class JikanController < ApplicationController
  before_action :authenticate_user!

  def search
    query = params[:query]
    return render(json: []) if query.blank? || query.length < 2

    results = JikanService.new.search_anime(query)
    render json: results.map { |r| format_result(r) }
  end

  def details
    result = JikanService.new.details(params[:id])
    render json: format_details(result)
  end

  private

  def format_result(result)
    {
      id: result["mal_id"],
      title: result["title"] || result["title_english"],
      year: result["year"],
      poster: result.dig("images", "jpg", "image_url"),
      synopsis: result["synopsis"]&.truncate(100)
    }
  end

  def format_details(details)
    return {} unless details

    {
      title: details["title"] || details["title_english"],
      overview: details["synopsis"],
      release_year: details["year"],
      poster_url: details.dig("images", "jpg", "large_image_url"),
      total_episodes: details["episodes"],
      platform: details.dig("studios", 0, "name"),
      score: details["score"],
      category: "anime"
    }
  end
end
