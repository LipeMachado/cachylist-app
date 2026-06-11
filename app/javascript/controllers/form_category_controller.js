import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["group"]

  connect() {
    this.showCategory("anime")
  }

  change(event) {
    this.showCategory(event.target.value)
  }

  showCategory(category) {
    this.groupTargets.forEach((group) => {
      const categories = group.dataset.category || ""
      const show = categories.split(" ").includes(category)
      group.classList.toggle("hidden", !show)
    })
  }
}
