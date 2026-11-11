// Web storage that cannot throw. With storage blocked (privacy settings, a sandboxed frame) merely reading
// `window.localStorage` raises a SecurityError, and a full quota makes setItem throw; a read then answers
// null and a write is dropped.
export type SafeStore = Pick<Storage, "getItem" | "setItem">;

export function safeStore(area: () => Storage): SafeStore {
  return {
    getItem(key) {
      try {
        return area().getItem(key);
      } catch {
        return null;
      }
    },
    setItem(key, value) {
      try {
        area().setItem(key, value);
      } catch {
        /* storage is blocked or full: nothing is remembered */
      }
    },
  };
}

export const local: SafeStore = safeStore(() => window.localStorage);
export const session: SafeStore = safeStore(() => window.sessionStorage);
