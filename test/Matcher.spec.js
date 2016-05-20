/*eslint-disable no-undef,max-nested-callbacks*/

'use strict'

const expect = require('expect')

const Matcher = require('../src/Matcher')
const match = Matcher.match
const _ = Matcher.WILDCARD

describe('Matcher', function () {
    describe('#match(schemata, tuple)', function () {
        it('should match tuples that do match', function () {
            const schemata = {
                id: 1,
                name: 'Bob'
            }
            const tuple = {
                id: 1,
                name: 'Bob'
            }
            expect(
                match(schemata, tuple)
            ).toExist()
        })

        it('should not match tuples that do not match', function () {
            const schemata = {
                id: 1,
                name: 'Matteo'
            }
            const tuple = {
                id: 1,
                name: 'Something'
            }
            expect(
                match(schemata, tuple)
            ).toNotExist()
        })

        it('should match tuples correctly using the wildcard element', function () {
            const schemata = {
                id: 0,
                name: _
            }

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
                match(schemata, tuple)
            ).toExist()
            expect(
                match(schemata, otherTuple)
            ).toExist()
            expect(
                match(schemata, notMatchingTuple)
            ).toNotExist()
        })
    })
})
