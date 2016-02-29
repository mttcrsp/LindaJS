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

function Space () {
    this.tuples = [];
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

Space.prototype.createAgent = function () {
    return new Agent(this);
};

Space.prototype.match = function (pattern, callback) {
    // If a tuple that matches the specified pattern can not be found in the
    // space at the moment register the callback to retry matching the pattern
    // when a new tuple is added.
    const tuple = this.tuples.find(pattern.match);
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
        that.emmiter.removeListener(tryMatchingWithNewTuple);
        callback(tuple);
    };
    this.emitter.on(NEW_TUPLE_EVENT, tryMatchingWithNewTuple);
};

module.exports = Space;
