'use strict';

function camelToSnakeCase(str) {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

function objectKeysToSnakeCase(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => objectKeysToSnakeCase(item));
  }

  const snakeObj = {};
  for (const [key, value] of Object.entries(obj)) {
    // We don't convert certain keys that we rely on in baseFetcher
    if (key === 'stateName' || key === 'districtName') {
      snakeObj[key] = value;
    } else {
      const snakeKey = camelToSnakeCase(key);
      snakeObj[snakeKey] = objectKeysToSnakeCase(value);
    }
  }
  return snakeObj;
}

module.exports = {
  objectKeysToSnakeCase
};
