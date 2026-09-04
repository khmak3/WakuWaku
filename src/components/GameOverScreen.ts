/** Displays the game-over overlay with final scores and a restart button. */
export class GameOverScreen {
    constructor(private container: HTMLElement) {}

    public show(playerScores: number[]): void {
        this.container.innerHTML = `
            <h1>Game Over</h1>
            <ul>
                ${playerScores.map((score, index) => `<li>Player ${index + 1}: ${score}</li>`).join('')}
            </ul>
            <button id="restart-button">Restart Game</button>
        `;
        this.container.hidden = false;
        this.container.querySelector('#restart-button')?.addEventListener('click', () => location.reload());
    }

    public hide(): void {
        this.container.hidden = true;
    }
}