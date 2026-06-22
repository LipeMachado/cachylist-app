import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["card", "count", "submitBtn", "analyzeBtn", "confirmBackdrop", "confirmDialog"]

  connect() {
    this.boundClickOutside = this.clickOutside.bind(this)
    document.addEventListener("click", this.boundClickOutside)
    this.boundResetLoading = this.resetLoading.bind(this)
    document.addEventListener("turbo:submit-end", this.boundResetLoading)
    this.boundTurboRender = this.onTurboRender.bind(this)
    document.addEventListener("turbo:render", this.boundTurboRender)
    this.updateCount()
    setTimeout(() => this.enrichVisibleCards(), 100)
  }

  disconnect() {
    document.removeEventListener("click", this.boundClickOutside)
    document.removeEventListener("turbo:submit-end", this.boundResetLoading)
    document.removeEventListener("turbo:render", this.boundTurboRender)
  }

  onTurboRender() {
    this.updateCount()
    setTimeout(() => this.enrichVisibleCards(), 100)
  }

  resetLoading() {
    setTimeout(() => {
      if (!document.body.contains(this.element)) return
      this.element.classList.remove("is-importing")
      if (this.hasAnalyzeBtnTarget) this.analyzeBtnTarget.disabled = false
      if (this.hasSubmitBtnTarget) this.submitBtnTarget.disabled = false
      document.body.style.cursor = ""
    }, 0)
  }

  /* ── Auto-search on title input ─────────────────────── */

  onTitleInput(event) {
    clearTimeout(this._searchTimeout)
    const input = event.currentTarget
    const card = input.closest("[data-import-target='card']")
    const title = input.value.trim()

    if (title.length < 2) {
      this.hideSearchResultsForCard(card)
      return
    }

    this._searchTimeout = setTimeout(() => {
      this.searchForCard(card)
    }, 350)
  }

  onCategoryChange(event) {
    const card = event.currentTarget.closest("[data-import-target='card']")
    const title = card.querySelector("[name='items[][title]']").value.trim()
    if (title.length < 2) return

    clearTimeout(this._searchTimeout)
    this._searchTimeout = setTimeout(() => {
      this.searchForCard(card)
    }, 200)
  }

  async searchForCard(card) {
    if (!card) return

    const title = card.querySelector("[name='items[][title]']").value.trim()
    const category = card.querySelector("[name='items[][category]']").value
    const apiPath = this.searchPath(category)

    if (!apiPath || title.length < 2) {
      this.hideSearchResultsForCard(card)
      return
    }

    let container = card.querySelector(".import-search-results")
    if (!container) {
      container = document.createElement("div")
      container.className = "import-search-results absolute left-0 top-full w-full z-50 border border-[var(--line)] bg-[var(--panel-bg)] shadow-xl max-h-[240px] overflow-y-auto"
      const wrapper = card.querySelector("[name='items[][title]']")?.closest(".relative")
      if (wrapper) wrapper.appendChild(container)
    }

    this.closeAllSearchResults()

    container.innerHTML = `
      <div class="divide-y divide-[var(--line)]">
        ${Array(3).fill(`
          <div class="flex items-center gap-3 px-4 py-3">
            <div class="w-9 h-[54px] bg-[var(--line)] flex-[0_0_36px] animate-pulse"></div>
            <div class="flex-1 space-y-2">
              <div class="h-3 w-3/4 bg-[var(--line)] animate-pulse"></div>
              <div class="h-2 w-1/2 bg-[var(--line)] animate-pulse"></div>
            </div>
          </div>
        `).join("")}
      </div>
    `
    container.hidden = false

    try {
      let response = await fetch(`${apiPath}?query=${encodeURIComponent(title)}`)
      if (!response.ok) throw new Error()
      let data = await response.json()

      if (data.length === 0 && category === "movie") {
        const fallbackUrl = "/app/anilist/search"
        response = await fetch(`${fallbackUrl}?query=${encodeURIComponent(title)}`)
        if (response.ok) data = await response.json()
      }

      if (data.length === 0) {
        container.innerHTML = `<div class="px-4 py-6 text-xs text-[var(--tertiary)] text-center">Nenhum resultado encontrado.</div>`
        return
      }

      card._searchData = data

      container.innerHTML = `
        <div class="divide-y divide-[var(--line)]">
          ${data.map((r, i) => `
            <button type="button" class="flex items-center gap-3 px-4 py-3 text-left w-full hover:bg-[var(--hover-bg)] cursor-pointer border-0 bg-transparent text-[var(--text)] text-sm" data-index="${i}" data-action="import#selectResult">
              ${r.poster ? `<img src="${this.escapeHtml(r.poster)}" alt="" class="w-9 h-[54px] object-cover flex-[0_0_36px]">` : '<span class="w-9 h-[54px] bg-[var(--line)] flex-[0_0_36px]"></span>'}
              <div class="min-w-0 flex-1">
                <div class="font-medium truncate">${this.escapeHtml(r.title)}</div>
                ${r.year || r.release_date ? `<div class="text-[var(--muted)] text-[10px] mt-0.5">${this.escapeHtml(r.year || (r.release_date || "").split("-")[0])}</div>` : ""}
              </div>
            </button>
          `).join("")}
        </div>
      `
      container.hidden = false
    } catch {
      container.innerHTML = `<div class="px-4 py-6 text-xs text-[var(--tertiary)] text-center">Erro ao buscar resultados.</div>`
    }
  }

  hideSearchResultsForCard(card) {
    const container = card?.querySelector(".import-search-results")
    if (container) container.hidden = true
    if (card) delete card._searchData
  }

  /* ── Select search result ───────────────────────────── */

  async selectResult(event) {
    const btn = event.currentTarget
    const card = btn.closest("[data-import-target='card']")
    if (!card) return

    const index = parseInt(btn.dataset.index)
    const data = card._searchData
    if (!data || data[index] === undefined) return

    const result = data[index]
    const category = card.querySelector("[name='items[][category]']").value
    const detailsUrl = this.detailsUrl(category, result)

    this.closeAllSearchResults()

    if (!detailsUrl) {
      this.fillCardFromResult(card, result, category)
      return
    }

    try {
      const response = await fetch(detailsUrl)
      if (!response.ok) throw new Error()
      const details = await response.json()
      this.fillCardFromDetails(card, result, details, category)
    } catch {
      this.fillCardFromResult(card, result, category)
    }
  }

  fillCardFromResult(card, result, category) {
    const titleInput = card.querySelector("[name='items[][title]']")
    const coverInput = card.querySelector("[name='items[][cover_url]']")
    const coverImg = card.querySelector("[data-import-cover]")
    const categorySelect = card.querySelector("[name='items[][category]']")

    if (titleInput) titleInput.value = result.title || ""
    if (coverInput) coverInput.value = result.poster || ""
    if (coverImg) coverImg.src = result.poster || coverImg.src
    if (categorySelect) categorySelect.value = category
  }

  fillCardFromDetails(card, result, details, category) {
    const titleInput = card.querySelector("[name='items[][title]']")
    const coverInput = card.querySelector("[name='items[][cover_url]']")
    const descriptionInput = card.querySelector("[name='items[][description]']")
    const releaseYearInput = card.querySelector("[name='items[][release_year]']")
    const platformInput = card.querySelector("[name='items[][platform]']")
    const categorySelect = card.querySelector("[name='items[][category]']")
    const coverImg = card.querySelector("[data-import-cover]")

    const nextCategory = category || categorySelect?.value || details.category
    const nextPoster = details.poster_url || result.poster

    if (titleInput && (details.title || result.title)) titleInput.value = details.title || result.title
    if (coverInput && nextPoster) coverInput.value = nextPoster
    if (coverImg && nextPoster) coverImg.src = nextPoster
    if (descriptionInput && details.overview) descriptionInput.value = details.overview
    if (releaseYearInput && details.release_year) releaseYearInput.value = details.release_year
    if (platformInput && details.platform) platformInput.value = details.platform
    if (categorySelect && nextCategory) categorySelect.value = nextCategory
  }

  keydown(event) {
    if (event.key === "Escape" && this.hasConfirmDialogTarget && !this.confirmDialogTarget.hidden) {
      this.cancelRemoveCard()
    }
  }

  /* ── Trash confirmation ─────────────────────────────── */

  requestRemoveCard(event) {
    const card = event.currentTarget.closest("[data-import-target='card']")
    if (!card) return
    this._cardToRemove = card
    if (this.hasConfirmBackdropTarget) this.confirmBackdropTarget.hidden = false
    if (this.hasConfirmDialogTarget) this.confirmDialogTarget.hidden = false
  }

  confirmRemoveCard() {
    if (this._cardToRemove) {
      this._cardToRemove.remove()
      this._cardToRemove = null
      this.updateCount()
    }
    this.hideConfirm()
  }

  cancelRemoveCard() {
    this._cardToRemove = null
    this.hideConfirm()
  }

  hideConfirm() {
    if (this.hasConfirmBackdropTarget) this.confirmBackdropTarget.hidden = true
    if (this.hasConfirmDialogTarget) this.confirmDialogTarget.hidden = true
  }

  /* ── Loading state ──────────────────────────────────── */

  startLoading() {
    this.element.classList.add("is-importing")
    if (this.hasAnalyzeBtnTarget) this.analyzeBtnTarget.disabled = true
    if (this.hasSubmitBtnTarget) this.submitBtnTarget.disabled = true
    document.body.style.cursor = "wait"
  }

  updateCount() {
    if (!this.hasCountTarget) return
    const count = this.cardTargets.length
    this.countTarget.textContent = `Importar ${count} ${count === 1 ? "item" : "itens"} →`
    if (this.hasSubmitBtnTarget) {
      this.submitBtnTarget.disabled = count === 0
    }
  }

  async loadPage(event) {
    const btn = event.currentTarget
    const page = btn.dataset.page
    if (!page) return

    if (this.hasSubmitBtnTarget) this.submitBtnTarget.disabled = true
    btn.disabled = true
    const originalHTML = btn.innerHTML
    btn.innerHTML = '<span class="flex items-center gap-2"><span class="import-spinner"></span> Carregando...</span>'

    try {
      const response = await fetch("/app/media_items/import_page", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "X-CSRF-Token": document.querySelector("[name='csrf-token']")?.content,
          "Accept": "text/vnd.turbo-stream.html"
        },
        body: new URLSearchParams({ page })
      })

      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const html = await response.text()
      window.Turbo.renderStreamMessage(html)
      this.updateCount()
    } catch (e) {
      btn.disabled = false
      btn.innerHTML = originalHTML
      if (this.hasSubmitBtnTarget) this.submitBtnTarget.disabled = false
    }
  }

  /* ── Lazy enrichment of visible cards ───────────────── */

  async enrichVisibleCards() {
    if (this._enrichingVisibleCards) return
    this._enrichingVisibleCards = true

    const cards = this.cardTargets.filter(card => {
      const id = card.dataset.anilistId
      if (!id || card.dataset.detailsLoaded === "true") return false
      const cover = card.querySelector("[data-import-cover]")
      return !cover || cover.src.includes("images.unsplash.com")
    }).slice(0, 2)

    for (const card of cards) {
      try {
        const response = await fetch(`/app/anilist/details?id=${card.dataset.anilistId}`)
        const data = await response.json()
        this.fillCardFromDetails(card, {}, data)
        card.dataset.detailsLoaded = "true"
      } catch (_error) {}
      await new Promise(resolve => setTimeout(resolve, 300))
    }

    this._enrichingVisibleCards = false
  }

  /* ── Search results helpers ─────────────────────────── */

  closeAllSearchResults() {
    this.element.querySelectorAll(".import-search-results").forEach(el => el.hidden = true)
    this.cardTargets.forEach(card => delete card._searchData)
  }

  clickOutside(event) {
    if (!this.element.contains(event.target)) {
      this.closeAllSearchResults()
    }
  }

  searchPath(category) {
    const paths = {
      anime: "/app/anilist/search",
      anime_movie: "/app/anilist/search",
      movie: "/app/tmdb/search",
      series: "/app/tmdb/search",
      game: "/app/steam/search"
    }
    return paths[category] || null
  }

  detailsUrl(category, result) {
    const id = result.id
    switch (category) {
      case "anime":
      case "anime_movie": return `/app/anilist/details?id=${id}`
      case "movie": return `/app/tmdb/details?id=${id}&type=movie`
      case "series": return `/app/tmdb/details?id=${id}&type=tv`
      case "game": return `/app/steam/details?id=${id}`
      default: return null
    }
  }

  escapeHtml(str) {
    if (!str) return ""
    const div = document.createElement("div")
    div.textContent = str
    return div.innerHTML
  }
}
