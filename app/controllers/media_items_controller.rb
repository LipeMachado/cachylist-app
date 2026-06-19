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

    respond_to do |format|
      if @media_item.save
        format.turbo_stream
        format.html { redirect_back fallback_location: library_path, notice: "Mídia criada com sucesso." }
      else
        format.turbo_stream do
          render turbo_stream: turbo_stream.replace("media_item_form",
            partial: "media_items/form",
            locals: { media_item: @media_item, modal: true }),
            status: :unprocessable_entity
        end
        format.html { render :new, status: :unprocessable_entity }
      end
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

  def import
    old_token = session.delete(:import_token)
    if old_token
      path = IMPORT_DIR.join(old_token)
      File.delete(path) if File.exist?(path)
    end
  end

  LIMIT = 50

  IMPORT_DIR = Rails.root.join("tmp", "imports")

  def import_preview
    file = params[:file]
    unless file
      redirect_to import_media_items_path, alert: "Selecione um arquivo."
      return
    end

    content = file.read.force_encoding("UTF-8")
    service = ImportService.new
    titles = service.parse_content(content, file.original_filename)

    if titles.empty?
      redirect_to import_media_items_path, alert: "Nenhum título encontrado no arquivo."
      return
    end

    enriched = service.identify_titles(titles)

    token = SecureRandom.hex(16)
    FileUtils.mkdir_p(IMPORT_DIR)
    File.write(IMPORT_DIR.join(token), enriched.to_json)
    session[:import_token] = token

    @page = 0
    @preview_items = enriched[0, LIMIT]
    @total_titles = enriched.size

    respond_to do |format|
      format.turbo_stream
      format.html { redirect_to library_path, notice: "#{@preview_items.size} itens encontrados para importar. Ative o JavaScript para usar o preview." }
    end
  end

  def import_page
    token = session[:import_token]

    unless token
      redirect_to import_media_items_path, alert: "Sessão expirada. Faça o upload novamente."
      return
    end

    path = IMPORT_DIR.join(token)
    unless File.exist?(path)
      redirect_to import_media_items_path, alert: "Arquivo temporário não encontrado. Faça o upload novamente."
      return
    end

    enriched = JSON.parse(File.read(path)).map(&:symbolize_keys)

    @page = params[:page].to_i
    @preview_items = enriched.drop(@page * LIMIT).first(LIMIT)
    @total_titles = enriched.size

    respond_to do |format|
      format.turbo_stream
      format.html { redirect_to import_media_items_path, alert: "Ative o JavaScript para navegar entre páginas." }
    end
  end

  def import_confirm
    items = params[:items]

    unless items.is_a?(Array) && items.any?
      redirect_to import_media_items_path, alert: "Nenhum item para importar."
      return
    end

    service = ImportService.new
    created = service.create_items(items, current_user)

    @import_count = created.size

    token = session.delete(:import_token)
    if token
      path = IMPORT_DIR.join(token)
      File.delete(path) if File.exist?(path)
    end

    respond_to do |format|
      format.turbo_stream
      format.html { redirect_to library_path, notice: "#{@import_count} #{@import_count == 1 ? "item importado" : "itens importados"} com sucesso." }
    end
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
      :cover_url, :started_at, :finished_at, :current_episode, :total_episodes, :current_season, :total_seasons,
      :current_page, :total_pages, :author, :director, :duration_minutes, :hours_played,
      :wants_platinum, :platinum_completed
    )
  end
end
