const Operation = require('./Operation')
const match = require('./Matcher').match

const Permission = (type, operand) => {
  const types = Object.keys(Operation.TYPE)
  if (types.indexOf(type) === -1) {
    throw new Error('Expected type to be a valid operation type.')
  }

  const isSubpattern = (schemata, otherSchemata) => {
    return (
      match(schemata, otherSchemata) !== undefined
    )
  }

  return {
    authorizes (operation) {
      if (operation.type !== type) {
        return false
      }

      switch (operation.type) {
        case Operation.TYPE.OUT:
        case Operation.TYPE.EVAL:
          const result = match(operand, operation.operand)
          return result !== undefined
        case Operation.TYPE.IN:
        case Operation.TYPE.RD:
        case Operation.TYPE.INP:
        case Operation.TYPE.RDP:
        case Operation.TYPE.RDP_ALL:
          return isSubpattern(operand, operation.operand)
        default:
          return false
      }
    }
  }
}

module.exports = Permission
