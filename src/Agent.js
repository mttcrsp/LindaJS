'use strict';

const async = require('async');

const Pattern = require('./Pattern');

const UNAUTHORIZED_ERROR = Error('This agent is still waiting for a\
 response to one a previosly requested operation. Retry after the previous\
 operation will be completed');

function Agent (_space) {
    const space = _space;
    let blocked = false;

    const authorize = function (operation) {
        return function (argument, callback) {
            if (blocked) {
                return callback(UNAUTHORIZED_ERROR);
            }
            operation(argument, callback);
        };
    };

    const out = function (tuple, callback) {
        space.add(tuple);
        callback();
    };

    const _eval = function (activeTuple, callback) {
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
                    space.add(passiveTuple);
                    callback(undefined, passiveTuple);
                }
            );
        });
    };

    const rd = function (patternArray, callback) {
        const pattern = Pattern(...patternArray);
        blocked = true;
        setImmediate(function () {
            space.match(pattern, function (tuple) {
                blocked = false;
                callback(undefined, tuple);
            });
        });
    };

    const _in = function (patternArray, callback) {
        const pattern = Pattern(...patternArray);
        blocked = true;
        setImmediate(function () {
            space.match(pattern, function (tuple) {
                blocked = false;
                space.remove(tuple);
                callback(undefined, tuple);
            });
        });
    };

    const rdp = function (patternArray, callback) {
        const pattern = Pattern(...patternArray);
        blocked = true;
        setImmediate(function () {
            space.verify(pattern, function (tuple) {
                blocked = false;
                callback(undefined, tuple);
            });
        });
    };

    const inp = function (patternArray, callback) {
        const pattern = Pattern(...patternArray);
        blocked = true;
        setImmediate(function () {
            space.verify(pattern, function (tuple) {
                blocked = false;
                space.remove(tuple);
                callback(undefined, tuple);
            });
        });
    };

    return {
        out: authorize(out),
        rd: authorize(rd),
        in: authorize(_in),
        rdp: authorize(rdp),
        inp: authorize(inp),
        eval: authorize(_eval)
    };
}

module.exports = Agent;
