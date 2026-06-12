import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["img"]

  connect() {
    this.element.addEventListener("reveal", () => this.load(), { once: true })
  }

  load() {
    this.imgTargets.forEach((img) => {
      const src = img.getAttribute("data-src")
      if (!src || img.src) return

      img.addEventListener("load", () => img.classList.add("loaded"), { once: true })
      if (img.complete) img.classList.add("loaded")
      img.src = src
      img.removeAttribute("data-src")
    })
  }
}
