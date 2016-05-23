const _ = require('lodash')
const async = require('async')

const Matcher = require('../src/Matcher')
const match = Matcher.match

const InspectableStore = initialTuples => {
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
        findAll (schemata, cb) {
            async.nextTick(() => {
                const results = tuples.filter(
                    tuple => match(schemata, tuple)
                )
                cb(undefined, results)
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
                return cb(new Error('You are trying to remove a tuple that is not in the store.'))
            }

            async.nextTick(() => {
                tuples.splice(index, 1)
                cb()
            })
        }
    }
}

module.exports = InspectableStore
