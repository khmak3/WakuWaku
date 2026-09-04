# BakuBaku Puzzle

## Overview
BakuBaku Puzzle is a web-based game inspired by the classic BakuBaku Animal Puzzle. It is designed for 1 to 2 players, featuring engaging gameplay mechanics, colorful graphics, and a fun competitive environment.

## Features
- **Single Player Mode**: Play against the game with increasing difficulty.
- **Two Player Mode**: Compete against a friend in real-time.
- **Dynamic Gameplay**: Blocks spawn randomly, and players must eliminate them by matching types.
- **Developer UI**: A user-friendly interface for tuning game parameters before enabling multiplayer rules.

## Project Structure
- **src/**: Contains all source code files.
  - **main.ts**: Entry point for the application.
  - **app.ts**: Manages the application structure and game state.
  - **config/**: Configuration parameters for the game.
  - **components/**: UI components for the game.
  - **devui/**: Developer interface for parameter tuning.
  - **engine/**: Core game logic and mechanics.
  - **input/**: Handles player input and controls.
  - **modes/**: Different gameplay modes (single and two-player).
  - **network/**: Manages multiplayer synchronization.
  - **state/**: Represents the game and player states.
  - **types/**: Type definitions used throughout the project.
  - **styles/**: CSS styles for the game.
  - **utils/**: Utility functions for game operations.
- **tests/**: Contains unit tests for various components and functionalities.
- **index.html**: Main HTML file for the game.
- **package.json**: npm configuration file.
- **tsconfig.json**: TypeScript configuration file.

## Setup Instructions
1. Clone the repository: `git clone <repository-url>`
2. Navigate to the project directory: `cd bakubaku-puzzle`
3. Install dependencies: `npm install`
4. Start the development server: `npm start`
5. Open your browser and navigate to `http://localhost:3000` to play the game.

## Gameplay Instructions
- Players take turns to place blocks on the game board.
- Match blocks of the same type to eliminate them and score points.
- The game ends when the board is filled, or a player reaches the winning score.

## Contribution
Feel free to contribute to the project by submitting issues or pull requests. Your feedback and suggestions are welcome!