import { GameEngine } from '../engine/GameEngine';
import { PlayerState } from '../state/PlayerState';
import { GameState } from '../state/GameState';

export class TwoPlayerMode {
    private gameEngine: GameEngine;
    private player1State: PlayerState;
    private player2State: PlayerState;
    private gameState: GameState;

    constructor() {
        this.gameEngine = new GameEngine();
        this.player1State = new PlayerState(1);
        this.player2State = new PlayerState(2);
        this.gameState = new GameState(2);
    }

    public startGame(): void {
        this.gameEngine.initialize(this.player1State, this.player2State);
        this.gameEngine.start();
    }

    public handlePlayerAction(playerId: number, action: string): void {
        if (playerId === 1) {
            this.player1State.performAction(action);
        } else if (playerId === 2) {
            this.player2State.performAction(action);
        }
        this.checkGameOver();
    }

    private checkGameOver(): void {
        if (this.gameEngine.isGameOver()) {
            this.endGame();
        }
    }

    private endGame(): void {
        this.gameEngine.end();
        this.gameState.updateFinalScores(this.player1State.score, this.player2State.score);
        this.displayGameOverScreen();
    }

    private displayGameOverScreen(): void {
        // Logic to display the game over screen with final scores
    }
}