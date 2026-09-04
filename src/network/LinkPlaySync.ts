export class LinkPlaySync {
    private socket: WebSocket;
    private players: Map<string, any>;

    constructor(serverUrl: string) {
        this.socket = new WebSocket(serverUrl);
        this.players = new Map();

        this.socket.onmessage = this.handleMessage.bind(this);
        this.socket.onopen = this.onOpen.bind(this);
        this.socket.onclose = this.onClose.bind(this);
    }

    private onOpen() {
        console.log("Connected to the game server.");
    }

    private onClose() {
        console.log("Disconnected from the game server.");
    }

    private handleMessage(event: MessageEvent) {
        const data = JSON.parse(event.data);
        switch (data.type) {
            case "playerUpdate":
                this.updatePlayer(data.playerId, data.state);
                break;
            case "gameState":
                this.updateGameState(data.state);
                break;
            // Handle other message types as needed
        }
    }

    public sendPlayerUpdate(playerId: string, state: any) {
        const message = {
            type: "playerUpdate",
            playerId: playerId,
            state: state,
        };
        this.socket.send(JSON.stringify(message));
    }

    public sendGameState(state: any) {
        const message = {
            type: "gameState",
            state: state,
        };
        this.socket.send(JSON.stringify(message));
    }

    private updatePlayer(playerId: string, state: any) {
        this.players.set(playerId, state);
        // Additional logic to handle player state updates
    }

    private updateGameState(state: any) {
        // Logic to update the game state based on received data
    }

    public getPlayers() {
        return this.players;
    }
}