const _ = require('lodash')
const crypto = require('crypto')
const {findTaverns, findPath, walk, normalize, findMines} = require('./util')
const FIGHT_THRESHOLD = 30
const PLANS = {
  'regenerate': Symbol('regenerate'),
  'conquer': Symbol('conquer'),
  'kill': Symbol('kill'),
  'flee': Symbol('flee'),
  'hide': Symbol('hide')
}

function jsonHash(json, algo = 'sha256') {
  const hash = crypto.createHash(algo)
  hash.update(new Buffer(JSON.stringify(json)))
  return hash.digest('hex')
}

function signature(plan) {
  // get identifier for plan
  return plan.type.toString() + jsonHash(plan)
}

function findNextTavern(state, grid) {
  const taverns = findTaverns(state.game.board)
  // find paths to all taverns
  const paths = taverns.map(t => findPath(normalize(state.hero.pos), t, grid.clone(), state.game.heroes.map(h => normalize(h.pos))))
  // find nearest tavern
  return shortest(paths)
}

function shortest(paths) {
  return _(paths)
    .filter(path => path.length > 0)
    .sortBy(path => path.length)
    .first()
}

// assigns plan an arbitrary score [0,)
// the idea is that killing an almost dead, rich player next to me is better
// than running across the map to a tavern when i have full health
function scorePlan(state, grid, plan) {
  // regeneration plans are useless when we have enough health
  // otoh they get exponentially more important the lower on health we are
  if (plan.type === PLANS.regenerate) {
    if (state.hero.life > plan.data.life) {
      return 0
    } else {
      //TODO take tavern distance into account
      return 10 + 100 / state.hero.life
    }
  }
  const me = state.hero
  const current_pos = normalize(me.pos)
  // conquering a mine is always okay-ish, but the nearer, the better
  if (plan.type === PLANS.conquer) {
    const path = findPath(current_pos, plan.data, grid.clone())
    return me.life > FIGHT_THRESHOLD ? 10 + 20 / path.length : 0
  }
  // killing a player is good when
  // * he has dem mines
  // * is lower on health than us
  // * is near
  if (plan.type === PLANS.kill) {
    const player = plan.data
    // if we are under 30 health, we don't get into fights at all
    return player.life > FIGHT_THRESHOLD ? player.mineCount +
    (me.life / player.life) +
    10 / findPath(current_pos, normalize(player.pos), grid.clone()).length : 0
  }

}

function getPlayer(heroes, id) {
  return _(heroes)
    .filter(hero => hero.id === id)
    .first()
}

function generatePlans(state) {
  // basically we have only a couple of options at any point in time:
  // * regenerate
  // * kill player
  // * conquer mine
  const kills = state.game.heroes
    .filter(hero => hero.id !== state.hero.id)
    .map(hero => ({
      type: PLANS.kill,
      data: hero
    }))
  const regenerates = [90].map(life => ({
    type: PLANS.regenerate,
    data: {
      life
    }
  }))
  const conquers = findMines(state.game.board)
    .filter(m => m.owner !== `${state.hero.id}`)
    .map(mine => ({
      type: PLANS.conquer,
      data: mine
    }))
  return [...kills, ...conquers, ...regenerates]
}

// takes game state, generates different plans, weighs them and returns plan with most payoff
function decide(state, grid) {
  const plans = generatePlans(state).map(plan => [plan, scorePlan(state, grid, plan)])
  const sorted = plans.sort((p1, p2) => {
    const s1 = p1[1]
    const s2 = p2[1]
    return s1 < s2 ? 1 : s2 < s1 ? -1 : 0
  })
  console.log(plans
    .filter((p, i) => i < 3)
    .map(([plan, score]) => `score: ${score} - ${plan.type.toString()}: ${JSON.stringify(plan.data)}`).join('\n'))
  return sorted[0][0]
}

function isAchieved(state, {plan, turn}) {
  const {type, data} = plan
  if (type === PLANS.regenerate) {
    const achieved = state.hero.life > data.life
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
    const achieved = target_mine.owner === `${state.hero.id}`
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
  const path = findNextTavern(state, grid)
  return walk(me, path)
}

function executeKill(state, grid, plan) {
  const victim = plan.data
  const me = normalize(state.hero.pos)
  const path = findPath(me, normalize(victim.pos), grid.clone(), state.game.heroes.map(h => normalize(h.pos)))
  return walk(me, path)
}

function executeConquer(state, grid, plan) {
  const mine = plan.data
  const me = normalize(state.hero.pos)
  const path = findPath(me, mine, grid.clone(), state.game.heroes.map(h => normalize(h.pos)))
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
  signature,
  execute,
  decide
}
