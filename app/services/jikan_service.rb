require "net/http"
require "json"

class JikanService
  BASE_URL = "https://api.jikan.moe/v4"
  IMAGE_BASE = "https://cdn.myanimelist.net/images/anime"

  def search_anime(query)
    data = get("/anime", { q: query, limit: 6, sfw: true })
    data["data"] || []
  end

  def details(mal_id)
    data = get("/anime/#{mal_id}")
    data["data"]
  end

  private

  def get(path, params = {})
    uri = URI("#{BASE_URL}#{path}")
    uri.query = URI.encode_www_form(params) unless params.empty?
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true
    http.read_timeout = 5
    request = Net::HTTP::Get.new(uri)
    request["Accept"] = "application/json"
    response = http.request(request)
    JSON.parse(response.body)
  rescue StandardError => e
    Rails.logger.error "Jikan API error: #{e.message}"
    { "data" => [] }
  end
end
