import { GameBoard } from './components/GameBoard';
import { ScoreDisplay } from './components/ScoreDisplay';
import { NextBlockPreview } from './components/NextBlockPreview';
import { GameOverScreen } from './components/GameOverScreen';
import { PlayerPanel } from './components/PlayerPanel';
import { FoodFeedPanel, createEmptyFoodCounts, FoodCounts } from './components/FoodFeedPanel';
import { PlayerControls } from './input/PlayerControls';
import { GameEngine } from './engine/GameEngine';
import { EliminationRules } from './engine/EliminationRules';
import { FOODS, GRID_COLS, GRID_ROWS } from './config/gameParams';
import { FoodType, TileDef } from './types';
import { FeedPayload, GameMode, PeerGameClient } from './network/PeerGameClient';

function requireElement(id: string): HTMLElement {
    const element = document.getElementById(id);
    if (!element) throw new Error(`Missing #${id} element in index.html`);
    return element;
}

function syncViewportHeight(): void {
    const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
    document.documentElement.style.setProperty('--app-height', `${viewportHeight}px`);
}

class App {
    private gameBoard: GameBoard;
    private scoreDisplay: ScoreDisplay;
    private nextBlockPreview: NextBlockPreview;
    private gameOverScreen: GameOverScreen;
    private playerPanel1: PlayerPanel;
    private playerPanel2: PlayerPanel;
    private foodFeedPanel: FoodFeedPanel;
    private engine: GameEngine;
    private eliminationRules = new EliminationRules();
    private lastFrameTime = 0;
    private score = 0;
    private isResolving = false;
    private foodCounts = createEmptyFoodCounts();
    private mode: GameMode | null = null;
    private peerClient: PeerGameClient | null = null;
    private splashScreen: HTMLElement;
    private appRoot: HTMLElement;
    private roundActive = false;
    private renderLoopId: number | null = null;
    private playerControls: PlayerControls | null = null;
    private hostPanel: HTMLElement;
    private guestPanel: HTMLElement;
    private hostIdText: HTMLElement;
    private guestIdInput: HTMLInputElement;
    private connectGuestBtn: HTMLButtonElement;
    private shareHostBtn: HTMLButtonElement;

    constructor() {
        this.splashScreen = requireElement('splash-screen');
        this.appRoot = requireElement('app');
        this.hostPanel = requireElement('network-host-panel');
        this.guestPanel = requireElement('network-guest-panel');
        this.hostIdText = requireElement('host-id-text');
        this.guestIdInput = requireElement('guest-id-input') as HTMLInputElement;
        this.connectGuestBtn = requireElement('connect-guest-btn') as HTMLButtonElement;
        this.shareHostBtn = requireElement('share-host-btn') as HTMLButtonElement;

        this.gameBoard = new GameBoard(requireElement('well-container'), GRID_COLS, GRID_ROWS);
        this.scoreDisplay = new ScoreDisplay(requireElement('score-display'));
        this.nextBlockPreview = new NextBlockPreview(requireElement('next-preview-panel'));
        this.gameOverScreen = new GameOverScreen(requireElement('game-over-screen'));
        this.playerPanel1 = new PlayerPanel(requireElement('player-panel-1'), 'Player 1');
        this.playerPanel2 = new PlayerPanel(requireElement('player-panel-2'), 'Player 2');
        this.foodFeedPanel = new FoodFeedPanel(requireElement('right-panel'), () => this.sendFood());
        this.engine = new GameEngine(GRID_COLS, GRID_ROWS);
        this.bindSplashSelection();
    }

    private bindSplashSelection(): void {
        document.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach((button) => {
            button.addEventListener('click', () => {
                const selectedMode = button.dataset.mode as GameMode;
                if (!selectedMode) return;
                this.startMode(selectedMode);
            });
        });

        this.connectGuestBtn.addEventListener('click', () => this.connectGuest());
        this.shareHostBtn.addEventListener('click', () => void this.shareHostLink());

        const sharedHostId = new URLSearchParams(window.location.search).get('hostId');
        if (sharedHostId) {
            this.guestIdInput.value = sharedHostId;
            this.startMode('guest');
            this.connectGuest();
        }
    }

    private startMode(mode: GameMode): void {
        this.mode = mode;
        this.appRoot.hidden = true;
        this.splashScreen.hidden = false;
        this.hostPanel.hidden = true;
        this.guestPanel.hidden = true;
        this.shareHostBtn.hidden = true;
        this.foodFeedPanel.update(this.foodCounts);
        const rightPanel = requireElement('right-panel');
        rightPanel.hidden = true;

        if (mode === 'single') {
            this.appRoot.hidden = false;
            this.splashScreen.hidden = true;
            rightPanel.hidden = false;
            this.roundActive = true;
            this.initializeGame();
            return;
        }

        if (mode === 'host') {
            this.playerPanel1.update('Host');
            this.playerPanel2.update('Guest waiting');
            this.hostPanel.hidden = false;
            this.shareHostBtn.hidden = false;
            this.peerClient = new PeerGameClient();
            this.peerClient.startHost(
                (id) => {
                    this.hostIdText.textContent = id;
                    this.shareHostBtn.dataset.peerId = id;
                    console.log('Host peer ID:', id);
                },
                () => {
                    this.appRoot.hidden = false;
                    this.splashScreen.hidden = true;
                    this.playerPanel2.container?.removeAttribute('hidden');
                    this.roundActive = true;
                    this.initializeGame();
                    this.playerPanel2.update('Guest connected');
                },
                (payload) => this.handleIncomingFeed(payload),
                (message) => this.handlePeerSystemMessage(message)
            );
            return;
        }

        this.playerPanel1.update('Guest');
        this.playerPanel2.update('Host');
        this.guestPanel.hidden = false;
    }

    private connectGuest(): void {
        const hostId = this.guestIdInput.value.trim();
        if (!hostId) {
            this.guestIdInput.focus();
            return;
        }

        const url = new URL(window.location.href);
        url.searchParams.set('hostId', hostId);
        window.history.replaceState({}, '', url.toString());

        this.peerClient = new PeerGameClient();
        this.peerClient.connectAsGuest(
            hostId,
            () => {
                this.appRoot.hidden = false;
                this.splashScreen.hidden = true;
                this.roundActive = true;
                this.initializeGame();
                this.playerPanel1.update('Guest connected');
            },
            (payload) => this.handleIncomingFeed(payload),
            (message) => this.handlePeerSystemMessage(message)
        );
    }

    private initializeGame(): void {
        this.roundActive = true;
        this.gameBoard.clearBoard();
        this.gameBoard.resize();
        this.engine = new GameEngine(GRID_COLS, GRID_ROWS);
        this.foodCounts = createEmptyFoodCounts();
        this.score = 0;
        this.isResolving = false;
        this.lastFrameTime = 0;
        this.scoreDisplay.update([0]);
        this.foodFeedPanel.update(this.foodCounts);
        this.gameOverScreen.hide();
        this.playerPanel1.update(this.mode === 'host' ? 'Host' : this.mode === 'guest' ? 'Guest' : 'Player 1');
        this.playerPanel2.update(this.mode === 'host' ? 'Guest' : 'Player 2');
        this.playerPanel2.container?.removeAttribute('hidden');

        this.playerControls?.destroy();
        this.playerControls = new PlayerControls({
            moveLeft: () => !this.isResolving && this.engine.moveLeft(),
            moveRight: () => !this.isResolving && this.engine.moveRight(),
            rotateLeft: () => !this.isResolving && this.engine.rotate(-1),
            rotateRight: () => !this.isResolving && this.engine.rotate(1),
            setSoftDrop: (active) => !this.isResolving && this.engine.setSoftDropping(active),
            sendFood: () => this.sendFood(),
        });
        this.spawnNextPiece();
        this.startRenderLoop();
    }

    private spawnNextPiece(): void {
        const piece = this.nextBlockPreview.shiftQueue();
        const spawned = this.engine.spawnPiece(piece.cells);
        if (!spawned) {
            this.handleGameOver();
        }
    }

    private async resolveChainsThenSpawn(): Promise<void> {
        this.isResolving = true;
        this.engine.setSoftDropping(false);

        while (true) {
            const chains = this.eliminationRules.findChains(this.engine.grid);
            if (chains.length === 0) break;

            await Promise.all(chains.map((chain) => {
                const targets = chain.actor.tile.type === 'lion' ? chain.animals.slice(1) : chain.foods;
                return this.gameBoard.playEatingChain(chain.actor, targets, (cell) => {
                    this.gameBoard.setStackTile(cell.col, cell.row, null);
                });
            }));

            for (const chain of chains) {
                for (const [type, count] of Object.entries(chain.foodCounts) as [FoodType, number][]) {
                    this.foodCounts[type] += count;
                }
                for (const cell of [...chain.foods, ...chain.animals]) {
                    this.engine.grid[cell.row][cell.col] = null;
                }
            }
            this.foodFeedPanel.update(this.foodCounts);
            this.score += chains.reduce((total, chain) => total + chain.score, 0);
            this.scoreDisplay.update([this.score]);
            this.engine.settleGrid();
            this.gameBoard.syncStack(this.engine.grid);
        }

        this.isResolving = false;
        this.spawnNextPiece();
    }

    private distributeFoodAcrossColumns(counts: FoodCounts): number[] {
        const total = Object.values(counts).reduce((sum, value) => sum + value, 0);
        const columns = Array.from({ length: 6 }, () => 0);
        let remaining = total;

        while (remaining > 0) {
            const lowest = Math.min(...columns);
            const candidates = columns
                .map((value, index) => ({ value, index }))
                .filter((entry) => entry.value === lowest)
                .map((entry) => entry.index);
            const index = candidates[Math.floor(Math.random() * candidates.length)];
            columns[index] += 1;
            remaining -= 1;
        }

        return columns;
    }

    private sendFood(): void {
        const payload: FeedPayload = {
            ...this.foodCounts,
            columns: this.distributeFoodAcrossColumns(this.foodCounts),
        };

        if (this.mode === 'host' || this.mode === 'guest') {
            if (this.peerClient?.isConnected()) {
                this.peerClient.sendFeed(payload);
            }
            const remoteSummary = payload.columns.join(', ');
            this.playerPanel2.update(`Sent ${remoteSummary}`);
        } else {
            console.log('Mock linked-play feed payload:', payload);
        }

        this.foodCounts = createEmptyFoodCounts();
        this.foodFeedPanel.update(this.foodCounts);
    }

    private handleIncomingFeed(payload: FeedPayload): void {
        const distribution = payload.columns.length === 6
            ? payload.columns
            : this.distributeFoodAcrossColumns({
                bone: payload.bone,
                bamboo: payload.bamboo,
                banana: payload.banana,
                carrot: payload.carrot,
                cheese: payload.cheese,
            });

        const summary = distribution.join(', ');
        this.playerPanel2.update(`Received: ${summary}`);
        this.applyIncomingFeedToBoard(payload, distribution);
    }

    private applyIncomingFeedToBoard(payload: FeedPayload, distribution: number[]): void {
        const remaining = {
            bone: payload.bone,
            bamboo: payload.bamboo,
            banana: payload.banana,
            carrot: payload.carrot,
            cheese: payload.cheese,
        };
        const order: FoodType[] = ['bone', 'bamboo', 'banana', 'carrot', 'cheese'];

        const drops: Array<{ col: number; row: number; tile: TileDef }> = [];

        for (let col = 0; col < 6; col++) {
            const count = distribution[col] ?? 0;
            for (let i = 0; i < count; i++) {
                const type = order.find((foodType) => remaining[foodType] > 0) ?? 'bone';
                remaining[type] -= 1;

                let row = 0;
                while (row < GRID_ROWS && this.engine.grid[row][col] !== null) {
                    row += 1;
                }

                if (row >= GRID_ROWS) {
                    continue;
                }

                this.engine.grid[row][col] = FOODS[type];
                drops.push({ col, row, tile: FOODS[type] });
            }
        }

        for (const drop of drops) {
            void this.gameBoard.dropTileIntoWell(drop.col, drop.row, drop.tile);
        }
    }

    private async shareHostLink(): Promise<void> {
        const peerId = this.hostIdText.textContent?.trim();
        if (!peerId) return;

        const url = new URL(window.location.href);
        url.searchParams.set('hostId', peerId);
        url.searchParams.set('mode', 'guest');
        const shareUrl = url.toString();

        try {
            if (navigator.share) {
                await navigator.share({
                    title: 'BakuBaku Puzzle',
                    text: 'Join my game room',
                    url: shareUrl,
                });
                return;
            }
        } catch {
            // Fall back to clipboard if the native share sheet is dismissed or unsupported.
        }

        try {
            await navigator.clipboard.writeText(shareUrl);
            this.shareHostBtn.textContent = 'Link copied';
            window.setTimeout(() => {
                this.shareHostBtn.textContent = 'Share Link';
            }, 1500);
        } catch {
            this.hostIdText.textContent = `Share this ID: ${peerId}`;
        }
    }

    private handlePeerSystemMessage(message: { type: string; payload?: Record<string, unknown> | FeedPayload }): void {
        if (message.type === 'game-over') {
            const payload = (message.payload ?? {}) as Record<string, unknown>;
            this.gameOverScreen.show([Number(payload.score ?? 0)]);
            this.playerPanel1.update('Opponent ended the round');
            const confirmRestart = window.confirm('The other player lost. Start a new round with the same connection?');
            if (confirmRestart) {
                this.roundActive = true;
                this.peerClient?.sendSystemMessage('restart');
                this.initializeGame();
            }
        }

        if (message.type === 'restart') {
            this.roundActive = true;
            this.initializeGame();
        }
    }

    private startNewRound(): void {
        if (!this.mode || !this.roundActive) return;
        this.roundActive = true;
        if (this.peerClient && this.peerClient.isConnected()) {
            this.peerClient.sendSystemMessage('restart');
        }
        this.initializeGame();
    }

    private handleGameOver(): void {
        if (!this.roundActive) return;
        this.roundActive = false;
        const finalScores = [this.score];
        this.gameOverScreen.show(finalScores);
        this.playerPanel1.update('Game over');
        this.peerClient?.sendSystemMessage('game-over', { score: this.score });

        const shouldRestart = window.confirm('You lost. Start again with the same connection?');
        if (shouldRestart) {
            this.startNewRound();
        }
    }

    private startRenderLoop(): void {
        if (this.renderLoopId !== null) {
            cancelAnimationFrame(this.renderLoopId);
            this.renderLoopId = null;
        }

        const loop = (time: number) => {
            const dtMs = this.lastFrameTime ? time - this.lastFrameTime : 0;
            this.lastFrameTime = time;

            if (!this.engine.toppedOut && !this.isResolving) {
                const lockedCells = this.engine.tick(dtMs);
                lockedCells.forEach((cell) => this.gameBoard.setStackTile(cell.col, cell.row, cell.tile));
                if (!this.engine.hasActivePiece()) {
                    void this.resolveChainsThenSpawn();
                }
                this.gameBoard.syncActivePiece(this.engine.getActiveCells(), this.engine.getFallProgress());
            }

            this.gameBoard.render();
            this.nextBlockPreview.render();
            this.renderLoopId = requestAnimationFrame(loop);
        };

        this.renderLoopId = requestAnimationFrame(loop);
    }
}

if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', syncViewportHeight);
    window.visualViewport.addEventListener('scroll', syncViewportHeight);
}
window.addEventListener('resize', syncViewportHeight);
syncViewportHeight();

const app = new App();

