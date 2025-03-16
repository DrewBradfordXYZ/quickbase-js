// Generated on 2025-03-16T19:44:00.741Z
import { AddManagersToGroup200Response, AddManagersToGroupRequest, AddMembersToGroup200Response, AddMembersToGroupRequest, AddSubgroupsToGroup200Response, AddSubgroupsToGroupRequest, Audit200Response, ChangesetSolution200Response, ChangesetSolutionFromRecord200Response, CloneUserToken200Response, CopyApp200Response, CopyAppRequest, CreateApp200Response, CreateAppRequest, CreateField200Response, CreateFieldRequest, CreateRelationship200Response, CreateSolution200Response, CreateSolutionFromRecord200Response, CreateTable200Response, CreateTableRequest, DeactivateUserToken200Response, DeleteApp200Response, DeleteAppRequest, DeleteFields200Response, DeleteFieldsRequest, DeleteFile200Response, DeleteRecords200Response, DeleteRecordsRequest, DeleteRelationship200Response, DeleteTable200Response, DeleteUserToken200Response, DenyUsers200Response, DenyUsersAndGroups200Response, DenyUsersAndGroupsRequest, DenyUsersRequest, DownloadFile200Response, ExchangeSsoToken200Response, ExportSolution200Response, ExportSolutionToRecord200Response, GenerateDocument200Response, GetApp200Response, GetAppEvents200Response, GetAppTables200Response, GetField200Response, GetFieldUsage200Response, GetFields200Response, GetFieldsUsage200Response, GetRelationships200Response, GetReport200Response, GetTable200Response, GetTableReports200Response, GetTempTokenDBID200Response, GetUsers200Response, GetUsersRequest, PlatformAnalyticEventSummaries200Response, PlatformAnalyticReads200Response, RemoveManagersFromGroup200Response, RemoveManagersFromGroupRequest, RemoveMembersFromGroup200Response, RemoveMembersFromGroupRequest, RemoveSubgroupsFromGroup200Response, RemoveSubgroupsFromGroupRequest, RunFormula200Response, RunQuery200Response, RunQueryRequest, RunReport200Response, TransferUserToken200Response, UndenyUsers200Response, UndenyUsersRequest, UpdateApp200Response, UpdateAppRequest, UpdateField200Response, UpdateFieldRequest, UpdateRelationship200Response, UpdateSolution200Response, UpdateSolutionToRecord200Response, UpdateTable200Response, UpdateTableRequest, Upsert200Response, Upsert207Response, UpsertRequest } from "../generated/models";

export interface QuickbaseClient {
  /**
   * Create an app
   * @param params - Parameters for the createApp operation
   * @returns A promise resolving to the createApp response
   */
  createApp: (params: { body?: CreateAppRequest }) => Promise<CreateApp200Response>;
  /**
   * Get an app
   * @param params - Parameters for the getApp operation
   * @returns A promise resolving to the getApp response
   */
  getApp: (params: { appId: string }) => Promise<GetApp200Response>;
  /**
   * Update an app
   * @param params - Parameters for the updateApp operation
   * @returns A promise resolving to the updateApp response
   */
  updateApp: (params: { appId: string; body?: UpdateAppRequest }) => Promise<UpdateApp200Response>;
  /**
   * Delete an app
   * @param params - Parameters for the deleteApp operation
   * @returns A promise resolving to the deleteApp response
   */
  deleteApp: (params: { appId: string; body?: DeleteAppRequest }) => Promise<DeleteApp200Response>;
  /**
   * Get app events
   * @param params - Parameters for the getAppEvents operation
   * @returns A promise resolving to the getAppEvents response
   */
  getAppEvents: (params: { appId: string }) => Promise<GetAppEvents200Response>;
  /**
   * Copy an app
   * @param params - Parameters for the copyApp operation
   * @returns A promise resolving to the copyApp response
   */
  copyApp: (params: { appId: string; body?: CopyAppRequest }) => Promise<CopyApp200Response>;
  /**
   * Create a table
   * @param params - Parameters for the createTable operation
   * @returns A promise resolving to the createTable response
   */
  createTable: (params: { appId: string; body?: CreateTableRequest }) => Promise<CreateTable200Response>;
  /**
   * Get tables for an app
   * @param params - Parameters for the getAppTables operation
   * @returns A promise resolving to the getAppTables response
   */
  getAppTables: (params: { appId: string }) => Promise<GetAppTables200Response>;
  /**
   * Get a table
   * @param params - Parameters for the getTable operation
   * @returns A promise resolving to the getTable response
   */
  getTable: (params: { appId: string; tableId: string }) => Promise<GetTable200Response>;
  /**
   * Update a table
   * @param params - Parameters for the updateTable operation
   * @returns A promise resolving to the updateTable response
   */
  updateTable: (params: { appId: string; tableId: string; body?: UpdateTableRequest }) => Promise<UpdateTable200Response>;
  /**
   * Delete a table
   * @param params - Parameters for the deleteTable operation
   * @returns A promise resolving to the deleteTable response
   */
  deleteTable: (params: { appId: string; tableId: string }) => Promise<DeleteTable200Response>;
  /**
   * Get all relationships
   * @param params - Parameters for the getRelationships operation
   * @returns A promise resolving to the getRelationships response
   */
  getRelationships: (params: { skip?: number; tableId: string }) => Promise<GetRelationships200Response>;
  /**
   * Create a relationship
   * @param params - Parameters for the createRelationship operation
   * @returns A promise resolving to the createRelationship response
   */
  createRelationship: (params: { tableId: string; body?: any }) => Promise<CreateRelationship200Response>;
  /**
   * Update a relationship
   * @param params - Parameters for the updateRelationship operation
   * @returns A promise resolving to the updateRelationship response
   */
  updateRelationship: (params: { tableId: string; relationshipId: number; body?: any }) => Promise<UpdateRelationship200Response>;
  /**
   * Delete a relationship
   * @param params - Parameters for the deleteRelationship operation
   * @returns A promise resolving to the deleteRelationship response
   */
  deleteRelationship: (params: { tableId: string; relationshipId: number }) => Promise<DeleteRelationship200Response>;
  /**
   * Get reports for a table
   * @param params - Parameters for the getTableReports operation
   * @returns A promise resolving to the getTableReports response
   */
  getTableReports: (params: { tableId: string }) => Promise<GetTableReports200Response>;
  /**
   * Get a report
   * @param params - Parameters for the getReport operation
   * @returns A promise resolving to the getReport response
   */
  getReport: (params: { tableId: string; reportId: string }) => Promise<GetReport200Response>;
  /**
   * Run a report
   * @param params - Parameters for the runReport operation
   * @returns A promise resolving to the runReport response
   */
  runReport: (params: { tableId: string; skip?: number; top?: number; reportId: string; body?: any }) => Promise<RunReport200Response>;
  /**
   * Get fields for a table
   * @param params - Parameters for the getFields operation
   * @returns A promise resolving to the getFields response
   */
  getFields: (params: { tableId: string; includeFieldPerms?: boolean }) => Promise<GetFields200Response>;
  /**
   * Create a field
   * @param params - Parameters for the createField operation
   * @returns A promise resolving to the createField response
   */
  createField: (params: { tableId: string; body?: CreateFieldRequest }) => Promise<CreateField200Response>;
  /**
   * Delete field(s)
   * @param params - Parameters for the deleteFields operation
   * @returns A promise resolving to the deleteFields response
   */
  deleteFields: (params: { tableId: string; body?: DeleteFieldsRequest }) => Promise<DeleteFields200Response>;
  /**
   * Get field
   * @param params - Parameters for the getField operation
   * @returns A promise resolving to the getField response
   */
  getField: (params: { tableId: string; includeFieldPerms?: boolean; fieldId: number }) => Promise<GetField200Response>;
  /**
   * Update a field
   * @param params - Parameters for the updateField operation
   * @returns A promise resolving to the updateField response
   */
  updateField: (params: { tableId: string; fieldId: number; body?: UpdateFieldRequest }) => Promise<UpdateField200Response>;
  /**
   * Get usage for all fields
   * @param params - Parameters for the getFieldsUsage operation
   * @returns A promise resolving to the getFieldsUsage response
   */
  getFieldsUsage: (params: { tableId: string; skip?: number; top?: number }) => Promise<GetFieldsUsage200Response>;
  /**
   * Get usage for a field
   * @param params - Parameters for the getFieldUsage operation
   * @returns A promise resolving to the getFieldUsage response
   */
  getFieldUsage: (params: { tableId: string; fieldId: number }) => Promise<GetFieldUsage200Response>;
  /**
   * Run a formula
   * @param params - Parameters for the runFormula operation
   * @returns A promise resolving to the runFormula response
   */
  runFormula: (params: { body?: { formula?: string; rid?: number; from?: string } }) => Promise<RunFormula200Response>;
  /**
   * Insert/Update record(s)
   * @param params - Parameters for the upsert operation
   * @returns A promise resolving to the upsert response
   */
  upsert: (params: { body?: UpsertRequest }) => Promise<Upsert200Response | Upsert207Response>;
  /**
   * Delete record(s)
   * @param params - Parameters for the deleteRecords operation
   * @returns A promise resolving to the deleteRecords response
   */
  deleteRecords: (params: { body?: DeleteRecordsRequest }) => Promise<DeleteRecords200Response>;
  /**
   * Query for data
   * @param params - Parameters for the runQuery operation
   * @returns A promise resolving to the runQuery response
   */
  runQuery: (params: { body?: RunQueryRequest }) => Promise<RunQuery200Response>;
  /**
   * Get a temporary token for a dbid
   * @param params - Parameters for the getTempTokenDBID operation
   * @returns A promise resolving to the getTempTokenDBID response
   */
  getTempTokenDBID: (params: { dbid: string; qBAppToken?: string }) => Promise<GetTempTokenDBID200Response>;
  /**
   * Exchange an SSO token
   * @param params - Parameters for the exchangeSsoToken operation
   * @returns A promise resolving to the exchangeSsoToken response
   */
  exchangeSsoToken: (params: { body?: { grant_type?: string; requested_token_type?: string; subject_token?: string; subject_token_type?: string } }) => Promise<ExchangeSsoToken200Response>;
  /**
   * Clone a user token
   * @param params - Parameters for the cloneUserToken operation
   * @returns A promise resolving to the cloneUserToken response
   */
  cloneUserToken: (params: { body?: { name?: string; description?: string } }) => Promise<CloneUserToken200Response>;
  /**
   * Transfer a user token
   * @param params - Parameters for the transferUserToken operation
   * @returns A promise resolving to the transferUserToken response
   */
  transferUserToken: (params: { body?: { id?: number; from?: string; to?: string } }) => Promise<TransferUserToken200Response>;
  /**
   * Deactivate a user token
   * @param params - Parameters for the deactivateUserToken operation
   * @returns A promise resolving to the deactivateUserToken response
   */
  deactivateUserToken: (params: {  }) => Promise<DeactivateUserToken200Response>;
  /**
   * Delete a user token
   * @param params - Parameters for the deleteUserToken operation
   * @returns A promise resolving to the deleteUserToken response
   */
  deleteUserToken: (params: {  }) => Promise<DeleteUserToken200Response>;
  /**
   * Download file
   * @param params - Parameters for the downloadFile operation
   * @returns A promise resolving to the downloadFile response
   */
  downloadFile: (params: { tableId: string; recordId: number; fieldId: number; versionNumber: number }) => Promise<DownloadFile200Response>;
  /**
   * Delete file
   * @param params - Parameters for the deleteFile operation
   * @returns A promise resolving to the deleteFile response
   */
  deleteFile: (params: { tableId: string; recordId: number; fieldId: number; versionNumber: number }) => Promise<DeleteFile200Response>;
  /**
   * Get users
   * @param params - Parameters for the getUsers operation
   * @returns A promise resolving to the getUsers response
   */
  getUsers: (params: { accountId?: number; body?: GetUsersRequest }) => Promise<GetUsers200Response>;
  /**
   * Deny users
   * @param params - Parameters for the denyUsers operation
   * @returns A promise resolving to the denyUsers response
   */
  denyUsers: (params: { accountId?: number; body?: DenyUsersRequest }) => Promise<DenyUsers200Response>;
  /**
   * Deny and remove users from groups
   * @param params - Parameters for the denyUsersAndGroups operation
   * @returns A promise resolving to the denyUsersAndGroups response
   */
  denyUsersAndGroups: (params: { accountId?: number; shouldDeleteFromGroups: boolean; body?: DenyUsersAndGroupsRequest }) => Promise<DenyUsersAndGroups200Response>;
  /**
   * Undeny users
   * @param params - Parameters for the undenyUsers operation
   * @returns A promise resolving to the undenyUsers response
   */
  undenyUsers: (params: { accountId?: number; body?: UndenyUsersRequest }) => Promise<UndenyUsers200Response>;
  /**
   * Add members
   * @param params - Parameters for the addMembersToGroup operation
   * @returns A promise resolving to the addMembersToGroup response
   */
  addMembersToGroup: (params: { gid: number; body?: AddMembersToGroupRequest }) => Promise<AddMembersToGroup200Response>;
  /**
   * Remove members
   * @param params - Parameters for the removeMembersFromGroup operation
   * @returns A promise resolving to the removeMembersFromGroup response
   */
  removeMembersFromGroup: (params: { gid: number; body?: RemoveMembersFromGroupRequest }) => Promise<RemoveMembersFromGroup200Response>;
  /**
   * Add managers
   * @param params - Parameters for the addManagersToGroup operation
   * @returns A promise resolving to the addManagersToGroup response
   */
  addManagersToGroup: (params: { gid: number; body?: AddManagersToGroupRequest }) => Promise<AddManagersToGroup200Response>;
  /**
   * Remove managers
   * @param params - Parameters for the removeManagersFromGroup operation
   * @returns A promise resolving to the removeManagersFromGroup response
   */
  removeManagersFromGroup: (params: { gid: number; body?: RemoveManagersFromGroupRequest }) => Promise<RemoveManagersFromGroup200Response>;
  /**
   * Add child groups
   * @param params - Parameters for the addSubgroupsToGroup operation
   * @returns A promise resolving to the addSubgroupsToGroup response
   */
  addSubgroupsToGroup: (params: { gid: number; body?: AddSubgroupsToGroupRequest }) => Promise<AddSubgroupsToGroup200Response>;
  /**
   * Remove child groups
   * @param params - Parameters for the removeSubgroupsFromGroup operation
   * @returns A promise resolving to the removeSubgroupsFromGroup response
   */
  removeSubgroupsFromGroup: (params: { gid: number; body?: RemoveSubgroupsFromGroupRequest }) => Promise<RemoveSubgroupsFromGroup200Response>;
  /**
   * Get audit logs
   * @param params - Parameters for the audit operation
   * @returns A promise resolving to the audit response
   */
  audit: (params: { body?: { nextToken?: string; numRows?: number; queryId?: string; date?: string; topics?: string[] } }) => Promise<Audit200Response>;
  /**
   * Get read summaries
   * @param params - Parameters for the platformAnalyticReads operation
   * @returns A promise resolving to the platformAnalyticReads response
   */
  platformAnalyticReads: (params: { day?: string }) => Promise<PlatformAnalyticReads200Response>;
  /**
   * Get event summaries
   * @param params - Parameters for the platformAnalyticEventSummaries operation
   * @returns A promise resolving to the platformAnalyticEventSummaries response
   */
  platformAnalyticEventSummaries: (params: { accountId?: number; body?: { start?: string; end?: string; groupBy?: string; nextToken?: string; where?: { id?: string; type?: string }[] } }) => Promise<PlatformAnalyticEventSummaries200Response>;
  /**
   * Export a solution
   * @param params - Parameters for the exportSolution operation
   * @returns A promise resolving to the exportSolution response
   */
  exportSolution: (params: { solutionId: string; qBLVersion?: string }) => Promise<ExportSolution200Response>;
  /**
   * Update a solution
   * @param params - Parameters for the updateSolution operation
   * @returns A promise resolving to the updateSolution response
   */
  updateSolution: (params: { solutionId: string; body?: any; xQBLErrorsAsSuccess?: boolean }) => Promise<UpdateSolution200Response>;
  /**
   * Create a solution
   * @param params - Parameters for the createSolution operation
   * @returns A promise resolving to the createSolution response
   */
  createSolution: (params: { body?: any; xQBLErrorsAsSuccess?: boolean }) => Promise<CreateSolution200Response>;
  /**
   * Export solution to record
   * @param params - Parameters for the exportSolutionToRecord operation
   * @returns A promise resolving to the exportSolutionToRecord response
   */
  exportSolutionToRecord: (params: { solutionId: string; tableId: string; fieldId: number; xQBLErrorsAsSuccess?: boolean; qBLVersion?: string }) => Promise<ExportSolutionToRecord200Response>;
  /**
   * Create solution from record
   * @param params - Parameters for the createSolutionFromRecord operation
   * @returns A promise resolving to the createSolutionFromRecord response
   */
  createSolutionFromRecord: (params: { tableId: string; fieldId: number; recordId: number; xQBLErrorsAsSuccess?: boolean }) => Promise<CreateSolutionFromRecord200Response>;
  /**
   * Update solution from record
   * @param params - Parameters for the updateSolutionToRecord operation
   * @returns A promise resolving to the updateSolutionToRecord response
   */
  updateSolutionToRecord: (params: { solutionId: string; tableId: string; fieldId: number; recordId: number; xQBLErrorsAsSuccess?: boolean }) => Promise<UpdateSolutionToRecord200Response>;
  /**
   * List solution changes
   * @param params - Parameters for the changesetSolution operation
   * @returns A promise resolving to the changesetSolution response
   */
  changesetSolution: (params: { solutionId: string; body?: any; xQBLErrorsAsSuccess?: boolean }) => Promise<ChangesetSolution200Response>;
  /**
   * List solution changes from record
   * @param params - Parameters for the changesetSolutionFromRecord operation
   * @returns A promise resolving to the changesetSolutionFromRecord response
   */
  changesetSolutionFromRecord: (params: { solutionId: string; tableId: string; fieldId: number; recordId: number; xQBLErrorsAsSuccess?: boolean }) => Promise<ChangesetSolutionFromRecord200Response>;
  /**
   * Generate a document
   * @param params - Parameters for the generateDocument operation
   * @returns A promise resolving to the generateDocument response
   */
  generateDocument: (params: { templateId: number; tableId: string; recordId?: number; filename: string; accept?: string; format?: string; margin?: string; unit?: string; pageSize?: string; orientation?: string; realm?: string }) => Promise<GenerateDocument200Response>;
}
