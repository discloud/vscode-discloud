export default function lazy<Value, Params extends unknown[] = unknown[]>(cb: (...args: Params) => Value): (...args: Params) => Value {
  let value: Value;
  return (...args: Params) => value ??= cb(...args);
}
