/*eslint-disable no-undef,max-nested-callbacks,max-len*/

'use strict';

const expect = require('expect');

const Space = require('../src/Space');

const Pattern = require('../src/Pattern');

describe('Space', function() {
    let space;

    const t1 = [1, 2, 3];
    const t2 = [3, 4, 5];

    const pattern = new Pattern(1, 2, 3);

    beforeEach(function () {
        space = new Space();
    });

    describe('add(tuple)', function () {
        it('should add tuples', function () {
            space.add(t1);
            space.add(t2);

            expect(space.tuples.length).toEqual(2);
        });

        it('should add duplicated tuples', function () {
            space.add(t1);
            space.add(t1);

            expect(space.tuples.length).toEqual(2);
        });
    });

    describe('remove(tuple)', function () {
        it('should remove tuples', function () {
            space.add(t1);
            space.add(t2);
            space.remove(t1);

            expect(space.tuples[0]).toEqual(t2);
        });

        it('should remove duplicated tuples only once', function () {
            space.add(t1);
            space.add(t1);
            space.remove(t1);

            expect(space.tuples.length).toEqual(1);
        });
    });

    describe('createAgent()', function () {
        it('should create an agent able to work on this space', function (done) {
            const agent = space.createAgent();

            agent.out(t1, function () {
                expect(space.tuples.length).toEqual(1);
                done();
            });
        });
    });

    describe('match(pattern, callback)', function () {
        it('should match with tuples that are already avalable', function (done) {
            space.add(t1);

            const agent = space.createAgent();
            agent.rd(pattern, function (error, tuple) {
                expect(tuple).toExist();
                expect(error).toNotExist();
                done();
            });
        });

        it('should match with tuples that are not yet avalable', function (done) {
            setTimeout(function () {
                space.add(t1);
            }, 100);

            space.match(pattern, function (result) {
                expect(result).toBe(t1);
                done();
            });
        });
    });
});
