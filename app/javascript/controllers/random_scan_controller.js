import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  connect() {
    this.bars = Array.from(this.element.querySelectorAll("span"))

    this.alignBars()

    this.resizeObserver = new ResizeObserver(() => this.alignBars())
    this.resizeObserver.observe(this.element)
  }

  disconnect() {
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
}
