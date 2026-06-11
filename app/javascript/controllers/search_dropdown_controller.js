import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["input", "results"]
  static values = { items: Array }

  connect() {
    this.filtered = []
  }

  search() {
    const query = this.normalize(this.inputTarget.value)
    if (query.length < 1) {
      this.hide()
      return
    }

    this.filtered = this.itemsValue
      .filter((item) => this.normalize(item).includes(query))
      .slice(0, 8)

    if (this.filtered.length === 0) {
      this.hide()
      return
    }

    this.resultsTarget.innerHTML = this.filtered.map((item) => `
      <button type="button" class="block w-full min-h-[42px] px-4 text-left border-0 border-b border-[var(--line)] bg-[var(--panel-bg)] text-[var(--text)] text-[12px] tracking-[.04em] cursor-pointer hover:bg-[var(--hover-bg)] last:border-b-0" data-action="search-dropdown#select" data-value="${this.escapeHtml(item)}">
        ${this.escapeHtml(item)}
      </button>
    `).join("")
    this.resultsTarget.hidden = false
  }

  select(event) {
    this.inputTarget.value = event.currentTarget.dataset.value
    this.hide()
    this.inputTarget.form?.requestSubmit()
  }

  hide() {
    this.resultsTarget.hidden = true
    this.resultsTarget.innerHTML = ""
  }

  clickOutside(event) {
    if (!this.element.contains(event.target)) this.hide()
  }

  normalize(value) {
    return value.toString().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
  }

  escapeHtml(value) {
    const div = document.createElement("div")
    div.textContent = value
    return div.innerHTML
  }
}
