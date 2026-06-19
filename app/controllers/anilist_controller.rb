class AnilistController < ApplicationController
  before_action :authenticate_user!

  def search
    query = params[:query]
    return render(json: []) if query.blank? || query.length < 2

    results = AniListService.new.search_anime(query)
    render json: results.map { |r| format_result(r) }
  end

  def details
    result = AniListService.new.details(params[:id])
    render json: format_details(result)
  end

  private

  def format_result(result)
    {
      id: result[:id],
      title: result[:title],
      year: result[:year],
      poster: result[:poster],
      format: result[:format],
      category: result[:category]
    }
  end

  def format_details(details)
    return {} unless details

    {
      title: details["title"],
      overview: details["overview"],
      release_year: details["release_year"],
      poster_url: details["poster_url"],
      total_episodes: details["total_episodes"],
      platform: nil,
      score: details["score"],
      category: details["category"]
    }
  end
end
