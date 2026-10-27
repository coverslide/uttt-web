import CustomElement from '@cover-slide/customelement'
import GlobalEventTarget from '../eventtarget/GlobalEventTarget'

class MainApp extends CustomElement {
  private events: GlobalEventTarget
  private initialized: boolean = false

  constructor() {
    super()
    this.events = GlobalEventTarget.getInstance()
  }

  connectedCallback(): void {
    super.connectedCallback()

    this.events.addEventListener('socket:connect', (_) => {
      if (this.initialized) {
        return
      }
      this.initialized = true
      this.events.dispatchEvent(new Event('app:connected'))
    })
  }
}

CustomElement.register(MainApp, 'main-app', `<game-board></game-board>`)

export default MainApp
