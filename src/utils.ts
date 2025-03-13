// src/utils.ts
export function simplifyName(name: string): string {
  return name
    .replace(/ById$/, "")
    .replace(/Api$/, "")
    .replace(/^(\w)/, (_, c) => c.toLowerCase());
}
