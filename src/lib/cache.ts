// A very simple singleton in-memory cache.
// This Map instance will be shared across the client-side application,
// persisting between page navigations.
export const cache = new Map<string, any>();
