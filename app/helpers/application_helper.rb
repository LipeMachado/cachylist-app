module ApplicationHelper
  def lucide_icon(name, size: 20, **options)
    options = LucideRails.default_options.merge(options).merge(width: size, height: size)

    content_tag(:svg, LucideRails::IconProvider.icon(name).html_safe, options)
  end

  def sidebar_nav_items
    [
      { label: "Dashboard", path: dashboard_path, icon: "layout-dashboard" },
      { label: "Biblioteca", path: library_path, icon: "library" },
      { label: "Animes", path: category_library_path("animes"), icon: "sparkles" },
      { label: "Séries", path: category_library_path("series"), icon: "tv" },
      { label: "Filmes", path: category_library_path("movies"), icon: "film" },
      { label: "Livros", path: category_library_path("books"), icon: "book-open" },
      { label: "Jogos", path: category_library_path("games"), icon: "gamepad-2" }
    ]
  end

  def avatar_options
    Rails.root.join("app/assets/images/avatar").children.select(&:file?).map { |path| "avatar/#{path.basename}" }.sort_by do |path|
      path[/\d+/].to_i
    end
  end

  def avatar_image_for(user)
    user.avatar if user.avatar.present? && avatar_options.include?(user.avatar)
  end
end
