import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["link"]

  connect() {
    this.element.classList.toggle("sidebar-collapsed", localStorage.getItem("sidebar-collapsed") === "true")
    this.boundSync = this.sync.bind(this)
    this.sync()

    document.addEventListener("turbo:render", this.boundSync)
    document.addEventListener("turbo:load", this.boundSync)
    window.addEventListener("popstate", this.boundSync)
  }

  disconnect() {
    document.removeEventListener("turbo:render", this.boundSync)
    document.removeEventListener("turbo:load", this.boundSync)
    window.removeEventListener("popstate", this.boundSync)
  }

  setActive(eventOrLink) {
    const clicked = eventOrLink.currentTarget || eventOrLink

    this.linkTargets.forEach((link) => {
      link.classList.toggle("active", link === clicked)
      link.classList.toggle("text-[var(--text)]", link === clicked)
      link.classList.toggle("bg-[var(--hover-bg)]", link === clicked)
      link.classList.toggle("shadow-[inset_3px_0_0_var(--accent)]", link === clicked)
    })
  }

  collapse() {
    this.element.classList.add("sidebar-collapsed")
    localStorage.setItem("sidebar-collapsed", "true")
  }

  expand() {
    this.element.classList.remove("sidebar-collapsed")
    localStorage.setItem("sidebar-collapsed", "false")
  }

  sync() {
    const currentPath = this.normalizePath(window.location.pathname)
    const activeLink = this.linkTargets
      .filter((link) => this.matchesPath(currentPath, this.normalizePath(link.dataset.path)))
      .sort((a, b) => this.normalizePath(b.dataset.path).length - this.normalizePath(a.dataset.path).length)[0]
    const activePath = this.normalizePath(activeLink?.dataset.path)

    this.linkTargets.forEach((link) => {
      const isMatch = this.normalizePath(link.dataset.path) === activePath

      link.classList.toggle("active", isMatch)
      link.classList.toggle("text-[var(--text)]", isMatch)
      link.classList.toggle("bg-[var(--hover-bg)]", isMatch)
      link.classList.toggle("shadow-[inset_3px_0_0_var(--accent)]", isMatch)
    })
  }

  matchesPath(currentPath, linkPath) {
    return currentPath === linkPath || currentPath.startsWith(`${linkPath}/`)
  }

  normalizePath(path) {
    return (path || "").replace(/\/$/, "") || "/"
  }
}
