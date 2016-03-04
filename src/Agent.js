'use strict';

const async = require('async');

const Pattern = require('./Pattern');

const UNAUTHORIZED_ERROR = Error('This agent is still waiting for a\
 response to one a previosly requested operation. Retry after the previous\
 operation will be completed');

const Agent = _space => {
    const space = _space;
    let blocked = false;

    const authorize = operation => {
        return (argument, callback) => {
            if (blocked) {
                return callback(UNAUTHORIZED_ERROR);
            }
            operation(argument, callback);
        };
    };

    const out = (tuple, callback) => {
        space.add(tuple);
        callback();
    };

    const _eval = (activeTuple, callback) => {
        setImmediate(() => {
            async.map(
                activeTuple,
                /*eslint-disable no-shadow*/
                (element, callback) => {
                /*eslint-enable no-shadow*/
                    if (typeof element !== 'function') {
                        return callback(undefined, element);
                    }
                    element(callback);
                },
                (error, passiveTuple) => {
                    if (error) {
                        return callback(error);
                    }
                    space.add(passiveTuple);
                    callback(undefined, passiveTuple);
                }
            );
        });
    };

    const rd = (patternArray, callback) => {
        const pattern = Pattern(...patternArray);
        blocked = true;
        setImmediate(() => {
            space.match(pattern, tuple => {
                blocked = false;
                callback(undefined, tuple);
            });
        });
    };

    const _in = (patternArray, callback) => {
        const pattern = Pattern(...patternArray);
        blocked = true;
        setImmediate(() => {
            space.match(pattern, tuple => {
                blocked = false;
                space.remove(tuple);
                callback(undefined, tuple);
            });
        });
    };

    const rdp = (patternArray, callback) => {
        const pattern = Pattern(...patternArray);
        blocked = true;
        setImmediate(() => {
            space.verify(pattern, tuple => {
                blocked = false;
                callback(undefined, tuple);
            });
        });
    };

    const inp = (patternArray, callback) => {
        const pattern = Pattern(...patternArray);
        blocked = true;
        setImmediate(() => {
            space.verify(pattern, tuple => {
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
