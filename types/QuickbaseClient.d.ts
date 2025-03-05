// Auto-generated type declarations for QuickbaseClient

export interface QuickbaseMethods {
  copyApp(params: { appId: string, userAgent?: string, generated?: any }): Promise<any>;
  createApp(params: { userAgent?: string, generated?: any }): Promise<any>;
  deleteApp(params: { appId: string, userAgent?: string, generated?: any }): Promise<any>;
  getApp(params: { appId: string, userAgent?: string }): Promise<any>;
  getAppEvents(params: { appId: string, userAgent?: string }): Promise<any>;
  updateApp(params: { appId: string, userAgent?: string, generated?: any }): Promise<any>;
  createField(params: { tableId: string, userAgent?: string, generated?: any }): Promise<any>;
  deleteFields(params: { tableId: string, userAgent?: string, generated?: any }): Promise<any>;
  getField(params: { tableId: string, fieldId: string, includeFieldPerms: boolean, userAgent?: string }): Promise<any>;
  getFieldUsage(params: { tableId: string, fieldId: string, userAgent?: string }): Promise<any>;
  getFields(params: { tableId: string, includeFieldPerms: boolean, userAgent?: string }): Promise<any>;
  getFieldsUsage(params: { tableId: string, skip: number, top: number, userAgent?: string }): Promise<any>;
  updateField(params: { tableId: string, fieldId: string, userAgent?: string, generated?: any }): Promise<any>;
  deleteRecords(params: { userAgent?: string, generated?: any }): Promise<any>;
  runQuery(params: { userAgent?: string, generated?: any }): Promise<any>;
  upsert(params: { userAgent?: string, generated?: any }): Promise<any>;
  createRelationship(params: { tableId: string, userAgent?: string, generated?: any }): Promise<any>;
  createTable(params: { appId: string, userAgent?: string, generated?: any }): Promise<any>;
  deleteRelationship(params: { tableId: string, relationshipId: string, userAgent?: string }): Promise<any>;
  deleteTable(params: { appId: string, tableId: string, userAgent?: string }): Promise<any>;
  getAppTables(params: { appId: string, userAgent?: string }): Promise<any>;
  getRelationships(params: { tableId: string, skip: number, userAgent?: string }): Promise<any>;
  getTable(params: { appId: string, tableId: string, userAgent?: string }): Promise<any>;
  updateRelationship(params: { tableId: string, relationshipId: string, userAgent?: string, generated?: any }): Promise<any>;
  updateTable(params: { appId: string, tableId: string, userAgent?: string, generated?: any }): Promise<any>;
}

export class QuickbaseClient implements QuickbaseMethods {}
