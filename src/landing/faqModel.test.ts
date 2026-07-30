import { describe, expect, it } from "vitest";
import { toggleFaq } from "./faqModel";

// Initial FAQ state contract (README §7 "Item 0 is open on load"): the Faq
// component seeds useState with { 0: true } — toggleFaq itself is agnostic
// to that seed, but every test below starts from it to match real usage.
const INITIAL: Record<number, boolean> = { 0: true };

describe("toggleFaq", () => {
  it("flips index i without touching other indices", () => {
    const next = toggleFaq(INITIAL, 2);
    expect(next).toEqual({ 0: true, 2: true });
    expect(next[0]).toBe(true);
  });

  it("flips an already-open index closed, leaving others untouched", () => {
    const opened = toggleFaq(INITIAL, 3);
    const closed = toggleFaq(opened, 0);
    expect(closed).toEqual({ 0: false, 3: true });
  });

  it("double-toggling an already-present index returns to the start state", () => {
    const once = toggleFaq(INITIAL, 0);
    const twice = toggleFaq(once, 0);
    expect(twice).toEqual(INITIAL);
  });

  it("double-toggling a fresh index lands back on falsy, matching an untouched index", () => {
    const once = toggleFaq(INITIAL, 1);
    const twice = toggleFaq(once, 1);
    expect(twice[1]).toBeFalsy();
  });

  it("is pure — does not mutate the input state object", () => {
    const before = { ...INITIAL };
    toggleFaq(INITIAL, 4);
    expect(INITIAL).toEqual(before);
  });

  it("returns a new object reference each call", () => {
    const next = toggleFaq(INITIAL, 0);
    expect(next).not.toBe(INITIAL);
  });
});
