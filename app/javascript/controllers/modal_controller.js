import { Controller } from "@hotwired/stimulus"
import gsap from "gsap"

export default class extends Controller {
  static targets = ["modal", "dialog", "confirm", "confirmBackdrop", "form", "category", "status"]

  connect() {
    this.dirty = false
  }

  open(event) {
    event.preventDefault()
    this.dirty = false
    this.formTarget.reset()
    this.confirmTarget.hidden = true
    this.confirmBackdropTarget.hidden = true

    if (event.currentTarget.dataset.categoryValue && this.hasCategoryTarget) {
      this.categoryTarget.value = event.currentTarget.dataset.categoryValue
    }

    if (event.currentTarget.dataset.statusValue && this.hasStatusTarget) {
      this.statusTarget.value = event.currentTarget.dataset.statusValue
    }

    this.modalTarget.hidden = false
    document.body.classList.add("modal-open")
    this.dialogTarget.scrollTop = 0
    gsap.fromTo(this.modalTarget, { opacity: 0 }, { opacity: 1, duration: 0.22, ease: "power2.out" })
    gsap.fromTo(this.dialogTarget, { opacity: 0, y: 26, scale: 0.98 }, { opacity: 1, y: 0, scale: 1, duration: 0.32, ease: "power3.out" })
    this.dialogTarget.querySelector("input, select, textarea")?.focus()
  }

  markDirty() {
    this.dirty = true
  }

  requestClose(event) {
    event.preventDefault()

    if (this.dirty) {
      this.confirmBackdropTarget.hidden = false
      this.confirmTarget.hidden = false
      gsap.fromTo(this.confirmBackdropTarget, { opacity: 0 }, { opacity: 1, duration: 0.18, ease: "power2.out" })
      gsap.fromTo(this.confirmTarget, { opacity: 0, y: 12, scale: 0.98 }, { opacity: 1, y: 0, scale: 1, duration: 0.22, ease: "power2.out" })
      return
    }

    this.close()
  }

  keepEditing(event) {
    event.preventDefault()
    this.confirmTarget.hidden = true
    this.confirmBackdropTarget.hidden = true
  }

  discard(event) {
    event.preventDefault()
    this.dirty = false
    this.confirmTarget.hidden = true
    this.confirmBackdropTarget.hidden = true
    this.close()
  }

  close() {
    gsap.to(this.dialogTarget, { opacity: 0, y: 16, scale: 0.98, duration: 0.2, ease: "power2.in" })
    gsap.to(this.modalTarget, {
      opacity: 0,
      duration: 0.22,
      ease: "power2.in",
      onComplete: () => {
        this.modalTarget.hidden = true
        document.body.classList.remove("modal-open")
      }
    })
  }
}
