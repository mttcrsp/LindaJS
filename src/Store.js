const _ = require('lodash')
const async = require('async')

const match = require('./Matcher').match

const TUPLE_NOT_FOUND_ERROR = new Error('The tuple you are trying to remove from the store could not be found.')

const Store = initialTuples => {
    const tuples = initialTuples || []
    return {
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
                return cb(TUPLE_NOT_FOUND_ERROR)
            }

            async.nextTick(() => {
                tuples.splice(index, 1)
                cb()
            })
        }
    }
}

module.exports = Store
