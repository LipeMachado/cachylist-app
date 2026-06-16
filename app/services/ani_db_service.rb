require "net/http"
require "rexml/document"
require "zlib"

class AniDbService
  TITLES_URL = "https://anidb.net/api/anime-titles.xml.gz"
  HTTP_API_URL = "http://api.anidb.net:9001/httpapi"
  IMAGE_BASE_URL = "https://cdn-eu.anidb.net/images/main"
  SEARCH_LIMIT = 6
  CACHE_TTL = 24.hours
  DETAILS_CACHE_TTL = 7.days
  DETAILS_CACHE_VERSION = "v3"
  HTTP_API_LOCK = Mutex.new

  @@_http_api_last = 0.0

  def search_anime(query)
    normalized_query = normalize(query)
    return [] if normalized_query.blank?

    titles.filter_map do |anime|
      score = match_score(anime, normalized_query)
      next unless score

      anime.merge(score: score)
    end.sort_by { |anime| [-anime[:score], anime[:title].length] }.first(SEARCH_LIMIT)
  rescue StandardError => e
    Rails.logger.error "AniDB search error: #{e.message}"
    []
  end

  def details(aid)
    cache_key = "anidb:anime_details:#{DETAILS_CACHE_VERSION}:#{aid}"
    cached = Rails.cache.read(cache_key)
    return cached if cached

    anime = title_by_aid(aid)
    details = http_api_details(aid)
    result = {
      "aid" => aid.to_i,
      "title" => details[:title].presence || anime&.dig(:title),
      "year" => extract_year(details[:start_date]),
      "poster_url" => details[:picture].present? ? "/app/anidb/image?file=#{ERB::Util.url_encode(details[:picture])}" : nil,
      "overview" => details[:description],
      "total_episodes" => details[:episode_count],
      "score" => details[:score]
    }.compact_blank

    expires_in = result["poster_url"].present? || result["overview"].present? ? DETAILS_CACHE_TTL : 15.minutes
    Rails.cache.write(cache_key, result, expires_in: expires_in)
    result
  rescue StandardError => e
    Rails.logger.error "AniDB details error for #{aid}: #{e.message}"
    anime = title_by_aid(aid)
    { "aid" => aid.to_i, "title" => anime&.dig(:title) }.compact_blank
  end

  private

  def titles
    Rails.cache.fetch("anidb:anime_titles", expires_in: CACHE_TTL) do
      parse_titles(fetch_titles_xml)
    end
  end

  def title_by_aid(aid)
    titles.find { |anime| anime[:aid].to_s == aid.to_s }
  end

  def fetch_titles_xml
    uri = URI(TITLES_URL)
    response = request(uri)
    raise "AniDB titles request failed with #{response.code}" unless response.is_a?(Net::HTTPSuccess)

    Zlib::GzipReader.new(StringIO.new(response.body)).read
  end

  def parse_titles(xml)
    document = REXML::Document.new(xml)
    parsed_titles = []

    document.elements.each("animetitles/anime") do |anime_node|
      aid = anime_node.attributes["aid"]
      anime_titles = []

      anime_node.elements.each("title") do |title_node|
        title = title_node.text.to_s.strip
        next if title.blank?

        anime_titles << {
          text: title,
          type: title_node.attributes["type"],
          lang: title_node.attributes["xml:lang"] || title_node.attributes["lang"]
        }
      end

      main_title = anime_titles.find { |title| title[:type] == "main" } || anime_titles.first
      next unless main_title

      parsed_titles << {
        aid: aid.to_i,
        title: main_title[:text],
        titles: anime_titles,
        normalized_titles: anime_titles.map { |title| normalize(title[:text]) }.reject(&:blank?).uniq
      }
    end

    parsed_titles
  end

  def http_api_details(aid)
    return {} if ENV["ANIDB_CLIENT"].blank?
    return {} if Rails.cache.read("anidb:http_api_blocked")

    throttle_http_api

    uri = URI(HTTP_API_URL)
    uri.query = URI.encode_www_form(
      request: "anime",
      client: ENV["ANIDB_CLIENT"],
      clientver: ENV.fetch("ANIDB_CLIENT_VERSION", "1"),
      protover: "1",
      aid: aid
    )

    response = request(uri)
    unless response.is_a?(Net::HTTPSuccess)
      Rails.logger.error "AniDB HTTP API failed with #{response.code}: #{response.body.to_s.first(200)}"
      return {}
    end

    parse_details(response.body)
  end

  def request(uri)
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = uri.scheme == "https"
    http.open_timeout = 5
    http.read_timeout = 10
    http.get(uri.request_uri)
  end

  def parse_details(xml)
    document = REXML::Document.new(xml)
    error = document.elements["error"]
    if error
      Rails.logger.error "AniDB HTTP API error #{error.attributes['code']}: #{error.text}"
      Rails.cache.write("anidb:http_api_blocked", true, expires_in: 30.minutes) if error.text.to_s.include?("banned")
      return {}
    end

    anime = document.elements["anime"]
    return {} unless anime

    {
      title: anime.elements["titles/title[@type='main']"]&.text || anime.elements["titles/title"]&.text,
      start_date: anime.elements["startdate"]&.text,
      picture: anime.elements["picture"]&.text,
      description: anime.elements["description"]&.text,
      episode_count: anime.elements["episodecount"]&.text,
      score: anime.elements["ratings/permanent"]&.text
    }
  end

  def throttle_http_api
    HTTP_API_LOCK.synchronize do
      elapsed = Process.clock_gettime(Process::CLOCK_MONOTONIC) - @@_http_api_last
      sleep(2.5 - elapsed) if elapsed < 2.5
      @@_http_api_last = Process.clock_gettime(Process::CLOCK_MONOTONIC)
    end
  end

  def match_score(anime, normalized_query)
    anime[:normalized_titles].filter_map do |title|
      if title == normalized_query
        100
      elsif title.start_with?(normalized_query)
        80
      elsif title.include?(normalized_query)
        60
      end
    end.max
  end

  def normalize(value)
    value.to_s.downcase.unicode_normalize(:nfkd).gsub(/\p{Mn}/, "").gsub(/[^\p{Alnum}]+/u, " ").squish
  end

  def extract_year(date_string)
    return nil if date_string.blank?

    Date.parse(date_string).year
  rescue ArgumentError
    nil
  end
end
