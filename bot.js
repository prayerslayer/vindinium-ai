const v = require('vindinium-client')
const _ = require('lodash')
const clear = require("cli-clear");
const {buildGrid, getDirection, findPath, printBoard, printHero} = require('./util')
const {PLAN, execute, isAchieved, decide, signature} = require('./plan')

const DIRECTION = {
  'n': 'North',
  's': 'South',
  'e': 'East',
  'w': 'West'
}

function logReturn(x) {
  console.log(x)
  return x
}

let grid = null
// { turn: 425, plan: {type: 'kill', data: {target: '@3'}}}
let planStack = []
let PLAN_TIMEOUT = -1
function bot(state, callback) {
  if (grid == null) {
    console.log(`Constructing grid...`)
    grid = buildGrid(state.game.board)
  }
  if (PLAN_TIMEOUT < 0) {
    PLAN_TIMEOUT = parseInt(state.game.board.size / 2, 10) * state.game.heroes.length
  }
  clear()
  printBoard(state.game.board)
  const sum_gold = state.game.heroes.reduce((gold, hero) => gold + hero.gold, 0)
  console.log(`Turn: ${state.game.turn} / ${state.game.maxTurns} | Gold: ${parseInt(state.hero.gold / sum_gold * 100, 10)} %`)
  printHero(state.hero)
  if (planStack.length > 0) {
    // see if we need to pop last plan
    if (isAchieved(state, planStack[planStack.length - 1])) {
      console.log(`Achieved plan ${JSON.stringify(planStack[planStack.length - 1].plan)}`)
      planStack.pop()
      if (planStack.length > 0 && state.game.turn - planStack[planStack.length - 1].turn > PLAN_TIMEOUT) {
        // next plan in stack timed out or stack is empty
        // as plans higher in the stack are always younger than plans lower in the stack
        // we can safely assume that if the highest plan timed out, every other plan below
        // is so, too, and we can reset the stack
        console.log(`Reset stack as all other plans timed out or it was empty anyways`)
        planStack = []
      }
    }
  }
  // find new plan
  console.log(`Active plans: ${planStack.length}`)
  const possibly_better_plan = decide(state, grid.clone())
  if (planStack.length === 0) {
    console.log(`Trying new plan ${possibly_better_plan.type.toString()}: ${JSON.stringify(possibly_better_plan.data)}`)
    planStack.push({
      turn: state.game.turn,
      plan: possibly_better_plan
    })
  } else if (signature(possibly_better_plan) !== signature(planStack[planStack.length - 1].plan)) {
    console.log(`Trying new plan ${possibly_better_plan.type.toString()}: ${JSON.stringify(possibly_better_plan.data)}`)
    planStack.push({
      turn: state.game.turn,
      plan: possibly_better_plan
    })
  }

  const dir = execute(state, grid.clone(), planStack[planStack.length - 1].plan)
  console.log(`${dir === 'Stay' ? 'Staying... ' : `Walking ${DIRECTION[dir]}...`}`)
  callback(null, dir);
}


module.exports = bot;
if (require.main === module)
  require('vindinium-client').cli(bot);
