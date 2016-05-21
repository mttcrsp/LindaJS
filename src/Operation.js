'use strict'

const async = require('async')

const Operation = (type, operand) => {
    const types = Object.keys(Operation.TYPE)
    if (types.indexOf(type) === -1) {
        throw new Error('Expected type to be a valid operation type.')
    }

    let operation
    switch (type) {
        case Operation.TYPE.OUT:
            operation = (space, cb) => {
                space.add(operand, cb)
            }
            break
        // In, inp, rd, rdp all follow the same pattern of execution. They all
        // schedule the search for a tuple matching the provided pattern and
        // call the callback function. They differ in the way that the search
        // works (p vs non-p) and whether they required the removal the
        // matching tuple from the space or not (in* vs rd*). This function
        // builds an operation based on this two different parameters that
        // should be specified: the way in which the operation should search
        // the space (blocking/non blocking) and whether the matched tuple
        // should be removed.
        case Operation.TYPE.IN:
            operation = (space, cb) => {
                async.waterfall([
                    async.apply(space.match, operand),
                    space.remove
                ], cb)
            }
            break
        case Operation.TYPE.INP:
            operation = (space, cb) => {
                space.verify(operand, (err, tuple) => {
                    if (!tuple) {
                        return cb()
                    }
                    space.remove(tuple, cb)
                })
            }
            break
        case Operation.TYPE.RD:
            operation = (space, cb) => {
                space.match(operand, cb)
            }
            break
        case Operation.TYPE.RDP:
            operation = (space, cb) => {
                space.verify(operand, cb)
            }
            break
        // The Linda guidelines describe an active tuple as a set of functions
        // that will be evaluated and become a passive tuple. Thus I decided
        // to model an active tuple as an array of functions that will be
        // invoked passing a callback as an argument. The role of each
        // function is to compute it's value and invoke the callback with the
        // result of their computation, or an error if for some reason they
        // were not able to complete their computation.
        case Operation.TYPE.EVAL:
            operation = (space, cb) => {
                async.nextTick(() => {
                    async.map(
                        operand,
                        // e is an element of an active tuple, if it is not a
                        // function already has a value, otherwise it needs to
                        // be evaluated so invoke it.
                        (e, innercb) => {
                            if (typeof e !== 'function') {
                                return innercb(undefined, e)
                            }
                            e(innercb)
                        },
                        (err, tuple) => {
                            if (err) {
                                return cb(err)
                            }
                            space.add(tuple, cb)
                        }
                    )
                })
            }
            break
    }

    operation.type = type
    operation.operand = operand

    return operation
}

Operation.TYPE = {
    OUT: 'OUT',
    IN: 'IN',
    INP: 'INP',
    RD: 'RD',
    RDP: 'RDP',
    EVAL: 'EVAL'
}

module.exports = Operation
