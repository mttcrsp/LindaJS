'use strict';

// Lindas pattern matching implementation are not always described as typed as
// we saw during during course classes, I decided not to go for a typed
// pattern  matching to keep the implementation lightweight and leave more
// freedom to users of the library. Given the lack of a good type system in
// Javascript a strictly typed matching would be a huge pain to use.
function Pattern (descriptor) {
    const keys = Object.keys(descriptor);
    return {
        match (tuple) {
            const tupleKeys = Object.keys(tuple);
            if (keys.length !== tupleKeys.length) {
                return undefined;
            }

            for (let i = 0; i < keys.length; i++) {
                const key = keys[i];
                const elementsDontMatch = descriptor[key] !== tuple[key];
                const isNotWildcard = descriptor[key] !== Pattern.WILDCARD;
                if (elementsDontMatch && isNotWildcard) {
                    return undefined;
                }
            }

            return tuple;
        },
        isSubpattern (otherPattern) {
            return (
                otherPattern.match(descriptor) !== undefined
            );
        }
    };
}

// An object identifier is guaranteed to be unique so it makes for a good
// wildcard object.
Pattern.WILDCARD = new Object();

module.exports = Pattern;
