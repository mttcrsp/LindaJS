const Linda = require('../../src/Linda')
const createStore = require('./MongoStore')

const URL = 'mongodb://localhost:27017/linda'

createStore(URL, (storeErr, store) => {
  if (storeErr) {
    throw storeErr
  }

  const space = Linda.Space(store)
  const agent = space.createAgent()
  const otherAgent = space.createAgent()

  const tuple = {
    name: 'Matteo',
    age: 23
  }

  agent.in(tuple, (err, res) => {
    console.log(err, res)
    store.close()
  })

  setTimeout(() => {
    otherAgent.out(tuple, () => {
    }) // eslint-disable-line max-nested-callbacks
  }, 1000)
})
