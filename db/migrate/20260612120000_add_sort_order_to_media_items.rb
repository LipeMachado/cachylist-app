class AddSortOrderToMediaItems < ActiveRecord::Migration[8.1]
  def up
    add_column :media_items, :sort_order, :integer

    MediaItem.reset_column_information
    User.find_each do |user|
      MediaItem.statuses.keys.each do |status|
        user.media_items.where(status: status).order(updated_at: :desc, created_at: :desc).each.with_index do |item, index|
          item.update_column(:sort_order, index)
        end
      end
    end

    change_column_null :media_items, :sort_order, false, 0
    change_column_default :media_items, :sort_order, from: nil, to: 0
    add_index :media_items, [ :user_id, :status, :sort_order ]
  end

  def down
    remove_index :media_items, [ :user_id, :status, :sort_order ]
    remove_column :media_items, :sort_order
  end
end
