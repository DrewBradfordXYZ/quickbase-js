// src/utils.ts
export function simplifyName(name) {
    return name
        .replace(/ById$/, "")
        .replace(/Api$/, "")
        .replace(/^(\w)/, (_, c) => c.toLowerCase());
}
//# sourceMappingURL=utils.js.map