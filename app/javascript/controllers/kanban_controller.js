import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["column"]
  static classes = ["dragging", "dragOver"]
  static statusClasses = ["status-planned", "status-in-progress", "status-completed", "status-paused", "status-no-date"]

  connect() {
    this.dragItem = null
    this.sourceColumn = null
    this.sourceNextSibling = null
    this.recalcCounts()
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
    const oldStatus = card.dataset.kanbanStatus
    const mediaItemId = card.dataset.kanbanCardId
    const updateUrl = card.dataset.kanbanUpdateUrl
    const sourceColumn = this.sourceColumn
    const sourceNextSibling = this.sourceNextSibling

    const addCard = targetColumn.querySelector(".add-card")
    targetColumn.insertBefore(card, addCard)
    card.dataset.kanbanStatus = newStatus
    this.updateCardStatusColor(card, newStatus)
    this.recalcCounts()

    fetch(updateUrl || `/app/media_items/${mediaItemId}/update_status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": document.querySelector("[name='csrf-token']")?.content,
        "Accept": "application/json"
      },
      body: JSON.stringify({ status: newStatus })
    }).then(r => {
      if (!r.ok) throw new Error()
      const turboFrame = card.closest("turbo-frame")
      if (turboFrame) turboFrame.reload()
    }).catch(() => {
      sourceColumn?.insertBefore(card, sourceNextSibling)
      card.dataset.kanbanStatus = oldStatus
      this.updateCardStatusColor(card, oldStatus)
      this.recalcCounts()
    })
  }

  updateCardStatusColor(card, status) {
    const dot = card.querySelector(".status-dot")
    if (!dot) return

    dot.classList.remove(...this.constructor.statusClasses)
    dot.classList.add(`status-${status.replaceAll("_", "-")}`)
  }

  recalcCounts() {
    const counts = this.statusCounts()

    this.columnTargets.forEach(col => {
      const badge = col.querySelector("header small")
      if (badge) badge.textContent = counts[col.dataset.kanbanStatus] || 0
    })

    this.updateDashboardStats(counts)
  }

  statusCounts() {
    return this.columnTargets.reduce((counts, col) => {
      counts[col.dataset.kanbanStatus] = col.querySelectorAll("[data-kanban-card-id]").length
      return counts
    }, {})
  }

  updateDashboardStats(counts) {
    const total = Object.values(counts).reduce((sum, count) => sum + count, 0)
    const values = {
      total,
      planned: counts.planned || 0,
      in_progress: counts.in_progress || 0,
      completed: counts.completed || 0,
      paused: counts.paused || 0,
      no_date: counts.no_date || 0,
      completed_percentage: total === 0 ? "0%" : `${Math.round(((counts.completed || 0) / total) * 100)}%`
    }

    Object.entries(values).forEach(([key, value]) => {
      document.querySelectorAll(`[data-dashboard-stat='${key}']`).forEach((element) => {
        element.textContent = value
      })
    })
  }
}
