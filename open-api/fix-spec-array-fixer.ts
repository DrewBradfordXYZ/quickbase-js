import { Parameter, Spec } from "./fix-spec-types.ts";

export function fixArraySchemas(spec: Spec): void {
  for (const pathKey in spec.paths) {
    for (const method in spec.paths[pathKey]) {
      const operation = spec.paths[pathKey][method];
      if (operation.parameters) {
        operation.parameters.forEach((param: Parameter) => {
          if (param.schema?.type === "array" && !param.schema.items) {
            console.log(
              `Fixing array schema for ${pathKey}(${method}).${param.name}`
            );
            param.schema.items = { type: "string" };
          }
          if (param.schema?.properties) {
            for (const propKey in param.schema.properties) {
              const prop = param.schema.properties[propKey];
              if (prop.type === "array" && !prop.items) {
                console.log(
                  `Fixing nested array for ${pathKey}(${method}).${param.name}.${propKey}`
                );
                prop.items = { type: "string" };
              }
            }
          }
        });
      }
      if (operation.responses) {
        for (const status in operation.responses) {
          const response = operation.responses[status];
          if (response.schema?.type === "array" && !response.schema.items) {
            console.log(
              `Fixing array schema for ${pathKey}(${method}).responses.${status}`
            );
            response.schema.items = { type: "string" };
          }
          if (response.schema?.properties) {
            for (const propKey in param.schema.properties) {
              const prop = param.schema.properties[propKey];
              if (prop.type === "array" && !prop.items) {
                console.log(
                  `Fixing nested array for ${pathKey}(${method}).responses.${status}.${propKey}`
                );
                prop.items = { type: "string" };
              }
            }
          }
        }
      }
    }
  }

  console.log("Fixing array schemas in definitions...");
  const definitions = spec.definitions || {};
  for (const defKey in definitions) {
    const def = definitions[defKey];
    if (def.properties) {
      for (const propKey in def.properties) {
        const prop = def.properties[propKey];
        if (prop.type === "array" && !prop.items) {
          console.log(`Fixing missing items in ${defKey}.${propKey}`);
          prop.items = { type: "string" };
        }
      }
    }
  }
}
