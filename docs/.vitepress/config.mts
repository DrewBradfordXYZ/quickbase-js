// docs/.vitepress/config.mjs
import { defineConfig } from "vitepress";
import apiDocs from "../../docs-data/api-docs.json";

export default defineConfig({
  title: "quickbase-js API Docs",
  description: "Documentation for quickbase-js library",
  base: "/", // Adjust to your repo name
  themeConfig: {
    nav: [
      {
        text: "GitHub",
        link: "https://github.com/DrewBradfordXYZ/quickbase-js/tree/main",
      },
    ],
    sidebar: [
      {
        text: "API Methods",
        items: apiDocs.map((method) => ({
          text: method.name,
          link: `#${method.name}`,
        })),
      },
    ],
  },
});
