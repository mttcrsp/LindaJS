const async = require('async')
const Range = require('lodash').range

// This examples shows the basic API of this library. The interesting bit is
// represented by the fact that a philosopher only has to know about how to
// implement its behavior and then is able to live inside the space. This
// example does not show how Linda can be used to solve concurrency problems
// at its best since deadlock situations may arise; as a matter of facts this
// program alts when a deadlock is reached.
const Linda = require('../../src/Linda')
const Store = Linda.Store
const Space = Linda.Space

// These next few lines setup the space with the necessary tuples: the forks
// and tickets that philosophers will use to eat.

// This variable controls the number of philosophers that will be generated
const PHILOSOPHERS_COUNT = 3

const tickets = Range(2).map(() => {
  return { type: 'room ticket' }
})
const forks = Range(PHILOSOPHERS_COUNT + 1).map(i => {
  return { type: 'fork', index: i }
})

const store = Store([
  ...tickets,
  ...forks
])
const space = Space(store)

// A philosopher is a simple evolution of an agent. It encapsulates an agent
// and implement 4 basic behaviors:
//  1. Think for some amount of time
//  2. When you are done with thinking start looking for the resources you need
//     in this order: ticket, left fork, right fork
//  3. When you have acquired all of the necessary resources start eating for
//     an indefinite amount of time
//  4. When you are done eating return the resources you previously acquired.
const Philosopher = id => {
  const agent = space.createAgent()

  const left = id
  const right = (id + 1) % 3

  const eat = cb => {
    setTimeout(() => {
      async.series([
        async.apply(agent.take, { type: 'room ticket' }),
        async.apply(agent.take, { type: 'fork', index: left }),
        async.apply(agent.take, { type: 'fork', index: right })
      ], () => {
        console.log(id + ' is thinking')
        cb()
      })
    }, Math.floor(Math.random() * 1000) + 500)
  }

  const think = cb => {
    setTimeout(() => {
      async.series([
        async.apply(agent.write, { type: 'room ticket' }),
        async.apply(agent.write, { type: 'fork', index: left }),
        async.apply(agent.write, { type: 'fork', index: right })
      ], () => {
        console.log(id + ' is eating')
        cb()
      })
    }, Math.floor(Math.random() * 3000) + 500)
  }

  return {
    live () {
      async.whilst(() => true, cb => {
        async.series([eat, think], cb)
      })
    }
  }
}

// Instantiate the philosopers
const philosophers = Range(PHILOSOPHERS_COUNT).map(
  i => Philosopher(i)
)

// Start the interaction
philosophers.forEach(
  philosopher => philosopher.live()
)
