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

function Space (tuples) {
    if (
        tuples !== undefined &&
        !Array.isArrayOfArrays(tuples)
    ) {
        throw new Error('Expected initial tuples to be an array of\
         tuples (aka array of arrays).');
    }
    this.tuples = tuples || [];
    this.emitter = new EventEmitter();
}

Space.prototype.add = function (tuple) {
    this.tuples.push(tuple);
    this.emitter.emit(NEW_TUPLE_EVENT, tuple);
};

Space.prototype.remove = function (tuple) {
    const index = this.tuples.indexOf(tuple);
    this.tuples.splice(index, 1);
};

Space.prototype.find = function (pattern) {
    return this.tuples.find(
        pattern.match.bind(pattern)
    );
};

Space.prototype.verify = function (pattern, callback) {
    const tuple = this.find(pattern);
    callback(tuple);
};

Space.prototype.match = function (pattern, callback) {
    // If a tuple that matches the specified pattern can not be found in the
    // space at the moment register the callback to retry matching the pattern
    // when a new tuple is added.
    const tuple = this.find(pattern);
    if (tuple !== undefined) {
        return callback(tuple);
    }
    const that = this;
    /*eslint-disable no-shadow*/
    const tryMatchingWithNewTuple = function (tuple) {
    /*eslint-enable no-shadow*/
        if (!pattern.match(tuple)) {
            return;
        }
        that.emitter.removeListener(
            NEW_TUPLE_EVENT,
            tryMatchingWithNewTuple
        );
        callback(tuple);
    };
    this.emitter.on(NEW_TUPLE_EVENT, tryMatchingWithNewTuple);
};

Space.prototype.createAgent = function () {
    return new Agent(this);
};

module.exports = Space;
