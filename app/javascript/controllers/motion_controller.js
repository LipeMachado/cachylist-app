import { Controller } from "@hotwired/stimulus"
import gsap from "gsap"

export default class extends Controller {
  connect() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    gsap.set("[data-motion], .landing-copy > *, .auth-panel > *, .pace-section, .category-strip", { clearProps: "all" })
    this.context = gsap.context(() => this.animatePage(), this.element)
  }

  disconnect() {
    this.context?.revert()
  }

  animatePage() {
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
    timeline.fromTo(".pace-section, .category-strip",
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 0.55, stagger: 0.06, clearProps: "opacity,y" },
      "-=0.15"
    )
  }
}
