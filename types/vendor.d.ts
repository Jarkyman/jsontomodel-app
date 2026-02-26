declare module "date-fns" {
  const dateFns: any;
  export = dateFns;
}

declare module "async_hooks" {
  export class AsyncLocalStorage<T> {
    disable(): void;
    getStore(): T | undefined;
    run<R>(store: T, callback: (...args: any[]) => R, ...args: any[]): R;
    exit<R>(callback: (...args: any[]) => R, ...args: any[]): R;
    enterWith(store: T): void;
  }

  export class AsyncResource {
    constructor(type: string);
    runInAsyncScope<R>(
      callback: (...args: any[]) => R,
      thisArg?: unknown,
      ...args: any[]
    ): R;
    emitDestroy(): void;
  }

  const asyncHooks: {
    AsyncLocalStorage: typeof AsyncLocalStorage;
    AsyncResource: typeof AsyncResource;
  };

  export default asyncHooks;
}

declare module "node:async_hooks" {
  export * from "async_hooks";
  import asyncHooks from "async_hooks";
  export default asyncHooks;
}
