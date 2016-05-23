/*eslint-disable no-undef,max-nested-callbacks*/

const expect = require('expect')
const async = require('async')
const series = async.series
const apply = async.apply

const Store = require('../src/Store')
const _ = require('../src/Matcher').WILDCARD

describe('Store', function () {
    let store

    const tuple = {
        name: 'Matteo',
        age: 23
    }
    const otherTuple = {
        name: 'Christian',
        age: 24
    }
    const schemata = {
        name: _,
        age: _
    }
    const unmatchedSchemata = {
        some: 'thing'
    }

    beforeEach(() => {
        store = Store()
    })

    describe('#constructor(initialTuples)', function () {
        it('should add the specified initial tuples', function (done) {
            const initialTuples = [tuple, otherTuple]
            store = Store(initialTuples)

            store.findAll(schemata, (err, matches) => {
                expect(err).toNotExist()
                expect(matches.length).toBe(2)
                expect(matches[0]).toBe(tuple)
                expect(matches[1]).toBe(otherTuple)
                done()
            })
        })
    })

    describe('#add(tuple, cb)', function () {
        it('should add the tuple', function (done) {
            series({
                add: apply(store.add, tuple),
                find: apply(store.find, schemata)
            }, (err, res) => {
                expect(err).toNotExist()
                expect(res.find).toBe(tuple)
                done()
            })
        })

        it('should add duplicates', function () {
            series({
                firstAdd: apply(store.add, tuple),
                secondAdd: apply(store.add, tuple),
                find: apply(store.findAll, schemata)
            }, (err, res) => {
                expect(err).toNotExist()

                const tuples = res.find
                expect(tuples.length).toBe(2)
                expect(tuples[0]).toBe(tuple)
                expect(tuples[1]).toBe(tuple)

                done()
            })
        })
    })

    describe('#remove(tuple, cb)', function () {
        it('should remove a tuple from the space', function (done) {
            store = Store([tuple])

            series({
                remove: apply(store.remove, tuple),
                find: apply(store.find, tuple)
            }, (err, res) => {
                expect(err).toNotExist()
                expect(res.find).toNotExist()
                done()
            })
        })

        it('should not remove all duplicates of a tuple', function (done) {
            store = Store([tuple, tuple])

            series({
                remove: apply(store.remove, tuple),
                find: apply(store.find, tuple)
            }, (err, res) => {
                expect(err).toNotExist()
                expect(res.find).toBe(tuple)
                done()
            })
        })
    })

    describe('#find(schemata, cb)', function () {
        it('should return the first tuple matching the schemata', function (done) {
            store = Store([tuple])

            store.find(schemata, (err, match) => {
                expect(err).toNotExist()
                expect(match).toBe(tuple)
                done()
            })
        })

        it('should not return anything if no tuples matches the predicate', function (done) {
            store = Store([tuple])

            store.find(unmatchedSchemata, (err, match) => {
                expect(err).toNotExist()
                expect(match).toNotExist()
                done()
            })
        })
    })

    describe('#findAll(schemata, cb)', function () {
        it('should return all the tuples matching the schemata', function (done) {
            const initialTuples = [tuple, otherTuple]
            store = Store(initialTuples)

            store.findAll(schemata, (err, matches) => {
                expect(err).toNotExist()
                expect(matches.length).toBe(2)
                expect(matches[0]).toBe(tuple)
                expect(matches[1]).toBe(otherTuple)
                done()
            })
        })

        it('should return an empty array if no tuple in the space matches the schemata', function (done) {
            const initialTuples = [tuple, otherTuple]
            store = Store(initialTuples)

            store.findAll(unmatchedSchemata, (err, matches) => {
                expect(err).toNotExist()
                expect(matches.length).toBe(0)
                done()
            })
        })
    })
})
