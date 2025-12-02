// utils/naming.ts
export function toCamelCase(str: string): string {
  return str
    .replace(/[-_](.)/g, (_, char) => char.toUpperCase())
    .replace(/^./, (str) => str.toLowerCase());
}

export function normalizeDefinitionName(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1);
}
