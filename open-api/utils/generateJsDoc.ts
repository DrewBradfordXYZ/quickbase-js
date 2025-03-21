import { ParamDetail, PropertyDetail, JsDocOptions } from "./sharedUtils.ts";

export function generateJsDoc({
  summary,
  opId,
  paramDetails,
  returnType,
  returnTypeDetails,
  docLink,
}: JsDocOptions): string {
  const jsDocLines: string[] = [
    `  /**`,
    `   * ${summary}`,
    `   *`,
    `   * @param {Object} params _Object containing the parameters for_ ${opId}`,
  ];

  // Parameters section (unchanged)
  if (paramDetails.length > 0) {
    paramDetails.forEach((p) => {
      jsDocLines.push(
        `   *   @param {${p.type}} params.${p.name} _${
          p.required ? "Required" : "Optional"
        } parameter with properties_`
      );
      if (p.properties.length > 0) {
        p.properties.forEach((prop) => {
          const propDesc = prop.jsdoc
            ? prop.jsdoc.replace(/@type\s*{[^}]+}\s*@memberof\s*\w+/, "").trim()
            : `Type: ${prop.type}`;
          jsDocLines.push(
            `   *     - **${prop.name}** (\`${prop.type}\`${
              prop.required ? ", required" : ", optional"
            }) _${propDesc}_`
          );
        });
      }
    });
  } else {
    jsDocLines.push(`   *   No parameters`);
  }

  // Returns section with recursive property rendering
  jsDocLines.push(`   *`);
  if (returnTypeDetails.length > 0) {
    jsDocLines.push(
      `   * @returns {Promise<${returnType}>} _Promise resolving to the ${opId} response with properties_`
    );
    const renderProperties = (props: PropertyDetail[], indent: string) => {
      props.forEach((prop) => {
        const propDesc = prop.jsdoc
          ? prop.jsdoc.replace(/@type\s*{[^}]+}\s*@memberof\s*\w+/, "").trim()
          : `Type: ${prop.type}`;
        jsDocLines.push(
          `${indent}*   - **${prop.name}** (\`${prop.type}\`${
            prop.required ? ", required" : ", optional"
          }) _${propDesc}_`
        );
        if (prop.properties && prop.properties.length > 0) {
          renderProperties(prop.properties, `${indent}*     `);
        }
      });
    };
    renderProperties(returnTypeDetails, `   `);
  } else {
    jsDocLines.push(
      `   * @returns {Promise<${returnType}>} _Promise resolving to the ${opId} response_`
    );
  }

  jsDocLines.push(
    `   *`,
    `   * @see {@link ${docLink}} Official Quickbase API documentation`,
    `   */`
  );
  return jsDocLines.join("\n");
}
