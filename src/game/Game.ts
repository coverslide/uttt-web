import Phaser from "phaser";

function buildConfig(parent :HTMLElement):Phaser.Types.Core.GameConfig{
    const gameConfig :Phaser.Types.Core.GameConfig = {
        parent: parent,
        scale: {parent: parent},
        mode: Phaser.Scale.ScaleModes.FIT,
    }

    return gameConfig;
}

export default class Game extends Phaser.Game {
    constructor(parent :HTMLElement){
        super(buildConfig(parent));
        this.scene.add("game", new GameScene());
        this.scene.run("game");
    }
}

class GameScene extends Phaser.Scene {
    private currentPlayerTurn = 1;
    private enabledGrids: {x:number,y:number}[] = initializeEnabledGrids();

    private subGridsStatus :number[][][][] = initializeSubGridStatus();
    private gridStatus :number[][] = initializeGridStatus();
    private enabledBoxes :Phaser.GameObjects.Image[] = [];
    private playerMarks :Phaser.GameObjects.Image[] = [];
    private currentTurnImage :Phaser.GameObjects.Image | undefined;
    private completedImages :Phaser.GameObjects.Image[] = [];

    preload(){
        this.load.image("X", "assets/dist/X.png");
        this.load.image("O", "assets/dist/O.png");
        this.load.image("largeBoard", "assets/dist/largeBoard.png");
        this.load.image("smallBoard", "assets/dist/smallBoard.png");
        this.load.image("enabledBox", "assets/dist/enabledBox.png");
    }

    create(){
        this.add.image(512, 384, "largeBoard");
        
        this.add.image(256, 128, "smallBoard"); // 0
        this.add.image(512, 128, "smallBoard");
        this.add.image(768, 128, "smallBoard");

        this.add.image(512, 384, "smallBoard");
        this.add.image(768, 384, "smallBoard");
        this.add.image(256, 384, "smallBoard");
        
        this.add.image(512, 640, "smallBoard");
        this.add.image(768, 640, "smallBoard");
        this.add.image(256, 640, "smallBoard");

        this.input.on("gameobjectdown", (
            pointer: Phaser.Input.Pointer,
            gameobject :Phaser.GameObjects.GameObject[]
        ) => {
            console.log(pointer, gameobject);
        })
        
        this.input.on("pointerdown", (pointer : Phaser.Input.Pointer) => {

            const clickedCell = Math.floor((pointer.downX + - 128) / 256);
            const clickedRow =  Math.floor((pointer.downY) / 256);

            if (
                clickedCell >= 0 &&
                clickedCell <= 2 &&
                clickedRow >= 0 &&
                clickedRow <= 2
            ) {
                if (!this.enabledGrids.some(grid => grid.x == clickedCell && grid.y == clickedRow)) {
                    return;
                };
                
                const cellOffset = 128 + 256 * clickedCell;
                const rowOffset = 256 * clickedRow;

                const innerX = pointer.downX - cellOffset;
                const innerY = pointer.downY - rowOffset;

                const innerCell = Math.floor(innerX / 85.3);
                const innerRow = Math.floor(innerY / 85.3);

                if (
                    innerCell >= 0 &&
                    innerCell <= 2 &&
                    innerRow >= 0 &&
                    innerRow <= 2
                ) {
                    const subGridStatus = this.subGridsStatus[clickedCell][clickedRow][innerCell][innerRow];
                    if (subGridStatus != 0) {
                        return;
                    }
                    this.subGridsStatus[clickedCell][clickedRow][innerCell][innerRow] = this.currentPlayerTurn;
                    const imageId :string = this.currentPlayerTurn === 1 ? "O" : "X";
                    const currentMark = this.add.image(
                        cellOffset + (innerCell * 85.3) + 43.5,
                        rowOffset + (innerRow * 85.3) + 43.5,
                        imageId
                    );

                    currentMark.scale=0.9;
                    this.playerMarks.push(currentMark);
                    
                    const subgridVictoryStatus = checkVictory(this.subGridsStatus[clickedCell][clickedRow]);

                    if (subgridVictoryStatus > 0) {
                        this.gridStatus[clickedCell][clickedRow] = subgridVictoryStatus;
                        
                        const completedImage = this.add.image(
                            (clickedCell * 256) + 256,
                            (clickedRow * 256) + 128,
                            imageId
                        );
                        completedImage.scale = 3;
                        this.completedImages.push(completedImage);
                    }

                    const gridVictoryStatus = checkVictory(this.gridStatus);
                    if (gridVictoryStatus > 0) {
                        this.enabledGrids = [];
                        this.updateEnabledBox();
                        setTimeout(() => {
                            alert(imageId + " Wins!");
                        }, 100);
                        setTimeout(() => {
                        this.initializeAll();
                        this.updateEnabledBox();
                        }, 1000);
                        return;
                    }

                    if (this.gridStatus[innerCell][innerRow] > 0) {
                        this.enabledGrids = [];
                        for (let i = 0 ; i < 3 ; i++) {
                            for (let j = 0 ; j < 3 ; j++) {
                                if (this.gridStatus[i][j] === 0) {
                                    this.enabledGrids.push({
                                        x: i,
                                        y: j,
                                    });
                                }
                            }
                        }
                    } else {
                        this.enabledGrids = [
                            {
                                x: innerCell,
                                y: innerRow,
                            }
                        ];
                    }
                    
                    this.currentPlayerTurn = 1 + (this.currentPlayerTurn) % 2;
                }
            }

            this.updateEnabledBox();
            this.updateCurrentTurn();
        })
        
        this.updateEnabledBox();
        this.updateCurrentTurn();
    }

    updateEnabledBox(){
        this.enabledBoxes.forEach(box => box.destroy());

        this.enabledGrids.forEach(grid => {
            this.enabledBoxes.push(
                this.add.image(
                    (grid.x * 256) + 256,
                    (grid.y * 256) + 128,
                    "enabledBox"
                )
            )
        });
    }

    updateCurrentTurn(){
        this.currentTurnImage?.destroy();
        const playerTokenId = this.currentPlayerTurn === 1 ? "O" : "X";
        this.currentTurnImage = this.add.image(50, 50, playerTokenId);
    }

    private initializeAll(){
        this.playerMarks.forEach(mark => mark.destroy());
        this.completedImages.forEach(image => image.destroy());

        this.completedImages = [];
        this.playerMarks = [];
        this.enabledGrids = initializeEnabledGrids();
    
        this.subGridsStatus = initializeSubGridStatus();
        this.gridStatus = initializeGridStatus();
        this.enabledBoxes = [];
        
        this.updateEnabledBox();
        this.updateCurrentTurn();
    }
}

function initializeSubGridStatus() :number[][][][] {
    const subGrids :number[][][][] = [];
    for (let i = 0 ; i < 3 ; i++) {
        subGrids[i] = [[[]]];
        for (let j = 0 ; j < 3 ; j++) {
            subGrids[i][j] = [];
            for (let k = 0 ; k < 3 ; k++) {
                subGrids[i][j][k] = [];
                for (let l = 0 ; l < 3 ; l++) {
                    subGrids[i][j][k] = [0, 0, 0];
                }
            }
        }
    }
    return subGrids;
}


function initializeGridStatus() :number[][] {
    const subGrids :number[][] = [];
    for (let i = 0 ; i < 3 ; i++) {
        subGrids[i] = [];
        for (let j = 0 ; j < 3 ; j++) {
            subGrids[i][j] = 0;
        }
    }
    return subGrids;
}

function initializeEnabledGrids() :{x:number,y:number}[] {
    const enabledGrids :{x:number,y:number}[] = [];
    for (let i = 0 ; i < 3 ; i++) {
        for (let j = 0 ; j < 3 ; j++) {
            enabledGrids.push({x:i, y:j});
        }
    }
    return enabledGrids;
}

function checkVictory(grid :number[][]) :number {
    // cells
    for (let i = 0 ; i < 3 ; i++) {
        if (
            grid[i][0] > 0 &&
            (grid[i][0] === grid[i][1] && grid[i][0] === grid[i][2])
        ) {
            return grid[i][0];
        }
    }
    // rows
    for (let i = 0 ; i < 3 ; i++) {
        if (
            grid[0][i] > 0 &&
            (grid[0][i] === grid[1][i] && grid[0][i] === grid[2][i])
        ) {
            return grid[0][i];
        }
    }
    
    // diagonals
    if (
        grid[1][1] > 0 &&
        (grid[1][1] === grid[0][0] && grid[1][1] === grid[2][2])
    ) {
        return grid[1][1];
    }
    
    if (
        grid[1][1] > 0 &&
        (grid[1][1] === grid[0][2] && grid[1][1] === grid[2][0])
    ) {
        return grid[1][1];
    }
    
    return 0;
}
