Rails.application.routes.draw do
  devise_for :users, path: "", path_names: {
    sign_in: "login",
    sign_up: "register",
    sign_out: "logout"
  }, controllers: { registrations: "users/registrations" }

  root "pages#home"

  get "/users/edit" => redirect("/edit")
  get "/users/sign_in" => redirect("/login")
  get "/users/sign_up" => redirect("/register")
  get "/users/password/new" => redirect("/password/new")
  get "/users/password/edit" => redirect("/password/edit")

  scope "/app" do
    get "/", to: "dashboards#show", as: :dashboard

    get "library", to: "libraries#index", as: :library
    get "library/:category", to: "libraries#index", as: :category_library,
      constraints: { category: /animes|series|movies|anime_movies|books|games/ }

    resources :users, only: :show do
      member do
        patch :avatar
      end
    end

    resources :media_items do
      collection do
        patch :reorder
        get :import
        post :import_preview
        post :import_page
        post :import_confirm
      end

      member do
        patch :update_status
      end
    end

    get "tmdb/search", to: "tmdb#search"
    get "tmdb/details", to: "tmdb#details"
    get "steam/search", to: "steam#search"
    get "steam/details", to: "steam#details"
    get "anilist/search", to: "anilist#search"
    get "anilist/details", to: "anilist#details"
  end

  get "up" => "rails/health#show", as: :rails_health_check
end
