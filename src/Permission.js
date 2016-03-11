const Operation = require('./Operation');

const Permission = (type, operand) => {
    const types = Object.keys(Operation.TYPE);
    if (types.indexOf(type) === -1) {
        throw new Error('Expected type to be a valid operation type.');
    }

    return {
        authorizes (operation) {
            if (operation.type !== type) {
                return false;
            }

            switch (operation.type) {
                case Operation.TYPE.OUT:
                case Operation.TYPE.EVAL:
                    const match = operand.match(operation.operand);
                    return match !== undefined;
                case Operation.TYPE.IN:
                case Operation.TYPE.RD:
                case Operation.TYPE.INP:
                case Operation.TYPE.RDP:
                    return operand.isSubpattern(operation.operand);
                default:
                    return false;
            }
        }
    };
};

module.exports = Permission;
