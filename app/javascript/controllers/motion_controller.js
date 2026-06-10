import { Controller } from "@hotwired/stimulus"
import gsap from "gsap"

export default class extends Controller {
  connect() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    this.context = gsap.context(() => this.animatePage(), this.element)
  }

  disconnect() {
    this.context?.revert()
  }

  animatePage() {
    const timeline = gsap.timeline({ defaults: { ease: "power3.out", overwrite: "auto" } })

    timeline.from(".landing-copy > *, .auth-panel > *", { opacity: 0, y: 20, duration: 0.5, stagger: 0.055 })
    timeline.from(".app-main .stat-card, .app-main .panel, .app-main .kanban-column, .app-main .media-card, .app-main .profile-card, .app-main .detail-hero, .app-main .form-section, .app-main .empty-state", { opacity: 0, y: 14, scale: 0.99, duration: 0.38, stagger: 0.025 }, "-=0.2")
    timeline.from(".pace-section, .category-strip", { opacity: 0, y: 24, duration: 0.55, stagger: 0.06 }, "-=0.15")
  }
}
