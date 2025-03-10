// Generated on 2025-03-10T05:25:52.099Z
import { App, CreateApp200Response, CreateAppRequest, DeleteTableResponse, Field, GetTempTokenDBID200Response, Record, ReportRunResponse, Table, UpdateTableRequest, Upsert200Response, Upsert207Response, UpsertRequest } from "../generated/models";

export interface QuickbaseClient {
  createApp: (params: { body: CreateAppRequest }) => Promise<CreateApp200Response>;
  getApp: (params: { appId: string }) => Promise<App>;
  getAppEvents: (params: { appId: string }) => Promise<any[]>;
  copyApp: (params: { appId: string; generated?: any }) => Promise<{ [key: string]: any }>;
  getAppTables: (params: { appId: string }) => Promise<Table[]>;
  getTable: (params: { tableId: string; appId: string }) => Promise<Table>;
  updateTable: (params: { tableId: string; appId: string; body: UpdateTableRequest }) => Promise<Table>;
  deleteTable: (params: { tableId: string; appId: string }) => Promise<DeleteTableResponse>;
  getRelationships: (params: { skip?: number; tableId: string }) => Promise<{ [key: string]: any }>;
  createRelationship: (params: { tableId: string; generated?: any }) => Promise<{ [key: string]: any }>;
  updateRelationship: (params: { tableId: string; relationshipId: any; generated?: any }) => Promise<{ [key: string]: any }>;
  deleteRelationship: (params: { tableId: string; relationshipId: any }) => Promise<{ [key: string]: any }>;
  getTableReports: (params: { tableId: string }) => Promise<any[]>;
  getReport: (params: { tableId: string; reportId: string }) => Promise<{ [key: string]: any }>;
  runReport: (params: { reportId: string; generated: any }) => Promise<ReportRunResponse[]>;
  getFields: (params: { tableId: string; includeFieldPerms?: boolean }) => Promise<Field[]>;
  getField: (params: { tableId: string; includeFieldPerms?: boolean; fieldId: number }) => Promise<{ [key: string]: any }>;
  updateField: (params: { tableId: string; fieldId: number; generated?: any }) => Promise<{ [key: string]: any }>;
  getFieldsUsage: (params: { tableId: string; skip?: number; top?: number }) => Promise<any[]>;
  getFieldUsage: (params: { tableId: string; fieldId: number }) => Promise<any[]>;
  runFormula: (params: { generated?: any }) => Promise<{ [key: string]: any }>;
  upsert: (params: { body: UpsertRequest }) => Promise<Upsert200Response | Upsert207Response>;
  upsertRecords: (params: { generated: { [key: string]: string }[] }) => Promise<Upsert200Response[] | Upsert207Response[]>;
  getTempTokenDBID: (params: { dbid: string }) => Promise<GetTempTokenDBID200Response>;
  exchangeSsoToken: (params: { generated?: any }) => Promise<{ [key: string]: any }>;
  cloneUserToken: (params: { generated?: any }) => Promise<{ [key: string]: any }>;
  transferUserToken: (params: { generated?: any }) => Promise<{ [key: string]: any }>;
  deactivateUserToken: (params: {  }) => Promise<{ [key: string]: any }>;
  deleteUserToken: (params: {  }) => Promise<{ [key: string]: any }>;
  downloadFile: (params: { tableId: string; recordId: number; fieldId: number; versionNumber: number }) => Promise<any>;
  deleteFile: (params: { tableId: string; recordId: number; fieldId: number; versionNumber: number }) => Promise<{ [key: string]: any }>;
  getUsers: (params: { accountId?: any; generated?: { [key: string]: any } }) => Promise<{ [key: string]: any }>;
  denyUsers: (params: { accountId?: any; generated?: string[] }) => Promise<{ [key: string]: any }>;
  denyUsersAndGroups: (params: { accountId?: any; shouldDeleteFromGroups: boolean; generated?: string[] }) => Promise<{ [key: string]: any }>;
  undenyUsers: (params: { accountId?: any; generated?: string[] }) => Promise<{ [key: string]: any }>;
  addMembersToGroup: (params: { gid: any; generated?: string[] }) => Promise<{ [key: string]: any }>;
  removeMembersFromGroup: (params: { gid: any; generated?: string[] }) => Promise<{ [key: string]: any }>;
  addManagersToGroup: (params: { gid: any; generated?: string[] }) => Promise<{ [key: string]: any }>;
  removeManagersFromGroup: (params: { gid: any; generated?: string[] }) => Promise<{ [key: string]: any }>;
  addSubgroupsToGroup: (params: { gid: any; generated?: string[] }) => Promise<{ [key: string]: any }>;
  removeSubgroupsFromGroup: (params: { gid: any; generated?: string[] }) => Promise<{ [key: string]: any }>;
  audit: (params: { generated?: any }) => Promise<{ [key: string]: any }>;
  platformAnalyticReads: (params: { day?: string }) => Promise<{ [key: string]: any }>;
  platformAnalyticEventSummaries: (params: { accountId?: any; generated?: any }) => Promise<any>;
  exportSolution: (params: { solutionId: string; qBLVersion?: string }) => Promise<any>;
  updateSolution: (params: { solutionId: string; generated?: any; xQBLErrorsAsSuccess?: boolean }) => Promise<any>;
  createSolution: (params: { generated?: any; xQBLErrorsAsSuccess?: boolean }) => Promise<any>;
  exportSolutionToRecord: (params: { solutionId: string; tableId: string; fieldId: number; xQBLErrorsAsSuccess?: boolean; qBLVersion?: string }) => Promise<any>;
  createSolutionFromRecord: (params: { tableId: string; fieldId: number; recordId: number; xQBLErrorsAsSuccess?: boolean }) => Promise<any>;
  updateSolutionToRecord: (params: { solutionId: string; tableId: string; fieldId: number; recordId: number; xQBLErrorsAsSuccess?: boolean }) => Promise<any>;
  changesetSolution: (params: { solutionId: string; generated?: any; xQBLErrorsAsSuccess?: boolean }) => Promise<any>;
  changesetSolutionFromRecord: (params: { solutionId: string; tableId: string; fieldId: number; recordId: number; xQBLErrorsAsSuccess?: boolean }) => Promise<any>;
  generateDocument: (params: { templateId: any; tableId: string; recordId?: any; filename: string; accept?: string; format?: string; margin?: string; unit?: string; pageSize?: string; orientation?: string; realm?: string }) => Promise<{ [key: string]: any }>;
}
