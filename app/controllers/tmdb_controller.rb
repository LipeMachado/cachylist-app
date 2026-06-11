class TmdbController < ApplicationController
  before_action :authenticate_user!

  def search
    query = params[:query]
    return render(json: []) if query.blank? || query.length < 2

    service = TmdbService.new
    results = service.search_multi(query)

    render json: results.map { |r| format_result(r) }
  end

  def details
    service = TmdbService.new
    details = service.details(params[:type], params[:id])
    render json: format_details(details, params[:type])
  end

  private

  def format_result(result)
    {
      id: result["id"],
      media_type: result["media_type"],
      title: result["title"] || result["name"],
      year: extract_year(result),
      poster: result["poster_path"] ? "#{TmdbService::IMAGE_BASE}/w92#{result["poster_path"]}" : nil,
      overview: result["overview"]&.truncate(100)
    }
  end

  def format_details(details, type)
    base = {
      title: details["title"] || details["name"],
      overview: details["overview"],
      release_year: extract_year(details),
      poster_url: details["poster_path"] ? "#{TmdbService::IMAGE_BASE}/w500#{details["poster_path"]}" : nil
    }

    if type == "movie"
      base.merge(
        category: "movie",
        duration_minutes: details["runtime"],
        director: details.dig("credits", "crew")&.find { |c| c["job"] == "Director" }&.dig("name")
      )
    else
      base.merge(
        category: "series",
        total_episodes: details["number_of_episodes"],
        platform: details.dig("networks", 0, "name")
      )
    end
  end

  def extract_year(item)
    date = item["release_date"] || item["first_air_date"]
    date&.split("-")&.first&.to_i
  end
end
