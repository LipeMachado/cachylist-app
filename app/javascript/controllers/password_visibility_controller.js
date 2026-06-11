import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["input"]

  connect() {
    this.visible = false
  }

  toggle(event) {
    event.preventDefault()
    this.visible = !this.visible
    this.inputTarget.type = this.visible ? "text" : "password"
    this.element.querySelector("[data-icon=on]").hidden = this.visible
    this.element.querySelector("[data-icon=off]").hidden = !this.visible
  }
}
