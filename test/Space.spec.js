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
const InspectableStore = require('./InspectableStore')

describe('Space', function() {
    let space
    let store

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

    const schemata = {
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
        store = InspectableStore()
        space = Space(store)
        space.addValidator(t => t.invalid !== true)
    })

    describe('#constructor(store)', function () {
        it('should set itself up with the provided store', function () {
            const store = { // eslint-disable-line no-shadow
                getTuples () {
                    return [tuple]
                },
                add () { },
                remove () { },
                find () { }
            }
            space = Space(store)

            const tuples = store.getTuples()
            expect(tuples).toExist()
            expect(tuples.length).toBe(1)
            expect(tuples[0]).toBe(tuple)
        })

        it('should default to an in memory store if no store was provided', function (done) {
            space = Space()

            series([
                apply(space.add, tuple),
                apply(space.search, schemata),
                apply(space.remove, tuple),
                apply(space.search, schemata)
            ], (err, res) => {
                expect(err).toNotExist()
                expect(res[0]).toExist()
                expect(res[1]).toExist()
                expect(res[2]).toExist()
                expect(res[3]).toNotExist()
                done()
            })
        })

        it('should should throw an error if the provided store is not compatible', function () {
            expect(() => {
                Space([])
            }).toThrow()
        })
    })

    describe('#add(tuple, cb)', function () {
        it('should add tuples', function (done) {
            series([
                apply(space.add, tuple),
                apply(space.add, otherTuple)
            ], err => {
                expect(err).toNotExist()

                const tuples = store.getTuples()
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

                const tuples = store.getTuples()
                expect(tuples[0]).toBe(tuple)
                expect(tuples[1]).toBe(tuple)
                expect(tuples.length).toBe(2)
                done()
            })
        })

        it('should throw an error if the tuple is invalid and not add it to the space', function (done) {
            space.add(invalidTuple, err => {
                expect(err).toExist()

                const tuples = store.getTuples()
                expect(tuples.length).toBe(0)
                done()
            })
        })
    })

    describe('#remove(tuple)', function () {
        it('should remove tuples', function (done) {
            store = InspectableStore([tuple, otherTuple])
            space = Space(store)

            space.remove(tuple, err => {
                expect(err).toNotExist()

                const tuples = store.getTuples()
                expect(tuples[0]).toEqual(otherTuple)
                done()
            })
        })

        it('should remove duplicated tuples only once', function (done) {
            store = InspectableStore([tuple, tuple])
            space = Space(store)

            space.remove(tuple, err => {
                expect(err).toNotExist()

                const tuples = store.getTuples()
                expect(tuples.length).toEqual(1)
                done()
            })
        })
    })


    describe('#search(schemata, callback)', function () {
        it('should match with tuples that are already available', function (done) {
            store = InspectableStore([tuple])
            space = Space(store)

            space.search(schemata, (err, res) => {
                expect(err).toNotExist()
                expect(res).toBe(tuple)
                done()
            })
        })

        it('should not match with tuples that are not yet available', function (done) {
            space.search(schemata, (err, res) => {
                expect(err).toNotExist()
                expect(res).toNotExist()
                done()
            })
        })
    })

    describe('#searchUntilFound(schemata, callback)', function () {
        it('should match with tuples that are already available', function (done) {
            store = InspectableStore([tuple])
            space = Space(store)

            space.searchUntilFound(schemata, (err, res) => {
                expect(err).toNotExist()
                expect(res).toBe(tuple)
                done()
            })
        })

        it('should match with tuples that are not yet available', function (done) {
            setTimeout(() => {
                space.add(tuple, () => {})
            }, 100)

            space.searchUntilFound(schemata, (err, res) => {
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

                const tuples = store.getTuples()
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
                apply(agent.in, schemata)
            ], (err, res) => {
                expect(err).toNotExist()
                expect(res[1]).toExist()

                const tuples = store.getTuples()
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

                const tuples = store.getTuples()
                expect(tuples.length).toBe(0)
                done()
            })
        })
    })
})
