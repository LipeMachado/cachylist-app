class User < ApplicationRecord
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable

  has_many :media_items, dependent: :destroy

  validates :username, uniqueness: { case_sensitive: false },
            format: { with: /\A[a-zA-Z0-9_]+\z/, message: "somente letras, números e underscore" },
            length: { minimum: 3, maximum: 30 }, allow_blank: true
  validates :avatar, inclusion: { in: ->(_) { User.avatar_files } }, allow_blank: true

  def self.avatar_files
    Rails.root.join("app/assets/images/avatar").children.select(&:file?).map { |path| "avatar/#{path.basename}" }
  end

  def display_name
    username.presence || email.split("@").first.to_s.titleize
  end
end
