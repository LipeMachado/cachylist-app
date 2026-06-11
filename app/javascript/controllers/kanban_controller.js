import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["column"]
  static classes = ["dragging", "dragOver"]

  connect() {
    this.dragItem = null
    this.sourceColumn = null
    this.sourceNextSibling = null
  }

  dragStart(event) {
    const card = event.currentTarget.closest("[data-kanban-card-id]")
    if (!card) return

    this.dragItem = card
    this.sourceColumn = card.closest("[data-kanban-target='column']")
    this.sourceNextSibling = card.nextElementSibling

    card.classList.add(this.draggingClass || "is-dragging")
    event.dataTransfer.effectAllowed = "move"
    event.dataTransfer.setData("text/plain", card.dataset.kanbanCardId)

    const ghost = card.cloneNode(true)
    ghost.style.position = "absolute"
    ghost.style.top = "-1000px"
    ghost.style.width = `${card.offsetWidth}px`
    ghost.style.opacity = "0.85"
    ghost.style.border = "1px solid var(--accent)"
    ghost.style.outline = "2px solid var(--accent)"
    ghost.style.outlineOffset = "-2px"
    ghost.style.setProperty("border-radius", "0", "important")
    ghost.style.setProperty("box-shadow", "none", "important")
    ghost.style.background = "var(--surface)"
    ghost.style.pointerEvents = "none"
    document.body.appendChild(ghost)
    event.dataTransfer.setDragImage(ghost, event.offsetX, event.offsetY)
    requestAnimationFrame(() => document.body.removeChild(ghost))
  }

  dragEnd(event) {
    this.columnTargets.forEach(col => col.classList.remove(this.dragOverClass || "is-drag-over"))

    if (this.dragItem) {
      this.dragItem.classList.remove(this.draggingClass || "is-dragging")
      this.dragItem = null
    }
    this.sourceColumn = null
    this.sourceNextSibling = null
  }

  allowDrop(event) {
    event.preventDefault()
    event.currentTarget.classList.add(this.dragOverClass || "is-drag-over")
  }

  dragEnter(event) {
    event.preventDefault()
  }

  dragLeave(event) {
    const column = event.currentTarget
    if (!column.contains(event.relatedTarget)) {
      column.classList.remove(this.dragOverClass || "is-drag-over")
    }
  }

  drop(event) {
    event.preventDefault()
    const targetColumn = event.currentTarget
    targetColumn.classList.remove(this.dragOverClass || "is-drag-over")

    const card = this.dragItem
    if (!card || targetColumn === this.sourceColumn) return

    const newStatus = targetColumn.dataset.kanbanStatus
    const mediaItemId = card.dataset.kanbanCardId

    const addCard = targetColumn.querySelector(".add-card")
    targetColumn.insertBefore(card, addCard)
    this.recalcCounts()

    fetch(`/media_items/${mediaItemId}/update_status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": document.querySelector("[name='csrf-token']")?.content,
        "Accept": "application/json"
      },
      body: JSON.stringify({ status: newStatus })
    }).then(r => {
      if (!r.ok) throw new Error()
      card.dataset.kanbanStatus = newStatus
      const turboFrame = card.closest("turbo-frame")
      if (turboFrame) turboFrame.reload()
    }).catch(() => {
      this.sourceColumn?.insertBefore(card, this.sourceNextSibling)
      this.recalcCounts()
    })
  }

  recalcCounts() {
    this.columnTargets.forEach(col => {
      const count = col.querySelectorAll("[data-kanban-card-id]").length
      const badge = col.querySelector("header small")
      if (badge) badge.textContent = count
    })
  }
}
