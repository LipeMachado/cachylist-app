class ProfilesController < ApplicationController
  def show
    redirect_to user_path(current_user)
  end
end
