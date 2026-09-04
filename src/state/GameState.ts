export class GameState {
    private scores: number[];
    private activeBlocks: any[];
    private gameOver: boolean;

    constructor(numPlayers: number = 1) {
        this.scores = Array(numPlayers).fill(0);
        this.activeBlocks = [];
        this.gameOver = false;
    }

    public getScores(): number[] {
        return this.scores;
    }

    public getActiveBlocks(): any[] {
        return this.activeBlocks;
    }

    public isGameOver(): boolean {
        return this.gameOver;
    }

    public setScore(playerIndex: number, score: number): void {
        this.scores[playerIndex] = score;
    }

    public addActiveBlock(block: any): void {
        this.activeBlocks.push(block);
    }

    public removeActiveBlock(block: any): void {
        this.activeBlocks = this.activeBlocks.filter(b => b !== block);
    }

    public endGame(): void {
        this.gameOver = true;
    }

    public resetGame(numPlayers: number): void {
        this.scores = Array(numPlayers).fill(0);
        this.activeBlocks = [];
        this.gameOver = false;
    }

    public updateFinalScores(player1Score: number, player2Score: number): void {
        if (this.scores.length < 2) {
            this.scores = [player1Score, player2Score];
            return;
        }

        this.scores[0] = player1Score;
        this.scores[1] = player2Score;
    }
}