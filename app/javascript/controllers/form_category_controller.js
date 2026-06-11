import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["group"]

  connect() {
    const select = this.element.querySelector("select")
    this.showCategory(select ? select.value : "anime")
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
