class MediaItem < ApplicationRecord
  belongs_to :user

  before_validation :assign_sort_order, on: :create
  before_validation :clear_non_episodic_progress_fields

  enum :category, { anime: 0, series: 1, movie: 2, book: 3, game: 4 }
  enum :status, { backlog: 5, planned: 0, in_progress: 1, completed: 2, paused: 3, no_date: 4 }

  validates :title, :category, :status, presence: true
  validates :title, uniqueness: { scope: :user_id, case_sensitive: false, message: "já existe na sua biblioteca" }
  validates :rating, inclusion: { in: 0..10 }, allow_blank: true
  validates :release_year, numericality: { only_integer: true, greater_than: 1800, less_than: 2200 }, allow_blank: true

  scope :recent, -> { order(updated_at: :desc, created_at: :desc) }
  scope :board_order, -> { order(:sort_order, updated_at: :desc, created_at: :desc) }
  scope :search, ->(term) { where("LOWER(title) LIKE :term OR LOWER(platform) LIKE :term", term: "%#{sanitize_sql_like(term.downcase)}%") }
  scope :by_category, ->(category) { where(category: category) if categories.key?(category) }
  scope :by_status, ->(status) { where(status: status) if statuses.key?(status) }
  scope :by_platform, ->(platform) { where(platform: platform) }

  def progress_label
    case category
    when "anime", "series"
      [ current_season.presence && "S#{current_season}", current_episode.presence && "E#{current_episode}", total_episodes.presence && "de #{total_episodes}" ].compact.join(" • ").presence
    when "book"
      return nil if current_page.blank? && total_pages.blank?

      "#{current_page || 0}/#{total_pages || "?"} pág."
    when "game"
      hours_played.present? ? "#{hours_played}h jogadas" : nil
    when "movie"
      duration_minutes.present? ? "#{duration_minutes} min" : nil
    end
  end

  def progress_percentage
    case category
    when "anime", "series"
      return 0 if current_episode.blank? || total_episodes.blank? || total_episodes.zero?

      (current_episode.to_f / total_episodes * 100).clamp(0, 100).round
    when "book"
      return 0 if current_page.blank? || total_pages.blank? || total_pages.zero?

      (current_page.to_f / total_pages * 100).clamp(0, 100).round
    else
      completed? ? 100 : 0
    end
  end

  private

  def clear_non_episodic_progress_fields
    return if anime? || series?

    self.current_season = nil
    self.current_episode = nil
    self.total_episodes = nil
  end

  def assign_sort_order
    return if sort_order.present? || user.blank? || status.blank?

    self.sort_order = user.media_items.where(status: status).maximum(:sort_order).to_i + 1
  end
end
