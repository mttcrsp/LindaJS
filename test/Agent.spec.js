/*eslint-disable no-undef,max-nested-callbacks*/

'use strict'

const expect = require('expect')

const Space = require('./TestSpace')

describe('Agent', function () {
    let space
    let agent

    const tuple = {
        id: 1,
        name: 'Bob'
    }
    const invalidTuple = {
        invalid: true
    }

    const schemata = {
        id: 1,
        name: 'Bob'
    }

    const activeTuple = {
        value: 1,
        func: cb => cb(undefined, 'something')
    }

    beforeEach(function () {
        space = Space()
        space.addValidator((t, cb) => {
            if (t.invalid === true) {
                return cb(new Error('Invalid tuple'))
            }
            cb()
        })
        agent = space.createAgent()
    })

    it('should not be able to operate on the space while blocked', function (done) {
        // Given that the space is empty this operation should block the agent
        agent.in(schemata, () => {})

        agent.out(tuple, err => {
            expect(err).toExist()
            done()
        })
    })

    describe('#out(tuple, callback)', function () {
        it('should add a tuple to the space', function (done) {
            agent.out(tuple, err => {
                expect(err).toNotExist()

                const tuples = space.getTuples()
                expect(tuples.length).toEqual(1)

                done()
            })
        })

        it('should not be able to add an invalid tuple to the space', function (done) {
            agent.out(invalidTuple, err => {
                expect(err).toExist()

                const tuples = space.getTuples()
                expect(tuples.length).toEqual(0)

                done()
            })
        })
    })

    describe('#rd(schemata, callback)', function () {
        it('should return a tuple if the tuple is already in the space without removing it', function (done) {
            space = Space([tuple])
            agent = space.createAgent()

            agent.rd(schemata, (err, match) => {
                expect(err).toNotExist()
                expect(match).toBe(tuple)
                done()
            })
        })

        it('should return a tuple also when the tuple is added later to the space', function (done) {
            setTimeout(() => {
                space.add(tuple, () => {})
            }, 100)

            agent.rd(schemata, (err, res) => {
                expect(err).toNotExist()
                expect(res).toBe(tuple)
                done()
            })
        })
    })

    describe('#in(schemata, callback)', function () {
        it('should return a tuple if the tuple is already in the space and then delete it', function (done) {
            space = Space([tuple])
            agent = space.createAgent()

            agent.in(schemata, (err, res) => {
                expect(err).toNotExist()
                expect(res).toBe(tuple)

                const tuples = space.getTuples()
                expect(tuples.length).toEqual(0)

                done()
            })
        })

        it('should return a tuple and delete it from the space also when the tuple is added at a later moment', function (done) {
            setTimeout(() => {
                space.add(tuple, () => {})
            }, 100)

            agent.in(schemata, (err, res) => {
                expect(err).toNotExist()
                expect(res).toBe(tuple)

                const tuples = space.getTuples()
                expect(tuples.length).toEqual(0)

                done()
            })
        })
    })

    describe('#inp(schemata, callback)', function () {
        it('should return a tuple if the tuple is already in the space and then delete it', function (done) {
            space = Space([tuple])
            agent = space.createAgent()

            agent.inp(schemata, (err, res) => {
                expect(err).toNotExist()
                expect(res).toBe(tuple)

                const tuples = space.getTuples()
                expect(tuples.length).toEqual(0)

                done()
            })
        })

        it('should not return a tuple if the tuple is not in the space and is added at a later moment', function (done) {
            setTimeout(() => {
                space.add(tuple, () => {})
            }, 100)

            agent.inp(schemata, (err, res) => {
                expect(err).toNotExist()
                expect(res).toNotExist()
                done()
            })
        })
    })

    describe('#rdp(schemata, callback)', function () {
        it('should return a tuple if the tuple is already in the space', function (done) {
            space = Space([tuple])
            agent = space.createAgent()

            agent.rdp(schemata, (err, res) => {
                expect(err).toNotExist()
                expect(res).toBe(tuple)

                const tuples = space.getTuples()
                expect(tuples.length).toEqual(1)

                done()
            })
        })

        it('should not return a tuple if the tuple is not in the space and is added at a later moment', function (done) {
            setTimeout(() => {
                space.add(tuple, () => {})
            }, 100)

            agent.rdp(schemata, (err, res) => {
                expect(err).toNotExist()
                expect(res).toNotExist()
                done()
            })
        })
    })

    describe('#rdpAll(schemata, callback)', function () {
        it('should return all of the tuple matching the schemata that are currently in the space', function (done) {
            space = Space([tuple, tuple])
            agent = space.createAgent()

            agent.rdpAll(schemata, (err, res) => {
                expect(err).toNotExist()
                expect(res.length).toBe(2)
                expect(res[0]).toBe(tuple)
                expect(res[1]).toBe(tuple)
                done()
            })
        })
    })

    describe('#eval(activeTuple, callback)', function () {
        it('should evaluate and add an active tuple to the space', function (done) {
            agent.eval(activeTuple, (err, passiveTuple) => {
                expect(err).toNotExist()

                expect(passiveTuple.value).toEqual(1)
                expect(passiveTuple.func).toEqual('something')

                const tuples = space.getTuples()
                expect(tuples[0].value).toEqual(1)
                expect(tuples[0].func).toEqual('something')

                done()
            })
        })

        it('should work asynchronously', function (done) {
            agent.eval(activeTuple, (err, passiveTuple) => {
                expect(err).toNotExist()
                expect(passiveTuple).toExist()
                done()
            })

            const tuples = space.getTuples()
            expect(tuples.length).toEqual(0)
        })
    })
})
