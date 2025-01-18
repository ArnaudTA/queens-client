export type EventType = 'click' | 'context'
export type StackElement = { type: EventType, coords: Coords }
export type Coords = [number, number]
export type EventStack = Array<StackElement>
export type EmptyMap = number[][]
export type Cell = {
    zone: number
    state: 'empty' | 'cross' | 'queen'
    invalid?: boolean
}
export type Board = Cell[][]


function click([i, j]: Coords, board: Board): Board {
  const cellState = board[i][j].state
  if (!cellState || cellState === 'empty') {
    board[i][j].state = "cross"
  } else if (cellState === "cross") {
    board[i][j].state = "queen"
  } else {
    board[i][j].state = "empty"
  }
  return board
}

function fillCross([i,j]: Coords, board: Board): Board {
  const zone = board[i][j].zone
  board[i][j].state = 'queen'
  for (const [ib, row] of Object.entries(board)) {
    for (const [jb, cell] of Object.entries(row)) {
      if (cell.state === 'empty') {
        if (Number(ib) === i || Number(jb) === j || cell.zone === zone) {
          cell.state = 'cross'
          continue
        }
      }
    }
  }
  const angles: Array<Cell | undefined> = [
    board[i-1]?.[j-1],
    board[i+1]?.[j-1],
    board[i-1]?.[j+1],
    board[i+1]?.[j+1],
  ]
  for (const cell of angles) {
    if (cell && (!cell?.state || cell.state === 'empty')) {
      cell.state = 'cross'
    }
  }
  return board
}

export function applyEvent(event: StackElement, board: Board): Board {
  if (event.type === 'click') {
    return click(event.coords, board)
  }
  return fillCross(event.coords, board)
}

export function generateBoardfromEmptyMap(map: EmptyMap) {
  return map.map(row => row.map(cell => ({ zone: cell, state: 'empty' as Cell['state'] })))
}