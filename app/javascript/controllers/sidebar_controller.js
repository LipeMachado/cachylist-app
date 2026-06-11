import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["link"]

  connect() {
    this.sync()

    this.linkTargets.forEach((link) => {
      link.addEventListener("click", () => this.setActive(link))
    })
  }

  setActive(clicked) {
    this.linkTargets.forEach((link) => {
      link.classList.toggle("active", link === clicked)
    })
  }

  sync() {
    const currentPath = window.location.pathname

    this.linkTargets.forEach((link) => {
      const linkPath = link.dataset.path
      const isMatch = linkPath === "/library"
        ? currentPath === linkPath
        : currentPath === linkPath

      link.classList.toggle("active", isMatch)
    })
  }
}
