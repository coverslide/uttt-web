import CustomElement from '@cover-slide/customelement'
import GlobalEventTarget from '../eventtarget/GlobalEventTarget'
import Game from '../game/Game'

class GameBoard extends CustomElement {
  private events: GlobalEventTarget
  private game: Game | undefined
  constructor() {
    super()
    this.events = GlobalEventTarget.getInstance()
  }

  connectedCallback(): void {
    this.game = new Game(this.root as HTMLElement)

    this.events.addEventListener('game:complete', (_) => {
      console.log('game completed')
    })

    this.events.addEventListener('outside:signal', (_) => {
      this.game?.log()
    })
  }
}

CustomElement.register(GameBoard, 'game-board')

export default GameBoard
