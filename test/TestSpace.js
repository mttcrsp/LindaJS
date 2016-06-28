'use strict'

const Space = require('../src/Space')
const InspectableStore = require('./InspectableStore')

const TestSpace = initialTuples => {
  const store = InspectableStore(initialTuples)
  const space = Space(store)
  space.getTuples = () => {
    return store.getTuples()
  }
  return space
}

module.exports = TestSpace
