/*eslint-disable no-undef,max-nested-callbacks,max-len*/

'use strict';

const expect = require('expect');

const Space = require('../src/Space');

describe('Agent', function () {
    let space = Space();
    let agent = space.createAgent();

    const pattern = [1, 2, 3];
    const tuple = [1, 2, 3];
    const invalidTuple = ['invalid'];

    const activeTuple = [1, callback => {
        callback(undefined, 'something');
    }];

    const validators = [t => t[0] !== 'invalid'];

    beforeEach(function () {
        space = Space([], validators);
        agent = space.createAgent();
    });

    it('should not be able to operate on the space while blocked', function (done) {
        // Given that the space is empty this operation should block the agent
        agent.in(pattern, () => {});

        agent.out(tuple, error => {
            expect(error).toExist();
            done();
        });
    });

    describe('#out(tuple, callback)', function () {
        it('should add a tuple to the space', function (done) {
            agent.out(tuple, (error) => {
                expect(error).toNotExist();
                expect(space.getTuples().length).toEqual(1);
                done();
            });
        });

        it('should not be able to add an invalid tuple to the space', function (done) {
            agent.out(invalidTuple, error => {
                expect(error).toExist();
                expect(space.getTuples().length).toEqual(0);
                done();
            });
        });
    });

    describe('#rd(pattern, callback)', function () {
        it('should return a tuple if the tuple is already in the space without removing it', function (done) {
            space.add(tuple);

            agent.rd(pattern, (error, result) => {
                expect(error).toNotExist();
                expect(result).toBe(tuple);
                expect(
                    space.getTuples().indexOf(tuple)
                ).toBe(0);
                done();
            });
        });

        it('should return a tuple also when the tuple is added later to the space', function (done) {
            setTimeout(() => {
                space.add(tuple);
            }, 100);

            agent.rd(pattern, (error, result) => {
                expect(error).toNotExist();
                expect(result).toBe(tuple);
                done();
            });
        });
    });

    describe('#in(pattern, callback)', function () {
        it('should return a tuple if the tuple is already in the space and then delete it', function (done) {
            space.add(tuple);

            agent.in(pattern, (error, result) => {
                expect(error).toNotExist();
                expect(result).toBe(tuple);
                expect(space.getTuples().length).toEqual(0);
                done();
            });
        });

        it('should return a tuple and delete it from the space also when the tuple is added at a later moment', function (done) {
            setTimeout(() => {
                space.add(tuple);
            }, 100);

            agent.in(pattern, (error, result) => {
                expect(error).toNotExist();
                expect(result).toBe(tuple);
                expect(space.getTuples().length).toEqual(0);
                done();
            });
        });
    });

    describe('#inp(pattern, callback)', function () {
        it('should return a tuple if the tuple is already in the space and then delete it', function (done) {
            space.add(tuple);

            agent.inp(pattern, (error, result) => {
                expect(error).toNotExist();
                expect(result).toBe(tuple);
                expect(space.getTuples().length).toEqual(0);
                done();
            });
        });

        it('should not return a tuple if the tuple is not in the space and is added at a later moment', function (done) {
            setTimeout(() => {
                space.add(tuple);
            }, 100);

            agent.inp(pattern, (error, result) => {
                expect(error).toNotExist();
                expect(result).toNotExist();
                done();
            });
        });
    });

    describe('#eval(activeTuple, callback)', function () {
        it('should evaluate and add an active tuple to the space', function (done) {
            agent.eval(activeTuple, (error, passiveTuple) => {
                expect(error).toNotExist();
                expect(passiveTuple[0]).toEqual(1);
                expect(passiveTuple[1]).toEqual('something');
                expect(space.getTuples()[0][0]).toEqual(1);
                expect(space.getTuples()[0][1]).toEqual('something');
                done();
            });
        });

        it('should work asynchronously', function (done) {
            agent.eval(activeTuple, (error, passiveTuple) => {
                expect(error).toNotExist();
                expect(passiveTuple).toExist();
                done();
            });
            expect(space.getTuples().length).toEqual(0);
        });
    });
});
