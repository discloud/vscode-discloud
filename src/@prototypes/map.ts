Map.prototype.getOrInsert ??= function (key, defaultValue) {
  if (this.has(key)) return this.get(key);

  this.set(key, defaultValue);
  return defaultValue;
};

Map.prototype.getOrInsertComputed ??= function (key, callback) {
  if (this.has(key)) return this.get(key);

  const defaultValue = callback(key);
  this.set(key, defaultValue);
  return defaultValue;
};
