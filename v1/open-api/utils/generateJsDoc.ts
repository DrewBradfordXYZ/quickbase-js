#!/usr/bin/env node

import { ParamDetail, PropertyDetail, JsDocOptions } from "./sharedUtils.ts";
import { getPropertyDescription } from "./sharedUtils.ts";

export function generateJsDoc({
  summary,
  opId,
  paramDetails,
  returnType,
  returnTypeDetails,
  docLink,
}: JsDocOptions): string {
  const jsDocLines: string[] = [`  /**`, `   * ${summary}`, `   *`];

  if (paramDetails.length > 0) {
    jsDocLines.push(
      `   * @param {Object} params - Object containing the parameters for ${opId}.`
    );
    paramDetails.forEach((p) => {
      const paramDesc = p.description || "No description provided.";
      const optionalMark = p.required ? "" : " (Optional)";
      jsDocLines.push(
        `   * @param {${p.type}} ${p.required ? "" : "["}params.${p.name}${
          p.required ? "" : "]"
        } - ${paramDesc}${optionalMark}`
      );
      if (p.properties.length > 0) {
        p.properties.forEach((prop) => {
          const propDesc = getPropertyDescription(prop);
          jsDocLines.push(
            `   *   - **${prop.name}** (\`${prop.type}\`, ${
              prop.required ? "required" : "optional"
            }) - ${propDesc}`
          );
        });
      }
    });
  } else {
    jsDocLines.push(`   * No parameters.`);
  }

  jsDocLines.push(`   *`);
  if (returnTypeDetails.length > 0) {
    jsDocLines.push(
      `   * @returns {Promise<${returnType}>} - Promise resolving to the ${opId} response.`
    );
    const renderProperties = (props: PropertyDetail[], indent: string) => {
      props.forEach((prop) => {
        const propDesc = getPropertyDescription(prop);
        jsDocLines.push(
          `${indent}*   - **${prop.name}** (\`${prop.type}\`, ${
            prop.required ? "required" : "optional"
          }) - ${propDesc}`
        );
        if (prop.properties && prop.properties.length > 0) {
          renderProperties(prop.properties, `${indent}*     `);
        }
      });
    };
    renderProperties(returnTypeDetails, `   `);
  } else {
    jsDocLines.push(
      `   * @returns {Promise<${returnType}>} - Promise resolving to the ${opId} response.`
    );
  }

  jsDocLines.push(
    `   *`,
    `   * @see ${docLink} - Official Quickbase API documentation`
  );
  jsDocLines.push(`   */`);
  return jsDocLines.join("\n");
}
