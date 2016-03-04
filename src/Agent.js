'use strict';

const async = require('async');

const Pattern = require('./Pattern');

const UNAUTHORIZED_ERROR = Error('This agent is still waiting for a\
 response to one a previosly requested operation. Retry after the previous\
 operation will be completed');

const Agent = _space => {
    const space = _space;
    let blocked = false;

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

    // In, inp, rd, rdp all follow the same pattern of execution. They all
    // schedule the search for a tuple matching the provided pattern and call
    // the callback function. They differ in the way that the search works (p
    // vs non-p)and whether they remove the matching tuple from the space or
    // not (in* vs rd*). (non-p operations search the space and immediatly
    // return while p operations block waiting for a matching tuple before
    // returning). This function builds an operation based on this two
    // different parameters that should be specified
    const operation = (searchSpace, shouldRemove) => {
        return (patternArray, callback) => {
            const pattern = Pattern(...patternArray);
            blocked = true;
            setImmediate(() => {
                searchSpace(pattern, tuple => {
                    blocked = false;
                    if (shouldRemove) {
                        space.remove(tuple);
                    }
                    callback(undefined, tuple);
                });
            });
        };
    };

    const blocking = space.match;
    const nonBlocking = space.verify;

    const rd = operation(blocking, false);
    const _in = operation(blocking, true);
    const rdp = operation(nonBlocking, false);
    const inp = operation(nonBlocking, true);

    const agent = {
        out,
        rd,
        'in': _in,
        rdp,
        inp,
        'eval': _eval
    };

    // Since every operation should check that the agent is not blocked you
    // you need to transform every operation that is associated with the agent
    // to include that check. This is done by mapping on all of its operations
    // and transforming them to valid authorized operations.
    /*eslint-disable no-shadow*/
    const authorize = operation => {
        return (argument, callback) => {
            if (blocked) {
                return callback(UNAUTHORIZED_ERROR);
            }
            operation(argument, callback);
        };
    };

    Object.keys(agent)
        .forEach(key => {
            agent[key] = authorize(agent[key]);
        });

    return agent;
};

module.exports = Agent;
