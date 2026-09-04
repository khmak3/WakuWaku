export class GameOverRules {
    private maxScore: number;
    private scoreLimit: number;

    constructor(maxScore: number, scoreLimit: number) {
        this.maxScore = maxScore;
        this.scoreLimit = scoreLimit;
    }

    public checkGameOver(playerScores: number[]): boolean {
        return playerScores.some(score => score >= this.scoreLimit);
    }

    public getWinner(playerScores: number[]): number {
        const maxScore = Math.max(...playerScores);
        return playerScores.indexOf(maxScore);
    }

    public resetGame(): void {
        // Logic to reset game state for a new game
    }
}