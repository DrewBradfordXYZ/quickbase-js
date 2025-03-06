export const simplifyName = (name: string): string =>
  name
    .replace(/ById$/, "")
    .replace(/Api$/, "")
    .replace(/^(\w)/, (_, c) => c.toLowerCase());
