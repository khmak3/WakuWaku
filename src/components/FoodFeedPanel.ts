import { FOODS } from '../config/gameParams';
import { FoodType } from '../types';

export type FoodCounts = Record<FoodType, number>;

export function createEmptyFoodCounts(): FoodCounts {
    return {
        bone: 0,
        bamboo: 0,
        banana: 0,
        carrot: 0,
        cheese: 0,
    };
}

export class FoodFeedPanel {
    private countNodes: Partial<Record<FoodType, HTMLSpanElement>> = {};

    constructor(private container: HTMLElement, onSend: (() => void) | null = null) {
        this.container.hidden = false;
        this.container.classList.add('food-feed-panel');
        this.container.innerHTML = `
            <div class="food-feed-header">
                <span class="food-feed-title">Feed</span>
            </div>
            <div class="food-feed-grid"></div>
        `;

        const grid = this.container.querySelector('.food-feed-grid') as HTMLDivElement;
        const order: FoodType[] = ['bone', 'bamboo', 'banana', 'carrot', 'cheese'];

        order.forEach((type) => {
            const tile = FOODS[type];
            const row = document.createElement('div');
            row.className = 'food-feed-row';
            row.innerHTML = `
                <span class="food-feed-icon" aria-label="${tile.label}" title="${tile.label}">${tile.icon}</span>
                <span class="food-feed-count" data-food-type="${type}">0</span>
            `;
            grid.appendChild(row);
            this.countNodes[type] = row.querySelector('.food-feed-count') as HTMLSpanElement;
        });
    }

    public update(counts: FoodCounts): void {
        const order: FoodType[] = ['bone', 'bamboo', 'banana', 'carrot', 'cheese'];
        order.forEach((type) => {
            const value = counts[type] ?? 0;
            const node = this.countNodes[type];
            if (node) {
                node.textContent = String(value);
            }
        });
    }
}
