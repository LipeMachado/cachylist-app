require "csv"

class ImportService
  PREVIEW_LIMIT = 50
  MAX_CONCURRENT = 5

  def parse_file(uploaded_file)
    content = uploaded_file.read
    parse_content(content, uploaded_file.original_filename)
  end

  def parse_content(content, filename)
    content = content.force_encoding("UTF-8") unless content.encoding == Encoding::UTF_8
    filename = filename.downcase

    if filename.end_with?(".csv")
      parse_csv(content)
    else
      parse_text(content)
    end
  end

  def identify_titles(titles)
    results = Array.new(titles.size)
    mutex = Mutex.new
    queue = Queue.new
    titles.each_with_index { |t, i| queue << [t, i] }

    threads = MAX_CONCURRENT.times.map do
      Thread.new do
        loop do
          work = nil
          mutex.synchronize { work = queue.pop(true) rescue nil }
          break unless work
          title, idx = work
          result = identify_anilist(title)
          mutex.synchronize { results[idx] = result }
        end
      end
    end

    threads.each(&:join)
    results
  end

  def build_preview(titles, offset: 0, limit: PREVIEW_LIMIT)
    titles.drop(offset).first(limit).map do |title|
      {
        original_title: title,
        title: title,
        category: "movie",
        cover_url: nil,
        description: nil,
        release_year: nil,
        platform: nil,
        source: nil
      }
    end
  end

  def enrich_all(titles)
    results = Array.new(titles.size)
    mutex = Mutex.new
    queue = Queue.new
    titles.each_with_index { |t, i| queue << [t, i] }

    threads = MAX_CONCURRENT.times.map do
      Thread.new do
        loop do
          work = nil
          mutex.synchronize { work = queue.pop(true) rescue nil }
          break unless work
          title, idx = work
          enriched = enrich_title(title)
          mutex.synchronize { results[idx] = enriched }
        end
      end
    end

    threads.each(&:join)
    results
  end

  def create_items(items_data, user)
    created = []

    items_data.each do |data|
      item = user.media_items.new(permit_item(data))

      if item.save
        created << item
      end
    end

    created
  end

  def permit_item(data)
    {
      title: data["title"],
      category: data["category"].presence || "anime",
      status: data["status"].presence || "backlog",
      cover_url: data["cover_url"].presence,
      description: data["description"].presence,
      release_year: data["release_year"].presence,
      platform: data["platform"].presence
    }.compact_blank
  end

  def self.category_for_api(source)
    case source
    when :anilist then "anime"
    when :tmdb_movie then "movie"
    when :tmdb_tv then "series"
    when :steam then "game"
    else nil
    end
  end

  private

  def parse_csv(content)
    rows = CSV.parse(content, headers: true)
    return [] if rows.headers.nil?

    title_key = rows.headers.find { |h| h.downcase.strip == "title" } || rows.headers.first
    rows.map do |row|
      row[title_key]&.strip.presence
    end.compact
  end

  def parse_text(content)
    content.split("\n").map(&:strip).reject(&:blank?)
  end

  def enrich_title(title)
    result = {
      original_title: title,
      title: title,
      category: nil,
      cover_url: nil,
      description: nil,
      release_year: nil,
      platform: nil,
      source: nil
    }

    results = {}

    search_result = search_anilist(title)
    results[search_result[:source]] = search_result if search_result

    search_result = search_tmdb(title)
    results[search_result[:source]] = search_result if search_result

    search_result = search_steam(title)
    results[search_result[:source]] = search_result if search_result

    best = pick_best(results)
    if best
      result.merge!(best)
    end

    result[:api_matches] = results.values

    result
  end

  def identify_anilist(title)
    results = AniListService.new.search_anime(title)
    if results.any?
      best = results.first
      category = best[:format] == "MOVIE" ? "anime_movie" : "anime"
      {
        original_title: title,
        title: best[:title],
        category: category,
        cover_url: nil, description: nil, release_year: nil, platform: nil,
        source: :anilist,
        anilist_id: best[:id]
      }
    else
      {
        original_title: title, title: title,
        category: "movie",
        cover_url: nil, description: nil, release_year: nil, platform: nil,
        source: nil, anilist_id: nil
      }
    end
  rescue StandardError => e
    Rails.logger.error "ImportService AniList identify error for #{title}: #{e.message}"
    {
      original_title: title, title: title,
      category: "movie",
      cover_url: nil, description: nil, release_year: nil, platform: nil,
      source: nil, anilist_id: nil
    }
  end

  def search_anilist(title)
    results = AniListService.new.search_anime(title)
    return nil if results.empty?

    anime = results.first
    details = AniListService.new.details(anime[:id])

    category = details["category"].presence || (anime[:format] == "MOVIE" ? "anime_movie" : "anime")

    {
      title: details["title"].presence || anime[:title],
      category: category,
      cover_url: details["poster_url"].presence || anime[:poster],
      description: details["overview"],
      release_year: details["release_year"] || anime[:year],
      platform: nil,
      source: :anilist
    }
  rescue StandardError => e
    Rails.logger.error "ImportService AniList error for #{title}: #{e.message}"
    nil
  end

  def search_tmdb(title)
    results = TmdbService.new.search_multi(title)
    return nil if results.empty?

    media = results.first
    type = media["media_type"]

    if type == "movie"
      {
        title: media["title"],
        category: "movie",
        cover_url: media["poster_path"] ? "https://image.tmdb.org/t/p/w500#{media["poster_path"]}" : nil,
        description: media["overview"],
        release_year: extract_year(media["release_date"]),
        platform: nil,
        source: :tmdb_movie
      }
    else
      {
        title: media["name"],
        category: "series",
        cover_url: media["poster_path"] ? "https://image.tmdb.org/t/p/w500#{media["poster_path"]}" : nil,
        description: media["overview"],
        release_year: extract_year(media["first_air_date"]),
        platform: nil,
        source: :tmdb_tv
      }
    end
  rescue StandardError => e
    Rails.logger.error "ImportService TMDB error for #{title}: #{e.message}"
    nil
  end

  def search_steam(title)
    results = SteamService.new.search(title)
    return nil if results.empty?

    game = results.first
    {
      title: game["name"],
      category: "game",
      cover_url: game["tiny_image"],
      description: nil,
      release_year: nil,
      platform: "Steam",
      source: :steam
    }
  rescue StandardError => e
    Rails.logger.error "ImportService Steam error for #{title}: #{e.message}"
    nil
  end

  def pick_best(results)
    priority = %i[anilist tmdb_movie tmdb_tv steam]
    priority.each do |source|
      return results[source] if results[source]
    end
    nil
  end

  def extract_year(date_string)
    return nil if date_string.blank?
    Date.parse(date_string).year
  rescue ArgumentError
    nil
  end
end
