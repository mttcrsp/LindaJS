/*eslint-disable no-undef,max-nested-callbacks*/

'use strict'

const expect = require('expect')

const Permission = require('../src/Permission')
const Operation = require('../src/Operation')
const Role = require('../src/Role')

describe('Role', function () {
    const tuple = {
        id: 1,
        name: 'Bob'
    }
    const pattern = {
        id: 1,
        name: 'Bob'
    }

    describe('#constructor', function () {
        it('should return a role with the specified permissions', function () {
            const permissions = [
                Permission(Operation.TYPE.OUT, pattern),
                Permission(Operation.TYPE.IN, pattern)
            ]

            const role = Role(permissions)
            expect(
                role.getPermissions().length
            ).toBe(2)
        })

        it('should return a role that inherits permissions from the specified superroles', function () {
            const permissions = [
                Permission(Operation.TYPE.OUT, pattern),
                Permission(Operation.TYPE.IN, pattern)
            ]

            const parentRole = Role(permissions)

            const newPermission = Permission(
                Operation.TYPE.EVAL,
                pattern
            )
            const role = Role([newPermission], [parentRole])
            expect(
                role.getPermissions().length
            ).toBe(3)
        })

        it('should return a role that inherits permissions from multiple parents', function () {
            const write = Permission(Operation.TYPE.OUT, pattern)
            const read = Permission(Operation.TYPE.IN, pattern)

            const parent1 = Role([write])
            const parent2 = Role([read])

            const role = Role([], [parent1, parent2])
            expect(
                role.getPermissions().length
            ).toBe(2)
        })
    })

    describe('#can(operation)', function () {
        it('should return true if the role has a compatible permission', function () {
            const operation = Operation(Operation.TYPE.OUT, tuple)

            const read = Permission(Operation.TYPE.IN, pattern)
            const write = Permission(Operation.TYPE.OUT, pattern)
            const role = Role([read, write])

            expect(
                role.can(operation)
            ).toBe(true)
        })

        it('should return false if the role does have a compatible permission', function () {
            const operation = Operation(Operation.TYPE.OUT, tuple)

            const read = Permission(Operation.TYPE.IN, pattern)
            const role = Role([read])

            expect(
                role.can(operation)
            ).toBe(false)
        })
    })
})
