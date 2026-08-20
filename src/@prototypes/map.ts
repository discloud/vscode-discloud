Map.prototype.getOrInsert ??= function (key, defaultValue) {
  const value = this.get(key);
  if (value !== undefined) return value;

  this.set(key, defaultValue);
  return defaultValue;
};

Map.prototype.getOrInsertComputed ??= function (key, callback) {
  const value = this.get(key);
  if (value !== undefined) return value;

  const defaultValue = callback(key);
  this.set(key, defaultValue);
  return defaultValue;
};
