require "net/http"
require "json"

class TmdbService
  BASE_URL = "https://api.themoviedb.org/3"
  IMAGE_BASE = "https://image.tmdb.org/t/p"

  def initialize
    @token = Rails.application.credentials.dig(:tmdb, :api_token)
    raise "TMDB API token not configured" unless @token
  end

  def search_multi(query)
    results = get("/search/multi", { query: query, language: "pt-BR", page: 1, include_adult: false })
    results["results"].select { |r| r["media_type"].in?(%w[movie tv]) }.first(6)
  end

  def details(type, id)
    get("/#{type}/#{id}", { language: "pt-BR", append_to_response: "credits" })
  end

  private

  def get(path, params = {})
    uri = URI("#{BASE_URL}#{path}")
    uri.query = URI.encode_www_form(params)
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true
    http.read_timeout = 5
    request = Net::HTTP::Get.new(uri)
    request["Authorization"] = "Bearer #{@token}"
    request["Accept"] = "application/json"
    response = http.request(request)
    JSON.parse(response.body)
  rescue StandardError => e
    Rails.logger.error "TMDB API error: #{e.message}"
    { "results" => [] }
  end
end
