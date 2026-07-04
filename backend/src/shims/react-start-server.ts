import { AsyncLocalStorage } from 'async_hooks';

// Stores the standard Request object for the current request
export const requestStorage = new AsyncLocalStorage<Request>();

export function getRequest(): Request | undefined {
  return requestStorage.getStore();
}
