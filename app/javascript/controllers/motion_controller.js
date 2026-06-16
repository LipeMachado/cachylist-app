import { Controller } from "@hotwired/stimulus"
import gsap from "gsap"

export default class extends Controller {
  connect() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    gsap.set("[data-motion], [data-controller='kanban'], .landing-copy > *, .auth-panel > *, .pace-copy, .category-strip", { clearProps: "all" })
    this.context = gsap.context(() => this.animatePage(), this.element)
  }

  disconnect() {
    this.context?.revert()
  }

  animatePage() {
    if (document.body.classList.contains("app-body")) {
      this.animateAppPage()
      return
    }

    const timeline = gsap.timeline({ defaults: { ease: "power3.out", overwrite: "auto" } })

    timeline.fromTo(".landing-copy > *, .auth-panel > *",
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.5, stagger: 0.055, clearProps: "opacity,y" }
    )
    timeline.fromTo("[data-motion]",
      { opacity: 0, y: 14, scale: 0.99 },
      { opacity: 1, y: 0, scale: 1, duration: 0.38, stagger: 0.025, clearProps: "opacity,y,scale" },
      "-=0.2"
    )
    timeline.fromTo(".pace-copy, .category-strip",
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 0.55, stagger: 0.06, clearProps: "opacity,y" },
      "-=0.15"
    )
  }

  animateAppPage() {
    this.animateStats()

    gsap.fromTo("[data-kanban-card-id], .mobile-progress-card, .mobile-latest-card",
      { opacity: 0, y: 14, scale: 0.985 },
      { opacity: 1, y: 0, scale: 1, duration: 0.38, stagger: 0.025, ease: "power3.out", clearProps: "opacity,y,scale" }
    )
  }

  animateStats() {
    document.querySelectorAll("[data-dashboard-stat]").forEach((element) => {
      const rawValue = element.textContent.trim()
      const hasPercent = rawValue.endsWith("%")
      const target = Number.parseInt(rawValue.replace(/[^0-9-]/g, ""), 10)
      if (Number.isNaN(target)) return

      const state = { value: 0 }
      element.textContent = hasPercent ? "0%" : "0"

      gsap.to(state, {
        value: target,
        duration: 0.9,
        ease: "power2.out",
        onUpdate: () => {
          const value = Math.round(state.value)
          element.textContent = hasPercent ? `${value}%` : `${value}`
        }
      })
    })
  }
}
