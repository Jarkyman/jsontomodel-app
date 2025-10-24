class SimpleAsyncLocalStorage<T> {
  private _currentStore: T | undefined;
  private _enterStore: T | undefined;
  private _enabled = true;

  getStore(): T | undefined {
    return this._currentStore ?? this._enterStore;
  }

  disable(): void {
    this._enabled = false;
    this._currentStore = undefined;
    this._enterStore = undefined;
  }

  enable(): void {
    this._enabled = true;
  }

  enterWith(store: T): void {
    if (!this._enabled) {
      return;
    }
    this._enterStore = store;
    this._currentStore = store;
  }

  run<R>(store: T, callback: (...args: any[]) => R, ...args: any[]): R {
    if (!this._enabled) {
      return callback(...args);
    }
    const previousStore = this._currentStore;
    this._currentStore = store;
    try {
      return callback(...args);
    } finally {
      this._currentStore = previousStore;
    }
  }

  exit<R>(callback: (...args: any[]) => R, ...args: any[]): R {
    const previousStore = this._currentStore;
    this._currentStore = undefined;
    try {
      return callback(...args);
    } finally {
      this._currentStore = previousStore;
    }
  }

  static snapshot(): never {
    throw new Error("AsyncLocalStorage.snapshot is not implemented in this polyfill.");
  }
}

const AsyncLocalStorage: typeof SimpleAsyncLocalStorage =
  (globalThis as unknown as { AsyncLocalStorage?: typeof SimpleAsyncLocalStorage })
    ?.AsyncLocalStorage ?? SimpleAsyncLocalStorage;

class AsyncResource {
  readonly type: string;

  constructor(type: string) {
    this.type = type;
  }

  runInAsyncScope<T>(
    fn: (...args: any[]) => T,
    thisArg: unknown = undefined,
    ...args: any[]
  ): T {
    return fn.apply(thisArg, args);
  }

  emitDestroy(): void {
    // No-op placeholder to satisfy interface expectations.
  }
}

const asyncHooks = {
  AsyncLocalStorage,
  AsyncResource,
};

export { AsyncLocalStorage, AsyncResource };
export default asyncHooks;
