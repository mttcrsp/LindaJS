// This example shows the basic API of this library. The interesting bit is
// represented by the fact that a philosopher only has to know about how to
// implement its behavior and how a fork tuple is made. It does not need to
// know anything about the other agents that live in its same space.
// This example does not show how Linda can be used to solve concurrency
// problems at its best since deadlock situations may arise; as a matter of
// facts this program alts when a deadlock is reached.
const Linda = require('../../src/Linda')
const lodash = require('lodash')
const range = lodash.range
const async = require('async')
const whilst = async.whilst
const series = async.series
const apply = async.apply

// Constants representing the four different states a philosopher can be in.
const State = {
  THINK: 'THINK',
  PREPARE: 'PREPARE',
  EAT: 'EAT',
  RELEASE: 'RELEASE'
}

const forever = () => true

const random = (min, max) => {
  return Math.floor(Math.random() * max) + min
}

// This variable controls the number of philosophers that will be generated.
const PHILOSOPHERS_COUNT = 5

// These next few lines setup the space using an in-memory store initialized
// with the necessary tuples: the forks philosophers will use to eat.
const forks = range(PHILOSOPHERS_COUNT).map(i => {
  return { type: 'fork', index: i }
})
const store = Linda.Store(forks)
const space = Linda.Space(store)

// A philosopher is a simple evolution of an agent. It encapsulates an agent
// and implement 4 basic behaviors:
//  1. Think for some amount of time (THINK STATE);
//  2. When you are done with thinking start looking for the resources you
//     need: your left fork and your right fork (PREPARE STATE);
//  3. When you have acquired all of the necessary resources start eating for
//     an indefinite amount of time (EAT STATE);
//  4. When you are done eating return the resources you previously acquired.
//     (PREPARE STATE).
const Philosopher = id => {
  const agent = space.createAgent()

  // Identify the index of the fork to the left and to the fork to the right of
  // the agent.
  const left = id
  const right = (id + 1) % PHILOSOPHERS_COUNT

  // An agent starts out in the prepare to eat state as it has not acquired.
  let state = State.PREPARE

  // While eating set the state to EAT, as soon as the timeout expires set the
  // state to RELEASE.
  const eat = cb => {
    state = State.EAT
    setTimeout(() => {
      state = State.RELEASE
      cb()
    }, random(500, 1000))
  }
  const think = cb => {
    state = State.THINK
    setTimeout(() => {
      state = State.PREPARE
      cb()
    }, random(500, 3000))
  }

  return {
    getState () {
      switch (state) {
        case State.THINK:
          return 'T'
        case State.EAT:
          return 'E'
        case State.PREPARE:
          return 'P'
        case State.RELEASE:
          return 'R'
      }
    },
    live () {
      whilst(forever, cb => {
        series([
          apply(agent.take, { type: 'fork', index: left }),
          apply(agent.take, { type: 'fork', index: right }),
          eat,
          apply(agent.write, { type: 'fork', index: right }),
          apply(agent.write, { type: 'fork', index: left }),
          think
        ], cb)
      })
    }
  }
}

// Instantiate the philosophers
const philosophers = range(PHILOSOPHERS_COUNT).map(Philosopher)

// Start the interaction
philosophers.forEach(
  philosopher => philosopher.live()
)

// Log the state of the overall system to the console every 500ms.
const getPhilosophersDescription = philosophers => philosophers.reduce(
  (previous, philosopher) => {
    const philosopherState = philosopher.getState()
    return `${previous} ${philosopherState} `
  },
  ''
)
setInterval(() => {
  const systemState = getPhilosophersDescription(philosophers)
  console.log(systemState)
}, 500)
