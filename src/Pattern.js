'use strict';

function Pattern () {
    this._pattern = Array.prototype.slice.call(arguments);
}

// An object identifier is guaranteed to be unique so it makes for a good
// wildcard object.
Pattern.WILDCARD = new Object();

// IDEA: This implementation of the match function is order dependant. It is
// debatable whether this is a good idea or not.
Pattern.prototype.match = function (tuple) {
    const pattern = this._pattern;

    if (tuple.length !== pattern.length) {
        return undefined;
    }

    for (let i = 0; i < pattern.length; i++) {
        const componentsDontMatch = pattern[i] !== tuple[i];
        const isNotWildcard = pattern[i] !== Pattern.WILDCARD;
        if (componentsDontMatch && isNotWildcard) {
            return undefined;
        }
    }

    return tuple;
};

module.exports = Pattern;
