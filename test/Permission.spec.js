/*eslint-disable no-undef,max-nested-callbacks*/

'use strict'

const expect = require('expect')

const Permission = require('../src/Permission')
const Operation = require('../src/Operation')
const _ = require('../src/Matcher').WILDCARD

describe('Permission', function () {
  const tuple = {
    id: 1,
    name: 'Bob'
  }
  const schemata = {
    id: 1,
    name: 'Bob'
  }
  const otherSchemata = {
    id: 2,
    name: 'Alice'
  }
  const genericSchemata = {
    id: 1,
    name: _
  }

  describe('constructor', function () {
    it('should thrown an exception if an invalid invalid parameter was provided', function () {
      expect(() => {
        Permission('something', [1])
      }).toThrow()
    })
  })

  describe('#authorizes', function () {
    it('should return true for compatible operations', function () {
      const write = Operation(Operation.TYPE.WRITE, tuple)
      const permission = Permission(
        Operation.TYPE.WRITE,
        schemata
      )
      expect(
        permission.authorizes(write)
      ).toBe(true)
    })

    it('should return false for operations with an incompatible type', function () {
      const write = Operation(Operation.TYPE.WRITE, tuple)
      const permission = Permission(
        Operation.TYPE.TAKE,
        schemata
      )
      expect(
        permission.authorizes(write)
      ).toBe(false)
    })

    it('should return false for operation with an incompatible operand', function () {
      const read = Operation(Operation.TYPE.TAKE, schemata)
      const readPermission = Permission(
        Operation.TYPE.TAKE,
        otherSchemata
      )
      expect(
        readPermission.authorizes(read)
      ).toBe(false)

      const write = Operation(Operation.TYPE.WRITE, tuple)
      const writePermission = Permission(
        Operation.TYPE.WRITE,
        otherSchemata
      )
      expect(
        writePermission.authorizes(write)
      ).toBe(false)
    })

    it('should return true for more specific operations', function () {
      const write = Operation(
        Operation.TYPE.TAKE,
        schemata
      )
      const permission = Permission(
        Operation.TYPE.TAKE,
        genericSchemata
      )
      expect(
        permission.authorizes(write)
      ).toBe(true)
    })

    it('should return false for more generic operations', function () {
      const write = Operation(
        Operation.TYPE.TAKE,
        genericSchemata
      )
      const permission = Permission(
        Operation.TYPE.TAKE,
        schemata
      )
      expect(
        permission.authorizes(write)
      ).toBe(false)
    })
  })
})
