export const deepClone = (o) => JSON.parse(JSON.stringify(o ?? {}));
export const toKeys = (path) =>
  Array.isArray(path) ? path : path.replace(/\[(\d+)\]/g, '.$1').split('.').filter(Boolean);
export const getAt = (obj, path) =>
  toKeys(path).reduce((a, k) => (a && a[k] !== undefined ? a[k] : undefined), obj);
export const setAt = (obj, path, value) => {
  const keys = toKeys(path);
  const root = deepClone(obj);
  let cur = root;
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    const nextIsIndex = String(+keys[i + 1]) === keys[i + 1];
    if (typeof cur[k] !== 'object' || cur[k] === null) cur[k] = nextIsIndex ? [] : {};
    cur = cur[k];
    if (cur === undefined) break;
  }
  if (cur) cur[keys[keys.length - 1]] = value;
  return root;
};
export const pushAt = (obj, path, item) => {
  const arr = getAt(obj, path);
  const newArr = Array.isArray(arr) ? [...arr, item] : [item];
  return setAt(obj, path, newArr);
};
export const removeAtIndex = (obj, path, idx) => {
  const arr = getAt(obj, path) || [];
  const newArr = arr.filter((_, i) => i !== idx);
  return setAt(obj, path, newArr);
};
