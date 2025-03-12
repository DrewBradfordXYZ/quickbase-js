import { appsPaths } from "./apps.ts";
import { authPaths } from "./auth.ts";
import { fieldsPaths } from "./fields.ts";
import { recordsPaths } from "./records.ts";
import { relationshipsPaths } from "./relationships.ts";
import { reportsPaths } from "./reports.ts";
import { tablesPaths } from "./tables.ts";

export const paths = {
  ...appsPaths,
  ...authPaths,
  ...fieldsPaths,
  ...recordsPaths,
  ...relationshipsPaths,
  ...reportsPaths,
  ...tablesPaths,
};
