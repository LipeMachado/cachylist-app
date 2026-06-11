import { Controller } from "@hotwired/stimulus"
import gsap from "gsap"

export default class extends Controller {
  static targets = [
    "modal", "dialog", "confirm", "confirmBackdrop",
    "confirmDelete", "confirmDeleteBackdrop",
    "confirmLogout", "confirmLogoutBackdrop",
    "form", "category", "status", "title",
    "passwordBackdrop", "passwordModal", "avatarBackdrop", "avatarModal"
  ]

  connect() {
    this.dirty = false
  }

  /* ── Media modal ─────────────────────────────────────── */

  open(event) {
    event.preventDefault()
    this._initializing = true
    this.dirty = false
    this.formTarget.reset()
    this.confirmTarget.hidden = true
    this.confirmBackdropTarget.hidden = true

    if (event.currentTarget.dataset.categoryValue && this.hasCategoryTarget) {
      this.categoryTarget.value = event.currentTarget.dataset.categoryValue
      this.categoryTarget.dispatchEvent(new Event("change", { bubbles: true }))
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
    this._initializing = false
  }

  markDirty() {
    if (this._initializing) return
    this.dirty = true
  }

  onCategoryChange(event) {
    this.updateTitle(event.target.value)
  }

  updateTitle(category) {
    if (!this.hasTitleTarget) return
    const labels = { anime: "Anime", series: "Série", movie: "Filme", book: "Livro", game: "Jogo" }
    const label = labels[category]
    this.titleTarget.textContent = label ? `Adicionar ${label}` : "Adicionar mídia"
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

  /* ── Delete account confirm ──────────────────────────── */

  requestDelete(event) {
    event.preventDefault()
    this.confirmDeleteBackdropTarget.hidden = false
    this.confirmDeleteTarget.hidden = false
    gsap.fromTo(this.confirmDeleteBackdropTarget, { opacity: 0 }, { opacity: 1, duration: 0.18, ease: "power2.out" })
    gsap.fromTo(this.confirmDeleteTarget, { opacity: 0, y: 12, scale: 0.98 }, { opacity: 1, y: 0, scale: 1, duration: 0.22, ease: "power2.out" })
  }

  confirmDelete(event) {
    event.preventDefault()
    const form = document.getElementById("delete-account-form")
    if (form) form.requestSubmit()
  }

  cancelDelete(event) {
    event.preventDefault()
    this.confirmDeleteTarget.hidden = true
    this.confirmDeleteBackdropTarget.hidden = true
  }

  /* ── Logout confirm ──────────────────────────────────── */

  requestLogout(event) {
    event.preventDefault()
    event.stopPropagation()
    this.confirmLogoutBackdropTarget.hidden = false
    this.confirmLogoutTarget.hidden = false
    gsap.fromTo(this.confirmLogoutBackdropTarget, { opacity: 0 }, { opacity: 1, duration: 0.18, ease: "power2.out" })
    gsap.fromTo(this.confirmLogoutTarget, { opacity: 0, y: 12, scale: 0.98 }, { opacity: 1, y: 0, scale: 1, duration: 0.22, ease: "power2.out" })
  }

  confirmLogout(event) {
    event.preventDefault()
    const form = document.getElementById("logout-form")
    if (form) form.requestSubmit()
  }

  cancelLogout(event) {
    event.preventDefault()
    this.confirmLogoutTarget.hidden = true
    this.confirmLogoutBackdropTarget.hidden = true
  }

  /* ── Password change modal ─────────────────────────────── */

  openPasswordModal(event) {
    event.preventDefault()
    this.passwordBackdropTarget.hidden = false
    this.passwordModalTarget.hidden = false
    gsap.fromTo(this.passwordBackdropTarget, { opacity: 0 }, { opacity: 1, duration: 0.18, ease: "power2.out" })
    gsap.fromTo(this.passwordModalTarget, { opacity: 0, y: 12, scale: 0.98 }, { opacity: 1, y: 0, scale: 1, duration: 0.22, ease: "power2.out" })
    this.passwordModalTarget.querySelector("input")?.focus()
  }

  closePasswordModal(event) {
    event.preventDefault()
    this.passwordModalTarget.hidden = true
    this.passwordBackdropTarget.hidden = true
  }

  /* ── Avatar modal ─────────────────────────────────────── */

  openAvatarModal(event) {
    event.preventDefault()
    this.avatarBackdropTarget.hidden = false
    this.avatarModalTarget.hidden = false
    gsap.fromTo(this.avatarBackdropTarget, { opacity: 0 }, { opacity: 1, duration: 0.18, ease: "power2.out" })
    gsap.fromTo(this.avatarModalTarget, { opacity: 0, y: 12, scale: 0.98 }, { opacity: 1, y: 0, scale: 1, duration: 0.22, ease: "power2.out" })
  }

  closeAvatarModal(event) {
    event.preventDefault()
    this.avatarModalTarget.hidden = true
    this.avatarBackdropTarget.hidden = true
  }
}
