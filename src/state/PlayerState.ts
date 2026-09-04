export class PlayerState {
    playerId: number;
    score: number;
    actions: string[];

    constructor(playerId: number = 0) {
        this.playerId = playerId;
        this.score = 0;
        this.actions = [];
    }

    addAction(action: string) {
        this.actions.push(action);
    }

    clearActions() {
        this.actions = [];
    }

    updateScore(points: number) {
        this.score += points;
    }

    performAction(action: string): void {
        this.addAction(action);
    }
}