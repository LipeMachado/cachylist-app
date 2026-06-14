import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["input", "results", "coverUrl", "description", "releaseYear", "platform"]

  connect() {
    this.selectedIndex = -1
    this.timeout = null
    this.resultsData = []
  }

  search() {
    clearTimeout(this.timeout)
    if (this.selectedCategory() !== "game") {
      return
    }

    const query = this.inputTarget.value.trim()
    if (query.length < 2) {
      this.hideResults()
      return
    }

    this.showSkeleton()
    this.timeout = setTimeout(() => {
      fetch(`/app/steam/search?query=${encodeURIComponent(query)}`)
        .then((response) => response.json())
        .then((data) => this.showResults(data))
        .catch(() => this.hideResults())
    }, 350)
  }

  skeletonHTML() {
    return `
      <div class="divide-y divide-[var(--line)]">
        ${Array(3).fill(`
          <div class="flex items-center gap-3 px-4 py-3">
            <div class="w-12 h-[28px] rounded bg-[var(--line)] flex-[0_0_48px] animate-pulse"></div>
            <div class="h-3 w-3/4 rounded bg-[var(--line)] animate-pulse"></div>
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

    this.resultsTarget.innerHTML = results.map((result, index) => `
      <button type="button" class="flex items-center gap-3 px-4 py-3 text-left w-full hover:bg-[rgba(255,255,255,.06)] cursor-pointer border-0 bg-transparent text-[var(--text)] text-sm ${index === 0 ? "bg-[rgba(255,255,255,.06)]" : ""}" data-index="${index}" data-action="steam-search#select">
        ${result.poster ? `<img src="${result.poster}" alt="" class="w-12 h-[28px] object-cover rounded flex-[0_0_48px]">` : "<span class=\"w-12 h-[28px] bg-[var(--line)] rounded flex-[0_0_48px]\"></span>"}
        <div class="min-w-0 flex-1">
          <div class="font-medium truncate">${this.escapeHtml(result.title)}</div>
        </div>
      </button>
    `).join("")
    this.resultsTarget.hidden = false
    this.selectedIndex = 0
  }

  select(event) {
    const index = parseInt(event.currentTarget.dataset.index)
    const result = this.resultsData[index]
    if (!result) return

    fetch(`/app/steam/details?id=${result.id}`)
      .then((response) => response.json())
      .then((data) => this.fillForm(data))
  }

  fillForm(data) {
    if (this.hasInputTarget) this.inputTarget.value = data.title || ""
    if (this.hasCoverUrlTarget) this.coverUrlTarget.value = data.poster_url || ""
    if (this.hasDescriptionTarget) this.descriptionTarget.value = data.overview || ""
    if (this.hasReleaseYearTarget) this.releaseYearTarget.value = data.release_year || ""
    if (this.hasPlatformTarget) this.platformTarget.value = data.platform || "Steam"
    this.setCategory("game")
    this.hideResults()
  }

  keydown(event) {
    if (this.selectedCategory() !== "game") return

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
    items.forEach((item, index) => {
      item.classList.toggle("bg-[rgba(255,255,255,.06)]", index === this.selectedIndex)
    })
    items[this.selectedIndex]?.scrollIntoView({ block: "nearest" })
  }

  clickOutside(event) {
    if (!this.element.contains(event.target)) this.hideResults()
  }

  hideResults() {
    this.resultsTarget.hidden = true
    this.selectedIndex = -1
    this.resultsData = []
  }

  selectedCategory() {
    return this.categoryField()?.value || ""
  }

  setCategory(category) {
    const field = this.categoryField()
    if (!field) return

    field.value = category
    field.dispatchEvent(new Event("change", { bubbles: true }))
  }

  categoryField() {
    return this.element.querySelector("select[name*='[category]']") || document.querySelector("#media_item_category")
  }

  escapeHtml(str) {
    if (!str) return ""
    const div = document.createElement("div")
    div.textContent = str
    return div.innerHTML
  }
}
