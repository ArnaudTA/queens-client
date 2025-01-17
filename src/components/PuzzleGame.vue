<script setup lang="ts">
import getRandomMap from '@/utils/maps';
import { computed, ref } from 'vue';

type Cell = {
    zone: number
    state: 'empty' | 'cross' | 'queen'
    invalid?: boolean
}

const colors = [
  'brown',
  'darkgoldenrod',
  'darkslateblue',
  'lightseagreen',
  'mediumpurple',
  'olive',
  'orchid',
  'palevioletred',
  'slategray',
  'steelblue',
  'tan'
]
const grid = ref<number[][]>([])

const board = ref<Cell[][]>([])

const zonesQueens = computed<Record<number, number>>(() => board.value.reduce((acc, row) => {
  for (const cell of row) {
    if (cell.state === 'queen') {
      acc[cell.zone] = (acc[cell.zone]?? 0)+1
    }
  }
  return acc
}, {} as Record<number, number>))

const rowsQueens = computed<Array<number>>(() => board.value.map(row => row.filter(cell => cell.state === 'queen').length))
const colsQueens = computed<Array<number>>(() => {
  return Object.keys(board.value[0]).map((i) => {
    return board.value.filter(row => row[Number(i)].state === 'queen').length
  })
})

function click(i: number, j: number) {
  const cellState = board.value[i][j].state
  if (!cellState || cellState === 'empty') {
    board.value[i][j].state = "cross"
  } else if (cellState === "cross") {
    board.value[i][j].state = "queen"
  } else {
    board.value[i][j].state = "empty"
  }
}

function queensNeighboorhood(i: number, j: number) {
  for (const modI of [-1,0,1]) {
    for (const modJ of [-1,0,1]) {
      if (modI === 0 && modJ === 0) continue
      if (board.value[i+modI]?.[j+modJ]?.state === 'queen') {
        return true
      }
    }
  }
  return false
}

function fillCross(i: number, j: number, zone: number) {
  board.value[i][j].state = 'queen'
  for (const [ib, row] of Object.entries(board.value)) {
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
    board.value[i-1]?.[j-1],
    board.value[i+1]?.[j-1],
    board.value[i-1]?.[j+1],
    board.value[i+1]?.[j+1],
  ]
  for (const cell of angles) {
    if (cell && (!cell?.state || cell.state === 'empty')) {
      cell.state = 'cross'
    }
  }
}

const won = computed<boolean>(() => {
  let rowsCompleted = 0
  let colsCompleted = 0
  let noInvalid = true

  for (const [i, row] of board.value.entries()) {
    let queensInRow = 0
    for (const [j, cell] of row.entries()) {
      cell.invalid = false
      if (cell.state === 'queen') {
        cell.invalid = queensNeighboorhood(i, j)
        queensInRow++
      }
      if (cell.invalid) {
        noInvalid = false
      }
    }
    if (queensInRow === 1) {
      rowsCompleted++
    }
  }
  for (const j of board.value.keys()) {
    let queensInCol = 0
    const col = board.value.map(row => row[j])
    for (const cell of col.values()) {
      if (cell.state === 'queen') {
        queensInCol++
      }
    }
    if (queensInCol === 1) {
      colsCompleted++
    }
  }

  return rowsCompleted === colsCompleted
  && rowsCompleted === board.value.length
  && noInvalid
  && Object.values(zonesQueens.value).every(num => num === 1)
})

function newGame() {
  grid.value = getRandomMap()
  restart()
}

function restart() {
  board.value = grid.value.map(row => row.map(cell => ({ zone: cell, state: 'empty' as const })))
}

newGame()
</script>
<template>
  <button @click="newGame">Nouvelle partie</button>
  <button @click="restart">Recommencer</button>
  <table>
    <tr
      v-for="(row, i) in board"
      :key="i"
    >
      <td
        v-for="(cell, j) in row"
        :key="j"
        :class="`${cell.state} cell ${(zonesQueens[cell.zone] > 1 || rowsQueens[i] > 1 || colsQueens[j] > 1 || (queensNeighboorhood(i, j) && cell.state==='queen')) ? 'invalid' : ''} `"
        :style="`background-color: ${colors[cell.zone]};`"
        @click="click(i, j)"
        @contextmenu.prevent="fillCross(i, j, cell.zone)"
      >
      </td>
    </tr>
  </table>
  <div
    v-if="won"
    class="victory"
  >
    <h1>VICTOIRE !!!</h1>
  </div>
</template>


<style scoped>
table{
  border-collapse: collapse;
}

.cell{
  height: 3rem;
  width: 3rem;
  border: solid 1px;
  background-color: white;
  color: black;
  border-radius: 0.2rem;
  background-repeat: no-repeat;
  background-position: center;
}

.invalid{
  border: solid 2px red;
}

.cross{
  background-image: url('/src/assets/close-large-fill.png');
}

.queen{
  padding: 0.5rem;
  background-image: url('/src/assets/vip-crown-2-fill.svg');
  background-clip: content-box padding-box;
  background-size: 70% 70%;
}

</style>

