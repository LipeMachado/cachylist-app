module MediaItemsHelper
  CATEGORY_LABELS = {
    "anime" => "Anime",
    "series" => "Série",
    "movie" => "Filme",
    "book" => "Livro",
    "game" => "Jogo",
    "anime_movie" => "Filmes/Animes"
  }.freeze

  STATUS_LABELS = {
    "backlog" => "Backlog",
    "planned" => "Para Depois",
    "in_progress" => "Em Andamento",
    "completed" => "Concluído",
    "paused" => "Pausado",
    "no_date" => "Sem Data"
  }.freeze

  CATEGORY_PATHS = {
    "anime" => "animes",
    "series" => "series",
    "movie" => "movies",
    "book" => "books",
    "game" => "games",
    "anime_movie" => "anime_movies"
  }.freeze

  def category_label(category)
    CATEGORY_LABELS.fetch(category.to_s, category.to_s.titleize)
  end

  def status_label(status)
    STATUS_LABELS.fetch(status.to_s, status.to_s.titleize)
  end

  def status_class(status)
    "status-#{status.to_s.dasherize}"
  end

  SOURCE_LABELS = {
    anidb: "AniDB (Anime)",
    tmdb_movie: "TMDB (Filme)",
    tmdb_tv: "TMDB (Série)",
    steam: "Steam (Jogo)"
  }.freeze

  def source_label(source)
    SOURCE_LABELS.fetch(source.to_sym, source.to_s.titleize)
  end

  def cover_for(item)
    item.cover_url.presence || "https://images.unsplash.com/photo-1518709268805-4e9042af2176?auto=format&fit=crop&w=500&q=80"
  end
end
