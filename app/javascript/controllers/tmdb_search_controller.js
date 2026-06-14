import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["input", "results", "coverUrl", "description", "releaseYear", "duration", "director", "totalEpisodes", "platform"]

  connect() {
    this.selectedIndex = -1
    this.timeout = null
    this.resultsData = []
  }

  search() {
    clearTimeout(this.timeout)
    if (this.selectedCategory() === "game") {
      this.hideResults()
      return
    }

    const query = this.inputTarget.value.trim()
    if (query.length < 2) {
      this.hideResults()
      return
    }
    this.showSkeleton()
    this.timeout = setTimeout(() => {
      fetch(`/app/tmdb/search?query=${encodeURIComponent(query)}`)
        .then(r => r.json())
        .then(data => this.showResults(data))
        .catch(() => this.hideResults())
    }, 350)
  }

  skeletonHTML() {
    return `
      <div class="divide-y divide-[var(--line)]">
        ${Array(3).fill(`
          <div class="flex items-center gap-3 px-4 py-3">
            <div class="w-9 h-[54px] rounded bg-[var(--line)] flex-[0_0_36px] animate-pulse"></div>
            <div class="flex-1 space-y-2">
              <div class="h-3 w-3/4 rounded bg-[var(--line)] animate-pulse"></div>
              <div class="h-2 w-1/2 rounded bg-[var(--line)] animate-pulse"></div>
            </div>
          </div>
        `).join("")}
      </div>
    `
  }

  showSkeleton() {
    this.resultsTarget.innerHTML = this.skeletonHTML()
    this.resultsTarget.hidden = false
  }

  showResults(results) {
    this.resultsData = results
    if (results.length === 0) { this.hideResults(); return }

    this.resultsTarget.innerHTML = results.map((r, i) => `
      <button type="button" class="flex items-center gap-3 px-4 py-3 text-left w-full hover:bg-[rgba(255,255,255,.06)] cursor-pointer border-0 bg-transparent text-[var(--text)] text-sm ${i === 0 ? 'bg-[rgba(255,255,255,.06)]' : ''}" data-index="${i}" data-action="tmdb-search#select">
        ${r.poster ? `<img src="${r.poster}" alt="" class="w-9 h-[54px] object-cover rounded flex-[0_0_36px]">` : '<span class="w-9 h-[54px] bg-[var(--line)] rounded flex-[0_0_36px]"></span>'}
        <div class="min-w-0 flex-1">
          <div class="font-medium truncate">${this.escapeHtml(r.title)}</div>
        </div>
      </button>
    `).join("")
    this.resultsTarget.hidden = false
    this.selectedIndex = 0
  }

  hideResults() {
    this.resultsTarget.hidden = true
    this.selectedIndex = -1
    this.resultsData = []
  }

  select(event) {
    const index = parseInt(event.currentTarget.dataset.index)
    const result = this.resultsData[index]
    if (!result) return
    this.fetchAndFill(result.id, result.media_type)
  }

  fetchAndFill(id, type) {
    fetch(`/app/tmdb/details?id=${id}&type=${type}`)
      .then(r => r.json())
      .then(data => this.fillForm(data))
  }

  fillForm(data) {
    if (this.hasInputTarget) this.inputTarget.value = data.title || ""
    if (this.hasCoverUrlTarget) this.coverUrlTarget.value = data.poster_url || ""
    if (this.hasDescriptionTarget) this.descriptionTarget.value = data.overview || ""
    if (this.hasReleaseYearTarget) this.releaseYearTarget.value = data.release_year || ""

    if (data.category) {
      const selectors = [
        "select[data-modal-target='category']",
        "select[name*='[category]']",
        "#media_item_category"
      ]
      for (const sel of selectors) {
        const el = document.querySelector(sel)
        if (el) {
          el.value = data.category
          el.dispatchEvent(new Event("change", { bubbles: true }))
          break
        }
      }
    }

    if (this.hasDurationTarget && data.duration_minutes != null) this.durationTarget.value = data.duration_minutes
    if (this.hasDirectorTarget && data.director) this.directorTarget.value = data.director
    if (this.hasTotalEpisodesTarget && data.total_episodes != null) this.totalEpisodesTarget.value = data.total_episodes
    if (this.hasPlatformTarget && data.platform) this.platformTarget.value = data.platform

    this.hideResults()
  }

  keydown(event) {
    if (this.selectedCategory() === "game") return

    const items = this.resultsTarget.querySelectorAll("button")
    if (items.length === 0) return

    if (event.key === "ArrowDown") {
      event.preventDefault()
      this.selectedIndex = Math.min(this.selectedIndex + 1, items.length - 1)
      this.highlightItem(items)
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      this.selectedIndex = Math.max(this.selectedIndex - 1, 0)
      this.highlightItem(items)
    } else if (event.key === "Enter" && !this.resultsTarget.hidden) {
      event.preventDefault()
      items[this.selectedIndex]?.click()
    } else if (event.key === "Escape") {
      this.hideResults()
      this.inputTarget.focus()
    }
  }

  highlightItem(items) {
    items.forEach((item, i) => {
      item.classList.toggle("bg-[rgba(255,255,255,.06)]", i === this.selectedIndex)
    })
    items[this.selectedIndex]?.scrollIntoView({ block: "nearest" })
  }

  clickOutside(event) {
    if (!this.element.contains(event.target)) {
      this.hideResults()
    }
  }

  selectedCategory() {
    return this.element.querySelector("select[name*='[category]']")?.value || document.querySelector("#media_item_category")?.value || ""
  }

  escapeHtml(str) {
    if (!str) return ""
    const div = document.createElement("div")
    div.textContent = str
    return div.innerHTML
  }
}
