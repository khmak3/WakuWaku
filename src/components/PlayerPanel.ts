/** Renders a single player's name/status card inside the given container. */
export class PlayerPanel {
    public readonly container: HTMLElement;

    constructor(container: HTMLElement, private playerName: string) {
        this.container = container;
        this.container.textContent = this.playerName;
    }

    public update(currentAction: string | null): void {
        this.container.textContent = currentAction ? `${this.playerName} - ${currentAction}` : this.playerName;
    }
}