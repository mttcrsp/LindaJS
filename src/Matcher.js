'use strict'

// An object identifier is guaranteed to be unique so it makes for a good
// wildcard object.
const WILDCARD = new Object()

// Lindas pattern matching implementation are not always described as typed as
// we saw during during course classes, I decided not to go for a typed pattern
// matching to keep the implementation lightweight and leave more freedom to
// users of the library. Given the lack of a good type system in Javascript a
// strictly typed matching would be a huge pain to use.
const match = (schemata, tuple) => {
    const keys = Object.keys(schemata)
    const tupleKeys = Object.keys(tuple)
    if (keys.length !== tupleKeys.length) {
        return undefined
    }

    for (let i = 0; i < keys.length; i++) {
        const key = keys[i]
        const elementsDontMatch = schemata[key] !== tuple[key]
        const isNotWildcard = schemata[key] !== WILDCARD
        if (elementsDontMatch && isNotWildcard) {
            return undefined
        }
    }

    return tuple
}

module.exports = {
    WILDCARD,
    match
}
