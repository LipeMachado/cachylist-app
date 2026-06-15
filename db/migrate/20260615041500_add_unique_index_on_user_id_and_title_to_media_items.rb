class AddUniqueIndexOnUserIdAndTitleToMediaItems < ActiveRecord::Migration[8.1]
  def change
    add_index :media_items, [:user_id, :title], unique: true,
      name: "index_media_items_on_user_id_and_title"
  end
end
