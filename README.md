# react-use-minesweeper

A react custom hook that provides the game logic for Minesweeper.

## 🔖 Overview

This hook provides the core mechanics for Minesweeper using only standard React APIs. It simplifies the integration of Minesweeper logic into your React applications, allowing you to concentrate on the UI and UX.

### 🎮 Demo
You can play example web app here: https://mine-sweeper.ebinas.dev/
<img width="1440" alt="playable example" src="https://github.com/ebinase/react-use-minesweeper/assets/54468945/2ec6dc73-cf20-4797-a6d0-a3c87fce17e1">

## 🚀 API
### useMinesweeper hook
Main hook to implement Minesweeper app.  
Each method does't depend on state and was defined with `useCallback`.  
(You can optimize rendering with `useMemo` in your app)

```typescript
const {
  board,           // The current state of the Minesweeper board.
  gameState,       // The current state of the game (e.g., "initialized", "playing", "completed", "failed").
  gameMode,        // The current game mode (e.g., "easy", "normal", "hard").
  init,            // Function to select game mode & initialize the game.
  restart,         // Function to restart the game in same game mode.
  open,            // Function to open a cell.
  toggleFlag,      // Function to toggle a flag on a cell.
  switchFlagType,  // Function to switch the type of flag(e.g., 🚩, ❓).
  flags,           // The current number of flags used in the game.
  settings         // The game settings constant.
} = useMinesweeper();
```

#### Example Implementation
```tsx
type Props = {
  defaultGameMode: GameMode;
};

const Example: React.FC<Props> = ({ defaultGameMode }) => {
  const {
    board, gameState, gameMode, init, restart, open, toggleFlag, switchFlagType, flags, settings,
  } = useMinesweeper(defaultGameMode);

  return (
    <>
      <h1>Example</h1>
      <p>{`💣: ${board.meta.mines}, 🚩: ${flags.normal}, ❓: ${flags.suspected}`}</p>
      {gameState === 'completed' && <p>🎉 You win!</p>}
      <div>
        {board.data.map((row) => {
          return row.map((cell) => {
            return (
              <Cell key={cell.id} data={cell} open={open} toggleFlag={toggleFlag} switchFlagType={switchFlagType} />
            );
          });
        })}
      </div>
        <div>
            <button onClick={() => init('hard')}>Hard Mode</button>
            <button onClick={restart}>Restart</button>
        </div>
            
    </>
  );
};
```

---

### Others
| Category          | Name           | Description                               |
|-------------------|----------------|-------------------------------------------|
| **Constants**     | GAME_MODE_LIST | A list of available game modes.           |
| **Helper Functions** | isMine       | Check if a cell is a mine.               |
|                   | isCount        | Check if a cell has a count.              |
|                   | isEmpty        | Check if a cell is empty.                 |
|                   | isOpened       | Check if a cell is opened.                |
|                   | isUnopened     | Check if a cell is unopened.              |
|                   | isFlagged      | Check if a cell is flagged. (ignore flag type) |
| **Types**         | Minesweeper    | Return type of useMinesweeper Hook        |
|                   | GameMode       | Type for game modes.                      |
|                   | Board          | Type for the game board.                  |
|                   | BoardConfig    | Configuration type for the board.         |
|                   | CellData       | Type for individual cell data.            |


## 📖 Background

This hook is derived from my Next.js application, [ebinase/mine-sweeper](https://github.com/ebinase/mine-sweeper). Its purpose is to separate the Minesweeper game logic from the UI, enabling easy implementation of Minesweeper in your projects.
