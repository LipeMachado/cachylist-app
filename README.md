# CachyList

> Your stories. Your way.

A personal media tracking app where you can organize, track, and manage all your media consumption — anime, series, movies, books, and games — in a single unified kanban-style interface.

![Rails](https://img.shields.io/badge/Rails-8.1.3-red?logo=ruby-on-rails)
![Ruby](https://img.shields.io/badge/Ruby-3.4.5-red?logo=ruby)
![License](https://img.shields.io/badge/license-MIT-blue)

## Features

- **Kanban-style library** — organize media by status columns (Planned, In Progress, Completed, Paused, No Date)
- **5 categories** — track anime, series, movies, books, and games
- **Progress tracking** — episode counters for anime/series, pages for books, hours for games, duration for movies
- **Category-specific fields** — season tracking, platinum completion status for games, author/director, etc.
- **Advanced filtering** — filter by category, status, platform, and full-text search
- **Quick-add modal** — add items inline from any page with context-aware pre-selection
- **Stats dashboard** — aggregated counts and percentages for your entire collection
- **Profile management** — update email, password, or delete your account
- **Responsive design** — works on desktop and mobile
- **Dark theme** — brutalist editorial aesthetic with high contrast and clean typography

## Built with

- **Ruby 3.4.5** + **Rails 8.1.3**
- **SQLite3** (with Solid Cache, Solid Queue, Solid Cable)
- **Hotwire** (Turbo + Stimulus)
- **Tailwind CSS 4** via `tailwindcss-rails`
- **Propshaft** (asset pipeline)
- **Devise** (authentication)
- **GSAP** (animations)
- **Lucide** (icons)
- **Importmap** (JavaScript — no Node.js or bundler required)
- **Kamal** (Docker-based deployment)

## Getting started

### Prerequisites

- Ruby 3.4.5
- SQLite3
- Bundler

### Installation

```bash
git clone https://github.com/yourusername/cachylist.git
cd cachylist

bundle install
bin/rails db:setup
bin/rails tailwindcss:build
```

### Run the development server

```bash
bin/dev
```

This starts both the Rails server and the Tailwind CSS watcher (via `Procfile.dev`).

Open [http://localhost:3000](http://localhost:3000).

### Run tests

```bash
bin/rails test
bin/rails test:system
```

## Usage

1. **Sign up** for an account
2. **Add media** using the quick-add modal or the full form
3. **Organize** by dragging items between status columns
4. **Track progress** — update episodes, pages, or hours as you go
5. **View stats** on the dashboard to see your overall progress

## Deployment

The app is Docker-ready and deploys via Kamal:

```bash
bin/kamal deploy
```

See `config/deploy.yml` for configuration.

## CI

GitHub Actions CI runs:

- Brakeman (security scan)
- Bundler audit (gem vulnerabilities)
- Importmap audit (JavaScript vulnerabilities)
- RuboCop (linting)
- Test suite + system tests

## License

This project is available as open source under the terms of the MIT License.
