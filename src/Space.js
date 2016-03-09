'use strict';

const _ = require('lodash');
const EventEmitter = require('events').EventEmitter;

const Agent = require('./Agent');
const Worker = require('./Worker');

const NEW_TUPLE_EVENT = 'newTuple';

const Space = (_tuples, _workers) => {
    if (
        _tuples !== undefined &&
        !Array.isArrayOfArrays(_tuples)
    ) {
        throw new Error('Expected initial tuples to be an array of tuples ' +
        '(aka array of arrays).');
    }

    const tuples = _tuples || [];
    const emitter = new EventEmitter();

    // Extract all the provided workers to their respective category
    const workers = _workers || [];

    const getWorkers = (type) => {
        return workers.filter(
            w => w.type === type
        ).map(o => o.work);
    };

    const validators = getWorkers(Worker.TYPE.VALIDATION);
    const didRemovers = getWorkers(Worker.TYPE.DID_REMOVE);
    const didAdders = getWorkers(Worker.TYPE.DID_ADD);
    const willAdders = getWorkers(Worker.TYPE.WILL_ADD);
    const willRemovers = getWorkers(Worker.TYPE.WILL_REMOVE);

    // Looks for the first tuple that matches the specified pattern in the
    // space.
    const find = pattern => {
        return _.find(
            tuples, pattern.match.bind(pattern)
        );
    };

    return {
        getTuples () {
            // Fastest way to clone an array
            return tuples.slice();
        },
        add (tuple) {
            const isValidTuple = _.every(
                validators, validator => validator(tuple)
            );
            if (!isValidTuple) {
                throw TypeError('The tuple was rejected by some validator ' +
                'function');
            }

            // FIXME: This should be done asyncronously
            willAdders.forEach(worker => worker(tuple));
            tuples.push(tuple);
            didAdders.forEach(worker => worker(tuple));

            emitter.emit(NEW_TUPLE_EVENT, tuple);
        },
        remove (tuple) {
            const index = tuples.indexOf(tuple);
            if (index === -1) {
                throw new Error('You are trying to delete a tuple that does' +
                ' not belong to the space');
            }

            // FIXME: This should be done asyncronously
            willRemovers.forEach(worker => worker(tuple));
            tuples.splice(index, 1);
            didRemovers.forEach(worker => worker(tuple));
        },
        find,
        // This two functions implement the two necessary search types, non
        // blocking and blocking:
        // - Verify verifies if a tuple matching the provided predicate can be
        //   found in the space and immediately invokes the callback with a
        //   matching tuple or undefined if no matching tuple can be found.
        // - Match looks for a matching tuple indefinetly and invokes the
        //   callback when one it is found. Look below to see the details of
        //   how this indefinitely running search is implemented.
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
            const tryMatchingWithNewTuple = tuple => {
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
            return Agent(this);
        }
    };
};

Array.isArrayOfArrays = function (o) {
    return (
        Array.isArray(o) &&
        _.every(o, Array.isArray)
    );
};

module.exports = Space;
