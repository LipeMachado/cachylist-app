import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["column"]
  static classes = ["dragging", "dragOver"]
  static statusClasses = ["status-planned", "status-in-progress", "status-completed", "status-paused", "status-no-date"]

  connect() {
    this.dragItem = null
    this.sourceColumn = null
    this.sourceNextSibling = null
    this.dropCommitted = false
    this.mouseState = null
    this.ghost = null
    this.currentDropColumn = null
    this.suppressNextClick = false
    this.boundPointerDragMove = this.pointerDragMove.bind(this)
    this.boundPointerDragEnd = this.pointerDragEnd.bind(this)
    this.recalcCounts()
  }

  disconnect() {
    this.cleanupMouseDrag()
    document.removeEventListener("pointermove", this.boundPointerDragMove)
    document.removeEventListener("pointerup", this.boundPointerDragEnd)
    document.removeEventListener("pointercancel", this.boundPointerDragEnd)
  }

  /* ── Native HTML5 Drag & Drop ─────────────────────────── */

  dragStart(event) {
    const card = event.currentTarget.closest("[data-kanban-card-id]")
    if (!card) return

    this.cleanupMouseDrag()

    this.dragItem = card
    this.sourceColumn = card.closest("[data-kanban-target='column']")
    this.sourceNextSibling = card.nextElementSibling
    this.dropCommitted = false

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
      if (!this.dropCommitted) this.sourceColumn?.insertBefore(this.dragItem, this.sourceNextSibling)
      this.dragItem.classList.remove(this.draggingClass || "is-dragging")
      this.dragItem = null
    }
    this.sourceColumn = null
    this.sourceNextSibling = null
  }

  allowDrop(event) {
    event.preventDefault()
    const column = event.currentTarget
    column.classList.add(this.dragOverClass || "is-drag-over")

    if (!this.dragItem) return

    const afterElement = this.dragAfterElement(column, event.clientY)
    column.insertBefore(this.dragItem, afterElement)
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
    if (!card) return

    const newStatus = targetColumn.dataset.kanbanStatus
    const oldStatus = card.dataset.kanbanStatus
    const sourceColumn = this.sourceColumn
    const sourceNextSibling = this.sourceNextSibling

    this.dropCommitted = true
    card.dataset.kanbanStatus = newStatus
    this.updateCardStatusColor(card, newStatus)
    this.recalcCounts()

    fetch("/app/media_items/reorder", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": document.querySelector("[name='csrf-token']")?.content,
        "Accept": "application/json"
      },
      body: JSON.stringify({ columns: this.orderedColumnsPayload() })
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

  /* ── Pointer Drag & Drop (mouse + touch) ───────────────── */

  pointerDragStart(event) {
    if (event.pointerType === "mouse" && event.button !== 0) return
    const card = event.currentTarget.closest("[data-kanban-card-id]")
    if (!card || this.dragItem) return

    this.mouseState = {
      card,
      startX: event.clientX,
      startY: event.clientY,
      dragging: false,
      pointerId: event.pointerId
    }

    document.addEventListener("pointermove", this.boundPointerDragMove, { passive: false })
    document.addEventListener("pointerup", this.boundPointerDragEnd)
    document.addEventListener("pointercancel", this.boundPointerDragEnd)
  }

  suppressClick(event) {
    if (!this.suppressNextClick) return
    event.preventDefault()
    event.stopImmediatePropagation()
    this.suppressNextClick = false
  }

  pointerDragMove(event) {
    if (!this.mouseState) return
    if (this.mouseState.pointerId !== event.pointerId) return

    if (!this.mouseState.dragging) {
      const dx = event.clientX - this.mouseState.startX
      const dy = event.clientY - this.mouseState.startY
      if (Math.abs(dx) <= 5 && Math.abs(dy) <= 5) return
      event.preventDefault()
      this.mouseState.dragging = true
      this.suppressNextClick = true
      this.initiateMouseDrag(this.mouseState.card, event)
      return
    }

    event.preventDefault()
    this.autoScrollBoard(event.clientX)

    if (this.ghost) {
      this.ghost.style.left = `${event.clientX - this.ghost.offsetWidth / 2}px`
      this.ghost.style.top = `${event.clientY - 10}px`
    }

    this.columnTargets.forEach(col => col.classList.remove(this.dragOverClass || "is-drag-over"))
    this.currentDropColumn = null

    if (!this.ghost) return

    this.ghost.style.display = "none"
    const element = document.elementFromPoint(event.clientX, event.clientY)
    this.ghost.style.display = ""

    if (element) {
      const column = element.closest("[data-kanban-target='column']")
      if (column) {
        column.classList.add(this.dragOverClass || "is-drag-over")
        this.currentDropColumn = column

        const afterElement = this.dragAfterElement(column, event.clientY)
        if (this.mouseState && this.mouseState.card) {
          column.insertBefore(this.mouseState.card, afterElement)
        }
      }
    }
  }

  pointerDragEnd(event) {
    if (!this.mouseState) return
    if (event.pointerId && this.mouseState.pointerId !== event.pointerId) return

    if (this.mouseState.dragging) {
      this.commitMouseDrop()
    }

    this.cleanupMouseDrag()
    document.removeEventListener("pointermove", this.boundPointerDragMove)
    document.removeEventListener("pointerup", this.boundPointerDragEnd)
    document.removeEventListener("pointercancel", this.boundPointerDragEnd)
  }

  initiateMouseDrag(card, event) {
    this.sourceColumn = card.closest("[data-kanban-target='column']")
    this.sourceNextSibling = card.nextElementSibling
    this.currentDropColumn = null

    card.classList.add(this.draggingClass || "is-dragging")

    this.ghost = card.cloneNode(true)
    this.ghost.style.position = "fixed"
    this.ghost.style.pointerEvents = "none"
    this.ghost.style.zIndex = "9999"
    this.ghost.style.opacity = "0.9"
    this.ghost.style.border = "1px solid var(--accent)"
    this.ghost.style.outline = "2px solid var(--accent)"
    this.ghost.style.outlineOffset = "-2px"
    this.ghost.style.width = `${card.offsetWidth}px`
    this.ghost.style.setProperty("border-radius", "0", "important")
    this.ghost.style.setProperty("box-shadow", "none", "important")
    this.ghost.style.background = "var(--surface)"
    this.ghost.style.left = `${event.clientX - card.offsetWidth / 2}px`
    this.ghost.style.top = `${event.clientY - 10}px`
    document.body.appendChild(this.ghost)
  }

  commitMouseDrop() {
    const targetColumn = this.currentDropColumn
    this.columnTargets.forEach(col => col.classList.remove(this.dragOverClass || "is-drag-over"))

    const card = this.mouseState?.card
    const sourceColumn = this.sourceColumn
    const sourceNextSibling = this.sourceNextSibling

    if (!card) return

    if (!targetColumn) {
      sourceColumn?.insertBefore(card, sourceNextSibling)
      return
    }

    const newStatus = targetColumn.dataset.kanbanStatus
    const oldStatus = card.dataset.kanbanStatus

    card.dataset.kanbanStatus = newStatus
    this.updateCardStatusColor(card, newStatus)
    this.recalcCounts()

    fetch("/app/media_items/reorder", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": document.querySelector("[name='csrf-token']")?.content,
        "Accept": "application/json"
      },
      body: JSON.stringify({ columns: this.orderedColumnsPayload() })
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

  cleanupMouseDrag() {
    if (this.ghost) {
      document.body.removeChild(this.ghost)
      this.ghost = null
    }

    if (this.mouseState?.card) {
      this.mouseState.card.classList.remove(this.draggingClass || "is-dragging")
    }

    this.columnTargets.forEach(col => col.classList.remove(this.dragOverClass || "is-drag-over"))
    this.currentDropColumn = null
    this.sourceColumn = null
    this.sourceNextSibling = null
    this.mouseState = null
  }

  /* ── Shared helpers ───────────────────────────────────── */

  dragAfterElement(column, y) {
    const cards = [...column.querySelectorAll("[data-kanban-card-id]:not(.is-dragging)")]

    return cards.reduce((closest, child) => {
      const box = child.getBoundingClientRect()
      const offset = y - box.top - box.height / 2

      if (offset < 0 && offset > closest.offset) return { offset, element: child }
      return closest
    }, { offset: Number.NEGATIVE_INFINITY, element: null }).element
  }

  autoScrollBoard(x) {
    const box = this.element.getBoundingClientRect()
    const edge = 48
    const speed = 16

    if (x > box.right - edge) {
      this.element.scrollLeft += speed
    } else if (x < box.left + edge) {
      this.element.scrollLeft -= speed
    }
  }

  orderedColumnsPayload() {
    return this.columnTargets.reduce((payload, column) => {
      payload[column.dataset.kanbanStatus] = [...column.querySelectorAll("[data-kanban-card-id]")].map((card) => card.dataset.kanbanCardId)
      return payload
    }, {})
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
