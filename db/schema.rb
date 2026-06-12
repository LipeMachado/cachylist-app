# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_06_12_120000) do
  create_table "media_items", force: :cascade do |t|
    t.string "author"
    t.integer "category", default: 0, null: false
    t.string "cover_url"
    t.datetime "created_at", null: false
    t.integer "current_episode"
    t.integer "current_page"
    t.integer "current_season"
    t.text "description"
    t.string "director"
    t.integer "duration_minutes"
    t.date "finished_at"
    t.integer "hours_played"
    t.text "notes"
    t.string "platform"
    t.boolean "platinum_completed", default: false, null: false
    t.integer "rating"
    t.integer "release_year"
    t.integer "sort_order", default: 0, null: false
    t.date "started_at"
    t.integer "status", default: 0, null: false
    t.string "title", null: false
    t.integer "total_episodes"
    t.integer "total_pages"
    t.datetime "updated_at", null: false
    t.integer "user_id", null: false
    t.boolean "wants_platinum", default: false, null: false
    t.index ["category"], name: "index_media_items_on_category"
    t.index ["platform"], name: "index_media_items_on_platform"
    t.index ["status"], name: "index_media_items_on_status"
    t.index ["user_id", "category", "status"], name: "index_media_items_on_user_id_and_category_and_status"
    t.index ["user_id", "status", "sort_order"], name: "index_media_items_on_user_id_and_status_and_sort_order"
    t.index ["user_id"], name: "index_media_items_on_user_id"
  end

  create_table "users", force: :cascade do |t|
    t.string "avatar"
    t.datetime "created_at", null: false
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.datetime "remember_created_at"
    t.datetime "reset_password_sent_at"
    t.string "reset_password_token"
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
  end

  add_foreign_key "media_items", "users"
end
