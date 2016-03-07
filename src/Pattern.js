'use strict';

// Lindas pattern matching implementation are not always described as typed as
// we saw during during course classes, I decided not to go for a typed
// pattern  matching to keep the implementation lightweight and leave more
// freedom to users of the library. Given the lack of a good type system in
// Javascript a strictly typed matching would be a huge pain to use.
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
