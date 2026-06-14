class MediaItemsController < ApplicationController
  before_action :set_media_item, only: %i[show edit update destroy update_status]

  def index
    redirect_to library_path
  end

  def show
  end

  def new
    @media_item = current_user.media_items.new(category: params[:category] || :anime, status: :planned)
  end

  def edit
  end

  def create
    @media_item = current_user.media_items.new(media_item_params)

    if @media_item.save
      render turbo_stream: [
        turbo_stream.prepend("flash-messages", partial: "shared/flash_toast", locals: { message: "Mídia criada com sucesso." }),
        turbo_stream.prepend("[data-kanban-status='#{@media_item.status}']", partial: "shared/media_card", locals: { item: @media_item })
      ]
    else
      render turbo_stream: turbo_stream.replace("media_item_form",
        partial: "media_items/form",
        locals: { media_item: @media_item, modal: true }),
        status: :unprocessable_entity
    end
  end

  def update
    if @media_item.update(media_item_params)
      redirect_to @media_item, notice: "Mídia atualizada com sucesso."
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def update_status
    @media_item.update!(status: params[:status])
    head :ok
  end

  def reorder
    columns = params.require(:columns).to_unsafe_h

    MediaItem.transaction do
      columns.each do |status, ids|
        next unless MediaItem.statuses.key?(status)

        Array(ids).each.with_index do |id, index|
          current_user.media_items.where(id: id).update_all(status: MediaItem.statuses[status], sort_order: index)
        end
      end
    end

    head :ok
  end

  def destroy
    @media_item.destroy
    redirect_to library_path, notice: "Mídia removida com sucesso."
  end

  private

  def set_media_item
    @media_item = current_user.media_items.find(params[:id])
  end

  def media_item_params
    params.require(:media_item).permit(
      :title, :description, :category, :status, :platform, :release_year, :rating, :notes,
      :cover_url, :started_at, :finished_at, :current_episode, :total_episodes, :current_season,
      :current_page, :total_pages, :author, :director, :duration_minutes, :hours_played,
      :wants_platinum, :platinum_completed
    )
  end
end
