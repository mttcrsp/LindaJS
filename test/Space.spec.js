/*eslint-disable no-undef,max-nested-callbacks*/

'use strict'

const expect = require('expect')
const async = require('async')
const series = async.series
const apply = async.apply

const Space = require('../src/Space')
const Operation = require('../src/Operation')
const Permission = require('../src/Permission')
const Role = require('../src/Role')

describe('Space', function() {
    let space

    const tuple = {
        id: 1,
        name: 'Bob'
    }
    const otherTuple = {
        key: 'value',
        number: 9
    }
    const invalidTuple = {
        invalid: true
    }

    const pattern = {
        id: 1,
        name: 'Bob'
    }

    const read = Permission(
        Operation.TYPE.IN,
        {
            id: 1,
            name: 'Bob'
        }
    )
    const write = Permission(
        Operation.TYPE.OUT,
        {
            id: 1,
            name: 'Bob'
        }
    )

    const User = Role([read])
    const Admin = Role([write], [User])

    beforeEach(function () {
        space = Space()
        space.addValidator(t => t.invalid !== true)
    })

    describe('#constructor', function () { })

    describe('#add(tuple, cb)', function () {
        it('should add tuples', function (done) {
            series([
                apply(space.add, tuple),
                apply(space.add, otherTuple)
            ], err => {
                expect(err).toNotExist()

                const tuples = space.getTuples()
                expect(tuples[0]).toBe(tuple)
                expect(tuples[1]).toBe(otherTuple)
                expect(tuples.length).toBe(2)

                done()
            })
        })

        it('should add duplicated tuples', function () {
            series([
                apply(space.add, tuple),
                apply(space.add, tuple)
            ], err => {
                expect(err).toNotExist()

                const tuples = space.getTuples()
                expect(tuples[0]).toBe(tuple)
                expect(tuples[1]).toBe(tuple)
                expect(tuples.length).toBe(2)

                done()
            })
        })

        it('should throw an error if the tuple is invalid and not add it to the space', function (done) {
            space.add(invalidTuple, err => {
                expect(err).toExist()
                expect(space.getTuples().length).toBe(0)
                done()
            })
        })
    })

    describe('#remove(tuple)', function () {
        it('should remove tuples', function (done) {
            series([
                apply(space.add, tuple),
                apply(space.add, otherTuple),
                apply(space.remove, tuple)
            ], err => {
                expect(err).toNotExist()

                const tuples = space.getTuples()
                expect(tuples[0]).toEqual(otherTuple)

                done()
            })
        })

        it('should remove duplicated tuples only once', function (done) {
            series([
                apply(space.add, tuple),
                apply(space.add, tuple),
                apply(space.remove, tuple)
            ], err => {
                expect(err).toNotExist()

                const tuples = space.getTuples()
                expect(tuples.length).toEqual(1)

                done()
            })
        })
    })


    describe('#verify(pattern, callback)', function () {
        it('should match with tuples that are already available', function (done) {
            series([
                apply(space.add, tuple),
                apply(space.verify, pattern)
            ], (err, res) => {
                expect(err).toNotExist()
                expect(res[1]).toBe(tuple)
                done()
            })
        })

        it('should not match with tuples that are not yet available', function (done) {
            space.verify(pattern, (err, res) => {
                expect(err).toNotExist()
                expect(res).toNotExist()
                done()
            })
        })
    })

    describe('#match(pattern, callback)', function () {
        it('should match with tuples that are already available', function (done) {
            series([
                apply(space.add, tuple),
                apply(space.match, pattern)
            ], (err, res) => {
                expect(err).toNotExist()
                expect(res[1]).toBe(tuple)
                done()
            })
        })

        it('should match with tuples that are not yet available', function (done) {
            setTimeout(() => {
                space.add(tuple, () => {})
            }, 100)

            space.match(pattern, (err, res) => {
                expect(res).toBe(tuple)
                done()
            })
        })
    })

    describe('#createAgent([roles])', function () {
        it('should create an agent able to work on this space', function (done) {
            const agent = space.createAgent()
            agent.out(tuple, (err, added) => {
                expect(err).toNotExist()
                expect(added).toBe(tuple)

                const tuples = space.getTuples()
                expect(tuples.length).toEqual(1)

                done()
            })
        })

        it('should throw if one of the specified roles is not defined for the space', function () {
            space = Space()

            space.addRoles([User])

            expect(() => {
                space.createAgent(Admin)
            }).toThrow()
        })

        it('should allow authorized operations', function (done) {
            space = Space()

            space.addRoles([User, Admin])

            const agent = space.createAgent(Admin)

            series([
                apply(space.add, tuple),
                apply(agent.in, pattern)
            ], (err, res) => {
                expect(err).toNotExist()
                expect(res[1]).toExist()

                const tuples = space.getTuples()
                expect(tuples.length).toBe(0)
                done()
            })
        })

        it('should prevent unauthorized operations', function (done) {
            space.addRoles([User, Admin])

            const agent = space.createAgent(User)

            agent.out(tuple, (err, added) => {
                expect(err).toExist()
                expect(added).toNotExist()

                const tuples = space.getTuples()
                expect(tuples.length).toBe(0)
                done()
            })
        })
    })
})
