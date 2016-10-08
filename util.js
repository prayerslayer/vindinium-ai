const {Grid, AStarFinder} = require('pathfinding')
const _ = require('lodash')
const finder = new AStarFinder();

const MINES = '!"§$%'
const MINE_OWNER = {
  '!': '1',
  '"': '2',
  '§': '3',
  '$': '4',
  '%': '-'
}

function normalize({x, y}) {
  return {
    y: x,
    x: y
  }
}

function findMines(board) {
  return compressBoard(board).reduce((agg, row, row_idx) => {
    row.map((tile, i) => MINES.indexOf(tile) !== -1 ? [tile, i] : -1)
      .filter(i => Array.isArray(i))
      .forEach(([tile, col_idx]) => agg.push({
        x: col_idx,
        y: row_idx,
        owner: MINE_OWNER[tile]
      }))
    return agg
  }, [])
}

function findTaverns(board) {
  return compressBoard(board).reduce((agg, row, row_idx) => {
    row.map((tile, i) => tile === 'T' ? i : -1)
      .filter(i => i >= 0)
      .forEach(col_idx => agg.push({
        x: col_idx,
        y: row_idx
      }))
    return agg
  }, [])
}

function compressBoard({tiles, size}) {
  const compressed = _.chunk(tiles, 2)
    .map(t => {
      if (t[0] === ' ' || t[0] === '#') {
        return t[0]
      }
      if (t[0] === '$') {
        switch (t[1]) {
          case '-':
            return MINES[4]
          case '1':
            return MINES[0]
          case '2':
            return MINES[1]
          case '3':
            return MINES[2]
          case '4':
            return MINES[3]
        }
      }
      if (t[0] === '@') {
        return t[1]
      }
      if (t[0] === '[') {
        return 'T'
      }
    })
    .join('')
  return _.chunk(compressed, size)
}

function printBoard({tiles, size}) {
  const board = compressBoard({
    tiles,
    size
  })
  console.log(board.map(r => r.join(' ')).join('\n'))
}

function printHero(hero) {
  console.log(`HP = ${hero.life}, mines = ${hero.mineCount}, gold = ${hero.gold}`)
}

function randomDirection() {
  const idx = Math.floor(Math.random() * 3)
  return 'nswe'[idx]
}

function walk(p1, path) {
  if (path.length === 0) {
    return randomDirection()
  }
  if (path.length === 1) {
    return "Stay"
  }
  const p2 = path[1]
  if (p1.y === p2.y && p1.x === p2.x) {
    return "Stay"
  }

  if (p1.x === p2.x) {
    if (p2.y < p1.y) {
      return "n"
    }
    return "s"
  } else if (p1.y === p2.y) {
    if (p2.x < p1.x) {
      return "w"
    }
    return "e"
  }
  throw new Error(`Cannot calculcate direction to diagonal points`)
}


function findPath(from, to, grid) {
  const start = Date.now()
  // ensure that target position is walkable
  grid.setWalkableAt(to.x, to.y, true)
  //console.log(`Finding path from ${from.y}/${from.x} to ${to.y}/${to.x}...`)
  const path = finder.findPath(from.x, from.y, to.x, to.y, grid)
    .map(pos => ({
      x: pos[0],
      y: pos[1]
    }))
  //console.log(`Execution time ${Date.now() - start} ms. Path is ${JSON.stringify(path)}`)
  return path
}


// given tiles and grid size, return grid instnace for pathfinding
function buildGrid({tiles, size}) {
  // can only walk through '  ' and '@?'
  const matrix = _.chunk(tiles, 2)
    .map(tile => tile[0] === ' ' || tile[0] === '@' ? 0 : 1)
    .reduce((agg, tile, i) => {
      const row_idx = Math.floor(i / size)
      const col_idx = i % size
      if (col_idx === 0) {
        agg.push([])
      }
      agg[row_idx].push(tile)
      return agg
    }, [])
  console.log(matrix)
  return new Grid(matrix)
}

module.exports = {
  buildGrid,
  findPath,
  printBoard,
  printHero,
  findTaverns,
  findMines,
  normalize,
  walk
}
