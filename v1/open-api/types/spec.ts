// open-api/types/spec.ts
export interface Parameter {
  name: string;
  in: string;
  required?: boolean;
  type?: string;
  schema?: {
    type?: string;
    items?: any;
    $ref?: string;
    properties?: any;
    example?: any;
  };
  example?: any;
}

export interface Operation {
  parameters?: Parameter[];
  responses?: Record<
    string,
    { description: string; schema?: any; "x-amf-mediaType"?: string }
  >;
  operationId?: string;
  summary?: string;
  tags?: string[];
}

export interface Spec {
  paths: Record<string, Record<string, Operation>>;
  definitions: Record<string, any>; // Required, no longer optional
  swagger: string;
  info: any;
  operations?: any;
  groups?: any;
  components?: any;
}

export interface FixSpecConfig {
  applyOverrides?: boolean;
  overridePaths?: string[];
  overrideDefinitions?: string[];
}
