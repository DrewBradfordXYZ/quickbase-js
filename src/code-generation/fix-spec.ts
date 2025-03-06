#!/usr/bin/env node
import { promises as fs } from "fs";
import path from "path";
import * as glob from "glob";

interface Parameter {
  name: string;
  in: string;
  required?: boolean;
  type?: string;
  schema?: { type?: string; items?: any; $ref?: string };
  example?: any;
}

interface Operation {
  parameters?: Parameter[];
  responses?: Record<string, { description: string; schema?: any }>;
  operationId?: string;
  summary?: string;
  tags?: string[];
}

interface Spec {
  paths: Record<string, Record<string, Operation>>;
  definitions?: Record<string, any>;
  operations?: any;
  groups?: any;
  components?: any;
}

async function fixQuickBaseSpec(): Promise<void> {
  try {
    const CODEGEN_DIR = path.dirname(new URL(import.meta.url).pathname);
    const SPECS_DIR = path.join(CODEGEN_DIR, "..", "specs");
    console.log("Finding latest QuickBase RESTful API spec...");
    const specFiles = glob.sync(
      path.join(SPECS_DIR, "QuickBase_RESTful_*.json")
    );
    if (specFiles.length === 0) {
      console.error(
        "No QuickBase_RESTful_*.json files found in specs/ folder."
      );
      process.exit(1);
    }
    const inputFile = specFiles.sort().pop() as string;
    const outputFile = path.join(CODEGEN_DIR, "quickbase-fixed.json");

    console.log(`Reading ${path.basename(inputFile)} from specs/...`);
    const specContent = await fs.readFile(inputFile, "utf8");
    const spec: Spec = JSON.parse(specContent);

    console.log("Fixing parameters...");
    for (const pathKey in spec.paths) {
      for (const method in spec.paths[pathKey]) {
        const operation = spec.paths[pathKey][method];
        if (operation.parameters) {
          operation.parameters = operation.parameters.map(
            (param: Parameter) => {
              if ("example" in param) delete param.example;
              if ("schema" in param && param.in !== "body") delete param.schema;
              if (!param.type && param.in !== "body") param.type = "string";
              if (
                param.name === "generated" &&
                param.schema?.type === "array" &&
                !param.schema.items
              ) {
                param.schema!.items = { $ref: "#/definitions/Record" };
              }
              return param;
            }
          );
        }
      }
    }

    console.log("Ensuring required endpoints...");
    // Fields endpoints
    spec.paths["/fields"] = spec.paths["/fields"] || {};
    spec.paths["/fields"].get = {
      operationId: "getFields",
      summary: "Get fields for a table",
      tags: ["Fields"],
      parameters: [
        { name: "tableId", in: "query", required: true, type: "string" },
        {
          name: "includeFieldPerms",
          in: "query",
          required: false,
          type: "boolean",
        },
      ],
      responses: {
        200: {
          description: "Success",
          schema: { type: "array", items: { $ref: "#/definitions/Field" } },
        },
      },
    };

    spec.paths["/fields"].post = {
      operationId: "createField",
      summary: "Create a field",
      tags: ["Fields"],
      parameters: [
        { name: "tableId", in: "query", required: true, type: "string" },
        {
          name: "generated",
          in: "body",
          required: true,
          schema: { type: "object" },
        },
      ],
      responses: {
        200: {
          description: "Success",
          schema: { $ref: "#/definitions/CreateField200Response" },
        },
      },
    };

    spec.paths["/fields"].delete = {
      operationId: "deleteFields",
      summary: "Delete fields",
      tags: ["Fields"],
      parameters: [
        { name: "tableId", in: "query", required: true, type: "string" },
        {
          name: "generated",
          in: "body",
          required: true,
          schema: { type: "object" },
        },
      ],
      responses: {
        200: {
          description: "Success",
          schema: { $ref: "#/definitions/DeleteFields200Response" },
        },
      },
    };

    // Tables endpoint
    spec.paths["/tables/{tableId}"] = spec.paths["/tables/{tableId}"] || {};
    spec.paths["/tables/{tableId}"].get = {
      operationId: "getTable",
      summary: "Get table details",
      tags: ["Tables"],
      parameters: [
        { name: "appId", in: "query", required: true, type: "string" },
        { name: "tableId", in: "path", required: true, type: "string" },
      ],
      responses: {
        200: {
          description: "Success",
          schema: { $ref: "#/definitions/Table" },
        },
      },
    };

    // Apps endpoints (overwriting /apps/{appId} entirely)
    spec.paths["/apps/{appId}"] = {
      get: {
        operationId: "getAppById",
        summary: "Get application details by ID",
        tags: ["Apps"],
        parameters: [
          { name: "appId", in: "path", required: true, type: "string" },
        ],
        responses: {
          200: {
            description: "Success",
            schema: { $ref: "#/definitions/App" },
          },
        },
      },
      post: {
        operationId: "updateApp",
        summary: "Update an app",
        tags: ["Apps"],
        parameters: [
          { name: "appId", in: "path", required: true, type: "string" },
          {
            name: "generated",
            in: "body",
            required: true,
            schema: { $ref: "#/definitions/UpdateAppRequest" },
          },
        ],
        responses: {
          200: {
            description: "Success",
            schema: { $ref: "#/definitions/UpdateApp200Response" },
          },
        },
      },
      delete: {
        operationId: "deleteApp",
        summary: "Delete an app",
        tags: ["Apps"],
        parameters: [
          { name: "appId", in: "path", required: true, type: "string" },
          {
            name: "generated",
            in: "body",
            required: true,
            schema: { $ref: "#/definitions/DeleteAppRequest" },
          },
        ],
        responses: {
          200: {
            description: "Success",
            schema: { $ref: "#/definitions/DeleteApp200Response" },
          },
        },
      },
    };

    spec.paths["/apps"] = {
      post: {
        operationId: "createApp",
        summary: "Create an app",
        tags: ["Apps"],
        parameters: [
          {
            name: "generated",
            in: "body",
            required: true,
            schema: { $ref: "#/definitions/CreateAppRequest" },
          },
        ],
        responses: {
          200: {
            description: "Success",
            schema: { $ref: "#/definitions/CreateApp200Response" },
          },
        },
      },
    };

    spec.paths["/apps/{appId}/copy"] = {
      post: {
        operationId: "copyApp",
        summary: "Copy an app",
        tags: ["Apps"],
        parameters: [
          { name: "appId", in: "path", required: true, type: "string" },
          {
            name: "generated",
            in: "body",
            required: true,
            schema: { $ref: "#/definitions/CopyAppRequest" },
          },
        ],
        responses: {
          200: {
            description: "Success",
            schema: { $ref: "#/definitions/CopyApp200Response" },
          },
        },
      },
    };

    spec.paths["/apps/{appId}/events"] = {
      get: {
        operationId: "getAppEvents",
        summary: "Get app events",
        tags: ["Apps"],
        parameters: [
          { name: "appId", in: "path", required: true, type: "string" },
        ],
        responses: {
          200: {
            description: "Success",
            schema: { type: "array", items: { type: "object" } },
          },
        },
      },
    };

    // Records endpoint
    spec.paths["/records"] = spec.paths["/records"] || {};
    spec.paths["/records"].post = {
      operationId: "upsert",
      summary: "Upsert records",
      tags: ["Records"],
      parameters: [
        {
          name: "generated",
          in: "body",
          required: true,
          schema: { type: "object" },
        },
      ],
      responses: {
        200: {
          description: "Success",
          schema: { $ref: "#/definitions/Upsert200Response" },
        },
      },
    };

    console.log("Adding definitions...");
    if (!spec.definitions) spec.definitions = {};
    spec.definitions.Field = {
      type: "object",
      properties: { id: { type: "integer" }, label: { type: "string" } },
    };
    spec.definitions.Table = {
      type: "object",
      properties: { id: { type: "string" }, name: { type: "string" } },
      required: ["id", "name"],
    };
    spec.definitions.App = {
      type: "object",
      properties: { id: { type: "string" }, name: { type: "string" } },
      required: ["id", "name"],
    };
    spec.definitions.Record = { type: "object", additionalProperties: true };
    spec.definitions.CreateField200Response = {
      type: "object",
      properties: { id: { type: "integer" } },
    };
    spec.definitions.DeleteFields200Response = {
      type: "object",
      properties: { deleted: { type: "boolean" } },
    };
    spec.definitions.Upsert200Response = {
      type: "object",
      properties: { metadata: { type: "object" } },
    };
    spec.definitions.CopyAppRequest = {
      type: "object",
      properties: { name: { type: "string" } },
    };
    spec.definitions.CopyApp200Response = {
      type: "object",
      properties: { id: { type: "string" } },
    };
    spec.definitions.CreateAppRequest = {
      type: "object",
      properties: { name: { type: "string" } },
    };
    spec.definitions.CreateApp200Response = {
      type: "object",
      properties: { id: { type: "string" } },
    };
    spec.definitions.DeleteAppRequest = {
      type: "object",
      properties: { name: { type: "string" } },
    };
    spec.definitions.DeleteApp200Response = {
      type: "object",
      properties: { deleted: { type: "boolean" } },
    };
    spec.definitions.UpdateAppRequest = {
      type: "object",
      properties: { name: { type: "string" } },
    };
    spec.definitions.UpdateApp200Response = {
      type: "object",
      properties: { id: { type: "string" } },
    };

    console.log("Removing unexpected top-level attributes...");
    delete spec.operations;
    delete spec.groups;
    delete spec.components;

    console.log(`Writing fixed spec to ${path.basename(outputFile)}...`);
    await fs.writeFile(outputFile, JSON.stringify(spec, null, 2), "utf8");
    console.log("Spec fixed successfully!");
  } catch (error) {
    console.error("Failed to fix spec:", error);
    process.exit(1);
  }
}

fixQuickBaseSpec();
