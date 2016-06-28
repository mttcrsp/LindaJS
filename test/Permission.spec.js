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
      const write = Operation(Operation.TYPE.OUT, tuple)
      const permission = Permission(
        Operation.TYPE.OUT,
        schemata
      )
      expect(
        permission.authorizes(write)
      ).toBe(true)
    })

    it('should return false for operations with an incompatible type', function () {
      const write = Operation(Operation.TYPE.OUT, tuple)
      const permission = Permission(
        Operation.TYPE.IN,
        schemata
      )
      expect(
        permission.authorizes(write)
      ).toBe(false)
    })

    it('should return false for operation with an incompatible operand', function () {
      const read = Operation(Operation.TYPE.IN, schemata)
      const readPermission = Permission(
        Operation.TYPE.IN,
        otherSchemata
      )
      expect(
        readPermission.authorizes(read)
      ).toBe(false)

      const write = Operation(Operation.TYPE.OUT, tuple)
      const writePermission = Permission(
        Operation.TYPE.OUT,
        otherSchemata
      )
      expect(
        writePermission.authorizes(write)
      ).toBe(false)
    })

    it('should return true for more specific operations', function () {
      const write = Operation(
        Operation.TYPE.IN,
        schemata
      )
      const permission = Permission(
        Operation.TYPE.IN,
        genericSchemata
      )
      expect(
        permission.authorizes(write)
      ).toBe(true)
    })

    it('should return false for more generic operations', function () {
      const write = Operation(
        Operation.TYPE.IN,
        genericSchemata
      )
      const permission = Permission(
        Operation.TYPE.IN,
        schemata
      )
      expect(
        permission.authorizes(write)
      ).toBe(false)
    })
  })
})
