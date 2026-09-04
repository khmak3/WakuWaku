export type DevPanelState = {
    blockTypes: string[];
    spawnRate: number;
    gameSpeed: number;
};

export type DevPanelProps = {
    onSave: (state: DevPanelState) => void;
};

export default class DevPanel {
    public state: DevPanelState;
    private readonly props: DevPanelProps;
    private readonly element: HTMLDivElement;

    constructor(props: DevPanelProps) {
        this.props = props;
        this.state = {
            blockTypes: [],
            spawnRate: 1000,
            gameSpeed: 1,
        };
        this.element = document.createElement('div');
        this.element.className = 'dev-panel';
        this.render();
    }

    public getElement(): HTMLDivElement {
        return this.element;
    }

    private setState(nextState: Partial<DevPanelState>): void {
        this.state = {
            ...this.state,
            ...nextState,
        };
        this.render();
    }

    private handleBlockTypeChange = (event: Event): void => {
        const target = event.target as HTMLInputElement;
        const blockTypes = target.value
            .split(',')
            .map((value) => value.trim())
            .filter(Boolean);

        this.setState({ blockTypes });
    };

    private handleSpawnRateChange = (event: Event): void => {
        const target = event.target as HTMLInputElement;
        this.setState({ spawnRate: Number(target.value) || 0 });
    };

    private handleGameSpeedChange = (event: Event): void => {
        const target = event.target as HTMLInputElement;
        this.setState({ gameSpeed: Number(target.value) || 0 });
    };

    private render(): void {
        this.element.innerHTML = `
            <h2>Developer Panel</h2>
            <div>
                <label>
                    Block Types (comma-separated):
                    <input type="text" value="${this.state.blockTypes.join(',')}" />
                </label>
            </div>
            <div>
                <label>
                    Spawn Rate (ms):
                    <input type="number" value="${this.state.spawnRate}" />
                </label>
            </div>
            <div>
                <label>
                    Game Speed:
                    <input type="number" value="${this.state.gameSpeed}" />
                </label>
            </div>
            <button type="button">Save Parameters</button>
        `;

        const blockTypeInput = this.element.querySelectorAll('input')[0] as HTMLInputElement | undefined;
        const spawnRateInput = this.element.querySelectorAll('input')[1] as HTMLInputElement | undefined;
        const gameSpeedInput = this.element.querySelectorAll('input')[2] as HTMLInputElement | undefined;
        const saveButton = this.element.querySelector('button') as HTMLButtonElement | null;

        blockTypeInput?.addEventListener('input', this.handleBlockTypeChange);
        spawnRateInput?.addEventListener('input', this.handleSpawnRateChange);
        gameSpeedInput?.addEventListener('input', this.handleGameSpeedChange);
        saveButton?.addEventListener('click', () => {
            this.props.onSave(this.state);
        });
    }
}