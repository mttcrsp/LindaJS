const Pattern = require('./Pattern');

const Permission = (operation, pattern) => {
    if (pattern.prototype === 'Pattern') {
        throw new TypeError('Expected pattern to be a Pattern object.');
    }
    return { operation, pattern };
};

const Role = (superroles, permissions) => {
    if (superroles.every(role => role.prototype === 'role')) {
        throw new TypeError('Expected superroles to be an array of Role ' +
        'objects.');
    }
    return [
        ...superroles.map(role => role()),
        ...permissions
    ];
};

Array.prototype.every = function (predicate) {
    for (let i = 0; i < this.length; i++) {
        if (!predicate(this[i])) {
            return false;
        }
    }
    return true;
};

module.exports = Role;
