/*eslint-disable no-undef,max-nested-callbacks,max-len*/

'use strict';

const expect = require('expect');

const Space = require('../src/Space');
const Pattern = require('../src/Pattern');

describe('Agent', function () {
    let space = new Space();
    let agent = space.createAgent();

    const tuple = [1, 2, 3];
    const pattern = new Pattern(1, 2, 3);

    beforeEach(function () {
        space = new Space();
        agent = space.createAgent();
    });

    it('should start out not blocked', function () {
        expect(agent.blocked).toBe(false);
    });

    it('should not be able to operate on the space while blocked', function (done) {
        agent.blocked = true;

        agent.out([1, 2, 3], function (error) {
            expect(error).toExist();
            done();
        });
    });

    describe('out(tuple, callback)', function () {
        it('should add a tuple to the space', function (done) {
            agent.out(tuple, function (error) {
                expect(error).toNotExist();
                expect(space.tuples.length).toEqual(1);
                done();
            });
        });
    });

    describe('rd(pattern, callback)', function () {
        it('should return a tuple if the tuple is already in the space without removing it', function (done) {
            space.add(tuple);

            agent.rd(pattern, function (error, result) {
                expect(error).toNotExist();
                expect(result).toBe(tuple);
                expect(
                    space.tuples.indexOf(tuple)
                ).toBe(0);
                done();
            });
        });

        it('should return a tuple also when the tuple is added later to the space', function (done) {
            setTimeout(function () {
                space.add(tuple);
            }, 100);

            agent.rd(pattern, function (error, result) {
                expect(error).toNotExist();
                expect(result).toBe(tuple);
                done();
            });
        });
    });

    describe('in(pattern, callback)', function () {
        it('should return a tuple if the tuple is already in the space and then delete it', function (done) {
            space.add(tuple);

            agent.in(pattern, function (error, result) {
                expect(error).toNotExist();
                expect(result).toBe(tuple);
                expect(space.tuples.length).toEqual(0);
                done();
            });
        });

        it('should return a tuple and delete it from the space also when the tuple is added at a later moment', function (done) {
            setTimeout(function () {
                space.add(tuple);
            }, 100);

            agent.in(pattern, function (error, result) {
                expect(error).toNotExist();
                expect(result).toBe(tuple);
                expect(space.tuples.length).toEqual(0);
                done();
            });
        });
    });

    describe('eval(activeTuple, callback)', function () {
        it('should evaluate and add an active tuple to the space', function (done) {
            const asyncFunc = function (callback) {
                callback(undefined, 'something');
            };
            const activeTuple = [1, asyncFunc];
            agent.eval(activeTuple, function (error, passiveTuple) {
                console.log(error, passiveTuple);
                expect(error).toNotExist();
                expect(passiveTuple[0]).toEqual(1);
                expect(passiveTuple[1]).toEqual('something');
                expect(space.tuples[0][0]).toEqual(1);
                expect(space.tuples[0][1]).toEqual('something');
                done();
            });
        });
    });
});
