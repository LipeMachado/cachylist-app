import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["overlay"]

  open(event) {
    event.preventDefault()
    this.element.classList.add("mobile-menu-open")
    if (this.hasOverlayTarget) this.overlayTarget.hidden = false
    document.documentElement.classList.add("modal-open")
    document.body.classList.add("modal-open")
  }

  close(event) {
    if (event && event.currentTarget?.tagName !== "A") event.preventDefault()
    this.element.classList.remove("mobile-menu-open")
    if (this.hasOverlayTarget) this.overlayTarget.hidden = true
    document.documentElement.classList.remove("modal-open")
    document.body.classList.remove("modal-open")
  }

  keydown(event) {
    if (event.key === "Escape" && this.element.classList.contains("mobile-menu-open")) this.close(event)
  }
}
