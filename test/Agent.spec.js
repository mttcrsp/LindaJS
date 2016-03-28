/*eslint-disable no-undef,max-nested-callbacks*/

'use strict';

const expect = require('expect');

const Space = require('../src/Space');

describe('Agent', function () {
    let space, agent;

    const tuple = {
        id: 1,
        name: 'Bob'
    };
    const invalidTuple = {
        invalid: true
    };

    const pattern = {
        id: 1,
        name: 'Bob'
    };

    const activeTuple = {
        value: 1,
        func: cb => cb(undefined, 'something')
    };

    beforeEach(function () {
        space = Space();
        space.addValidator(t => t.invalid !== true);
        agent = space.createAgent();
    });

    it('should not be able to operate on the space while blocked', function (done) {
        // Given that the space is empty this operation should block the agent
        agent.in(pattern, () => {});

        agent.out(tuple, err => {
            expect(err).toExist();
            done();
        });
    });

    describe('#out(tuple, callback)', function () {
        it('should add a tuple to the space', function (done) {
            agent.out(tuple, err => {
                expect(err).toNotExist();

                const tuples = space.getTuples();
                expect(tuples.length).toEqual(1);

                done();
            });
        });

        it('should not be able to add an invalid tuple to the space', function (done) {
            agent.out(invalidTuple, err => {
                expect(err).toExist();

                const tuples = space.getTuples();
                expect(tuples.length).toEqual(0);

                done();
            });
        });
    });

    describe('#rd(pattern, callback)', function () {
        it('should return a tuple if the tuple is already in the space without removing it', function (done) {
            space.add(tuple, () => {
                agent.rd(pattern, (err, res) => {
                    expect(err).toNotExist();
                    expect(res).toBe(tuple);
                    done();
                });
            });
        });

        it('should return a tuple also when the tuple is added later to the space', function (done) {
            setTimeout(() => {
                space.add(tuple, () => {});
            }, 100);

            agent.rd(pattern, (err, res) => {
                expect(err).toNotExist();
                expect(res).toBe(tuple);
                done();
            });
        });
    });

    describe('#in(pattern, callback)', function () {
        it('should return a tuple if the tuple is already in the space and then delete it', function (done) {
            space.add(tuple, () => {
                agent.in(pattern, (err, res) => {
                    expect(err).toNotExist();
                    expect(res).toBe(tuple);

                    const tuples = space.getTuples();
                    expect(tuples.length).toEqual(0);

                    done();
                });
            });
        });

        it('should return a tuple and delete it from the space also when the tuple is added at a later moment', function (done) {
            setTimeout(() => {
                space.add(tuple, () => {});
            }, 100);

            agent.in(pattern, (err, res) => {
                expect(err).toNotExist();
                expect(res).toBe(tuple);

                const tuples = space.getTuples();
                expect(tuples.length).toEqual(0);

                done();
            });
        });
    });

    describe('#inp(pattern, callback)', function () {
        it('should return a tuple if the tuple is already in the space and then delete it', function (done) {
            space.add(tuple, () => {});

            agent.inp(pattern, (err, res) => {
                expect(err).toNotExist();
                expect(res).toBe(tuple);

                const tuples = space.getTuples();
                expect(tuples.length).toEqual(0);

                done();
            });
        });

        it('should not return a tuple if the tuple is not in the space and is added at a later moment', function (done) {
            setTimeout(() => {
                space.add(tuple, () => {});
            }, 100);

            agent.inp(pattern, (err, res) => {
                expect(err).toNotExist();
                expect(res).toNotExist();
                done();
            });
        });
    });

    describe('#eval(activeTuple, callback)', function () {
        it('should evaluate and add an active tuple to the space', function (done) {
            agent.eval(activeTuple, (err, passiveTuple) => {
                expect(err).toNotExist();

                expect(passiveTuple.value).toEqual(1);
                expect(passiveTuple.func).toEqual('something');

                const tuples = space.getTuples();
                expect(tuples[0].value).toEqual(1);
                expect(tuples[0].func).toEqual('something');

                done();
            });
        });

        it('should work asynchronously', function (done) {
            agent.eval(activeTuple, (err, passiveTuple) => {
                expect(err).toNotExist();
                expect(passiveTuple).toExist();
                done();
            });

            const tuples = space.getTuples();
            expect(tuples.length).toEqual(0);
        });
    });
});
