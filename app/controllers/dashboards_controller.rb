class DashboardsController < ApplicationController
  def show
    @media_items = current_user.media_items.recent
    @stats = MediaItemStats.new(current_user.media_items)
    @items_by_status = MediaItem.statuses.keys.index_with do |status|
      @media_items.where(status: status).limit(3)
    end
  end
end
