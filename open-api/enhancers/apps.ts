// open-api/enhancers/apps.ts
import { Operation, Parameter, Spec } from "../fix-spec-types.ts";
import { normalizeDefinitionName } from "../fix-spec-utils.ts";

export function enhanceApps(spec: Spec): void {
  for (const pathKey in spec.paths) {
    for (const method in spec.paths[pathKey]) {
      const operation: Operation = spec.paths[pathKey][method];
      if (operation.tags?.includes("Apps")) {
        const opId =
          operation.operationId || `${method}${pathKey.replace(/\W/g, "")}`;
        const requestName = normalizeDefinitionName(`${opId}Request`);
        let properties;

        if (pathKey.includes("/copy") && method === "post") {
          properties = {
            name: { type: "string", description: "The name of the new app." },
            description: {
              type: "string",
              description: "A description for the new app.",
            },
            properties: {
              type: "object",
              properties: {
                keepData: {
                  type: "boolean",
                  description: "Whether to copy data.",
                },
                excludeFiles: {
                  type: "boolean",
                  description: "Whether to exclude files.",
                },
                usersAndRoles: {
                  type: "boolean",
                  description: "Whether to copy users and roles.",
                },
                assignUserToken: {
                  type: "boolean",
                  description: "Whether to assign the user token.",
                },
              },
              description: "Options for customizing the app copy process.",
            },
          };
        } else if (
          !operation.parameters?.find((p) => p.in === "body")?.schema
            ?.properties ||
          Object.keys(
            operation.parameters?.find((p) => p.in === "body")?.schema
              ?.properties || {}
          ).length === 0
        ) {
          console.log(
            `No schema found for ${pathKey}(${method}), defining default`
          );
          properties = {
            name: { type: "string", description: "The name of the app." },
            description: {
              type: "string",
              description: "A description for the app.",
            },
            assignToken: {
              type: "boolean",
              description: "Whether to assign the user token.",
            },
          };
        } else {
          console.log(`Preserving existing schema for ${pathKey}(${method})`);
          properties =
            operation.parameters.find((p) => p.in === "body")?.schema
              ?.properties || {};
        }

        spec.definitions[requestName] = {
          type: "object",
          properties,
          required: Object.keys(properties).filter(
            (key) => key !== "description" && key !== "properties"
          ),
          description: operation.summary || "Request body for app operation",
        };

        const bodyParam = operation.parameters.find((p) => p.in === "body");
        if (bodyParam) {
          bodyParam.schema = { $ref: `#/definitions/${requestName}` };
          console.log(
            `Enhanced Apps schema for ${requestName} in ${pathKey}(${method})`
          );
        }
      }
    }
  }
}
