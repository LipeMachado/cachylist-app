class SteamController < ApplicationController
  before_action :authenticate_user!

  def search
    query = params[:query]
    return render(json: []) if query.blank? || query.length < 2

    results = SteamService.new.search(query)
    render json: results.map { |result| format_result(result) }
  end

  def details
    details = SteamService.new.details(params[:id])
    render json: format_details(details)
  end

  private

  def format_result(result)
    {
      id: result["id"],
      title: result["name"],
      poster: result["tiny_image"]
    }
  end

  def format_details(details)
    {
      title: details["name"],
      overview: helpers.strip_tags(details["short_description"].presence || details["detailed_description"]),
      release_year: release_year(details.dig("release_date", "date")),
      poster_url: details["header_image"],
      category: "game",
      platform: "Steam"
    }
  end

  def release_year(date)
    date.to_s.match(/\d{4}/)&.[](0)&.to_i
  end
end
