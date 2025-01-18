<script setup lang="ts">
import { applyEvent, generateBoardfromEmptyMap, type Board, type Cell, type Coords, type EmptyMap, type EventStack, type EventType } from '@/utils/engine';
import { maps } from '@/utils/maps';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';

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

const eventStack = ref<EventStack>([])
const eventIndex = ref(0)
const mapIndex = ref(0)
const grid = computed<EmptyMap>(() => maps[mapIndex.value])
const sideLength = computed<number>(() => maps[mapIndex.value].length)

const rows = computed<Board>(() => eventStack.value.reduce((board, event, index) => {
  if (index > eventIndex.value - 1) {
    return board
  }
  return applyEvent(event, board)
}, generateBoardfromEmptyMap(grid.value)))

const allCells = computed(() => rows.value.flat())

const cols = computed<Array<Cell[]>>(() => {
  return Array.from(Array(sideLength.value).entries()).map((_, i) => {
    return rows.value.map(row => row[i])
  })
})
const zones = computed<Record<number, Cell[]>>(() => {
  return allCells.value.reduce((acc, curr) => {
    if (curr.zone in acc) {
      acc[curr.zone].push(curr)
    } else {
      acc[curr.zone] = [curr]
    }
    return acc
  }, {} as Record<number, Cell[]>)
})

type State = {
  completed: boolean
  invalid: boolean
}
function getState(cells: Cell[]): State {
  const nbQueens = cells.filter(cell => cell.state === 'queen').length
  if (nbQueens === 1) {
    return { completed: true, invalid: false }
  }
  return {
    completed: false,
    invalid: cells.every(cell => cell.state === 'cross') || nbQueens > 1
  }
}

const rowsState = computed(() => rows.value.map(getState))
const colsState = computed(() => cols.value.map(getState))
const zonesState = computed(() => Object.fromEntries(Object.entries(zones.value).map(([i, cells]) => ([i, getState(cells)]))))

function queensNeighboorhood(i: number, j: number) {
  for (const modI of [-1, 0, 1]) {
    for (const modJ of [-1, 0, 1]) {
      if (modI === 0 && modJ === 0) continue
      if (rows.value[i + modI]?.[j + modJ]?.state === 'queen') {
        return true
      }
    }
  }
  return false
}

const won = computed<boolean>(() => {
  for (const [i, row] of rows.value.entries()) {
    for (const [j, cell] of row.entries()) {
      if (cell.state === 'queen' && queensNeighboorhood(i, j)) {
        return false
      }
    }
  }
  return rowsState.value.every(state => state.completed && !state.invalid)
    && colsState.value.every(state => state.completed && !state.invalid)
    && Object.values(zonesState.value).every(state => state.completed && !state.invalid)
})

function restart() {
  eventStack.value = []
  eventIndex.value = 0
}

function newEvent(coords: Coords, type: EventType) {
  eventStack.value = eventStack.value.slice(0, eventIndex.value).concat({ coords, type })
  eventIndex.value = eventStack.value.length
}

watch(mapIndex, restart, { immediate: true })

function undo() {
  eventIndex.value = Math.max(eventIndex.value - 1, 0)
}
function redo() {
  eventIndex.value = Math.min(eventIndex.value + 1, eventStack.value.length)
}

function keyupHandler(event: KeyboardEvent) {
  if (event.ctrlKey && event.key === 'z') {
    undo()
  } else if (event.ctrlKey && event.shiftKey && event.key === 'Z') {
    redo()
  }
}

onMounted(() => {
  document.addEventListener('keyup', keyupHandler)
})
onUnmounted(() => {
  document.removeEventListener('keyup', keyupHandler)
})
</script>
<template>
  <div>
    <select name="mapSelect" id="mapSelect" v-model="mapIndex">
      <option v-for="([i, map]) in maps.entries()" :key="i" :value="i">{{ i }}: L{{ map.length }}</option>
    </select>
    <div class="grid" :style="`grid-template-columns: repeat(${sideLength}, 3rem);`">
      <template v-for="(row, r) in rows" :key="r">
        <div v-for="(cell, c) in row" :key="c"
          :class="`${cell.state} cell ${((queensNeighboorhood(r, c) && cell.state === 'queen') || zonesState[cell.zone].invalid || rowsState[r].invalid || colsState[c].invalid) ? 'invalid' : ''} `"
          :style="`background-color: ${colors[cell.zone]};`" @click="newEvent([r, c], 'click')"
          @contextmenu.prevent="newEvent([r, c], 'context')">
        </div>
      </template>
    </div>
    <button @click="undo" :disabled="!eventIndex">&#60;</button>
    <button @click="restart" :disabled="!eventStack.length">Recommencer</button>
    <button @click="redo" :disabled="eventIndex === eventStack.length">&#62;</button>
  </div>
  <div style="margin-left: 10rem;">
    <div>
      <h1>Astuce</h1>
      <p>Clic: vide -> croix -> reine</p>
      <p>Clic droit: reine + croix automatique</p>
    </div>
    <div v-if="won" class="victory">
      <h1>VICTOIRE !!!</h1>
    </div>
  </div>
</template>


<style scoped>
table {
  border-collapse: collapse;
}

.cell {
  height: 3rem;
  border: solid 1px;
  background-color: white;
  color: black;
  border-radius: 0.2rem;
  background-repeat: no-repeat;
  background-position: center;
}

.invalid {
  border: solid 2px red;
}

.cross {
  background-image: url('/src/assets/close-large-fill.png');
}

.queen {
  padding: 0.5rem;
  background-image: url('/src/assets/vip-crown-2-fill.svg');
  background-clip: content-box padding-box;
  background-size: 70% 70%;
}

.grid {
  display: grid;
}
</style>
