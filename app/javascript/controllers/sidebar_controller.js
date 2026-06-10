import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["link"]

  connect() {
    this.sync()
  }

  sync() {
    const currentPath = window.location.pathname

    this.linkTargets.forEach((link) => {
      const linkPath = link.dataset.path
      const active = linkPath === "/library" ? currentPath === linkPath : currentPath === linkPath

      link.classList.toggle("active", active)
    })
  }
}
