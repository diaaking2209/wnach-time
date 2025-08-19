/**
 * A simple, in-memory, singleton cache.
 * This is used to store data fetched from Supabase to avoid re-fetching on navigation.
 * The cache is cleared on a full page reload.
 */
class Cache {
  private store = new Map<string, any>();

  get<T>(key: string): T | undefined {
    return this.store.get(key);
  }

  set<T>(key: string, value: T): void {
    this.store.set(key, value);
  }

  has(key: string): boolean {
    return this.store.has(key);
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

// Export a single instance to be used throughout the app
export const cache = new Cache();

    