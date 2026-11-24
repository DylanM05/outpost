// Compact ES2022 + TypeScript utility standard library declarations for fast,
// offline in-browser strict TypeScript typechecking inside Web Workers & Vitest.
export const LIB_DTS = `
/// <reference no-default-lib="true"/>

type PropertyKey = string | number | symbol;

interface Symbol {
  readonly description: string | undefined;
  toString(): string;
  valueOf(): symbol;
}

interface SymbolConstructor {
  readonly prototype: Symbol;
  (description?: string | number): symbol;
  readonly iterator: unique symbol;
  readonly asyncIterator: unique symbol;
  readonly toStringTag: unique symbol;
}
declare var Symbol: SymbolConstructor;

interface IteratorYieldResult<TYield> {
  done?: false;
  value: TYield;
}
interface IteratorReturnResult<TReturn> {
  done: true;
  value: TReturn;
}
type IteratorResult<T, TReturn = any> = IteratorYieldResult<T> | IteratorReturnResult<TReturn>;

interface Iterator<T, TReturn = any, TNext = undefined> {
  next(...args: [] | [TNext]): IteratorResult<T, TReturn>;
  return?(value?: TReturn): IteratorResult<T, TReturn>;
  throw?(e?: any): IteratorResult<T, TReturn>;
}

interface Iterable<T> {
  [Symbol.iterator](): Iterator<T>;
}

interface IterableIterator<T> extends Iterator<T> {
  [Symbol.iterator](): IterableIterator<T>;
}

interface AsyncIterator<T, TReturn = any, TNext = undefined> {
  next(...args: [] | [TNext]): Promise<IteratorResult<T, TReturn>>;
  return?(value?: TReturn | PromiseLike<TReturn>): Promise<IteratorResult<T, TReturn>>;
  throw?(e?: any): Promise<IteratorResult<T, TReturn>>;
}

interface AsyncIterable<T> {
  [Symbol.asyncIterator](): AsyncIterator<T>;
}

interface AsyncIterableIterator<T> extends AsyncIterator<T> {
  [Symbol.asyncIterator](): AsyncIterableIterator<T>;
}

interface Object {
  constructor: Function;
  toString(): string;
  valueOf(): Object;
  hasOwnProperty(v: PropertyKey): boolean;
}

interface PropertyDescriptor {
  configurable?: boolean;
  enumerable?: boolean;
  value?: any;
  writable?: boolean;
  get?(): any;
  set?(v: any): void;
}

interface ObjectConstructor {
  new (value?: any): Object;
  (value?: any): any;
  readonly prototype: Object;
  keys(o: object): string[];
  values<T>(o: { [s: string]: T } | ArrayLike<T>): T[];
  values(o: {}): any[];
  entries<T>(o: { [s: string]: T } | ArrayLike<T>): [string, T][];
  entries(o: {}): [string, any][];
  fromEntries<T = any>(entries: Iterable<readonly [PropertyKey, T]>): { [k: string]: T };
  assign<T extends {}, U>(target: T, source: U): T & U;
  assign<T extends {}, U, V>(target: T, source1: U, source2: V): T & U & V;
  assign(target: object, ...sources: any[]): any;
  freeze<T extends Function>(f: T): T;
  freeze<T extends { [idx: string]: any }>(o: T): Readonly<T>;
  freeze<T>(o: T): Readonly<T>;
  is(value1: any, value2: any): boolean;
  hasOwn(o: object, v: PropertyKey): boolean;
  create(o: object | null): any;
  getPrototypeOf(o: any): any;
}
declare var Object: ObjectConstructor;

interface Function {
  apply(this: Function, thisArg: any, argArray?: any): any;
  call(this: Function, thisArg: any, ...argArray: any[]): any;
  bind(this: Function, thisArg: any, ...argArray: any[]): any;
  readonly length: number;
  readonly name: string;
}

interface CallableFunction extends Function {}
interface NewableFunction extends Function {}
interface IArguments {
  [index: number]: any;
  length: number;
}

interface ArrayLike<T> {
  readonly length: number;
  readonly [n: number]: T;
}

interface TemplateStringsArray extends ReadonlyArray<string> {
  readonly raw: readonly string[];
}

interface String {
  readonly length: number;
  charAt(pos: number): string;
  charCodeAt(index: number): number;
  concat(...strings: string[]): string;
  indexOf(searchString: string, position?: number): number;
  lastIndexOf(searchString: string, position?: number): number;
  includes(searchString: string, position?: number): boolean;
  startsWith(searchString: string, position?: number): boolean;
  endsWith(searchString: string, endPosition?: number): boolean;
  slice(start?: number, end?: number): string;
  substring(start: number, end?: number): string;
  split(separator: string | RegExp, limit?: number): string[];
  toLowerCase(): string;
  toUpperCase(): string;
  trim(): string;
  trimStart(): string;
  trimEnd(): string;
  padStart(maxLength: number, fillString?: string): string;
  padEnd(maxLength: number, fillString?: string): string;
  repeat(count: number): string;
  replace(searchValue: string | RegExp, replaceValue: string): string;
  replace(searchValue: string | RegExp, replacer: (substring: string, ...args: any[]) => string): string;
  replaceAll(searchValue: string | RegExp, replaceValue: string): string;
  match(matcher: string | RegExp): RegExpMatchArray | null;
  at(index: number): string | undefined;
  localeCompare(that: string): number;
  [Symbol.iterator](): IterableIterator<string>;
  readonly [index: number]: string;
}

interface StringConstructor {
  new (value?: any): String;
  (value?: any): string;
  fromCharCode(...codes: number[]): string;
}
declare var String: StringConstructor;

interface Boolean {
  valueOf(): boolean;
}
interface BooleanConstructor {
  new (value?: any): Boolean;
  <T>(value?: T): boolean;
}
declare var Boolean: BooleanConstructor;

interface Number {
  toString(radix?: number): string;
  toFixed(fractionDigits?: number): string;
  toPrecision(precision?: number): string;
  valueOf(): number;
}
interface NumberConstructor {
  new (value?: any): Number;
  (value?: any): number;
  readonly MAX_SAFE_INTEGER: number;
  readonly MIN_SAFE_INTEGER: number;
  readonly POSITIVE_INFINITY: number;
  readonly NEGATIVE_INFINITY: number;
  readonly NaN: number;
  isFinite(number: unknown): boolean;
  isInteger(number: unknown): boolean;
  isNaN(number: unknown): boolean;
  parseFloat(string: string): number;
  parseInt(string: string, radix?: number): number;
}
declare var Number: NumberConstructor;
declare var NaN: number;
declare var Infinity: number;
declare function parseInt(string: string, radix?: number): number;
declare function parseFloat(string: string): number;
declare function isNaN(number: number): boolean;
declare function isFinite(number: number): boolean;

interface Math {
  readonly PI: number;
  readonly E: number;
  abs(x: number): number;
  ceil(x: number): number;
  floor(x: number): number;
  round(x: number): number;
  trunc(x: number): number;
  max(...values: number[]): number;
  min(...values: number[]): number;
  pow(x: number, y: number): number;
  sqrt(x: number): number;
  log(x: number): number;
  log2(x: number): number;
  sign(x: number): number;
  random(): number;
}
declare var Math: Math;

interface RegExpMatchArray extends Array<string> {
  index?: number;
  input?: string;
  groups?: { [key: string]: string };
}
interface RegExpExecArray extends Array<string> {
  index: number;
  input: string;
  groups?: { [key: string]: string };
}
interface RegExp {
  exec(string: string): RegExpExecArray | null;
  test(string: string): boolean;
  readonly source: string;
  readonly flags: string;
  lastIndex: number;
}
interface RegExpConstructor {
  new (pattern: RegExp | string, flags?: string): RegExp;
  (pattern: RegExp | string, flags?: string): RegExp;
}
declare var RegExp: RegExpConstructor;

interface Date {
  getTime(): number;
  toISOString(): string;
  toString(): string;
  valueOf(): number;
}
interface DateConstructor {
  new (): Date;
  new (value: number | string | Date): Date;
  now(): number;
  parse(s: string): number;
}
declare var Date: DateConstructor;

interface ReadonlyArray<T> {
  readonly length: number;
  readonly [n: number]: T;
  toString(): string;
  concat(...items: (T | ReadonlyArray<T>)[]): T[];
  join(separator?: string): string;
  slice(start?: number, end?: number): T[];
  indexOf(searchElement: T, fromIndex?: number): number;
  lastIndexOf(searchElement: T, fromIndex?: number): number;
  includes(searchElement: T, fromIndex?: number): boolean;
  every<S extends T>(predicate: (value: T, index: number, array: readonly T[]) => value is S): this is readonly S[];
  every(predicate: (value: T, index: number, array: readonly T[]) => unknown): boolean;
  some(predicate: (value: T, index: number, array: readonly T[]) => unknown): boolean;
  forEach(callbackfn: (value: T, index: number, array: readonly T[]) => void): void;
  map<U>(callbackfn: (value: T, index: number, array: readonly T[]) => U): U[];
  filter<S extends T>(predicate: (value: T, index: number, array: readonly T[]) => value is S): S[];
  filter(predicate: (value: T, index: number, array: readonly T[]) => unknown): T[];
  reduce(callbackfn: (previousValue: T, currentValue: T, currentIndex: number, array: readonly T[]) => T): T;
  reduce(callbackfn: (previousValue: T, currentValue: T, currentIndex: number, array: readonly T[]) => T, initialValue: T): T;
  reduce<U>(callbackfn: (previousValue: U, currentValue: T, currentIndex: number, array: readonly T[]) => U, initialValue: U): U;
  find<S extends T>(predicate: (value: T, index: number, obj: readonly T[]) => value is S): S | undefined;
  find(predicate: (value: T, index: number, obj: readonly T[]) => unknown): T | undefined;
  findIndex(predicate: (value: T, index: number, obj: readonly T[]) => unknown): number;
  flatMap<U>(callback: (value: T, index: number, array: readonly T[]) => U | ReadonlyArray<U>): U[];
  flat<A, D extends number = 1>(this: A, depth?: D): any[];
  at(index: number): T | undefined;
  entries(): IterableIterator<[number, T]>;
  keys(): IterableIterator<number>;
  values(): IterableIterator<T>;
  [Symbol.iterator](): IterableIterator<T>;
}

interface Array<T> {
  length: number;
  [n: number]: T;
  toString(): string;
  push(...items: T[]): number;
  pop(): T | undefined;
  shift(): T | undefined;
  unshift(...items: T[]): number;
  concat(...items: (T | ReadonlyArray<T>)[]): T[];
  join(separator?: string): string;
  reverse(): T[];
  slice(start?: number, end?: number): T[];
  splice(start: number, deleteCount?: number, ...items: T[]): T[];
  sort(compareFn?: (a: T, b: T) => number): this;
  indexOf(searchElement: T, fromIndex?: number): number;
  lastIndexOf(searchElement: T, fromIndex?: number): number;
  includes(searchElement: T, fromIndex?: number): boolean;
  every<S extends T>(predicate: (value: T, index: number, array: T[]) => value is S): this is S[];
  every(predicate: (value: T, index: number, array: T[]) => unknown): boolean;
  some(predicate: (value: T, index: number, array: T[]) => unknown): boolean;
  forEach(callbackfn: (value: T, index: number, array: T[]) => void): void;
  map<U>(callbackfn: (value: T, index: number, array: T[]) => U): U[];
  filter<S extends T>(predicate: (value: T, index: number, array: T[]) => value is S): S[];
  filter(predicate: (value: T, index: number, array: T[]) => unknown): T[];
  reduce(callbackfn: (previousValue: T, currentValue: T, currentIndex: number, array: T[]) => T): T;
  reduce(callbackfn: (previousValue: T, currentValue: T, currentIndex: number, array: T[]) => T, initialValue: T): T;
  reduce<U>(callbackfn: (previousValue: U, currentValue: T, currentIndex: number, array: T[]) => U, initialValue: U): U;
  find<S extends T>(predicate: (value: T, index: number, obj: T[]) => value is S): S | undefined;
  find(predicate: (value: T, index: number, obj: T[]) => unknown): T | undefined;
  findIndex(predicate: (value: T, index: number, obj: T[]) => unknown): number;
  flatMap<U>(callback: (value: T, index: number, array: T[]) => U | ReadonlyArray<U>): U[];
  flat<D extends number = 1>(depth?: D): any[];
  fill(value: T, start?: number, end?: number): this;
  at(index: number): T | undefined;
  entries(): IterableIterator<[number, T]>;
  keys(): IterableIterator<number>;
  values(): IterableIterator<T>;
  [Symbol.iterator](): IterableIterator<T>;
}

interface ArrayConstructor {
  new <T>(arrayLength?: number): T[];
  new <T>(...items: T[]): T[];
  isArray(arg: any): arg is any[];
  from<T>(iterable: Iterable<T> | ArrayLike<T>): T[];
  from<T, U>(iterable: Iterable<T> | ArrayLike<T>, mapfn: (v: T, k: number) => U): U[];
  of<T>(...items: T[]): T[];
}
declare var Array: ArrayConstructor;

interface Map<K, V> {
  readonly size: number;
  clear(): void;
  delete(key: K): boolean;
  forEach(callbackfn: (value: V, key: K, map: Map<K, V>) => void): void;
  get(key: K): V | undefined;
  has(key: K): boolean;
  set(key: K, value: V): this;
  entries(): IterableIterator<[K, V]>;
  keys(): IterableIterator<K>;
  values(): IterableIterator<V>;
  [Symbol.iterator](): IterableIterator<[K, V]>;
}
interface MapConstructor {
  new <K, V>(entries?: readonly (readonly [K, V])[] | null): Map<K, V>;
  new <K, V>(iterable?: Iterable<readonly [K, V]> | null): Map<K, V>;
}
declare var Map: MapConstructor;

interface ReadonlyMap<K, V> {
  readonly size: number;
  forEach(callbackfn: (value: V, key: K, map: ReadonlyMap<K, V>) => void): void;
  get(key: K): V | undefined;
  has(key: K): boolean;
  entries(): IterableIterator<[K, V]>;
  keys(): IterableIterator<K>;
  values(): IterableIterator<V>;
  [Symbol.iterator](): IterableIterator<[K, V]>;
}

interface Set<T> {
  readonly size: number;
  add(value: T): this;
  clear(): void;
  delete(value: T): boolean;
  forEach(callbackfn: (value: T, value2: T, set: Set<T>) => void): void;
  has(value: T): boolean;
  entries(): IterableIterator<[T, T]>;
  keys(): IterableIterator<T>;
  values(): IterableIterator<T>;
  [Symbol.iterator](): IterableIterator<T>;
}
interface SetConstructor {
  new <T = any>(values?: readonly T[] | Iterable<T> | null): Set<T>;
}
declare var Set: SetConstructor;

interface ReadonlySet<T> {
  readonly size: number;
  forEach(callbackfn: (value: T, value2: T, set: ReadonlySet<T>) => void): void;
  has(value: T): boolean;
  entries(): IterableIterator<[T, T]>;
  keys(): IterableIterator<T>;
  values(): IterableIterator<T>;
  [Symbol.iterator](): IterableIterator<T>;
}

interface WeakMap<K extends object, V> {
  delete(key: K): boolean;
  get(key: K): V | undefined;
  has(key: K): boolean;
  set(key: K, value: V): this;
}
declare var WeakMap: { new <K extends object = object, V = any>(): WeakMap<K, V> };

interface WeakSet<T extends object> {
  add(value: T): this;
  delete(value: T): boolean;
  has(value: T): boolean;
}
declare var WeakSet: { new <T extends object = object>(): WeakSet<T> };

interface PromiseLike<T> {
  then<TResult1 = T, TResult2 = never>(
    onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null,
  ): PromiseLike<TResult1 | TResult2>;
}

interface PromiseFulfilledResult<T> {
  status: "fulfilled";
  value: T;
}
interface PromiseRejectedResult {
  status: "rejected";
  reason: any;
}
type PromiseSettledResult<T> = PromiseFulfilledResult<T> | PromiseRejectedResult;

interface Promise<T> {
  then<TResult1 = T, TResult2 = never>(
    onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null,
  ): Promise<TResult1 | TResult2>;
  catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): Promise<T | TResult>;
  finally(onfinally?: (() => void) | undefined | null): Promise<T>;
}
interface PromiseConstructor {
  new <T>(executor: (resolve: (value: T | PromiseLike<T>) => void, reject: (reason?: any) => void) => void): Promise<T>;
  resolve(): Promise<void>;
  resolve<T>(value: T | PromiseLike<T>): Promise<Awaited<T>>;
  reject<T = never>(reason?: any): Promise<T>;
  all<T extends readonly unknown[] | []>(values: T): Promise<{ -readonly [P in keyof T]: Awaited<T[P]> }>;
  all<T>(values: Iterable<T | PromiseLike<T>>): Promise<Awaited<T>[]>;
  allSettled<T>(values: Iterable<T | PromiseLike<T>>): Promise<PromiseSettledResult<Awaited<T>>[]>;
  race<T>(values: Iterable<T | PromiseLike<T>>): Promise<Awaited<T>>;
}
declare var Promise: PromiseConstructor;

interface Error {
  name: string;
  message: string;
  stack?: string;
}
interface ErrorConstructor {
  new (message?: string): Error;
  (message?: string): Error;
}
declare var Error: ErrorConstructor;
declare var TypeError: ErrorConstructor;
declare var RangeError: ErrorConstructor;
declare var SyntaxError: ErrorConstructor;
declare var ReferenceError: ErrorConstructor;

interface JSON {
  parse(text: string): any;
  stringify(value: any, replacer?: any, space?: string | number): string;
}
declare var JSON: JSON;

interface Console {
  log(...data: any[]): void;
  info(...data: any[]): void;
  warn(...data: any[]): void;
  error(...data: any[]): void;
  debug(...data: any[]): void;
}
declare var console: Console;

declare function setTimeout(handler: (...args: any[]) => void, timeout?: number, ...args: any[]): any;
declare function clearTimeout(id?: any): void;
declare function encodeURIComponent(uriComponent: string | number | boolean): string;
declare function decodeURIComponent(encodedURIComponent: string): string;

// Standard TypeScript Utility Types
type Awaited<T> = T extends null | undefined
  ? T
  : T extends object & { then(onfulfilled: infer F, ...args: infer _): any }
    ? F extends (value: infer V, ...args: infer _) => any
      ? Awaited<V>
      : never
    : T;
type Partial<T> = { [P in keyof T]?: T[P] };
type Required<T> = { [P in keyof T]-?: T[P] };
type Readonly<T> = { readonly [P in keyof T]: T[P] };
type Pick<T, K extends keyof T> = { [P in K]: T[P] };
type Record<K extends keyof any, T> = { [P in K]: T };
type Exclude<T, U> = T extends U ? never : T;
type Extract<T, U> = T extends U ? T : never;
type Omit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>;
type NonNullable<T> = T & {};
type Parameters<T extends (...args: any) => any> = T extends (...args: infer P) => any ? P : never;
type ConstructorParameters<T extends abstract new (...args: any) => any> = T extends abstract new (...args: infer P) => any ? P : never;
type ReturnType<T extends (...args: any) => any> = T extends (...args: any) => infer R ? R : any;
type InstanceType<T extends abstract new (...args: any) => any> = T extends abstract new (...args: any) => infer R ? R : any;
type Uppercase<S extends string> = intrinsic;
type Lowercase<S extends string> = intrinsic;
type Capitalize<S extends string> = intrinsic;
type Uncapitalize<S extends string> = intrinsic;
type NoInfer<T> = intrinsic;
`;
