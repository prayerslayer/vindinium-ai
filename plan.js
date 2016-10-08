const _ = require('lodash')
const {findTaverns, findPath, walk, normalize, findMines} = require('./util')

const PLANS = {
  'regenerate': Symbol('regenerate'),
  'kill': Symbol('kill'),
  'conquer': Symbol('conquer'),
  'flee': Symbol('flee'),
  'hide': Symbol('hide')
}

function shortest(paths) {
  console.log(`Finding shortest of ${paths.length} possible paths with lengths ${paths.map(p => p.length)}`)
  return _(paths)
    .filter(path => path.length > 0)
    .sortBy(path => path.length)
    .first()
}

// assigns plan an arbitrary score [0,)
// the idea is that killing an almost dead, rich player next to me is better
// than running across the map to a tavern when i have full health
function weighPlan(state, plan) {
  //TODO
  return 1
}

function deathLetter(me, heroes) {
  return _(heroes)
    .filter(hero => hero.id !== me.id)
    .orderBy(['mineCount', 'life'], ['desc', 'asc'])
    .first()
}

function getPlayer(heroes, id) {
  return _(heroes)
    .filter(hero => hero.id === id)
    .first()
}

// takes game state, generates different plans, weighs them and returns plan with most payoff
function decide(state, grid) {
  // if we are wounded and have gold, get to next tavern for healing
  if (state.hero.life < 50 && state.hero.gold > 0) {
    return {
      type: PLANS.regenerate,
      data: {
        life: 80
      }
    }
  }
  const unconquered_mines = findMines(state.game.board).filter(mine => mine.owner !== '1')
  if (unconquered_mines.length > 0) {
    // as long as there are unconquered mines, try to get them
    const me = normalize(state.hero.pos)
    const paths = unconquered_mines.map(m => [m, findPath(me, m, grid.clone())])
    const sorted = _(paths)
      .filter(([_, path]) => path.length > 0)
      .sortBy(([_, path]) => path.length)
      .first()
    return {
      type: PLANS.conquer,
      data: sorted[0]
    }
  }
  // otherwise kill weakest player
  const victim = deathLetter(state.hero, state.game.heroes)
  return {
    type: PLANS.kill,
    data: victim
  }
}

function isAchieved(state, {plan, turn}) {
  const {type, data} = plan
  if (type === PLANS.regenerate) {
    const achieved = state.hero.life > data.life
    console.log(`Target${achieved ? ' ' : ' not '}achieved`)
    return achieved
  }
  if (type === PLANS.conquer) {
    const mines = findMines(state.game.board)
    const target_mine = _(mines)
      .filter({
        x: data.x,
        y: data.y
      })
      .first()
    const achieved = target_mine.owner === '1'
    console.log(`Target${achieved ? ' ' : ' not '}achieved`)
    return achieved
  }
  if (type === PLANS.kill) {
    // find victim
    const current_victim = getPlayer(state.game.heroes, data.id)
    // killed means he has less mines and more hp than when we attacked
    return data.mineCount === 0 ?
      current_victim.life > data.life :
      current_victim.mineCount < data.mineCount && current_victim.life < data.life
  }
  throw new Error(`Do not know how to measure achievement for plan ${type}`)
}

function executeRegenerate(state, grid, plan) {
  const me = normalize(state.hero.pos)
  // find taverns on board
  const taverns = findTaverns(state.game.board)
  // find paths to all taverns
  const paths = taverns.map(t => findPath(me, t, grid.clone()))
  // find nearest tavern
  const path = shortest(paths)
  return walk(me, path)
}

function executeKill(state, grid, plan) {
  const victim = plan.data
  const me = normalize(state.hero.pos)
  const path = findPath(me, normalize(victim.pos), grid.clone())
  return walk(me, path)
}

function executeConquer(state, grid, plan) {
  const mine = plan.data
  const me = normalize(state.hero.pos)
  const path = findPath(me, mine, grid.clone())
  return walk(me, path)
}

function executeFlee(state, grid, plan) {
  throw new Error(`Flee not implemented`)
}

function executeHide(state, grid, plan) {
  throw new Error(`Hide not implemented`)
}

function execute(state, grid, plan) {
  console.log(`Executing ${plan.type.toString()} with ${JSON.stringify(plan.data)}`)
  switch (plan.type) {
    case PLANS.regenerate:
      return executeRegenerate(state, grid, plan);
    case PLANS.kill:
      return executeKill(state, grid, plan);
    case PLANS.conquer:
      return executeConquer(state, grid, plan);
    case PLANS.flee:
      return executeFlee(state, grid, plan);
    case PLANS.hide:
      return executeHide(state, grid, plan);
    default:
      throw new Error(`Do not know how to execute plan ${plan.type.toString()}`)
  }
}

module.exports = {
  isAchieved,
  execute,
  decide,
  PLANS
}
