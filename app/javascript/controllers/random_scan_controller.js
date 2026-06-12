import { Controller } from "@hotwired/stimulus"
import gsap from "gsap"

export default class extends Controller {
  connect() {
    this.bars = Array.from(this.element.querySelectorAll("span"))
    this.tweens = new Set()
    this.active = true

    this.alignBars()
    this.startScans()

    this.resizeObserver = new ResizeObserver(() => this.alignBars())
    this.resizeObserver.observe(this.element)
  }

  disconnect() {
    this.active = false
    this.tweens?.forEach((tween) => tween.kill())
    this.tweens?.clear()
    this.resizeObserver?.disconnect()
  }

  alignBars() {
    const width = this.element.clientWidth
    const count = this.bars.length
    if (width === 0 || count === 0) return

    this.bars.forEach((bar, index) => {
      const distributedX = ((index + 1) * width) / (count + 1)
      const gridX = Math.round(distributedX / 9) * 9
      bar.style.setProperty("--bar-left", `${gridX}px`)
    })
  }

  startScans() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    this.bars.forEach((bar, index) => {
      const scan = bar.querySelector("i")
      if (!scan) return

      gsap.set(scan, {
        xPercent: -50,
        yPercent: Math.random() * 230,
        opacity: 0.28 + Math.random() * 0.14
      })

      this.animateScan(scan, index % 2 === 0 ? 1 : -1)
    })
  }

  animateScan(scan, direction) {
    if (!this.active) return

    const currentY = Number(gsap.getProperty(scan, "yPercent")) || 0
    const targetY = direction > 0 ? 230 : 0
    const distance = Math.abs(targetY - currentY) / 230
    const duration = Math.max(3.2, this.randomDuration() * Math.max(distance, 0.35))
    const fadeIn = Math.min(1.8, duration * 0.25)
    const fadeOut = Math.min(2.4, duration * 0.35)

    const timeline = gsap.timeline({
      onComplete: () => {
        this.tweens.delete(timeline)
        this.animateScan(scan, direction * -1)
      }
    })

    this.tweens.add(timeline)
    timeline.to(scan, { opacity: 0.42, duration: fadeIn, ease: "sine.inOut" }, 0)
    timeline.to(scan, { yPercent: targetY, duration, ease: "sine.inOut" }, 0)
    timeline.to(scan, { opacity: 0.16, duration: fadeOut, ease: "sine.inOut" }, Math.max(0, duration - fadeOut))
  }

  randomDuration() {
    const roll = Math.random()
    let range

    if (roll < 0.42) {
      range = [14, 22]
    } else if (roll < 0.72) {
      range = [9, 14]
    } else if (roll < 0.92) {
      range = [6.5, 9]
    } else {
      range = [4.8, 6.5]
    }

    return range[0] + Math.random() * (range[1] - range[0])
  }
}
