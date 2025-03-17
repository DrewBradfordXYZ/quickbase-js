// Generated on 2025-03-17T18:15:59.854Z
import { AddManagersToGroup200Response, AddManagersToGroupRequest, AddMembersToGroup200Response, AddMembersToGroupRequest, AddSubgroupsToGroup200Response, AddSubgroupsToGroupRequest, Audit200Response, ChangesetSolution200Response, ChangesetSolutionFromRecord200Response, CloneUserToken200Response, CopyApp200Response, CopyAppRequest, CreateApp200Response, CreateAppRequest, CreateField200Response, CreateFieldRequest, CreateRelationship200Response, CreateRelationshipRequest, CreateSolution200Response, CreateSolutionFromRecord200Response, CreateTable200Response, CreateTableRequest, DeactivateUserToken200Response, DeleteApp200Response, DeleteAppRequest, DeleteFields200Response, DeleteFieldsRequest, DeleteFile200Response, DeleteRecords200Response, DeleteRecordsRequest, DeleteRelationship200Response, DeleteTable200Response, DeleteUserToken200Response, DenyUsers200Response, DenyUsersAndGroups200Response, DenyUsersAndGroupsRequest, DenyUsersRequest, DownloadFile200Response, ExchangeSsoToken200Response, ExportSolution200Response, ExportSolutionToRecord200Response, GenerateDocument200Response, GetApp200Response, GetAppEvents200Response, GetAppTables200Response, GetField200Response, GetFieldUsage200Response, GetFields200Response, GetFieldsUsage200Response, GetRelationships200Response, GetReport200Response, GetTable200Response, GetTableReports200Response, GetTempTokenDBID200Response, GetUsers200Response, GetUsersRequest, PlatformAnalyticEventSummaries200Response, PlatformAnalyticReads200Response, RemoveManagersFromGroup200Response, RemoveManagersFromGroupRequest, RemoveMembersFromGroup200Response, RemoveMembersFromGroupRequest, RemoveSubgroupsFromGroup200Response, RemoveSubgroupsFromGroupRequest, RunFormula200Response, RunQuery200Response, RunQueryRequest, RunReport200Response, TransferUserToken200Response, UndenyUsers200Response, UndenyUsersRequest, UpdateApp200Response, UpdateAppRequest, UpdateField200Response, UpdateFieldRequest, UpdateRelationship200Response, UpdateRelationshipRequest, UpdateSolution200Response, UpdateSolutionToRecord200Response, UpdateTable200Response, UpdateTableRequest, Upsert200Response, Upsert207Response, UpsertRequest } from "../generated/models";

export interface QuickbaseClient {
  /**
   * Create an app
   * @param params - Parameters for createApp
   * @returns Promise resolving to createApp response
   */
  createApp: (params: { body?: CreateAppRequest }) => Promise<CreateApp200Response>;
  /**
   * Get an app
   * @param params - Parameters for getApp
   * @returns Promise resolving to getApp response
   */
  getApp: (params: { appId: string }) => Promise<GetApp200Response>;
  /**
   * Update an app
   * @param params - Parameters for updateApp
   * @returns Promise resolving to updateApp response
   */
  updateApp: (params: { appId: string; body?: UpdateAppRequest }) => Promise<UpdateApp200Response>;
  /**
   * Delete an app
   * @param params - Parameters for deleteApp
   * @returns Promise resolving to deleteApp response
   */
  deleteApp: (params: { appId: string; body?: DeleteAppRequest }) => Promise<DeleteApp200Response>;
  /**
   * Get app events
   * @param params - Parameters for getAppEvents
   * @returns Promise resolving to getAppEvents response
   */
  getAppEvents: (params: { appId: string }) => Promise<GetAppEvents200Response>;
  /**
   * Copy an app
   * @param params - Parameters for copyApp
   * @returns Promise resolving to copyApp response
   */
  copyApp: (params: { appId: string; body?: CopyAppRequest }) => Promise<CopyApp200Response>;
  /**
   * Create a table
   * @param params - Parameters for createTable
   * @returns Promise resolving to createTable response
   */
  createTable: (params: { appId: string; body?: CreateTableRequest }) => Promise<CreateTable200Response>;
  /**
   * Get tables for an app
   * @param params - Parameters for getAppTables
   * @returns Promise resolving to getAppTables response
   */
  getAppTables: (params: { appId: string }) => Promise<GetAppTables200Response>;
  /**
   * Get a table
   * @param params - Parameters for getTable
   * @returns Promise resolving to getTable response
   */
  getTable: (params: { appId: string; tableId: string }) => Promise<GetTable200Response>;
  /**
   * Update a table
   * @param params - Parameters for updateTable
   * @returns Promise resolving to updateTable response
   */
  updateTable: (params: { appId: string; tableId: string; body?: UpdateTableRequest }) => Promise<UpdateTable200Response>;
  /**
   * Delete a table
   * @param params - Parameters for deleteTable
   * @returns Promise resolving to deleteTable response
   */
  deleteTable: (params: { appId: string; tableId: string }) => Promise<DeleteTable200Response>;
  /**
   * Get all relationships
   * @param params - Parameters for getRelationships
   * @returns Promise resolving to getRelationships response
   */
  getRelationships: (params: { skip?: number; tableId: string }) => Promise<GetRelationships200Response>;
  /**
   * Create a relationship
   * @param params - Parameters for createRelationship
   * @returns Promise resolving to createRelationship response
   */
  createRelationship: (params: { tableId: string; body?: CreateRelationshipRequest }) => Promise<CreateRelationship200Response>;
  /**
   * Update a relationship
   * @param params - Parameters for updateRelationship
   * @returns Promise resolving to updateRelationship response
   */
  updateRelationship: (params: { tableId: string; relationshipId: number; body?: UpdateRelationshipRequest }) => Promise<UpdateRelationship200Response>;
  /**
   * Delete a relationship
   * @param params - Parameters for deleteRelationship
   * @returns Promise resolving to deleteRelationship response
   */
  deleteRelationship: (params: { tableId: string; relationshipId: number }) => Promise<DeleteRelationship200Response>;
  /**
   * Get reports for a table
   * @param params - Parameters for getTableReports
   * @returns Promise resolving to getTableReports response
   */
  getTableReports: (params: { tableId: string }) => Promise<GetTableReports200Response>;
  /**
   * Get a report
   * @param params - Parameters for getReport
   * @returns Promise resolving to getReport response
   */
  getReport: (params: { tableId: string; reportId: string }) => Promise<GetReport200Response>;
  /**
   * Run a report
   * @param params - Parameters for runReport
   * @returns Promise resolving to runReport response
   */
  runReport: (params: { tableId: string; skip?: number; top?: number; reportId: string; body?: any }) => Promise<RunReport200Response>;
  /**
   * Get fields for a table
   * @param params - Parameters for getFields
   * @returns Promise resolving to getFields response
   */
  getFields: (params: { tableId: string; includeFieldPerms?: boolean }) => Promise<GetFields200Response>;
  /**
   * Create a field
   * @param params - Parameters for createField
   * @returns Promise resolving to createField response
   */
  createField: (params: { tableId: string; body?: CreateFieldRequest }) => Promise<CreateField200Response>;
  /**
   * Delete field(s)
   * @param params - Parameters for deleteFields
   * @returns Promise resolving to deleteFields response
   */
  deleteFields: (params: { tableId: string; body?: DeleteFieldsRequest }) => Promise<DeleteFields200Response>;
  /**
   * Get field
   * @param params - Parameters for getField
   * @returns Promise resolving to getField response
   */
  getField: (params: { tableId: string; includeFieldPerms?: boolean; fieldId: number }) => Promise<GetField200Response>;
  /**
   * Update a field
   * @param params - Parameters for updateField
   * @returns Promise resolving to updateField response
   */
  updateField: (params: { tableId: string; fieldId: number; body?: UpdateFieldRequest }) => Promise<UpdateField200Response>;
  /**
   * Get usage for all fields
   * @param params - Parameters for getFieldsUsage
   * @returns Promise resolving to getFieldsUsage response
   */
  getFieldsUsage: (params: { tableId: string; skip?: number; top?: number }) => Promise<GetFieldsUsage200Response>;
  /**
   * Get usage for a field
   * @param params - Parameters for getFieldUsage
   * @returns Promise resolving to getFieldUsage response
   */
  getFieldUsage: (params: { tableId: string; fieldId: number }) => Promise<GetFieldUsage200Response>;
  /**
   * Run a formula
   * @param params - Parameters for runFormula
   * @returns Promise resolving to runFormula response
   */
  runFormula: (params: { body?: { formula?: string; rid?: number; from?: string } }) => Promise<RunFormula200Response>;
  /**
   * Insert/Update record(s)
   * @param params - Parameters for upsert
   * @returns Promise resolving to upsert response
   */
  upsert: (params: { body?: UpsertRequest }) => Promise<Upsert200Response | Upsert207Response>;
  /**
   * Delete record(s)
   * @param params - Parameters for deleteRecords
   * @returns Promise resolving to deleteRecords response
   */
  deleteRecords: (params: { body?: DeleteRecordsRequest }) => Promise<DeleteRecords200Response>;
  /**
   * Query for data
   * @param params - Parameters for runQuery
   * @returns Promise resolving to runQuery response
   */
  runQuery: (params: { body?: RunQueryRequest }) => Promise<RunQuery200Response>;
  /**
   * Get a temporary token for a dbid
   * @param params - Parameters for getTempTokenDBID
   * @returns Promise resolving to getTempTokenDBID response
   */
  getTempTokenDBID: (params: { dbid: string; qBAppToken?: string }) => Promise<GetTempTokenDBID200Response>;
  /**
   * Exchange an SSO token
   * @param params - Parameters for exchangeSsoToken
   * @returns Promise resolving to exchangeSsoToken response
   */
  exchangeSsoToken: (params: { body?: { grant_type?: string; requested_token_type?: string; subject_token?: string; subject_token_type?: string } }) => Promise<ExchangeSsoToken200Response>;
  /**
   * Clone a user token
   * @param params - Parameters for cloneUserToken
   * @returns Promise resolving to cloneUserToken response
   */
  cloneUserToken: (params: { body?: { name?: string; description?: string } }) => Promise<CloneUserToken200Response>;
  /**
   * Transfer a user token
   * @param params - Parameters for transferUserToken
   * @returns Promise resolving to transferUserToken response
   */
  transferUserToken: (params: { body?: { id?: number; from?: string; to?: string } }) => Promise<TransferUserToken200Response>;
  /**
   * Deactivate a user token
   * @param params - Parameters for deactivateUserToken
   * @returns Promise resolving to deactivateUserToken response
   */
  deactivateUserToken: (params: {  }) => Promise<DeactivateUserToken200Response>;
  /**
   * Delete a user token
   * @param params - Parameters for deleteUserToken
   * @returns Promise resolving to deleteUserToken response
   */
  deleteUserToken: (params: {  }) => Promise<DeleteUserToken200Response>;
  /**
   * Download file
   * @param params - Parameters for downloadFile
   * @returns Promise resolving to downloadFile response
   */
  downloadFile: (params: { tableId: string; recordId: number; fieldId: number; versionNumber: number }) => Promise<DownloadFile200Response>;
  /**
   * Delete file
   * @param params - Parameters for deleteFile
   * @returns Promise resolving to deleteFile response
   */
  deleteFile: (params: { tableId: string; recordId: number; fieldId: number; versionNumber: number }) => Promise<DeleteFile200Response>;
  /**
   * Get users
   * @param params - Parameters for getUsers
   * @returns Promise resolving to getUsers response
   */
  getUsers: (params: { accountId?: number; body?: GetUsersRequest }) => Promise<GetUsers200Response>;
  /**
   * Deny users
   * @param params - Parameters for denyUsers
   * @returns Promise resolving to denyUsers response
   */
  denyUsers: (params: { accountId?: number; body?: DenyUsersRequest }) => Promise<DenyUsers200Response>;
  /**
   * Deny and remove users from groups
   * @param params - Parameters for denyUsersAndGroups
   * @returns Promise resolving to denyUsersAndGroups response
   */
  denyUsersAndGroups: (params: { accountId?: number; shouldDeleteFromGroups: boolean; body?: DenyUsersAndGroupsRequest }) => Promise<DenyUsersAndGroups200Response>;
  /**
   * Undeny users
   * @param params - Parameters for undenyUsers
   * @returns Promise resolving to undenyUsers response
   */
  undenyUsers: (params: { accountId?: number; body?: UndenyUsersRequest }) => Promise<UndenyUsers200Response>;
  /**
   * Add members
   * @param params - Parameters for addMembersToGroup
   * @returns Promise resolving to addMembersToGroup response
   */
  addMembersToGroup: (params: { gid: number; body?: AddMembersToGroupRequest }) => Promise<AddMembersToGroup200Response>;
  /**
   * Remove members
   * @param params - Parameters for removeMembersFromGroup
   * @returns Promise resolving to removeMembersFromGroup response
   */
  removeMembersFromGroup: (params: { gid: number; body?: RemoveMembersFromGroupRequest }) => Promise<RemoveMembersFromGroup200Response>;
  /**
   * Add managers
   * @param params - Parameters for addManagersToGroup
   * @returns Promise resolving to addManagersToGroup response
   */
  addManagersToGroup: (params: { gid: number; body?: AddManagersToGroupRequest }) => Promise<AddManagersToGroup200Response>;
  /**
   * Remove managers
   * @param params - Parameters for removeManagersFromGroup
   * @returns Promise resolving to removeManagersFromGroup response
   */
  removeManagersFromGroup: (params: { gid: number; body?: RemoveManagersFromGroupRequest }) => Promise<RemoveManagersFromGroup200Response>;
  /**
   * Add child groups
   * @param params - Parameters for addSubgroupsToGroup
   * @returns Promise resolving to addSubgroupsToGroup response
   */
  addSubgroupsToGroup: (params: { gid: number; body?: AddSubgroupsToGroupRequest }) => Promise<AddSubgroupsToGroup200Response>;
  /**
   * Remove child groups
   * @param params - Parameters for removeSubgroupsFromGroup
   * @returns Promise resolving to removeSubgroupsFromGroup response
   */
  removeSubgroupsFromGroup: (params: { gid: number; body?: RemoveSubgroupsFromGroupRequest }) => Promise<RemoveSubgroupsFromGroup200Response>;
  /**
   * Get audit logs
   * @param params - Parameters for audit
   * @returns Promise resolving to audit response
   */
  audit: (params: { body?: { nextToken?: string; numRows?: number; queryId?: string; date?: string; topics?: string[] } }) => Promise<Audit200Response>;
  /**
   * Get read summaries
   * @param params - Parameters for platformAnalyticReads
   * @returns Promise resolving to platformAnalyticReads response
   */
  platformAnalyticReads: (params: { day?: string }) => Promise<PlatformAnalyticReads200Response>;
  /**
   * Get event summaries
   * @param params - Parameters for platformAnalyticEventSummaries
   * @returns Promise resolving to platformAnalyticEventSummaries response
   */
  platformAnalyticEventSummaries: (params: { accountId?: number; body?: { start?: string; end?: string; groupBy?: string; nextToken?: string; where?: { id?: string; type?: string }[] } }) => Promise<PlatformAnalyticEventSummaries200Response>;
  /**
   * Export a solution
   * @param params - Parameters for exportSolution
   * @returns Promise resolving to exportSolution response
   */
  exportSolution: (params: { solutionId: string; qBLVersion?: string }) => Promise<ExportSolution200Response>;
  /**
   * Update a solution
   * @param params - Parameters for updateSolution
   * @returns Promise resolving to updateSolution response
   */
  updateSolution: (params: { solutionId: string; body?: any; xQBLErrorsAsSuccess?: boolean }) => Promise<UpdateSolution200Response>;
  /**
   * Create a solution
   * @param params - Parameters for createSolution
   * @returns Promise resolving to createSolution response
   */
  createSolution: (params: { body?: any; xQBLErrorsAsSuccess?: boolean }) => Promise<CreateSolution200Response>;
  /**
   * Export solution to record
   * @param params - Parameters for exportSolutionToRecord
   * @returns Promise resolving to exportSolutionToRecord response
   */
  exportSolutionToRecord: (params: { solutionId: string; tableId: string; fieldId: number; xQBLErrorsAsSuccess?: boolean; qBLVersion?: string }) => Promise<ExportSolutionToRecord200Response>;
  /**
   * Create solution from record
   * @param params - Parameters for createSolutionFromRecord
   * @returns Promise resolving to createSolutionFromRecord response
   */
  createSolutionFromRecord: (params: { tableId: string; fieldId: number; recordId: number; xQBLErrorsAsSuccess?: boolean }) => Promise<CreateSolutionFromRecord200Response>;
  /**
   * Update solution from record
   * @param params - Parameters for updateSolutionToRecord
   * @returns Promise resolving to updateSolutionToRecord response
   */
  updateSolutionToRecord: (params: { solutionId: string; tableId: string; fieldId: number; recordId: number; xQBLErrorsAsSuccess?: boolean }) => Promise<UpdateSolutionToRecord200Response>;
  /**
   * List solution changes
   * @param params - Parameters for changesetSolution
   * @returns Promise resolving to changesetSolution response
   */
  changesetSolution: (params: { solutionId: string; body?: any; xQBLErrorsAsSuccess?: boolean }) => Promise<ChangesetSolution200Response>;
  /**
   * List solution changes from record
   * @param params - Parameters for changesetSolutionFromRecord
   * @returns Promise resolving to changesetSolutionFromRecord response
   */
  changesetSolutionFromRecord: (params: { solutionId: string; tableId: string; fieldId: number; recordId: number; xQBLErrorsAsSuccess?: boolean }) => Promise<ChangesetSolutionFromRecord200Response>;
  /**
   * Generate a document
   * @param params - Parameters for generateDocument
   * @returns Promise resolving to generateDocument response
   */
  generateDocument: (params: { templateId: number; tableId: string; recordId?: number; filename: string; accept?: string; format?: string; margin?: string; unit?: string; pageSize?: string; orientation?: string; realm?: string }) => Promise<GenerateDocument200Response>;
}
