/*eslint-disable no-undef,max-nested-callbacks,max-len*/

'use strict';

const expect = require('expect');

const Pattern = require('../src/Pattern');

describe('Pattern', function () {
    describe('#match(tuple)', function () {
        it('should match tuples that do match', function () {
            const pattern = new Pattern(1, 'something', 3);
            expect(
                pattern.match([1, 'something', 3])
            ).toExist();
        });

        it('should not match tuples that do not match', function () {
            const pattern = new Pattern(1, 2, 3);
            expect(
                pattern.match([1, 2, 4])
            ).toNotExist();
            expect(
                pattern.match([4, 2, 1])
            ).toNotExist();
        });

        it('should match tuples correctly using the wildcard element', function () {
            const pattern = new Pattern(1, Pattern.WILDCARD, 2);
            expect(
                pattern.match([1, 5, 2])
            ).toExist();
            expect(
                pattern.match([1, 'something', 2])
            ).toExist();
            expect(
                pattern.match([1, 'something', 3])
            ).toNotExist();
        });
    });
});
