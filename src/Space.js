'use strict'

const EventEmitter = require('events').EventEmitter

const _ = require('lodash')
const async = require('async')

const Store = require('./Store')
const Agent = require('./Agent')
const match = require('./Matcher').match

const INITIALIZATION_ERROR = new Error('This store is not compatible. A store is expected to provided add, remove and find functions.')
const TUPLE_NOT_FOUND_ERROR = new Error('You are trying to delete a tuple that does not belong to the space.')
const ROLE_NOT_FOUND_ERROR = new Error('This role is not defined. Declare it on the space before trying to use it.')

const NEW_TUPLE_EVENT = 'newTuple'

const Space = (injectedStore) => {
    if (injectedStore && (
        !injectedStore.add ||
        !injectedStore.remove ||
        !injectedStore.find
    )) {
        throw INITIALIZATION_ERROR
    }

    const store = injectedStore || Store()
    const emitter = new EventEmitter()

    const roles = []

    const validators = []
    const eventHandlers = {
        onWillAdd: [],
        onDidAdd: [],
        onWillRemove: [],
        onDidRemove: []
    }

    return {
        add (tuple, cb) {
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
                innercb => {
                    async.parallel(validators.map(
                        validator => async.apply(validator, tuple)
                    ), innercb)
                },
                ...willAdd,
                async.apply(store.add, tuple),
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
            const ensureExistence = innercb => {
                store.find(tuple, (err, found) => {
                    if (!found) {
                        return innercb(TUPLE_NOT_FOUND_ERROR)
                    }
                    innercb()
                })
            }

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
                ensureExistence,
                ...willRemove,
                async.apply(store.remove, tuple),
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
        // - search verifies if a tuple matching the provided predicate can
        //   be found in the space and immediately returns with a matching
        //   tuple or undefined if no matching tuple can be found.
        // - searchUntilFound looks for a matching tuple indefinetely and
        //   invokes the callback when one it is found. Look below to see the
        //   details of how this indefinitely running search is implemented.
        search (schemata, cb) {
            store.find(schemata, cb)
        },
        searchMany (schemata, cb) {
            store.findAll(schemata, cb)
        },
        searchUntilFound (schemata, cb) {
            // If the space does not contain any tuple matching the specied
            // schemata at this moment, register a callback to retry matching
            // the schemata whenever a new tuple is added.
            store.find(schemata, (err, tuple) => {
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
                    async.nextTick(cb, undefined, tuple)
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
