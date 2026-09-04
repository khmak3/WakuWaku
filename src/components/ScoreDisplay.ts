/** Renders one score readout per player inside the given container. */
export class ScoreDisplay {
    constructor(private container: HTMLElement) {}

    public update(scores: number[]): void {
        this.container.innerHTML = scores
            .map((score, index) => `<span class="player-score">P${index + 1}: ${score}</span>`)
            .join('');
    }
}