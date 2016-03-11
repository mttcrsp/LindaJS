'use strict';

const _ = require('lodash');

const Role = (_permissions, _superroles) => {
    const superroles = _superroles || [];
    const permissions = [
        ..._permissions,
        ..._.flatMap(superroles, role => role.getPermissions())
    ];
    return {
        getPermissions () {
            return permissions;
        },
        can (operation) {
            return _.some(
                permissions,
                permission => permission.authorizes(operation)
            );
        }
    };
};

module.exports = Role;
