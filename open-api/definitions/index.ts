// src/code-generation/definitions/index.ts
import { appsDefinitions } from "./apps.ts";
import { authDefinitions } from "./auth.ts";
import { fieldsDefinitions } from "./fields.ts";
import { recordsDefinitions } from "./records.ts";
import { relationshipsDefinitions } from "./relationships.ts";
import { reportsDefinitions } from "./reports.ts";
import { tablesDefinitions } from "./tables.ts";

export const definitions = {
  ...appsDefinitions,
  ...authDefinitions,
  ...fieldsDefinitions,
  ...recordsDefinitions,
  ...relationshipsDefinitions,
  ...reportsDefinitions,
  ...tablesDefinitions,
};
