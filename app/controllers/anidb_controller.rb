class AnidbController < ApplicationController
  before_action :authenticate_user!
  skip_before_action :verify_authenticity_token, only: :image

  def search
    query = params[:query]
    return render(json: []) if query.blank? || query.length < 2

    results = AniDbService.new.search_anime(query)
    render json: results.map { |result| format_result(result) }
  end

  def details
    result = AniDbService.new.details(params[:id])
    render json: format_details(result)
  end

  def image
    file = params[:file].to_s
    return head :bad_request unless file.match?(/\A[\w.-]+\z/)

    image = Rails.cache.fetch("anidb:image:#{file}", expires_in: 7.days) do
      uri = URI("#{AniDbService::IMAGE_BASE_URL}/#{file}")
      response = image_request(uri)
      raise "AniDB image request failed with #{response.code}" unless response.is_a?(Net::HTTPSuccess)

      {
        body: response.body,
        content_type: response["content-type"].presence || "image/jpeg"
      }
    end

    send_data image[:body], type: image[:content_type], disposition: "inline"
  rescue StandardError => e
    Rails.logger.error "AniDB image proxy error for #{file}: #{e.message}"
    head :not_found
  end

  private

  def image_request(uri)
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = uri.scheme == "https"
    http.open_timeout = 5
    http.read_timeout = 10
    request = Net::HTTP::Get.new(uri)
    request["User-Agent"] = "CachyList/1.0"
    http.request(request)
  end

  def format_result(result)
    {
      id: result[:aid],
      title: result[:title],
      year: result[:year],
      poster: result[:poster_url],
      synopsis: result[:overview]&.truncate(100)
    }
  end

  def format_details(details)
    return {} unless details

    {
      title: details["title"],
      overview: details["overview"],
      release_year: details["year"],
      poster_url: details["poster_url"],
      total_episodes: details["total_episodes"],
      platform: nil,
      score: details["score"],
      category: "anime"
    }
  end
end
