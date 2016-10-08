const v = require('vindinium-client')
const _ = require('lodash')
const clear = require("cli-clear");
const {buildGrid, getDirection, findPath, printBoard, printHero} = require('./util')
const {PLAN, execute, isAchieved, decide} = require('./plan')
const PLAN_TIMEOUT = 20

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

function bot(state, callback) {
  if (grid == null) {
    console.log(`Constructing grid...`)
    grid = buildGrid(state.game.board)
  }
  clear()
  printBoard(state.game.board)
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
  if (planStack.length === 0) {
    // find new plan
    const plan = decide(state, grid.clone())
    console.log(`Trying new plan ${plan.type.toString()}: ${JSON.stringify(plan.data)}`)
    planStack.push({
      turn: state.game.turn,
      plan
    })
  }
  const dir = execute(state, grid.clone(), planStack[planStack.length - 1].plan)
  console.log(`${dir === 'Stay' ? 'Staying... ' : `Walking ${DIRECTION[dir]}...`}`)
  callback(null, dir);
}


module.exports = bot;
if (require.main === module)
  require('vindinium-client').cli(bot);
