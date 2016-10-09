const v = require('vindinium-client')
const _ = require('lodash')
const clear = require("cli-clear");
const {getDirection, findPath, printBoard, printHero} = require('./util')
const {init, execute, isAchieved, decide, signature} = require('./plan')

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

// { turn: 425, plan: {type: 'kill', data: {target: '@3'}}}
let plan_stack = []
let PLAN_TIMEOUT = -1
function bot(state, callback) {
  if (state.game.turn === 0) {
    PLAN_TIMEOUT = parseInt(state.game.board.size / 2, 10) * state.game.heroes.length
    init(state.game.board)
  }
  clear()
  printBoard(state.game.board)
  const sum_gold = state.game.heroes.reduce((gold, hero) => gold + hero.gold, 0)
  console.log(`Turn: ${state.game.turn} / ${state.game.maxTurns} | Gold: ${parseInt(state.hero.gold / sum_gold * 100, 10)} %`)
  printHero(state.hero)
  if (plan_stack.length > 0) {
    // see if we need to pop last plan
    if (isAchieved(state, _.last(plan_stack))) {
      console.log(`Achieved plan ${JSON.stringify(_.last(plan_stack).plan)}`)
      plan_stack.pop()
      if (plan_stack.length > 0 && state.game.turn - _.last(plan_stack).turn > PLAN_TIMEOUT) {
        // next plan in stack timed out or stack is empty
        // as plans higher in the stack are always younger than plans lower in the stack
        // we can safely assume that if the highest plan timed out, every other plan below
        // is so, too, and we can reset the stack
        console.log(`Reset stack as all other plans timed out or it was empty anyways`)
        plan_stack = []
      }
    }
  }
  // find new plan
  console.log(`Active plans: ${plan_stack.map(p => p.plan.type.toString())}`)
  const possibly_better_plan = decide(state)
  if (plan_stack.length === 0) {
    console.log(`Trying new plan ${possibly_better_plan.type.toString()}: ${JSON.stringify(possibly_better_plan.data)}`)
    plan_stack.push({
      turn: state.game.turn,
      plan: possibly_better_plan
    })
  } else if (signature(possibly_better_plan) !== signature(_.last(plan_stack).plan)) {
    console.log(`Trying new plan ${possibly_better_plan.type.toString()}: ${JSON.stringify(possibly_better_plan.data)}`)
    plan_stack.push({
      turn: state.game.turn,
      plan: possibly_better_plan
    })
  }

  const dir = execute(state, _.last(plan_stack).plan)
  console.log(`${dir === 'Stay' ? 'Staying... ' : `Walking ${DIRECTION[dir]}...`}`)
  callback(null, dir);
}


module.exports = bot;
if (require.main === module)
  require('vindinium-client').cli(bot);
