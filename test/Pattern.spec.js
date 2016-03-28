/*eslint-disable no-undef,max-nested-callbacks*/

'use strict'

const expect = require('expect')

const Pattern = require('../src/Pattern')

describe('Pattern', function () {
    describe('#match(tuple)', function () {
        it('should match tuples that do match', function () {
            const pattern = Pattern({
                id: 1,
                name: 'Bob'
            })
            const tuple = {
                id: 1,
                name: 'Bob'
            }
            expect(
                pattern.match(tuple)
            ).toExist()
        })

        it('should not match tuples that do not match', function () {
            const pattern = Pattern({
                id: 1,
                name: 'Matteo'
            })
            const tuple = {
                id: 1,
                name: 'Something'
            }
            expect(
                pattern.match(tuple)
            ).toNotExist()
        })

        it('should match tuples correctly using the wildcard element', function () {
            const pattern = Pattern({
                id: 0,
                name: Pattern.WILDCARD
            })

            const tuple = {
                id: 0,
                name: 'Bob'
            }
            const otherTuple = {
                id: 0,
                name: 'Alice'
            }
            const notMatchingTuple = {
                id: 1,
                name: 'Bob'
            }
            expect(
                pattern.match(tuple)
            ).toExist()
            expect(
                pattern.match(otherTuple)
            ).toExist()
            expect(
                pattern.match(notMatchingTuple)
            ).toNotExist()
        })
    })
})
