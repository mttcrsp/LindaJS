/*eslint-disable no-undef,max-nested-callbacks*/

'use strict';

const expect = require('expect');

const Permission = require('../src/Permission');
const Operation = require('../src/Operation');
const Pattern = require('../src/Pattern');
const _ = Pattern.WILDCARD;

describe('Permission', function () {
    describe('constructor', function () {
        it('should thrown an exception if an invalid invalid parameter was provided', function () {
            expect(() => {
                Permission('something', [1]);
            }).toThrow();
        });
    });

    describe('#authorizes', function () {
        it('should return true for compatible operations', function () {
            const write = Operation(Operation.TYPE.OUT, [1]);
            const permission = Permission(
                Operation.TYPE.OUT,
                Pattern(1)
            );
            expect(
                permission.authorizes(write)
            ).toBe(true);
        });

        it('should return false for operations with an incompatible type', function () {
            const write = Operation(Operation.TYPE.OUT, [1]);
            const permission = Permission(
                Operation.TYPE.IN,
                Pattern(1)
            );
            expect(
                permission.authorizes(write)
            ).toBe(false);
        });

        it('should return false for operation with an incompatible operand', function () {
            const read = Operation(Operation.TYPE.IN, Pattern(1));
            const readPermission = Permission(
                Operation.TYPE.IN,
                Pattern(2)
            );
            expect(
                readPermission.authorizes(read)
            ).toBe(false);

            const write = Operation(Operation.TYPE.OUT, [1]);
            const writePermission = Permission(
                Operation.TYPE.OUT,
                Pattern(2)
            );
            expect(
                writePermission.authorizes(write)
            ).toBe(false);
        });

        it('should return true for more specific operations', function () {
            const write = Operation(
                Operation.TYPE.IN,
                Pattern(1)
            );
            const permission = Permission(
                Operation.TYPE.IN,
                Pattern(_)
            );
            expect(
                permission.authorizes(write)
            ).toBe(true);
        });

        it('should return false for more generic operations', function () {
            const write = Operation(
                Operation.TYPE.IN,
                Pattern(_)
            );
            const permission = Permission(
                Operation.TYPE.IN,
                Pattern(1)
            );
            expect(
                permission.authorizes(write)
            ).toBe(false);
        });
    });
});
