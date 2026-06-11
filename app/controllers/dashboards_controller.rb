class DashboardsController < ApplicationController
  def show
    @media_items = current_user.media_items.recent
    @stats = MediaItemStats.new(current_user.media_items)
    @search_suggestions = current_user.media_items.flat_map { |item| [ item.title, item.platform, item.director, item.author ] }.compact_blank.uniq.sort
    @items_by_status = MediaItem.statuses.keys.index_with do |status|
      @media_items.where(status: status).limit(3)
    end
  end
end
