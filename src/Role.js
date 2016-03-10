'use strict';

// FIXME: Add parameters type checking

const Permission = (type, pattern) => {
    const types = Object.keys(Permission.TYPES);
    for (let i = 0; i < types.length; i++) {
        if (type === types[i]) {
            return { type, pattern };
        }
    }
    throw new TypeError('Expected operationType to be a valid operation type.');
};

Permission.TYPES = {
    IN: 'IN',
    OUT: 'OUT',
    EVAL: 'EVAL'
};

const Role = (permissions, _superroles) => {
    const superroles = _superroles || [];
    return () => [
        ...superroles.map(role => role()),
        ...permissions
    ];
};

exports = { Permission, Role };
