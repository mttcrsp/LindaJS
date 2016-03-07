/*eslint-disable no-undef,max-nested-callbacks,max-len*/

'use strict';

const expect = require('expect');

const Space = require('../src/Space');
const Pattern = require('../src/Pattern');

describe('Space', function() {
    let space;

    const tuple = [1, 2, 3];
    const otherTuple = [3, 4, 5];

    const pattern = Pattern(1, 2, 3);

    beforeEach(function () {
        space = Space();
    });

    describe('#constructor(tuples)', function () {
        it('should error if the provided value is not a array of tuples', function () {
            expect(() => {
                space = Space(1);
            }).toThrow();

            expect(() => {
                space = Space([1, 2, 3]);
            }).toThrow();
        });

        it('should correctly initialize the tuples space if an initial value is provided', function () {
            space = Space([tuple, otherTuple]);
            expect(space.getTuples().length).toEqual(2);
        });
    });

    describe('#add(tuple)', function () {
        it('should add tuples', function () {
            space.add(tuple);
            space.add(otherTuple);

            expect(space.getTuples().length).toEqual(2);
        });

        it('should add duplicated tuples', function () {
            space.add(tuple);
            space.add(tuple);

            expect(space.getTuples().length).toEqual(2);
        });
    });

    describe('#remove(tuple)', function () {
        it('should remove tuples', function () {
            space.add(tuple);
            space.add(otherTuple);
            space.remove(tuple);

            expect(space.getTuples()[0]).toEqual(otherTuple);
        });

        it('should remove duplicated tuples only once', function () {
            space.add(tuple);
            space.add(tuple);
            space.remove(tuple);

            expect(space.getTuples().length).toEqual(1);
        });
    });

    describe('#find', function () {
        it('should return a tuple matching the pattern if a matching tuple is available', function () {
            space.add(tuple);

            expect(
                space.find(pattern)
            ).toBe(tuple);
        });

        it('should return undefined if no tuple matching the predicate is available', function () {
            space.add(otherTuple);

            expect(
                space.find(pattern)
            ).toNotExist();
        });
    });

    describe('#verify(pattern, callback)', function () {
        it('should match with tuples that are already available', function (done) {
            space.add(tuple);

            space.verify(pattern, (result) => {
                expect(result).toBe(tuple);
                done();
            });
        });

        it('should not match with tuples that are not yet available', function (done) {
            setTimeout(() => {
                space.add(tuple);
            }, 100);

            space.verify(pattern, (result) => {
                expect(result).toNotExist();
                done();
            });
        });
    });

    describe('#match(pattern, callback)', function () {
        it('should match with tuples that are already available', function (done) {
            space.add(tuple);

            space.match(pattern, (result) => {
                expect(result).toBe(tuple);
                done();
            });
        });

        it('should match with tuples that are not yet available', function (done) {
            setTimeout(() => {
                space.add(tuple);
            }, 100);

            space.match(pattern, (result) => {
                expect(result).toBe(tuple);
                done();
            });
        });
    });

    describe('#createAgent()', function () {
        it('should create an agent able to work on this space', function (done) {
            const agent = space.createAgent();
            agent.out(tuple, () => {
                expect(space.getTuples().length).toEqual(1);
                done();
            });
        });
    });
});
