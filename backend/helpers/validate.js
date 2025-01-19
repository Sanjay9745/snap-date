module.exports.isNull = (value) => {
    return value === null || value === undefined || value === '' || value === 'null' || value === 'undefined' || value === 'NaN' || value === '0';
}

module.exports.isTruthy = (value) => {
    return value === true || value === 'true' || value === 1 || value === '1';
}