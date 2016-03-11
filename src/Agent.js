'use strict';

const Operation = require('./Operation');

const BLOCKED_ERROR = new Error('This agent is still waiting for a response to one a previosly requested operation. Retry after the previous operation will be completed.');
const UNAUTHORIZED_ERROR = new Error('This agent is not authorized to perform this operation');

// The Linda specifications prescribe in and rd operations to block the caller
// and inp and rdp operations to be non blocking. This clearly does not match
// the Node model of execution: no operation should ever block.
// However when you really think about it the essential difference between
// this two kind of operations is that the first one is guaranteed to return a
// matching tuple (maybe after a while but surely will) while the second one
// does not guarantee that a matching tuple is returned to the caller (it
// returns a tuple if matching one is already inside the space, but if there
// is no matching tuple in the space it does not return anything).
// Based on this idea this implementation of the Linda model implements
// operations this way:
// - p operations search the space and immediatly invoke the callback with a
//   tuple matching the pattern or undefined if no tuple matching the pattern
//   is found is found;
// - non-p operations 'block' waiting for a matching tuple to be added to the
//   space before returning.
// In this context 'blocking' does not actually mean that the whole process is
// blocked, it means that the agent won't be able to operate on the space
// until a matching tuple is found in the space and the requested operation
// will complete (from a practical standpoint until the provided callback
// won't be invoked by the space).
const Agent = (space, role) => {
    let block = false;

    const execute = (operation, cb) => {
        if (block) {
            return cb(BLOCKED_ERROR);
        }

        if (role && !role.can(operation)) {
            return cb(UNAUTHORIZED_ERROR);
        }

        block = true;
        operation(space, (err, res) => {
            block = false;
            cb(err, res);
        });
    };

    return {
        out (tuple, cb) {
            const operation = Operation(Operation.TYPE.OUT, tuple);
            execute(operation, cb);
        },
        in (pattern, cb) {
            const operation = Operation(Operation.TYPE.IN, pattern);
            execute(operation, cb);
        },
        inp (pattern, cb) {
            const operation = Operation(Operation.TYPE.INP, pattern);
            execute(operation, cb);
        },
        rd (pattern, cb) {
            const operation = Operation(Operation.TYPE.RD, pattern);
            execute(operation, cb);
        },
        rdp (pattern, cb) {
            const operation = Operation(Operation.TYPE.RDP, pattern);
            execute(operation, cb);
        },
        eval (activeTuple, cb) {
            const operation = Operation(Operation.TYPE.EVAL, activeTuple);
            execute(operation, cb);
        }
    };
};

module.exports = Agent;
