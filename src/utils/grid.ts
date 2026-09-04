export function createGrid(rows: number, cols: number): number[][] {
    return Array.from({ length: rows }, () => Array(cols).fill(0));
}

export function isValidPlacement(grid: number[][], row: number, col: number): boolean {
    return grid[row] && grid[row][col] === 0;
}

export function clearFullRows(grid: number[][]): number[][] {
    return grid.filter(row => row.some(cell => cell === 0)).concat(
        Array(grid.length - grid.filter(row => row.some(cell => cell === 0)).length).fill(Array(grid[0].length).fill(0))
    );
}

export function printGrid(grid: number[][]): void {
    grid.forEach(row => console.log(row.join(' ')));
}