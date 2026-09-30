function camelToSnake(obj) {
  if (typeof obj !== 'object' || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(camelToSnake);
  return Object.keys(obj).reduce((acc, key) => {
    const snakeKey = key.replace(/[A-Z]/g, letter => \`_\${letter.toLowerCase()}\`);
    acc[snakeKey] = camelToSnake(obj[key]);
    return acc;
  }, {});
}
console.log(camelToSnake({ stateName: 'Delhi', casesFiled: 100, weatherCondition: { isRaining: true } }));
