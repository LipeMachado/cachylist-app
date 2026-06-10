class ProfilesController < ApplicationController
  def show
    @stats = MediaItemStats.new(current_user.media_items)
  end
end
