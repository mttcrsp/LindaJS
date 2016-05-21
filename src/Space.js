'use strict'

const EventEmitter = require('events').EventEmitter

const _ = require('lodash')
const async = require('async')

const Agent = require('./Agent')
const match = require('./Matcher').match

const INITIALIZATION_ERROR = new Error('Expected initial tuples to be an array of tuples (aka array of objects).')
const VALIDATION_ERROR = new Error('The tuple was rejected by some validator function.')
const TUPLE_NOT_FOUND_ERROR = new Error('You are trying to delete a tuple that does not belong to the space.')
const ROLE_NOT_FOUND_ERROR = new Error('This role is not defined. Declare it on the space')

const NEW_TUPLE_EVENT = 'newTuple'

const Space = () => {
    const tuples = []
    const emitter = new EventEmitter()

    const roles = []

    const validators = []
    const eventHandlers = {
        onWillAdd: [],
        onDidAdd: [],
        onWillRemove: [],
        onDidRemove: []
    }

    // Looks for the first tuple that matches the specified tuple schemata in
    // the space.
    const find = (schemata, cb) => {
        async.nextTick(() => {
            const result = _.find(
                tuples, async.apply(match, schemata)
            )
            cb(undefined, result)
        })
    }

    const add = (tuple, cb) => {
        async.nextTick(() => {
            tuples.push(tuple)
            cb()
        })
    }

    const remove = (tuple, cb) => {
        const index = tuples.indexOf(tuple)
        if (index === -1) {
            return cb(TUPLE_NOT_FOUND_ERROR)
        }

        async.nextTick(() => {
            tuples.splice(index, 1)
            cb()
        })
    }

    return {
        getTuples () {
            // Fastest way to clone an array
            return tuples.slice()
        },
        add (tuple, cb) {
            const isValidTuple = _.every(
                validators, validator => validator(tuple)
            )
            if (!isValidTuple) {
                return cb(VALIDATION_ERROR)
            }

            const willAdd = (
                eventHandlers.onWillAdd
            ).map(
                worker => async.apply(worker, tuple)
            )

            const didAdd = (
                eventHandlers.onDidAdd
            ).map(
                worker => async.apply(worker, tuple)
            )

            async.series([
                ...willAdd,
                async.apply(add, tuple),
                ...didAdd
            ], err => {
                if (err) {
                    return cb(err)
                }

                emitter.emit(NEW_TUPLE_EVENT, tuple)
                cb(undefined, tuple)
            })
        },
        remove (tuple, cb) {
            const willRemove = (
                eventHandlers.onWillRemove
            ).map(
                worker => async.apply(worker, tuple)
            )

            const didRemove = (
                eventHandlers.onDidRemove
            ).map(
                worker => async.apply(worker, tuple)
            )

            async.series([
                innercb => {
                    const index = tuples.indexOf(tuple)
                    if (index === -1) {
                        return innercb(TUPLE_NOT_FOUND_ERROR)
                    }
                    innercb()
                },
                ...willRemove,
                async.apply(remove, tuple),
                ...didRemove
            ], err => {
                if (err) {
                    return cb(err)
                }
                cb(undefined, tuple)
            })
        },
        // This two functions implement the two necessary search types, non
        // blocking and blocking:
        // - Verify verifies if a tuple matching the provided predicate can be
        //   found in the space and immediately returns with a matching tuple
        //   or
        //   undefined if no matching tuple can be found.
        // - Match looks for a matching tuple indefinetly and invokes the
        //   callback when one it is found. Look below to see the details of
        //   how this indefinitely running search is implemented.
        verify (schemata, cb) {
            find(schemata, cb)
        },
        match (schemata, cb) {
            // If a tuple that matches the specified pattern can not be found
            // in the space at the moment register the callback to retry
            // matching the pattern when a new tuple is added.
            find(schemata, (err, tuple) => {
                if (err) {
                    return cb(err)
                }

                if (tuple) {
                    return cb(undefined, tuple)
                }

                const tryMatchingWithNewTuple = tuple => { // eslint-disable-line no-shadow
                    if (!match(schemata, tuple)) {
                        return
                    }
                    emitter.removeListener(
                        NEW_TUPLE_EVENT,
                        tryMatchingWithNewTuple
                    )
                    cb(undefined, tuple)
                }
                emitter.on(NEW_TUPLE_EVENT, tryMatchingWithNewTuple)
            })
        },
        addValidator (validator) {
            validators.push(validator)
        },
        onWillAdd (handler) {
            eventHandlers.onWillAdd.push(handler)
        },
        onDidAdd (handler) {
            eventHandlers.onDidAdd.push(handler)
        },
        onWillRemove (handler) {
            eventHandlers.onWillRemove.push(handler)
        },
        onDidRemove (handler) {
            eventHandlers.onDidRemove.push(handler)
        },
        addRoles (newRoles) {
            roles.push(...newRoles)
        },
        createAgent (role) {
            // If no role was specified simply return an agent that is enable
            // to perform every possibile operation. Otherwise check that the
            // role, is a valid one.
            if (roles.length === 0) {
                return Agent(this)
            }

            if (roles.indexOf(role) === -1) {
                throw ROLE_NOT_FOUND_ERROR
            }

            return Agent(this, role)
        }
    }
}

Array.isArrayOfObjects = function (array) {
    return (
        Array.isArray(array) &&
        _.every(array, e => typeof(e) === 'object')
    )
}

module.exports = Space
