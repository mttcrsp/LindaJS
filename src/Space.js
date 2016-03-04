'use strict';

const EventEmitter = require('events').EventEmitter;
const Agent = require('./Agent');

const NEW_TUPLE_EVENT = 'newTuple';

Array.prototype.find = function (predicate) {
    for (let i = 0; i < this.length; i++) {
        if (predicate(this[i])) {
            return this[i];
        }
    }
    return undefined;
};

Array.prototype.every = function (predicate) {
    for (let i = 0; i < this.length; i++) {
        if (!predicate(this[i])) {
            return false;
        }
    }
    return true;
};

Array.isArrayOfArrays = function (o) {
    return (
        Array.isArray(o) &&
        o.every(Array.isArray)
    );
};

function Space (_tuples) {
    if (
        _tuples !== undefined &&
        !Array.isArrayOfArrays(_tuples)
    ) {
        throw new Error('Expected initial tuples to be an array of\
         tuples (aka array of arrays).');
    }
    const tuples = _tuples || [];
    const emitter = new EventEmitter();

    const find = function (pattern) {
        return tuples.find(
            pattern.match.bind(pattern)
        );
    };

    return {
        tuples () {
            // Fastest way to clone an array
            return tuples.slice();
        },
        add (tuple) {
            tuples.push(tuple);
            emitter.emit(NEW_TUPLE_EVENT, tuple);
        },
        remove (tuple) {
            const index = tuples.indexOf(tuple);
            tuples.splice(index, 1);
        },
        find,
        verify (pattern, callback) {
            const tuple = find(pattern);
            callback(tuple);
        },
        match (pattern, callback) {
            // If a tuple that matches the specified pattern can not be found
            // in the space at the moment register the callback to retry
            // matching the pattern when a new tuple is added.
            const tuple = find(pattern);
            if (tuple !== undefined) {
                return callback(tuple);
            }
            /*eslint-disable no-shadow*/
            const tryMatchingWithNewTuple = function (tuple) {
            /*eslint-enable no-shadow*/
                if (!pattern.match(tuple)) {
                    return;
                }
                emitter.removeListener(
                    NEW_TUPLE_EVENT,
                    tryMatchingWithNewTuple
                );
                callback(tuple);
            };
            emitter.on(NEW_TUPLE_EVENT, tryMatchingWithNewTuple);
        },
        createAgent () {
            const agent = Agent(this);
            return agent;
        }
    };
}

module.exports = Space;
