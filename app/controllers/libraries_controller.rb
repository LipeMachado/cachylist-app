class LibrariesController < ApplicationController
  def index
    @selected_category = category_from_param
    @items = current_user.media_items.recent
    @items = @items.by_category(@selected_category) if @selected_category.present?
    @items = @items.by_category(params[:category]) if params[:category].present?
    @items = @items.by_status(params[:status]) if params[:status].present?
    @items = @items.by_platform(params[:platform]) if params[:platform].present?

    @stats = MediaItemStats.new(current_user.media_items)
    @platforms = current_user.media_items.where.not(platform: [ nil, "" ]).distinct.order(:platform).pluck(:platform)
    @search_suggestions = current_user.media_items.flat_map { |item| [ item.title, item.platform, item.author ] }.compact_blank.uniq.sort
    @items = @items.to_a
    @items = @items.select { |item| searchable_text(item).include?(normalize_query(params[:query])) } if params[:query].present?
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

  def normalize_query(value)
    I18n.transliterate(value.to_s).downcase
  end

  def searchable_text(item)
    normalize_query([ item.title, item.platform, item.author, item.release_year ].compact.join(" "))
  end
end
