class AddTotalSeasonsToMediaItems < ActiveRecord::Migration[8.1]
  def change
    add_column :media_items, :total_seasons, :integer
  end
end
