class UsersController < ApplicationController
  def show
    @user = User.find(params[:id])
    @stats = MediaItemStats.new(@user.media_items)
    @recent_items = @user.media_items.recent.limit(10)
    @items_by_status = MediaItem.statuses.keys.index_with do |status|
      @user.media_items.where(status: status).board_order
    end
  end

  def avatar
    if current_user.update(avatar: params[:avatar])
      redirect_back fallback_location: user_path(current_user), notice: "Avatar atualizado."
    else
      redirect_back fallback_location: user_path(current_user), alert: "Avatar inválido."
    end
  end
end
