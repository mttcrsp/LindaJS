/*eslint-disable no-undef,max-nested-callbacks*/

'use strict';

const expect = require('expect');
const async = require('async');
const series = async.series;
const apply = async.apply;

const Space = require('../src/Space');

describe('Worker', function () {
    let space;

    const tuple = [1, 2, 3];

    describe('workers of different types', function () {
        it('should be ran in the correct order', function (done) {
            space = Space();

            space.onWillAdd((t, cb) => {
                expect(t).toExist();
                const tuples = space.getTuples();
                expect(tuples.length).toEqual(0);
                cb();
            });
            space.onDidAdd((t, cb) => {
                expect(t).toExist();
                const tuples = space.getTuples();
                expect(tuples.length).toEqual(1);
                cb();
            });
            space.onWillRemove((t, cb) => {
                expect(t).toExist();
                const tuples = space.getTuples();
                expect(tuples.length).toEqual(1);
                cb();
            });
            space.onDidRemove((t, cb) => {
                expect(t).toExist();
                const tuples = space.getTuples();
                expect(tuples.length).toEqual(0);
                cb();
            });

            series([
                apply(space.add, tuple),
                apply(space.remove, tuple)
            ], err => {
                expect(err).toNotExist();
                done();
            });
        });
    });

    describe('will add workers', function () {
        it('should be ran before a tuple is added', function (done) {
            let count = 0;
            const work = (added, cb) => {
                expect(added).toBe(tuple);

                const tuples = space.getTuples();
                expect(tuples.length).toEqual(0);

                count += 1;
                if (count === 2) {
                    done();
                }

                cb();
            };

            space = Space();

            space.onWillAdd(work);
            space.onWillAdd(work);

            space.add(tuple, () => {});
        });
    });

    describe('did add workers', function () {
        it('should be ran before a tuple is added', function (done) {
            let count = 0;
            const work = (added, cb) => {
                expect(added).toBe(tuple);

                const tuples = space.getTuples();
                expect(tuples.length).toEqual(1);

                count += 1;
                if (count === 2) {
                    done();
                }

                cb();
            };

            space = Space();

            space.onDidAdd(work);
            space.onDidAdd(work);

            space.add(tuple, () => {});
        });
    });

    describe('will remove workers', function () {
        it('should be ran before a tuple is removed', function (done) {
            let count = 0;
            const work = (removed, cb) => {
                expect(removed).toExist();

                const tuples = space.getTuples();
                expect(tuples.length).toEqual(1);

                count += 1;
                if (count === 2) {
                    done();
                }

                cb();
            };

            space = Space([tuple]);

            space.onWillRemove(work);
            space.onWillRemove(work);

            space.remove(tuple, () => {});
        });
    });

    describe('did remove workers', function () {
        it('should be ran before a tuple is removed', function (done) {
            let count = 0;
            const work = (removed, cb) => {
                expect(removed).toExist();

                const tuples = space.getTuples();
                expect(tuples.length).toEqual(0);

                count += 1;
                if (count === 2) {
                    done();
                }

                cb();
            };

            space = Space([tuple]);

            space.onDidRemove(work);
            space.onDidRemove(work);

            space.remove(tuple, () => {});
        });
    });
});
