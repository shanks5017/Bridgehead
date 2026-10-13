export function objectKeysToSnakeCase(obj: any): any {
  if (typeof obj !== 'object' || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(objectKeysToSnakeCase);
  const newObj: any = {};
  for (const key of Object.keys(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    newObj[snakeKey] = objectKeysToSnakeCase(obj[key]);
  }
  return newObj;
}
