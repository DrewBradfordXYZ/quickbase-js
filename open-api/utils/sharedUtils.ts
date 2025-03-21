import { OpenAPIV2 } from "openapi-types";
import { join } from "path"; // Correct import from 'path', not 'fs'

export interface PropertyDetail {
  name: string;
  type: string;
  required: boolean;
  jsdoc?: string;
  properties?: PropertyDetail[];
}

export interface ParamDetail {
  name: string;
  type: string;
  required: boolean;
  properties: PropertyDetail[];
}
