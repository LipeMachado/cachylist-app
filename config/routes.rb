Rails.application.routes.draw do
  devise_for :users

  authenticated :user do
    root "dashboards#show", as: :authenticated_root
  end

  unauthenticated do
    root "pages#home"
  end

  resource :dashboard, only: :show
  resource :profile, only: :show

  get "library", to: "libraries#index", as: :library
  get "library/:category", to: "libraries#index", as: :category_library,
    constraints: { category: /animes|series|movies|books|games/ }

  resources :media_items

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # Render dynamic PWA files from app/views/pwa/* (remember to link manifest in application.html.erb)
  # get "manifest" => "rails/pwa#manifest", as: :pwa_manifest
  # get "service-worker" => "rails/pwa#service_worker", as: :pwa_service_worker
end
