export function isPlainObject(value: any): value is Record<string, any> {
  return Object.prototype.toString.call(value) === '[object Object]';
}

export function pickBy<T extends Record<string, any>>(obj: T, predicate: (value: any, key: string) => boolean): Partial<T> {
  const result: Partial<T> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (predicate(val, key)) {
      (result as any)[key] = val;
    }
  }
  return result;
}

export function size(value: any): number {
  if (Array.isArray(value) || typeof value === 'string') return value.length;
  if (isPlainObject(value)) return Object.keys(value).length;
  return 0;
}

export function values<T>(obj: Record<string, T>): T[] {
  return Object.values(obj);
}

export function get(obj: any, path: string | Array<string | number>): any {
  const parts = Array.isArray(path) ? path : String(path).split('.');
  let current = obj;
  for (const part of parts) {
    if (current == null) return undefined;
    current = current[part as any];
  }
  return current;
}

export function isEqual(a: any, b: any): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function groupBy<T>(array: T[], iteratee: string | ((item: T) => string | number)): Record<string, T[]> {
  const getKey = typeof iteratee === 'function' ? iteratee : (item: T) => String(get(item as any, iteratee));
  return array.reduce<Record<string, T[]>>((acc, item) => {
    const key = String(getKey(item));
    (acc[key] ||= []).push(item);
    return acc;
  }, {});
}

export function orderBy<T>(array: T[], iteratee: string | ((item: T) => any), orders: ('asc' | 'desc')[] = ['asc']): T[] {
  const getValue = typeof iteratee === 'function' ? iteratee : (item: T) => get(item as any, iteratee);
  const order = orders[0] ?? 'asc';
  return [...array].sort((a, b) => {
    const va = getValue(a);
    const vb = getValue(b);
    if (va < vb) return order === 'asc' ? -1 : 1;
    if (va > vb) return order === 'asc' ? 1 : -1;
    return 0;
  });
}

export function flattenDeep(arr: any[]): any[] {
  const result: any[] = [];
  for (const item of arr) {
    if (Array.isArray(item)) {
      result.push(...flattenDeep(item));
    } else {
      result.push(item);
    }
  }
  return result;
}

export function pick<T extends Record<string, any>, K extends keyof T>(obj: T, keys: readonly K[]): Pick<T, K> {
  const result: Partial<T> = {};
  for (const key of keys) {
    if (key in obj) {
      (result as any)[key] = obj[key];
    }
  }
  return result as Pick<T, K>;
}

export function omit<T extends Record<string, any>, K extends keyof T>(obj: T, keys: readonly K[]): Omit<T, K> {
  const result: Record<string, any> = { ...obj };
  for (const key of keys) {
    delete result[key as string];
  }
  return result as Omit<T, K>;
}

export function isEmpty(value: any): boolean {
  if (Array.isArray(value) || typeof value === 'string') return value.length === 0;
  if (isPlainObject(value)) return Object.keys(value).length === 0;
  return !value;
}

export function every<T>(arr: T[], predicate: (item: T) => boolean): boolean {
  return arr.every(predicate);
}

export function some<T>(arr: T[], predicate: (item: T) => boolean): boolean {
  return arr.some(predicate);
}

export function map<T, U>(arr: T[], iteratee: (item: T) => U): U[] {
  return arr.map(iteratee);
}

export function filter<T>(arr: T[], predicate: (item: T) => boolean): T[] {
  return arr.filter(predicate);
}

export function sampleSize<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

export function take<T>(arr: T[], n: number): T[] {
  return arr.slice(0, n);
}

export function transform<T extends Record<string, any>, R>(obj: T, iteratee: (result: R, value: any, key: string) => void, accumulator: R): R {
  for (const [key, val] of Object.entries(obj)) {
    iteratee(accumulator, val, key);
  }
  return accumulator;
}
