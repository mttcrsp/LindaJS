// FIXME: Add parameters type checking

const Permission = (operation, pattern) => {
    return { operation, pattern };
};

const Role = (permissions, _superroles) => {
    const superroles = _superroles || [];
    return () => [
        ...superroles.map(role => role()),
        ...permissions
    ];
};

exports = { Permission, Role };
