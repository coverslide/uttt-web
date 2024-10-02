import CustomElement from "@cover-slide/customelement";
import GlobalEventTarget from "../eventtarget/GlobalEventTarget";
import Game from "../game/Game";

class GameBoard extends CustomElement {
    private events :GlobalEventTarget;
    private game :Game | undefined;
    constructor(){
        super();
        this.events = GlobalEventTarget.getInstance();
    }

    connectedCallback(): void {
        this.game = new Game(this.root as HTMLElement);

        
    }
}

CustomElement.register(GameBoard, "game-board");

export default GameBoard;