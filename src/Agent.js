'use strict';

const async = require('async');

const UNAUTHORIZED_ERROR = new Error('This agent is still waiting for a\
 response to one a previosly requested operation. Retry after the previous\
 operation will be completed');

function Agent (space) {
    this.space = space;
    this.blocked = false;
}

Agent.prototype._out = function (tuple) {
    this.space.add(tuple);
};

Agent.prototype._rd = function (pattern, callback) {
    const that = this;
    this.blocked = true;
    setImmediate(function () {
        that.space.match(pattern, function (tuple) {
            that.blocked = false;
            callback(tuple);
        });
    });
};

Agent.prototype._in = function (pattern, callback) {
    const that = this;
    this.blocked = true;
    setImmediate(function () {
        that.space.match(pattern, function (tuple) {
            that.blocked = false;
            that.space.remove(tuple);
            callback(tuple);
        });
    });
};

Agent.prototype._eval = function (activeTuple, callback) {
    const that = this;
    setImmediate(function () {
        async.map(
            activeTuple,
            /*eslint-disable no-shadow*/
            function (element, callback) {
            /*eslint-enable no-shadow*/
                if (typeof element !== 'function') {
                    return callback(undefined, element);
                }
                element(callback);
            },
            function (error, passiveTuple) {
                if (error) {
                    return callback(error);
                }
                that.space.add(passiveTuple);
                callback(undefined, passiveTuple);
            }
        );
    });
};

Agent.prototype.out = function (tuple, callback) {
    if (this.blocked) {
        return callback(UNAUTHORIZED_ERROR);
    }
    this._out(tuple);
};

Agent.prototype.rd = function (pattern, callback) {
    if (this.blocked) {
        return callback(UNAUTHORIZED_ERROR);
    }
    this._rd(pattern, callback);
};

Agent.prototype.in = function (pattern, callback) {
    if (this.blocked) {
        return callback(UNAUTHORIZED_ERROR);
    }
    this._in(pattern, callback);
};

Agent.prototype.eval = function (activeTuple, callback) {
    if (this.blocked) {
        return callback(UNAUTHORIZED_ERROR);
    }
    this._eval(activeTuple, callback);
};

module.exports = Agent;
