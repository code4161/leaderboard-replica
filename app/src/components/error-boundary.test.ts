import { describe, expect, it } from "vitest";
import { boundaryState } from "./error-boundary";

describe("error boundary state", () => {
  it("starts with nothing caught, so children render as they are", () => {
    expect(boundaryState.initial("/")).toEqual({ failed: false, resetKey: "/" });
  });
  it("shows the notice once an error is caught and keeps it on the same route", () => {
    const state = { ...boundaryState.initial("/account/x"), ...boundaryState.caught() };
    expect(state.failed).toBe(true);
    expect(boundaryState.next({ resetKey: "/account/x" }, state)).toBeNull();
  });
  it("clears the error when the route changes", () => {
    const state = { ...boundaryState.initial("/account/x"), ...boundaryState.caught() };
    expect(boundaryState.next({ resetKey: "/" }, state)).toEqual({ failed: false, resetKey: "/" });
  });
});
