/*eslint-disable no-undef,max-nested-callbacks*/

'use strict';

const expect = require('expect');

const Space = require('../src/Space');
const Worker = require('../src/Worker');

describe('Worker', function () {
    let space;

    const tuple = [1, 2, 3];

    describe('Workers of different types', function () {
        it('should be ran in the correct order', function (done) {
            const willAdd = Worker(
                Worker.TYPE.WILL_ADD,
                t => {
                    expect(t).toExist();
                    expect(space.getTuples().length).toEqual(0);
                }
            );
            const didAdd = Worker(
                Worker.TYPE.DID_ADD,
                t => {
                    expect(t).toExist();
                    expect(space.getTuples().length).toEqual(1);
                }
            );
            const willRemove = Worker(
                Worker.TYPE.WILL_REMOVE,
                t => {
                    expect(t).toExist();
                    expect(space.getTuples().length).toEqual(1);
                }
            );
            const didRemove = Worker(
                Worker.TYPE.DID_REMOVE,
                t => {
                    expect(t).toExist();
                    expect(space.getTuples().length).toEqual(0);
                    done();
                }
            );

            space = Space([], [willAdd, didAdd, willRemove, didRemove]);

            space.add(tuple);
            space.remove(tuple);
        });
    });

    describe('Will add workers', function () {
        it('should be ran before a tuple is added', function (done) {
            let count = 0;
            const work = (t) => {
                expect(t).toExist();
                expect(space.getTuples().length).toEqual(0);
                count += 1;
                if (count === 2) {
                    done();
                }
            };

            const worker = Worker(Worker.TYPE.WILL_ADD, work);
            const otherWorker = Worker(Worker.TYPE.WILL_ADD, work);

            space = Space([], [worker, otherWorker]);

            space.add(tuple);
        });
    });

    describe('Did add workers', function () {
        it('should be ran before a tuple is added', function (done) {
            let count = 0;
            const work = (t) => {
                expect(t).toExist();
                expect(space.getTuples().length).toEqual(1);
                count += 1;
                if (count === 2) {
                    done();
                }
            };

            const worker = Worker(Worker.TYPE.DID_ADD, work);
            const otherWorker = Worker(Worker.TYPE.DID_ADD, work);

            space = Space([], [worker, otherWorker]);

            space.add(tuple);
        });
    });

    describe('Will remove workers', function () {
        it('should be ran before a tuple is removed', function (done) {
            let count = 0;
            const work = (t) => {
                expect(t).toExist();
                expect(space.getTuples().length).toEqual(1);
                count += 1;
                if (count === 2) {
                    done();
                }
            };

            const worker = Worker(Worker.TYPE.WILL_REMOVE, work);
            const otherWorker = Worker(Worker.TYPE.WILL_REMOVE, work);

            space = Space([tuple], [worker, otherWorker]);

            space.remove(tuple);
        });
    });

    describe('Did add workers', function () {
        it('should be ran before a tuple is removed', function (done) {
            let count = 0;
            const work = (t) => {
                expect(t).toExist();
                expect(space.getTuples().length).toEqual(0);
                count += 1;
                if (count === 2) {
                    done();
                }
            };

            const worker = Worker(Worker.TYPE.DID_REMOVE, work);
            const otherWorker = Worker(Worker.TYPE.DID_REMOVE, work);

            space = Space([tuple], [worker, otherWorker]);

            space.remove(tuple);
        });
    });
});
