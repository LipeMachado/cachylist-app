require "net/http"
require "json"

class SteamService
  SEARCH_URL = "https://store.steampowered.com/api/storesearch/"
  DETAILS_URL = "https://store.steampowered.com/api/appdetails"

  def search(query)
    response = get(SEARCH_URL, { term: query, cc: "BR", l: "brazilian", page: 1 })
    Array(response["items"]).first(8)
  end

  def details(app_id)
    response = get(DETAILS_URL, { appids: app_id, cc: "BR", l: "brazilian" })
    result = response[app_id.to_s]
    result && result["success"] ? result["data"] : {}
  end

  private

  def get(url, params = {})
    uri = URI(url)
    uri.query = URI.encode_www_form(params)
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = true
    http.read_timeout = 5
    response = http.get(uri.request_uri, { "Accept" => "application/json" })
    JSON.parse(response.body)
  rescue StandardError => e
    Rails.logger.error "Steam API error: #{e.message}"
    {}
  end
end
