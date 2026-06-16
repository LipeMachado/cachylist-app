class DashboardsController < ApplicationController
  def show
    @media_items = current_user.media_items.board_order
    @stats = MediaItemStats.new(current_user.media_items)
    @search_suggestions = current_user.media_items.flat_map { |item| [ item.title, item.platform, item.author ] }.compact_blank.uniq.sort
    @continue_items = current_user.media_items.where(status: %i[in_progress paused]).recent.limit(3)
    @continue_items = current_user.media_items.recent.limit(3) if @continue_items.empty?
    @latest_items = current_user.media_items.recent.limit(3)
    @items_by_status = %w[planned in_progress completed paused].index_with do |status|
      @media_items.where(status: status)
    end
  end
end
