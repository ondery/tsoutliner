/**
 * Demo JavaScript / JSX-style module for TS Outliner.
 */
export function greet(name) {
  return `Hello, ${name}`;
}

export class Counter {
  constructor(initial = 0) {
    this.value = initial;
  }

  increment() {
    this.value += 1;
    return this.value;
  }
}

export const add = (a, b) => a + b;
