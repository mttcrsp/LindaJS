/*eslint-disable no-undef,max-nested-callbacks*/

'use strict';

const expect = require('expect');

const Permission = require('../src/Permission');
const Operation = require('../src/Operation');
const _ = require('../src/Pattern').WILDCARD;

describe('Permission', function () {
    const tuple = {
        id: 1,
        name: 'Bob'
    };
    const pattern = {
        id: 1,
        name: 'Bob'
    };
    const otherPattern = {
        id: 2,
        name: 'Alice'
    };
    const genericPattern = {
        id: 1,
        name: _
    };

    describe('constructor', function () {
        it('should thrown an exception if an invalid invalid parameter was provided', function () {
            expect(() => {
                Permission('something', [1]);
            }).toThrow();
        });
    });

    describe('#authorizes', function () {
        it('should return true for compatible operations', function () {
            const write = Operation(Operation.TYPE.OUT, tuple);
            const permission = Permission(
                Operation.TYPE.OUT,
                pattern
            );
            expect(
                permission.authorizes(write)
            ).toBe(true);
        });

        it('should return false for operations with an incompatible type', function () {
            const write = Operation(Operation.TYPE.OUT, tuple);
            const permission = Permission(
                Operation.TYPE.IN,
                pattern
            );
            expect(
                permission.authorizes(write)
            ).toBe(false);
        });

        it('should return false for operation with an incompatible operand', function () {
            const read = Operation(Operation.TYPE.IN, pattern);
            const readPermission = Permission(
                Operation.TYPE.IN,
                otherPattern
            );
            expect(
                readPermission.authorizes(read)
            ).toBe(false);

            const write = Operation(Operation.TYPE.OUT, tuple);
            const writePermission = Permission(
                Operation.TYPE.OUT,
                otherPattern
            );
            expect(
                writePermission.authorizes(write)
            ).toBe(false);
        });

        it('should return true for more specific operations', function () {
            const write = Operation(
                Operation.TYPE.IN,
                pattern
            );
            const permission = Permission(
                Operation.TYPE.IN,
                genericPattern
            );
            expect(
                permission.authorizes(write)
            ).toBe(true);
        });

        it('should return false for more generic operations', function () {
            const write = Operation(
                Operation.TYPE.IN,
                genericPattern
            );
            const permission = Permission(
                Operation.TYPE.IN,
                pattern
            );
            expect(
                permission.authorizes(write)
            ).toBe(false);
        });
    });
});
