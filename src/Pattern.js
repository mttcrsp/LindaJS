'use strict';

// IDEA: This implementation of the match function is order dependant. It is
// debatable whether this is a good idea or not.
function Pattern () {
    const pattern = Array.prototype.slice.call(arguments);

    return {
        match (tuple) {
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
        }
    };
}

// An object identifier is guaranteed to be unique so it makes for a good
// wildcard object.
Pattern.WILDCARD = new Object();

module.exports = Pattern;
