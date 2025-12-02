// schema/tags/apps.ts
import { Operation, Parameter, Spec } from "../../types/spec.ts";
import { normalizeDefinitionName } from "../../utils/naming.ts";

export function enhanceApps(
  spec: Spec,
  pathKey: string,
  method: string,
  operation: Operation
): void {
  const opId =
    operation.operationId || `${method}${pathKey.replace(/\W/g, "")}`;
  if (operation.parameters && operation.tags?.includes("Apps")) {
    operation.parameters.forEach((param: Parameter) => {
      if (param.in === "body") {
        if (!param.schema) param.schema = {};
        let requestName =
          param.schema.$ref?.split("/").pop() || `${opId}Request`;
        requestName = normalizeDefinitionName(requestName);

        if (
          !spec.definitions[requestName] ||
          !spec.definitions[requestName].type ||
          Object.keys(spec.definitions[requestName]?.properties || {})
            .length === 0
        ) {
          console.log(
            `Defining schema for ${requestName} in ${pathKey}(${method})`
          );
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
          } else {
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
          }
          spec.definitions[requestName] = {
            type: "object",
            properties,
            required: Object.keys(properties).filter(
              (key) => key !== "description" && key !== "properties"
            ),
            description: operation.summary || `Request body for ${opId}`,
          };
        }
        param.schema = { $ref: `#/definitions/${requestName}` };
        console.log(
          `Ensured ${requestName} in definitions for ${pathKey}(${method})`
        );
      }
    });
  }
}
