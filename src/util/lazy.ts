export function lazy<Value>(cb: () => Value): () => Value {
  let value: Value;
  return () => value ??= cb();
}
