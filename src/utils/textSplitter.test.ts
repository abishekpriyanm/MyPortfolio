import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TextSplitter } from "./textSplitter";

describe("TextSplitter line layout", () => {
  let frames: Map<number, FrameRequestCallback>;
  let nextFrame: number;

  beforeEach(() => {
    frames = new Map();
    nextFrame = 0;
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      frames.set(++nextFrame, callback);
      return nextFrame;
    });
    vi.stubGlobal("cancelAnimationFrame", (id: number) => frames.delete(id));
  });

  afterEach(() => {
    document.body.replaceChildren();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  function flushFrames() {
    const pending = [...frames.values()];
    frames.clear();
    pending.forEach((callback) => callback(0));
  }

  function paragraph(text: string) {
    const element = document.createElement("p");
    element.textContent = text;
    document.body.append(element);
    return element;
  }

  it("cancels old line wrapping when text is rebuilt before the next frame", () => {
    const element = paragraph("About Me");
    const previous = new TextSplitter(element, { type: "chars,lines" });
    previous.revert();
    new TextSplitter(element, { type: "chars,lines" });
    flushFrames();

    expect(element.querySelectorAll(".split-line")).toHaveLength(1);
    expect(element.querySelector(".split-line .split-line")).toBeNull();
  });

  it("groups by layout position, ignoring animated character transforms", () => {
    const element = paragraph("About");
    const splitter = new TextSplitter(element, { type: "chars,lines" });
    splitter.chars.forEach((char, index) => {
      Object.defineProperty(char, "offsetTop", { value: 0 });
      vi.spyOn(char, "getBoundingClientRect").mockReturnValue(new DOMRect(0, 80 + index * 10, 20, 20));
    });
    flushFrames();

    expect(element.querySelectorAll(".split-line")).toHaveLength(1);
    expect(element.textContent).toBe("About");
  });

  it("preserves spaces when words move into their line wrappers", () => {
    const element = paragraph("Build useful software");
    new TextSplitter(element, { type: "words,lines" });
    flushFrames();

    expect(element.textContent).toBe("Build useful software");
    expect(element.querySelector(".split-line")?.textContent).toBe("Build useful software");
  });

  it("does not overwrite newer React content when an old split is reverted", () => {
    const element = paragraph("Old draft");
    const previous = new TextSplitter(element, { type: "words,lines" });
    element.textContent = "Published revision";
    previous.revert();
    flushFrames();

    expect(element.textContent).toBe("Published revision");
  });
});
