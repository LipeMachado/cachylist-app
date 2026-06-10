class LibrariesController < ApplicationController
  def index
    @selected_category = category_from_param
    @items = current_user.media_items.recent
    @items = @items.by_category(@selected_category) if @selected_category.present?
    @items = @items.search(params[:query]) if params[:query].present?
    @items = @items.by_category(params[:category]) if params[:category].present?
    @items = @items.by_status(params[:status]) if params[:status].present?
    @items = @items.by_platform(params[:platform]) if params[:platform].present?

    @stats = MediaItemStats.new(current_user.media_items)
    @platforms = current_user.media_items.where.not(platform: [ nil, "" ]).distinct.order(:platform).pluck(:platform)
    @items = @items.to_a
    @items_by_status = MediaItem.statuses.keys.index_with do |status|
      @items.select { |item| item.status == status }
    end
  end

  private

  def category_from_param
    {
      "animes" => "anime",
      "series" => "series",
      "movies" => "movie",
      "books" => "book",
      "games" => "game"
    }[params[:category]]
  end
end
