import React, { SyntheticEvent } from "react";
import "./App.css";

type GameProps = {
  rows: number;
  columns: number;
  mines: number;
};

type BoardProps = {
  rows: number;
  columns: number;
  cellContents: { [id: number]: any };
  explored: number[];
  flagged: Set<number>;
  markExplored: (id: number) => void;
  toggleFlagged: (id: number) => void;
};

type CellProps = {
  id: number;
  content: any;
  isExplored: boolean;
  isFlagged: boolean;
  markExplored: (id: number) => void;
  toggleFlagged: (id: number) => void;
};

type Coord = {
  row: number;
  column: number;
};

function Cell(props: CellProps) {
  function onClick(e: SyntheticEvent) {
    console.log(e);
    if (e.type === "click") {
      e.preventDefault();
      props.markExplored(props.id);
    } else if (e.type === "contextmenu") {
      e.preventDefault();
      props.toggleFlagged(props.id);
    }
  }
  if (props.isExplored) {
    return (
      <div
        className={`cell ${props.content === -1 ? "mine" : ""}`}
        key={`explored${props.id}`}
      >
        {props.content as number}
      </div>
    );
  } else {
    return (
      <div
        className={`cell ${props.isFlagged ? "flagged" : "unexplored"}`}
        key={props.id}
        onClick={onClick}
        onContextMenu={onClick}
      />
    );
  }
}

function Board(props: BoardProps) {
  return (
    <div className="container">
      {[...Array(props.rows)].map((_, row) => {
        return (
          <div className="row">
            {[...Array(props.columns)].map((_, column) => {
              const cellId = row * props.columns + column;
              return (
                <Cell
                  id={cellId}
                  content={props.cellContents[cellId]}
                  isExplored={props.explored.includes(cellId)}
                  isFlagged={props.flagged.has(cellId)}
                  markExplored={props.markExplored}
                  toggleFlagged={props.toggleFlagged}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function Game(props: GameProps) {
  function coordToId(coord: Coord): number {
    return coord.row * props.columns + coord.column;
  }

  function idToCoord(id: number): Coord {
    const row = Math.floor(id / props.columns);
    const column = id % props.columns;
    return { row, column };
  }

  function getNeighborIds(id: number): number[] {
    const coord = idToCoord(id);
    const neighborCoords: Coord[] = [
      { row: coord.row - 1, column: coord.column - 1 },
      { row: coord.row - 1, column: coord.column },
      { row: coord.row - 1, column: coord.column + 1 },
      { row: coord.row, column: coord.column - 1 },
      { row: coord.row, column: coord.column + 1 },
      { row: coord.row + 1, column: coord.column - 1 },
      { row: coord.row + 1, column: coord.column },
      { row: coord.row + 1, column: coord.column + 1 },
    ];
    const validCoords = neighborCoords.filter(
      (coord) =>
        coord.row >= 0 &&
        coord.row < props.rows &&
        coord.column >= 0 &&
        coord.column < props.columns
    );
    return validCoords.map((coord) => coordToId(coord));
  }

  function isMine(id: number, mineCellIds: number[]): boolean {
    return mineCellIds.includes(id);
  }

  function calculateCellContent(id: number, mineCellIds: number[]): number {
    if (isMine(id, mineCellIds)) {
      return -1;
    }
    const neighborIds = getNeighborIds(id);
    const mineCount = neighborIds.filter((id) =>
      isMine(id, mineCellIds)
    ).length;
    return mineCount;
  }

  function generateCellContents(rows: number, columns: number, mines: number) {
    const cells = rows * columns;
    const candidates = [...Array(cells)].map((_, i) => i);
    const sampleFromCandidates = (): number => {
      const index = Math.floor(Math.random() * candidates.length);
      return candidates.splice(index, 1)[0];
    };
    const mineCellIds = [...Array(mines)].map((_) => sampleFromCandidates());
    let cellContents: { [id: number]: any } = {};
    for (let i: number = 0; i < cells; i++) {
      cellContents[i] = calculateCellContent(i, mineCellIds);
    }
    return cellContents;
  }

  function floodFillFromId(id: number, toFill: Set<number>) {
    if (toFill.has(id)) {
      return toFill;
    }
    toFill = toFill.add(id);
    if (contents[id] !== 0) {
      return toFill;
    }
    const neighbors = getNeighborIds(id);
    for (let neighborId of neighbors) {
      toFill = floodFillFromId(neighborId, toFill);
    }
    return toFill;
  }

  const [contents, _] = React.useState(
    generateCellContents(props.rows, props.columns, props.mines)
  );
  const [explored, setExplored] = React.useState<number[]>([]);
  const [flagged, setFlagged] = React.useState<Set<number>>(() => new Set());
  const markExplored = (id: number) => {
    if (contents[id] === -1) {
      const allCellIds = Object.keys(contents).map((key) => parseInt(key));
      setExplored(allCellIds);
    } else if (contents[id] === 0) {
      const toExplore = floodFillFromId(id, new Set());
      setExplored([...explored, ...[...toExplore]]);
    } else {
      setExplored([...explored, id]);
    }
  };
  const toggleFlagged = (id: number) => {
    if (flagged.has(id)) {
      setFlagged((prev) => {
        let next = new Set(prev);
        next.delete(id);
        return next;
      });
    } else {
      setFlagged((prev) => new Set(prev).add(id));
    }
  };

  return (
    <Board
      rows={props.rows}
      columns={props.columns}
      cellContents={contents}
      explored={explored}
      flagged={flagged}
      markExplored={markExplored}
      toggleFlagged={toggleFlagged}
    />
  );
}

function App() {
  return <Game rows={14} columns={18} mines={40} />;
}

export default App;
