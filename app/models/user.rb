class User < ApplicationRecord
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable, :trackable and :omniauthable
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable

  has_many :media_items, dependent: :destroy

  validates :avatar, inclusion: { in: ->(_) { User.avatar_files } }, allow_blank: true

  def self.avatar_files
    Rails.root.join("app/assets/images/avatar").children.select(&:file?).map { |path| "avatar/#{path.basename}" }
  end

  def display_name
    email.split("@").first.to_s.titleize
  end
end
