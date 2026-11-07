// Simple text splitter utility to replace GSAP SplitText
export class TextSplitter {
  chars: Element[] = [];
  words: Element[] = [];
  lines: Element[] = [];
  elements: Element[] = [];
  selector: string;
  private originalHTML: Map<Element, string> = new Map();
  private lineFrames = new Set<number>();

  constructor(target: string | Element | NodeListOf<Element> | Element[], vars?: { type?: string; linesClass?: string }) {
    const type = vars?.type || "chars,words,lines";
    const linesClass = vars?.linesClass || "split-line";

    // Get elements
    let elements: Element[] = [];
    if (typeof target === "string") {
      elements = Array.from(document.querySelectorAll(target));
    } else if (target instanceof NodeList) {
      elements = Array.from(target);
    } else if (Array.isArray(target)) {
      elements = target;
    } else {
      elements = [target];
    }

    this.selector = typeof target === "string" ? target : "";
    this.elements = elements;

    elements.forEach((element) => {
      // Store original HTML for revert
      this.originalHTML.set(element, element.innerHTML);

      if (type.includes("chars") && type.includes("words")) {
        // Split into words first, then chars
        this.splitWords(element);
        this.splitCharsFromWords(element);
      } else if (type.includes("chars")) {
        this.splitChars(element);
      } else if (type.includes("words")) {
        this.splitWords(element);
      }

      if (type.includes("lines")) {
        this.splitLines(element, linesClass);
      }
    });
  }

  private splitChars(element: Element) {
    const text = element.textContent || "";
    const chars = text.split("");
    
    element.innerHTML = chars
      .map((char) => {
        if (char === " ") {
          return '<span class="split-char split-space">&nbsp;</span>';
        }
        if (char === "\n") {
          return "<br>";
        }
        return `<span class="split-char">${char}</span>`;
      })
      .join("");

    this.chars.push(...Array.from(element.querySelectorAll(".split-char")));
  }

  private splitWords(element: Element) {
    const text = element.textContent || "";
    const words = text.split(/(\s+)/);

    element.innerHTML = words
      .map((word) => {
        if (word.trim().length === 0) {
          return word; // Preserve whitespace
        }
        return `<span class="split-word">${word}</span>`;
      })
      .join("");

    this.words.push(...Array.from(element.querySelectorAll(".split-word")));
  }

  private splitCharsFromWords(element: Element) {
    const words = element.querySelectorAll(".split-word");
    words.forEach((word) => {
      const text = word.textContent || "";
      const chars = text.split("");
      word.innerHTML = chars
        .map((char) => `<span class="split-char">${char}</span>`)
        .join("");
      this.chars.push(...Array.from(word.querySelectorAll(".split-char")));
    });
  }

  private splitLines(element: Element, linesClass: string) {
    // Use requestAnimationFrame to ensure layout is complete
    const frame = requestAnimationFrame(() => {
      this.lineFrames.delete(frame);
      const words = element.querySelectorAll(":scope > .split-word");
      const items = words.length ? words : element.querySelectorAll(":scope > .split-char");
      if (items.length === 0) return;

      let currentLine: Element[] = [];
      const lines: Element[][] = [];
      let currentTop: number | null = null;

      items.forEach((item) => {
        // Layout positions stay stable while GSAP translates or rotates text.
        const top = (item as HTMLElement).offsetTop;
        if (currentTop === null) {
          currentTop = top;
        }

        if (Math.abs(top - currentTop) > 5) {
          // New line
          if (currentLine.length > 0) {
            lines.push([...currentLine]);
          }
          currentLine = [item];
          currentTop = top;
        } else {
          currentLine.push(item);
        }
      });

      if (currentLine.length > 0) {
        lines.push(currentLine);
      }

      // Wrap lines
      lines.forEach((line) => {
        if (line.length === 0) return;
        const lineWrapper = document.createElement("span");
        lineWrapper.className = linesClass;
        lineWrapper.style.display = "block";
        const firstItem = line[0];
        firstItem.parentNode?.insertBefore(lineWrapper, firstItem);
        const lastItem = line[line.length - 1];
        let node: ChildNode | null = firstItem;
        while (node) {
          const next: ChildNode | null = node.nextSibling;
          lineWrapper.appendChild(node);
          if (node === lastItem) break;
          node = next;
        }
      });

      this.lines.push(...Array.from(element.querySelectorAll(`.${linesClass}`)));
    });
    this.lineFrames.add(frame);
  }

  revert() {
    this.lineFrames.forEach((frame) => cancelAnimationFrame(frame));
    this.lineFrames.clear();
    this.elements.forEach((element) => {
      const original = this.originalHTML.get(element);
      const splitItems = [...this.chars, ...this.words];
      // React may have replaced split content with a newer published revision.
      const stillOwnsContent = splitItems.some((item) => element.contains(item));
      if (original !== undefined && (stillOwnsContent || splitItems.length === 0)) {
        element.innerHTML = original;
      }
    });
    this.chars = [];
    this.words = [];
    this.lines = [];
    this.originalHTML.clear();
  }
}
