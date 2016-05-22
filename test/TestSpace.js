'use strict'

const _ = require('lodash')
const async = require('async')

const Space = require('../src/Space')
const match = require('../src/Matcher').match

const Store = initialTuples => {
    const tuples = initialTuples || []
    return {
        getTuples () {
            return tuples
        },
        find (schemata, cb) {
            async.nextTick(() => {
                const result = _.find(
                    tuples, async.apply(match, schemata)
                )
                cb(undefined, result)
            })
        },
        add (tuple, cb) {
            async.nextTick(() => {
                tuples.push(tuple)
                cb()
            })
        },
        remove (tuple, cb) {
            const index = tuples.indexOf(tuple)
            if (index === -1) {
                return cb(new Error())
            }

            async.nextTick(() => {
                tuples.splice(index, 1)
                cb()
            })
        }
    }
}

const TestSpace = () => {
    const store = Store()
    const space = Space(store)
    space.getTuples = () => {
        return store.getTuples()
    }
    return space
}

module.exports = TestSpace
