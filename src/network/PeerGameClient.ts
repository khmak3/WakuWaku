import Peer, { type DataConnection } from 'peerjs';

export type GameMode = 'single' | 'host' | 'guest';

export interface FeedPayload {
    bone: number;
    bamboo: number;
    banana: number;
    carrot: number;
    cheese: number;
    columns: number[];
}

export type PeerSystemMessageType = 'feed' | 'game-over' | 'restart';

export interface PeerSystemMessage {
    type: PeerSystemMessageType;
    payload: Record<string, unknown> | FeedPayload;
}

export class PeerGameClient {
    private peer: Peer | null = null;
    private connection: DataConnection | null = null;
    private peerId: string | null = null;
    private onConnected: (() => void) | null = null;
    private onReceive: ((payload: FeedPayload) => void) | null = null;
    private onMessage: ((message: PeerSystemMessage) => void) | null = null;

    public startHost(
        onReady: (peerId: string) => void,
        onConnected: () => void,
        onReceive: (payload: FeedPayload) => void,
        onMessage?: (message: PeerSystemMessage) => void,
    ): void {
        this.disconnect();
        this.onConnected = onConnected;
        this.onReceive = onReceive;
        this.onMessage = onMessage ?? null;
        this.peer = new Peer({ debug: 1 });
        this.peer.on('open', (id) => {
            this.peerId = id;
            onReady(id);
        });
        this.peer.on('connection', (conn) => {
            this.connection = conn;
            this.connection.on('data', (payload) => this.handleIncoming(payload));
            this.connection.on('open', () => {
                this.onConnected?.();
            });
        });
    }

    public connectAsGuest(
        hostId: string,
        onConnected: () => void,
        onReceive: (payload: FeedPayload) => void,
        onMessage?: (message: PeerSystemMessage) => void,
    ): void {
        this.disconnect();
        this.onConnected = onConnected;
        this.onReceive = onReceive;
        this.onMessage = onMessage ?? null;
        this.peer = new Peer({ debug: 1 });
        this.peer.on('open', () => {
            this.connection = this.peer!.connect(hostId);
            this.connection.on('open', () => {
                this.onConnected?.();
            });
            this.connection.on('data', (payload) => this.handleIncoming(payload));
        });
    }

    public sendFeed(payload: FeedPayload): void {
        this.sendMessage({ type: 'feed', payload });
    }

    public sendSystemMessage(type: PeerSystemMessageType, payload: Record<string, unknown> | FeedPayload = {}): void {
        this.sendMessage({ type, payload });
    }

    private sendMessage(message: PeerSystemMessage): void {
        if (!this.connection || !this.connection.open) return;
        this.connection.send(message);
    }

    public getPeerId(): string | null {
        return this.peerId;
    }

    public isConnected(): boolean {
        return !!this.connection && this.connection.open;
    }

    public disconnect(): void {
        this.connection?.close();
        this.peer?.destroy();
        this.connection = null;
        this.peer = null;
        this.peerId = null;
    }

    private handleIncoming(payload: unknown): void {
        if (!payload || typeof payload !== 'object') return;

        const message = payload as Partial<PeerSystemMessage> & Partial<FeedPayload>;
        if (typeof message.type === 'string') {
            if (message.type === 'feed') {
                const feedPayload = (message.payload ?? message) as Partial<FeedPayload>;
                const normalized = this.normalizeFeed(feedPayload);
                this.onReceive?.(normalized);
                return;
            }

            this.onMessage?.({
                type: message.type as PeerSystemMessageType,
                payload: (message.payload as Record<string, unknown>) ?? {},
            });
            return;
        }

        const normalized = this.normalizeFeed(message as Partial<FeedPayload>);
        this.onReceive?.(normalized);
    }

    private normalizeFeed(feed: Partial<FeedPayload>): FeedPayload {
        return {
            bone: Number(feed.bone ?? 0),
            bamboo: Number(feed.bamboo ?? 0),
            banana: Number(feed.banana ?? 0),
            carrot: Number(feed.carrot ?? 0),
            cheese: Number(feed.cheese ?? 0),
            columns: Array.isArray(feed.columns)
                ? feed.columns.map((value) => Number(value) || 0)
                : Array.from({ length: 6 }, () => 0),
        };
    }
}
