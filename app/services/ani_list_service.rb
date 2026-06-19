require "net/http"
require "json"

class AniListService
  GRAPHQL_URL = "https://graphql.anilist.co"
  SEARCH_LIMIT = 8
  SEARCH_CACHE_TTL = 24.hours
  DETAILS_CACHE_TTL = 7.days
  DETAILS_CACHE_VERSION = "v1"

  def search_anime(query)
    normalized = normalize(query)
    return [] if normalized.blank?

    if (cached = read_cache("anilist:search:#{normalized}"))
      return cached
    end

    variables = { search: query, perPage: SEARCH_LIMIT }
    response = post(query_search, variables)

    media = response.dig("data", "Page", "media") || []
    results = media.map { |m| format_search_result(m) }

    write_cache("anilist:search:#{normalized}", results, SEARCH_CACHE_TTL)
    results
  rescue StandardError => e
    Rails.logger.error "AniList search error: #{e.message}"
    []
  end

  def details(id)
    cache_key = "anilist:details:#{DETAILS_CACHE_VERSION}:#{id}"

    if (cached = read_cache(cache_key))
      return cached
    end

    variables = { id: id.to_i }
    response = post(query_details, variables)

    media = response["data"]&.[]("Media")
    return {} unless media

    result = format_details(media)

    write_cache(cache_key, result, DETAILS_CACHE_TTL)
    result
  rescue StandardError => e
    Rails.logger.error "AniList details error for #{id}: #{e.message}"
    {}
  end

  private

  def query_search
    <<~GRAPHQL
      query ($search: String, $perPage: Int) {
        Page(page: 1, perPage: $perPage) {
          media(search: $search, type: ANIME) {
            id
            title { romaji english }
            coverImage { large }
            startDate { year }
            format
          }
        }
      }
    GRAPHQL
  end

  def query_details
    <<~GRAPHQL
      query ($id: Int) {
        Media(id: $id) {
          id
          title { romaji english }
          coverImage { large }
          description(asHtml: false)
          startDate { year }
          episodes
          averageScore
          format
        }
      }
    GRAPHQL
  end

  def post(query, variables = {})
    uri = URI(GRAPHQL_URL)
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true
    http.open_timeout = 5
    http.read_timeout = 10

    request = Net::HTTP::Post.new(uri)
    request["Content-Type"] = "application/json"
    request["Accept"] = "application/json"
    request["Client-ID"] = ENV["ANILIST_CLIENT_ID"] if ENV["ANILIST_CLIENT_ID"].present?
    request.body = { query: query, variables: variables }.to_json

    response = http.request(request)
    raise "AniList request failed with #{response.code}: #{response.body.first(200)}" unless response.is_a?(Net::HTTPSuccess)

    JSON.parse(response.body)
  end

  def format_search_result(media)
    title = media.dig("title", "romaji") || media.dig("title", "english") || ""
    {
      id: media["id"],
      title: title,
      year: media.dig("startDate", "year"),
      poster: media.dig("coverImage", "large"),
      format: media["format"],
      category: media["format"] == "MOVIE" ? "anime_movie" : "anime"
    }
  end

  def format_details(media)
    title = media.dig("title", "romaji") || media.dig("title", "english") || ""
    {
      "title" => title,
      "overview" => media["description"]&.strip,
      "release_year" => media.dig("startDate", "year"),
      "poster_url" => media.dig("coverImage", "large"),
      "total_episodes" => media["episodes"],
      "score" => media["averageScore"],
      "format" => media["format"],
      "category" => media["format"] == "MOVIE" ? "anime_movie" : "anime"
    }
  end

  def normalize(value)
    value.to_s.downcase.unicode_normalize(:nfkd).gsub(/\p{Mn}/, "").gsub(/[^\p{Alnum}]+/u, " ").squish
  end

  def read_cache(key)
    Rails.cache.read(key)
  rescue ActiveRecord::StatementInvalid
    nil
  end

  def write_cache(key, value, ttl)
    Rails.cache.write(key, value, expires_in: ttl)
  rescue ActiveRecord::StatementInvalid
    nil
  end
end
