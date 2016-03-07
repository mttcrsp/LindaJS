'use strict';

const async = require('async');

const Pattern = require('./Pattern');

const UNAUTHORIZED_ERROR = Error('This agent is still waiting for a\
 response to one a previosly requested operation. Retry after the previous\
 operation will be completed');

const Agent = _space => {
    const space = _space;
    // The Linda specifications prescribe in and rd operations to block the
    // caller and inp and rdp operations to be non blocking. This clearly does
    // not match the Node model of execution: no operation should ever block.
    // However when you really think about it the essential difference between
    // this two kind of operations is that the first one is guaranteed to
    // return a matching tuple (maybe after a while but surely will) while the
    // second one does not guarantee that a matching tuple is returned to the
    // caller (it returns a tuple if matching one is already inside the space,
    // but if there's no matching tuple in the space it does not return
    // anything).
    // Based on this idea this implementation of the Linda model implements
    // operations this way:
    // - p operations search the space and immediatly invoke the callback with
    // a tuple matching the pattern or undefined if no tuple matching the
    // pattern is found is found;
    // - non-p operations 'block' waiting for a matching tuple to be added to
    // the space before returning.
    // In this context 'blocking' does not actually mean that the whole
    // process is blocked, it means that the agent won't be able to operate on
    // the space until a matching tuple is found in the space and the
    // requested operation will complete (from a practical standpoint until
    // the provided callback won't be invoked by the space).
    let blocked = false;

    const out = (tuple, callback) => {
        try {
            space.add(tuple);
            return callback();
        } catch (error) {
            return callback(error);
        }
    };

    // The Linda guidelines descrive an active tuple as a set of functions
    // that will be evaluated and become a passive tuple. Thus I decided to
    // model an active tuple as an array of functions that will be invoked
    // passing a callback as an argument. The role of each function is to
    // compute it's value and invoke the callback with the result of their
    // computation, or an error if for some reason they were not able to
    // complete their computation.
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
                    try {
                        space.add(passiveTuple);
                        return callback(undefined, passiveTuple);
                    } catch (validationError) {
                        return callback(validationError);
                    }
                }
            );
        });
    };

    // In, inp, rd, rdp all follow the same pattern of execution. They all
    // schedule the search for a tuple matching the provided pattern and call
    // the callback function. They differ in the way that the search works (p
    // vs non-p) and whether they required the removal the matching tuple from
    // the space or not (in* vs rd*). This function builds an operation based
    // on this two different parameters that should be specified: the way in
    // which the operation should search the space (blocking/non blocking) and
    // whether the matched tuple should be removed.
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
    /*eslint-enable no-shadow*/
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
