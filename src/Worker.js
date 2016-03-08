const VALIDATION_TYPE = 'VALIDATION';
const WILL_REMOVE_TYPE = 'WILL REMOVE';
const DID_REMOVE_TYPE = 'DID REMOVE';
const WILL_ADD_TYPE = 'WILL ADD';
const DID_ADD_TYPE = 'DID ADD';

const TYPES = [
    VALIDATION_TYPE,
    WILL_REMOVE_TYPE,
    DID_REMOVE_TYPE,
    WILL_ADD_TYPE,
    DID_ADD_TYPE
];

const Worker = (type, work) => {
    if (!TYPES.contains(type)) {
        throw new TypeError(type + 'is not a valid worker type.');
    }

    if (!(typeof work === 'function')) {
        throw new TypeError('Expected work to be a function');
    }

    return { type, work };
};

Worker.TYPE = {
    VALIDATION: VALIDATION_TYPE,
    WILL_REMOVE: WILL_REMOVE_TYPE,
    DID_REMOVE: DID_REMOVE_TYPE,
    WILL_ADD: WILL_ADD_TYPE,
    DID_ADD: DID_ADD_TYPE
};

Array.prototype.contains = function (e) {
    return this.indexOf(e) !== -1;
};

module.exports = Worker;
