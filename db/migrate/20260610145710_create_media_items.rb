class CreateMediaItems < ActiveRecord::Migration[8.1]
  def change
    create_table :media_items do |t|
      t.references :user, null: false, foreign_key: true
      t.string :title, null: false
      t.text :description
      t.integer :category, null: false, default: 0
      t.integer :status, null: false, default: 0
      t.string :platform
      t.integer :release_year
      t.integer :rating
      t.text :notes
      t.string :cover_url
      t.date :started_at
      t.date :finished_at
      t.integer :current_episode
      t.integer :total_episodes
      t.integer :current_season
      t.integer :current_page
      t.integer :total_pages
      t.string :author
      t.string :director
      t.integer :duration_minutes
      t.integer :hours_played
      t.boolean :wants_platinum, null: false, default: false
      t.boolean :platinum_completed, null: false, default: false

      t.timestamps
    end

    add_index :media_items, :category
    add_index :media_items, :status
    add_index :media_items, :platform
    add_index :media_items, %i[user_id category status]
  end
end
