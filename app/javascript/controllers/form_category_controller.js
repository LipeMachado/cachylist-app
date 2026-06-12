import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["group", "select"]

  connect() {
    this.showCategory(this.hasSelectTarget ? this.selectTarget.value : "")
  }

  change(event) {
    this.showCategory(event.target.value)
  }

  showCategory(category) {
    this.groupTargets.forEach((group) => {
      const categories = group.dataset.category || ""
      const show = categories.split(" ").includes(category)
      group.classList.toggle("hidden", !show)
      group.querySelectorAll("input, select, textarea").forEach((field) => {
        field.disabled = !show
      })
    })
  }
}
