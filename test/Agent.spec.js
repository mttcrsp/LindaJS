/*eslint-disable no-undef,max-nested-callbacks,max-len*/

'use strict';

const expect = require('expect');

const Space = require('../src/Space');

describe('Agent', function () {
    let space = Space();
    let agent = space.createAgent();

    const pattern = [1, 2, 3];
    const tuple = [1, 2, 3];

    const activeTuple = [1, function (callback) {
        callback(undefined, 'something');
    }];

    beforeEach(function () {
        space = Space();
        agent = space.createAgent();
    });

    it('should not be able to operate on the space while blocked', function (done) {
        // Given that the space is empty this operation should block the agent
        agent.in(pattern, function () {});
        
        agent.out(tuple, function (error) {
            expect(error).toExist();
            done();
        });
    });

    describe('#out(tuple, callback)', function () {
        it('should add a tuple to the space', function (done) {
            agent.out(tuple, function (error) {
                expect(error).toNotExist();
                expect(space.tuples().length).toEqual(1);
                done();
            });
        });
    });

    describe('#rd(pattern, callback)', function () {
        it('should return a tuple if the tuple is already in the space without removing it', function (done) {
            space.add(tuple);

            agent.rd(pattern, function (error, result) {
                expect(error).toNotExist();
                expect(result).toBe(tuple);
                expect(
                    space.tuples().indexOf(tuple)
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

    describe('#in(pattern, callback)', function () {
        it('should return a tuple if the tuple is already in the space and then delete it', function (done) {
            space.add(tuple);

            agent.in(pattern, function (error, result) {
                expect(error).toNotExist();
                expect(result).toBe(tuple);
                expect(space.tuples().length).toEqual(0);
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
                expect(space.tuples().length).toEqual(0);
                done();
            });
        });
    });

    describe('#inp(pattern, callback)', function () {
        it('should return a tuple if the tuple is already in the space and then delete it', function (done) {
            space.add(tuple);

            agent.inp(pattern, function (error, result) {
                expect(error).toNotExist();
                expect(result).toBe(tuple);
                expect(space.tuples().length).toEqual(0);
                done();
            });
        });

        it('should not return a tuple if the tuple is not in the space and is added at a later moment', function (done) {
            setTimeout(function () {
                space.add(tuple);
            }, 100);

            agent.inp(pattern, function (error, result) {
                expect(error).toNotExist();
                expect(result).toNotExist();
                done();
            });
        });
    });

    describe('#eval(activeTuple, callback)', function () {
        it('should evaluate and add an active tuple to the space', function (done) {
            agent.eval(activeTuple, function (error, passiveTuple) {
                expect(error).toNotExist();
                expect(passiveTuple[0]).toEqual(1);
                expect(passiveTuple[1]).toEqual('something');
                expect(space.tuples()[0][0]).toEqual(1);
                expect(space.tuples()[0][1]).toEqual('something');
                done();
            });
        });

        it('should work asynchronously', function (done) {
            agent.eval(activeTuple, function (error, passiveTuple) {
                expect(error).toNotExist();
                expect(passiveTuple).toExist();
                done();
            });
            expect(space.tuples().length).toEqual(0);
        });
    });
});
