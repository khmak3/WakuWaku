import { KEY_BINDINGS } from './KeyBindings';

export interface PlayerActionHandlers {
    moveLeft: () => void;
    moveRight: () => void;
    rotateLeft: () => void;
    rotateRight: () => void;
    setSoftDrop: (active: boolean) => void;
    sendFood: () => void;
}

/** Binds desktop keyboard (arrows + Z/X) and mobile touch buttons to piece action handlers. */
export class PlayerControls {
    private readonly keydownHandler = (event: KeyboardEvent) => {
        switch (event.code) {
            case KEY_BINDINGS.moveLeft:
                event.preventDefault();
                this.handlers.moveLeft();
                break;
            case KEY_BINDINGS.moveRight:
                event.preventDefault();
                this.handlers.moveRight();
                break;
            case KEY_BINDINGS.softDrop:
                event.preventDefault();
                this.handlers.setSoftDrop(true);
                break;
            case KEY_BINDINGS.rotateLeft:
                this.handlers.rotateLeft();
                break;
            case KEY_BINDINGS.rotateRight:
                this.handlers.rotateRight();
                break;
            case KEY_BINDINGS.sendFood:
                event.preventDefault();
                this.handlers.sendFood();
                break;
        }
    };

    private readonly keyupHandler = (event: KeyboardEvent) => {
        if (event.code === KEY_BINDINGS.softDrop) {
            this.handlers.setSoftDrop(false);
        }
    };

    private readonly touchBindings: Array<{ button: HTMLButtonElement; eventName: string; listener: EventListener }> = [];

    constructor(private handlers: PlayerActionHandlers, private touchRoot: ParentNode = document) {
        this.bindKeyboard();
        this.bindTouch();
    }

    private bindKeyboard(): void {
        window.addEventListener('keydown', this.keydownHandler);
        window.addEventListener('keyup', this.keyupHandler);
    }

    private bindTouch(): void {
        this.touchRoot.querySelectorAll<HTMLButtonElement>('.touch-btn').forEach((button) => {
            const action = button.dataset.action;
            if (action === 'down') {
                const pointerDown = () => this.handlers.setSoftDrop(true);
                const pointerRelease = () => this.handlers.setSoftDrop(false);
                button.addEventListener('pointerdown', pointerDown);
                ['pointerup', 'pointerleave', 'pointercancel'].forEach((eventName) => {
                    button.addEventListener(eventName, pointerRelease);
                    this.touchBindings.push({ button, eventName, listener: pointerRelease });
                });
                this.touchBindings.push({ button, eventName: 'pointerdown', listener: pointerDown });
                return;
            }

            const clickHandler = () => {
                if (action === 'left') this.handlers.moveLeft();
                if (action === 'right') this.handlers.moveRight();
                if (action === 'rotateLeft') this.handlers.rotateLeft();
                if (action === 'rotateRight') this.handlers.rotateRight();
                if (action === 'sendFood') this.handlers.sendFood();
            };
            button.addEventListener('click', clickHandler);
            this.touchBindings.push({ button, eventName: 'click', listener: clickHandler });
        });
    }

    public destroy(): void {
        window.removeEventListener('keydown', this.keydownHandler);
        window.removeEventListener('keyup', this.keyupHandler);

        this.touchBindings.forEach(({ button, eventName, listener }) => {
            button.removeEventListener(eventName, listener);
        });
        this.touchBindings.length = 0;
    }
}
