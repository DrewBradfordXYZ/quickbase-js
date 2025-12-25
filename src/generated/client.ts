/**
 * Auto-generated QuickBase API client implementation
 * DO NOT EDIT - Regenerate with: npm run spec:generate
 */

import { PaginatedRequest, createPaginatedRequest } from '../client/pagination.js';

import type {
  QuickbaseAPI,
  CreateAppRequest,
  CreateAppResponse,
  GetAppParams,
  GetAppResponse,
  UpdateAppParams,
  UpdateAppRequest,
  UpdateAppResponse,
  DeleteAppParams,
  DeleteAppRequest,
  DeleteAppResponse,
  GetAppEventsParams,
  GetAppEventsResponse,
  CopyAppParams,
  CopyAppRequest,
  CopyAppResponse,
  GetRolesParams,
  GetRolesResponse,
  GetAppTablesParams,
  GetAppTablesResponse,
  CreateTableParams,
  CreateTableRequest,
  CreateTableResponse,
  GetTableParams,
  GetTableResponse,
  UpdateTableParams,
  UpdateTableRequest,
  UpdateTableResponse,
  DeleteTableParams,
  DeleteTableResponse,
  GetRelationshipsParams,
  GetRelationshipsResponse,
  CreateRelationshipParams,
  CreateRelationshipRequest,
  CreateRelationshipResponse,
  UpdateRelationshipParams,
  UpdateRelationshipRequest,
  UpdateRelationshipResponse,
  DeleteRelationshipParams,
  DeleteRelationshipResponse,
  GetTableReportsParams,
  GetTableReportsResponse,
  GetReportParams,
  GetReportResponse,
  RunReportParams,
  RunReportRequest,
  RunReportResponse,
  GetFieldsParams,
  GetFieldsResponse,
  CreateFieldParams,
  CreateFieldRequest,
  CreateFieldResponse,
  DeleteFieldsParams,
  DeleteFieldsRequest,
  DeleteFieldsResponse,
  GetFieldParams,
  GetFieldResponse,
  UpdateFieldParams,
  UpdateFieldRequest,
  UpdateFieldResponse,
  GetFieldsUsageParams,
  GetFieldsUsageResponse,
  GetFieldUsageParams,
  GetFieldUsageResponse,
  RunFormulaRequest,
  RunFormulaResponse,
  UpsertRequest,
  UpsertResponse,
  DeleteRecordsRequest,
  DeleteRecordsResponse,
  RunQueryRequest,
  RunQueryResponse,
  RecordsModifiedSinceRequest,
  RecordsModifiedSinceResponse,
  GetTempTokenDBIDParams,
  GetTempTokenDBIDResponse,
  ExchangeSsoTokenRequest,
  ExchangeSsoTokenResponse,
  CloneUserTokenRequest,
  CloneUserTokenResponse,
  TransferUserTokenRequest,
  TransferUserTokenResponse,
  DeactivateUserTokenResponse,
  DeleteUserTokenResponse,
  DownloadFileParams,
  DownloadFileResponse,
  DeleteFileParams,
  DeleteFileResponse,
  GetUsersParams,
  GetUsersRequest,
  GetUsersResponse,
  DenyUsersParams,
  DenyUsersRequest,
  DenyUsersResponse,
  DenyUsersAndGroupsParams,
  DenyUsersAndGroupsRequest,
  DenyUsersAndGroupsResponse,
  UndenyUsersParams,
  UndenyUsersRequest,
  UndenyUsersResponse,
  AddMembersToGroupParams,
  AddMembersToGroupRequest,
  AddMembersToGroupResponse,
  RemoveMembersFromGroupParams,
  RemoveMembersFromGroupRequest,
  RemoveMembersFromGroupResponse,
  AddManagersToGroupParams,
  AddManagersToGroupRequest,
  AddManagersToGroupResponse,
  RemoveManagersFromGroupParams,
  RemoveManagersFromGroupRequest,
  RemoveManagersFromGroupResponse,
  AddSubgroupsToGroupParams,
  AddSubgroupsToGroupRequest,
  AddSubgroupsToGroupResponse,
  RemoveSubgroupsFromGroupParams,
  RemoveSubgroupsFromGroupRequest,
  RemoveSubgroupsFromGroupResponse,
  AuditRequest,
  AuditResponse,
  PlatformAnalyticReadsParams,
  PlatformAnalyticReadsResponse,
  PlatformAnalyticEventSummariesParams,
  PlatformAnalyticEventSummariesRequest,
  PlatformAnalyticEventSummariesResponse,
  ExportSolutionParams,
  ExportSolutionResponse,
  UpdateSolutionParams,
  UpdateSolutionRequest,
  UpdateSolutionResponse,
  CreateSolutionRequest,
  CreateSolutionResponse,
  ExportSolutionToRecordParams,
  ExportSolutionToRecordResponse,
  CreateSolutionFromRecordParams,
  CreateSolutionFromRecordResponse,
  UpdateSolutionToRecordParams,
  UpdateSolutionToRecordResponse,
  ChangesetSolutionParams,
  ChangesetSolutionRequest,
  ChangesetSolutionResponse,
  ChangesetSolutionFromRecordParams,
  ChangesetSolutionFromRecordResponse,
  GenerateDocumentParams,
  GenerateDocumentResponse,
  GetSolutionPublicParams,
  GetSolutionPublicResponse,
  GetTrusteesParams,
  GetTrusteesResponse,
  AddTrusteesParams,
  AddTrusteesRequest,
  AddTrusteesResponse,
  RemoveTrusteesParams,
  RemoveTrusteesRequest,
  RemoveTrusteesResponse,
  UpdateTrusteesParams,
  UpdateTrusteesRequest,
  UpdateTrusteesResponse,
} from './types.js';

export type RequestFn = <T>(options: {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
}) => Promise<T>;

/**
 * Create typed API methods from a request function
 * @param request - The request executor function
 * @param autoPaginate - Default auto-pagination behavior (default: false)
 */
export function createApiMethods(request: RequestFn, autoPaginate: boolean = false): QuickbaseAPI {
  return {
  /**
   * Create an app
   *
   * Creates an application in an account. You must have application creation rights in the respective account. Main properties and application variables can be set with this API.
   *
   * @param body - Request body
   * @param body.assignToken - Set to true if you would like to assign the app to the user token you used to create the application. The default is false. (optional)
   * @param body.variables - The app variables. A maximum of 10 variables can be inserted at a time. See [About Application Variables](https://help.quickbase.com/user-assistance/variables.html) (optional)
   * @param body.name - The app name. You are allowed to create multiple apps with the same name, in the same realm, because they will have different dbid values. We urge you to be careful about doing this.
   * @param body.securityProperties - Application security properties. (optional)
   * @param body.description - The description for the app. If this property is left out, the app description will be blank. (optional)
   *
   * @returns Success
   *
   * @see https://developer.quickbase.com/operation/createApp
   */
  createApp(body: CreateAppRequest): Promise<CreateAppResponse> {
    return request<CreateAppResponse>({
      method: 'POST',
      path: '/apps',
      body,
    });
  },

  /**
   * Get an app
   *
   * Returns the main properties of an application, including application variables.
   *
   * @param params.appId - The unique identifier of an app
   *
   * @returns Success
   *
   * @see https://developer.quickbase.com/operation/getApp
   */
  getApp(params: GetAppParams): Promise<GetAppResponse> {
    return request<GetAppResponse>({
      method: 'GET',
      path: `/apps/${params.appId}`,
    });
  },

  /**
   * Update an app
   *
   * Updates the main properties and/or application variables for a specific application. Any properties of the app that you do not specify in the request body will remain unchanged.
   *
   * @param params.appId - The unique identifier of an app
   *
   * @param body - Request body (optional)
   * @param body.variables - The app variables. A maximum of 10 variables can be updated at a time. See [About Application Variables](https://help.quickbase.com/user-assistance/variables.html) (optional)
   * @param body.name - The name for the app. (optional)
   * @param body.securityProperties - Security properties of the application (optional)
   * @param body.description - The description for the app. (optional)
   *
   * @returns Success
   *
   * @see https://developer.quickbase.com/operation/updateApp
   */
  updateApp(params: UpdateAppParams, body?: UpdateAppRequest): Promise<UpdateAppResponse> {
    return request<UpdateAppResponse>({
      method: 'POST',
      path: `/apps/${params.appId}`,
      body,
    });
  },

  /**
   * Delete an app
   *
   * Deletes an entire application, including all of the tables and data.
   *
   * @param params.appId - The unique identifier of an app
   *
   * @param body - Request body
   * @param body.name - To confirm application deletion we ask for application name.
   *
   * @returns Success
   *
   * @see https://developer.quickbase.com/operation/deleteApp
   */
  deleteApp(params: DeleteAppParams, body: DeleteAppRequest): Promise<DeleteAppResponse> {
    return request<DeleteAppResponse>({
      method: 'DELETE',
      path: `/apps/${params.appId}`,
      body,
    });
  },

  /**
   * Get app events
   *
   * Get a list of events that can be triggered based on data or user actions in this application, includes: Email notification, Reminders, Subscriptions, QB Actions, Webhooks, record change triggered Automations (does not include scheduled).
   *
   * @param params.appId - The unique identifier of an app
   *
   * @returns Success
   *
   * @see https://developer.quickbase.com/operation/getAppEvents
   */
  getAppEvents(params: GetAppEventsParams): Promise<GetAppEventsResponse> {
    return request<GetAppEventsResponse>({
      method: 'GET',
      path: `/apps/${params.appId}/events`,
    });
  },

  /**
   * Copy an app
   *
   * Copies the specified application. The new application will have the same schema as the original. See below for additional copy options.
   *
   * @param params.appId - The unique identifier of an app
   *
   * @param body - Request body
   * @param body.name - The name of the newly copied app
   * @param body.description - The description of the newly copied app (optional)
   * @param body.properties - The configuration properties for performing the app copy (optional)
   *
   * @returns Success
   *
   * @see https://developer.quickbase.com/operation/copyApp
   */
  copyApp(params: CopyAppParams, body: CopyAppRequest): Promise<CopyAppResponse> {
    return request<CopyAppResponse>({
      method: 'POST',
      path: `/apps/${params.appId}/copy`,
      body,
    });
  },

  /**
   * Get app roles
   *
   * Retrieves all of the roles for an application. Requires admin access to an app.
   *
   * @param params.appId - The unique identifier of an app
   *
   * @returns Success
   *
   * @see https://developer.quickbase.com/operation/getRoles
   */
  getRoles(params: GetRolesParams): Promise<GetRolesResponse> {
    return request<GetRolesResponse>({
      method: 'GET',
      path: `/apps/${params.appId}/roles`,
    });
  },

  /**
   * Get tables for an app
   *
   * Gets a list of all the tables that exist in a specific application. The properties for each table are the same as what is returned in Get table.
   *
   * @param params.appId - The unique identifier of an app
   *
   * @returns Success
   *
   * @see https://developer.quickbase.com/operation/getAppTables
   */
  getAppTables(params: GetAppTablesParams): Promise<GetAppTablesResponse> {
    return request<GetAppTablesResponse>({
      method: 'GET',
      path: '/tables',
      query: { appId: params.appId },
    });
  },

  /**
   * Create a table
   *
   * Creates a table in an application.
   *
   * @param params.appId - The unique identifier of an app
   *
   * @param body - Request body
   * @param body.name - The name for the table.
   * @param body.pluralRecordName - The plural noun for records in the table. If this value is not passed the default value is 'Records'. (optional)
   * @param body.singleRecordName - The singular noun for records in the table. If this value is not passed the default value is 'Record'. (optional)
   * @param body.description - The description for the table. If this value is not passed the default value is blank. (optional)
   *
   * @returns Success
   *
   * @see https://developer.quickbase.com/operation/createTable
   */
  createTable(params: CreateTableParams, body: CreateTableRequest): Promise<CreateTableResponse> {
    return request<CreateTableResponse>({
      method: 'POST',
      path: '/tables',
      query: { appId: params.appId },
      body,
    });
  },

  /**
   * Get a table
   *
   * Gets the properties of an individual table that is part of an application.
   *
   * @param params.appId - The unique identifier of an app
   * @param params.tableId - The unique identifier (dbid) of the table.
   *
   * @returns Success
   *
   * @see https://developer.quickbase.com/operation/getTable
   */
  getTable(params: GetTableParams): Promise<GetTableResponse> {
    return request<GetTableResponse>({
      method: 'GET',
      path: `/tables/${params.tableId}`,
      query: { appId: params.appId },
    });
  },

  /**
   * Update a table
   *
   * Updates the main properties of a specific table. Any properties of the table that you do not specify in the request body will remain unchanged.
   *
   * @param params.appId - The unique identifier of an app
   * @param params.tableId - The unique identifier (dbid) of the table.
   *
   * @param body - Request body (optional)
   * @param body.name - The name for the table. (optional)
   * @param body.pluralRecordName - The plural noun for records in the table. If this value is not passed the default value is 'Records'. (optional)
   * @param body.singleRecordName - The singular noun for records in the table. If this value is not passed the default value is 'Record'. (optional)
   * @param body.description - The description for the table. If this value is not passed the default value is blank. (optional)
   *
   * @returns Success
   *
   * @see https://developer.quickbase.com/operation/updateTable
   */
  updateTable(params: UpdateTableParams, body?: UpdateTableRequest): Promise<UpdateTableResponse> {
    return request<UpdateTableResponse>({
      method: 'POST',
      path: `/tables/${params.tableId}`,
      query: { appId: params.appId },
      body,
    });
  },

  /**
   * Delete a table
   *
   * Deletes a specific table in an application, including all of the data within it.
   *
   * @param params.appId - The unique identifier of an app
   * @param params.tableId - The unique identifier (dbid) of the table.
   *
   * @returns Success
   *
   * @see https://developer.quickbase.com/operation/deleteTable
   */
  deleteTable(params: DeleteTableParams): Promise<DeleteTableResponse> {
    return request<DeleteTableResponse>({
      method: 'DELETE',
      path: `/tables/${params.tableId}`,
      query: { appId: params.appId },
    });
  },

  /**
   * Get all relationships
   *
   * Get a list of all relationships, and their definitions, for a specific table. Details are provided for the child side of relationships within a given application. Limited details are returned for cross-application relationships.
   *
   * @param params.skip - The number of relationships to skip. (optional)
   * @param params.tableId - The unique identifier (dbid) of the child table.
   *
   * @returns Success
   *
   * @see https://developer.quickbase.com/operation/getRelationships
   */
  getRelationships(params: GetRelationshipsParams): PaginatedRequest<GetRelationshipsResponse> {
    const executor = () => {
      return request<GetRelationshipsResponse>({
        method: 'GET',
        path: `/tables/${params.tableId}/relationships`,
        query: { skip: params.skip },
      });
    };
    const paginatedExecutor = (paginationParams: { skip?: number; nextPageToken?: string; nextToken?: string }) => {
      return request<GetRelationshipsResponse>({
        method: 'GET',
        path: `/tables/${params.tableId}/relationships`,
        query: { skip: params.skip, ...paginationParams },
      });
    };
    return createPaginatedRequest(executor, { paginatedExecutor, autoPaginate });
  },

  /**
   * Create a relationship
   *
   * Creates a relationship in a table as well as lookup/summary fields. Relationships can only be created for tables within the same app.
   *
   * @param params.tableId - The unique identifier (dbid) of the table. This will be the child table.
   *
   * @param body - Request body
   * @param body.summaryFields - Array of summary field objects which will turn into summary fields in the parent table. When you specify the 'COUNT' accumulation type, you have to specify 0 as the summaryFid (or not set it in the request). 'DISTINCT-COUNT' requires that summaryFid be set to an actual fid. (optional)
   * @param body.lookupFieldIds - Array of field IDs in the parent table that will become lookup fields in the child table. (optional)
   * @param body.parentTableId - The parent table id for the relationship.
   * @param body.foreignKeyField - This property is optional.  If it is not provided, the foreign key field will be created with the label ‘Related <record>', where <record> is the name of a record in the parent table. (optional)
   *
   * @returns Success
   *
   * @see https://developer.quickbase.com/operation/createRelationship
   */
  createRelationship(params: CreateRelationshipParams, body: CreateRelationshipRequest): Promise<CreateRelationshipResponse> {
    return request<CreateRelationshipResponse>({
      method: 'POST',
      path: `/tables/${params.tableId}/relationship`,
      body,
    });
  },

  /**
   * Update a relationship
   *
   * Use this endpoint to add lookup fields and summary fields to an existing relationship. Updating a relationship will not delete existing lookup/summary fields.
   *
   * @param params.tableId - The unique identifier (dbid) of the table. This will be the child table.
   * @param params.relationshipId - The relationship id. This is the field id of the reference field on the child table.
   *
   * @param body - Request body (optional)
   * @param body.summaryFields - An array of objects, each representing a configuration of one field from the child table, that will become summary fields on the parent table. When you specify the 'COUNT' accumulation type, you have to specify 0 as the summaryFid (or not set it in the request). 'DISTINCT-COUNT' requires that summaryFid be set to an actual fid. (optional)
   * @param body.lookupFieldIds - An array of field IDs on the parent table that will become lookup fields on the child table. (optional)
   *
   * @returns Success
   *
   * @see https://developer.quickbase.com/operation/updateRelationship
   */
  updateRelationship(params: UpdateRelationshipParams, body?: UpdateRelationshipRequest): Promise<UpdateRelationshipResponse> {
    return request<UpdateRelationshipResponse>({
      method: 'POST',
      path: `/tables/${params.tableId}/relationship/${params.relationshipId}`,
      body,
    });
  },

  /**
   * Delete a relationship
   *
   * Use this endpoint to delete an entire relationship, including all lookup and summary fields. The reference field in the relationship will not be deleted.
   *
   * @param params.tableId - The unique identifier (dbid) of the table. This will be the child table.
   * @param params.relationshipId - The relationship id. This is the field id of the reference field on the child table.
   *
   * @returns Success
   *
   * @see https://developer.quickbase.com/operation/deleteRelationship
   */
  deleteRelationship(params: DeleteRelationshipParams): Promise<DeleteRelationshipResponse> {
    return request<DeleteRelationshipResponse>({
      method: 'DELETE',
      path: `/tables/${params.tableId}/relationship/${params.relationshipId}`,
    });
  },

  /**
   * Get reports for a table
   *
   * Get the schema (properties) of all reports for a table. If the user running the API is an application administrator, the API will also return all personal reports with owner's user id.
   *
   * @param params.tableId - The unique identifier of the table.
   *
   * @returns Success
   *
   * @see https://developer.quickbase.com/operation/getTableReports
   */
  getTableReports(params: GetTableReportsParams): Promise<GetTableReportsResponse> {
    return request<GetTableReportsResponse>({
      method: 'GET',
      path: '/reports',
      query: { tableId: params.tableId },
    });
  },

  /**
   * Get a report
   *
   * Get the schema (properties) of an individual report.
   *
   * @param params.tableId - The unique identifier of table.
   * @param params.reportId - The identifier of the report, unique to the table.
   *
   * @returns Success
   *
   * @see https://developer.quickbase.com/operation/getReport
   */
  getReport(params: GetReportParams): Promise<GetReportResponse> {
    return request<GetReportResponse>({
      method: 'GET',
      path: `/reports/${params.reportId}`,
      query: { tableId: params.tableId },
    });
  },

  /**
   * Run a report
   *
   * Runs a report, based on an ID and returns the underlying data associated with it. The format of the data will vary based on the report type. Reports that focus on record-level data (table, calendar, etc.) return the individual records. Aggregate reports (summary, chart) will return the summarized information as configured in the report. UI-specific elements are not returned, such as totals, averages and visualizations. Returns data with intelligent pagination based on the approximate size of each record. The metadata object will include the necessary information to iterate over the response and gather more data.
   *
   * @param params.tableId - The identifier of the table for the report.
   * @param params.skip - The number of records to skip. You can set this value when paginating through a set of results. (optional)
   * @param params.top - The maximum number of records to return. You can override the default Quickbase pagination to get more or fewer results. If your requested value here exceeds the dynamic maximums, we will return a subset of results and the rest can be gathered in subsequent API calls. (optional)
   * @param params.reportId - The identifier of the report, unique to the table.
   *
   * @param body - Request body (optional)
   *
   * @returns Success
   *
   * @see https://developer.quickbase.com/operation/runReport
   */
  runReport(params: RunReportParams, body?: RunReportRequest): PaginatedRequest<RunReportResponse> {
    const executor = () => {
      return request<RunReportResponse>({
        method: 'POST',
        path: `/reports/${params.reportId}/run`,
        query: { tableId: params.tableId, skip: params.skip, top: params.top },
        body,
      });
    };
    const paginatedExecutor = (paginationParams: { skip?: number; nextPageToken?: string; nextToken?: string }) => {
      const bodyRecord = body as unknown as Record<string, unknown> | undefined;
      const paginatedBody = paginationParams.skip !== undefined || paginationParams.nextPageToken || paginationParams.nextToken
        ? {
            ...(bodyRecord || {}),
            options: {
              ...(bodyRecord?.options as Record<string, unknown> || {}),
              ...(paginationParams.skip !== undefined ? { skip: paginationParams.skip } : {}),
            },
            ...(paginationParams.nextPageToken ? { nextPageToken: paginationParams.nextPageToken } : {}),
            ...(paginationParams.nextToken ? { nextToken: paginationParams.nextToken } : {}),
          }
        : body;
      return request<RunReportResponse>({
        method: 'POST',
        path: `/reports/${params.reportId}/run`,
        query: { tableId: params.tableId, skip: params.skip, top: params.top },
        body: paginatedBody,
      });
    };
    return createPaginatedRequest(executor, { paginatedExecutor, autoPaginate });
  },

  /**
   * Get fields for a table
   *
   * Gets the properties for all fields in a specific table. The properties for each field are the same as in Get field.
   *
   * @param params.tableId - The unique identifier (dbid) of the table.
   * @param params.includeFieldPerms - Set to 'true' if you'd like to get back the custom permissions for the field(s). (optional)
   *
   * @returns Success
   *
   * @see https://developer.quickbase.com/operation/getFields
   */
  getFields(params: GetFieldsParams): Promise<GetFieldsResponse> {
    return request<GetFieldsResponse>({
      method: 'GET',
      path: '/fields',
      query: { tableId: params.tableId, includeFieldPerms: params.includeFieldPerms },
    });
  },

  /**
   * Create a field
   *
   * Creates a field within a table, including the custom permissions of that field.
   *
   * @param params.tableId - The unique identifier of the table.
   *
   * @param body - Request body
   * @param body.audited - Indicates if the field is being tracked as part of Quickbase Audit Logs. You can only set this property to "true" if the app has audit logs enabled. See Enable data change logs under [Quickbase Audit Logs](https://help.quickbase.com/docs/audit-logs). Defaults to false. (optional)
   * @param body.fieldHelp - The configured help text shown to users within the product. (optional)
   * @param body.bold - Indicates if the field is configured to display in bold in the product. Defaults to false. (optional)
   * @param body.properties - Specific field properties. (optional)
   * @param body.appearsByDefault - Indicates if the field is marked as a default in reports. Defaults to true. (optional)
   * @param body.fieldType - The [field types](https://help.quickbase.com/docs/field-types), click on any of the field type links for more info.
   * @param body.permissions - Field Permissions for different roles. (optional)
   * @param body.addToForms - Whether the field you are adding should appear on forms. Defaults to false. (optional)
   * @param body.label - The label (name) of the field.
   * @param body.findEnabled - Indicates if the field is marked as searchable. Defaults to true. (optional)
   * @param body.noWrap - Indicates if the field is configured to not wrap when displayed in the product. Defaults to false. (optional)
   *
   * @returns Success
   *
   * @see https://developer.quickbase.com/operation/createField
   */
  createField(params: CreateFieldParams, body: CreateFieldRequest): Promise<CreateFieldResponse> {
    return request<CreateFieldResponse>({
      method: 'POST',
      path: '/fields',
      query: { tableId: params.tableId },
      body,
    });
  },

  /**
   * Delete field(s)
   *
   * Deletes one or many fields in a table, based on field id. This will also permanently delete any data or calculations in that field.
   *
   * @param params.tableId - The unique identifier of the table.
   *
   * @param body - Request body
   * @param body.fieldIds - List of field IDs to be deleted.
   *
   * @returns Success
   *
   * @see https://developer.quickbase.com/operation/deleteFields
   */
  deleteFields(params: DeleteFieldsParams, body: DeleteFieldsRequest): Promise<DeleteFieldsResponse> {
    return request<DeleteFieldsResponse>({
      method: 'DELETE',
      path: '/fields',
      query: { tableId: params.tableId },
      body,
    });
  },

  /**
   * Get field
   *
   * Gets the properties of an individual field, based on field id.  
  Properties present on all field types are returned at the top level. Properties unique to a specific type of field are returned under the 'properties' attribute. Please see [Field types page](../fieldInfo) for more details on the properties for each field type.
   *
   * @param params.tableId - The unique identifier (dbid) of the table.
   * @param params.includeFieldPerms - Set to 'true' if you'd like to get back the custom permissions for the field(s). (optional)
   * @param params.fieldId - The unique identifier (fid) of the field.
   *
   * @returns Success
   *
   * @see https://developer.quickbase.com/operation/getField
   */
  getField(params: GetFieldParams): Promise<GetFieldResponse> {
    return request<GetFieldResponse>({
      method: 'GET',
      path: `/fields/${params.fieldId}`,
      query: { tableId: params.tableId, includeFieldPerms: params.includeFieldPerms },
    });
  },

  /**
   * Update a field
   *
   * Updates the properties and custom permissions of a field. The attempt to update certain properties might cause existing data to no longer obey the field's new properties and may be rejected. See the descriptions of required, unique, and choices, below, for specific situations. Any properties of the field that you do not specify in the request body will remain unchanged.
   *
   * @param params.tableId - The unique identifier of the table.
   * @param params.fieldId - The unique identifier (fid) of the field.
   *
   * @param body - Request body (optional)
   * @param body.audited - Indicates if the field is being tracked as part of Quickbase Audit Logs. You can only set this property to "true" if the app has audit logs enabled. See Enable data change logs under [Quickbase Audit Logs](https://help.quickbase.com/user-assistance/audit_logs.html). (optional)
   * @param body.fieldHelp - The configured help text shown to users within the product. (optional)
   * @param body.bold - Indicates if the field is configured to display in bold in the product. (optional)
   * @param body.required - Indicates if the field is required (i.e. if every record must have a non-null value in this field). If you attempt to change a field from not-required to required, and the table currently contains records that have null values in that field, you will get an error indicating that there are null values of the field. In this case you need to find and update those records with null values of the field before changing the field to required. (optional)
   * @param body.properties - Specific field properties. (optional)
   * @param body.appearsByDefault - Indicates if the field is marked as a default in reports. (optional)
   * @param body.unique - Indicates if every record in the table must contain a unique value of this field. If you attempt to change a field from not-unique to unique, and the table currently contains records with the same value of this field, you will get an error. In this case you need to find and update those records with duplicate values of the field before changing the field to unique. (optional)
   * @param body.permissions - Field Permissions for different roles. (optional)
   * @param body.addToForms - Whether the field you are adding should appear on forms. (optional)
   * @param body.label - The label (name) of the field. (optional)
   * @param body.findEnabled - Indicates if the field is marked as searchable. (optional)
   * @param body.noWrap - Indicates if the field is configured to not wrap when displayed in the product. (optional)
   *
   * @returns Success
   *
   * @see https://developer.quickbase.com/operation/updateField
   */
  updateField(params: UpdateFieldParams, body?: UpdateFieldRequest): Promise<UpdateFieldResponse> {
    return request<UpdateFieldResponse>({
      method: 'POST',
      path: `/fields/${params.fieldId}`,
      query: { tableId: params.tableId },
      body,
    });
  },

  /**
   * Get usage for all fields
   *
   * Get all the field usage statistics for a table. This is a summary of the information that can be found in the usage table of field properties.
   *
   * @param params.tableId - The unique identifier (dbid) of the table.
   * @param params.skip - The number of fields to skip from the list. (optional)
   * @param params.top - The maximum number of fields to return. (optional)
   *
   * @returns Success
   *
   * @see https://developer.quickbase.com/operation/getFieldsUsage
   */
  getFieldsUsage(params: GetFieldsUsageParams): Promise<GetFieldsUsageResponse> {
    return request<GetFieldsUsageResponse>({
      method: 'GET',
      path: '/fields/usage',
      query: { tableId: params.tableId, skip: params.skip, top: params.top },
    });
  },

  /**
   * Get usage for a field
   *
   * Get a single fields usage statistics. This is a summary of the information that can be found in the usage table of field properties.
   *
   * @param params.tableId - The unique identifier (dbid) of the table.
   * @param params.fieldId - The unique identifier (fid) of the field.
   *
   * @returns Success
   *
   * @see https://developer.quickbase.com/operation/getFieldUsage
   */
  getFieldUsage(params: GetFieldUsageParams): Promise<GetFieldUsageResponse> {
    return request<GetFieldUsageResponse>({
      method: 'GET',
      path: `/fields/usage/${params.fieldId}`,
      query: { tableId: params.tableId },
    });
  },

  /**
   * Run a formula
   *
   * Allows running a formula via an API call. Use this method in custom code to get the value back of a formula without a discrete field on a record.
   *
   * @param body - Request body
   * @param body.formula - The formula to run. This must be a valid Quickbase formula.
   * @param body.rid - The record ID to run the formula against. Only necessary for formulas that are run in the context of a record. For example, the formula User() does not need a record ID. (optional)
   * @param body.from - The unique identifier (dbid) of the table.
   *
   * @returns Success
   *
   * @see https://developer.quickbase.com/operation/runFormula
   */
  runFormula(body: RunFormulaRequest): Promise<RunFormulaResponse> {
    return request<RunFormulaResponse>({
      method: 'POST',
      path: '/formula/run',
      body,
    });
  },

  /**
   * Insert/Update record(s)
   *
   * Insert and/or update record(s) in a table. In this single API call, inserts and updates can be submitted. Update can use the key field on the table, or any other supported unique field. Refer to the [Field types page](../fieldInfo) for more information about how each field type should be formatted. This operation allows for incremental processing of successful records, even when some of the records fail.  
  **Note:** This endpoint supports a maximum payload size of 40MB.
   *
   * @param body - Request body
   * @param body.to - The table identifier.
   * @param body.data - Record data array, where each record contains key-value mappings of fields to be defined/updated and their values. (optional)
   * @param body.mergeFieldId - The merge field id. (optional)
   * @param body.fieldsToReturn - Specify an array of field IDs that will return data for any updates or added record. Record ID (FID 3) is always returned if any field ID is requested. (optional)
   *
   * @returns Response
   *
   * @see https://developer.quickbase.com/operation/upsert
   */
  upsert(body: UpsertRequest): PaginatedRequest<UpsertResponse> {
    const executor = () => {
      return request<UpsertResponse>({
        method: 'POST',
        path: '/records',
        body,
      });
    };
    const paginatedExecutor = (paginationParams: { skip?: number; nextPageToken?: string; nextToken?: string }) => {
      const bodyRecord = body as unknown as Record<string, unknown> | undefined;
      const paginatedBody = paginationParams.skip !== undefined || paginationParams.nextPageToken || paginationParams.nextToken
        ? {
            ...(bodyRecord || {}),
            options: {
              ...(bodyRecord?.options as Record<string, unknown> || {}),
              ...(paginationParams.skip !== undefined ? { skip: paginationParams.skip } : {}),
            },
            ...(paginationParams.nextPageToken ? { nextPageToken: paginationParams.nextPageToken } : {}),
            ...(paginationParams.nextToken ? { nextToken: paginationParams.nextToken } : {}),
          }
        : body;
      return request<UpsertResponse>({
        method: 'POST',
        path: '/records',
        body: paginatedBody,
      });
    };
    return createPaginatedRequest(executor, { paginatedExecutor, autoPaginate });
  },

  /**
   * Delete record(s)
   *
   * Deletes record(s) in a table based on a query. Alternatively, all records in the table can be deleted.
   *
   * @param body - Request body
   * @param body.from - The unique identifier of the table.
   * @param body.where - The filter to delete records. To delete all records specify a filter that will include all records, for example {3.GT.0} where 3 is the ID of the Record ID field. Or supply a JSON array of Record IDs.
   *
   * @returns Successful delete records response.
   *
   * @see https://developer.quickbase.com/operation/deleteRecords
   */
  deleteRecords(body: DeleteRecordsRequest): Promise<DeleteRecordsResponse> {
    return request<DeleteRecordsResponse>({
      method: 'DELETE',
      path: '/records',
      body,
    });
  },

  /**
   * Query for data
   *
   * Pass in a query in the [Quickbase query language](https://help.quickbase.com/api-guide/componentsquery.html). Returns record data with [intelligent pagination](../pagination) based on the approximate size of each record. The metadata object will include the necessary information to iterate over the response and gather more data.
   *
   * @param body - Request body
   * @param body.options - Additional query options. (optional)
   * @param body.where - The filter, using the Quickbase query language, which determines the records to return. Or supply a JSON array of Record IDs. If this parameter is omitted, the query will return all records. (optional)
   * @param body.groupBy - An array that contains the fields to group the records by. (optional)
   * @param body.sortBy - The sortBy (optional)
   * @param body.select - An array of field IDs for the fields that should be returned in the response. If empty, the default columns on the table will be returned. (optional)
   * @param body.from - The table identifier.
   *
   * @returns Success
   *
   * @see https://developer.quickbase.com/operation/runQuery
   */
  runQuery(body: RunQueryRequest): PaginatedRequest<RunQueryResponse> {
    const executor = () => {
      return request<RunQueryResponse>({
        method: 'POST',
        path: '/records/query',
        body,
      });
    };
    const paginatedExecutor = (paginationParams: { skip?: number; nextPageToken?: string; nextToken?: string }) => {
      const bodyRecord = body as unknown as Record<string, unknown> | undefined;
      const paginatedBody = paginationParams.skip !== undefined || paginationParams.nextPageToken || paginationParams.nextToken
        ? {
            ...(bodyRecord || {}),
            options: {
              ...(bodyRecord?.options as Record<string, unknown> || {}),
              ...(paginationParams.skip !== undefined ? { skip: paginationParams.skip } : {}),
            },
            ...(paginationParams.nextPageToken ? { nextPageToken: paginationParams.nextPageToken } : {}),
            ...(paginationParams.nextToken ? { nextToken: paginationParams.nextToken } : {}),
          }
        : body;
      return request<RunQueryResponse>({
        method: 'POST',
        path: '/records/query',
        body: paginatedBody,
      });
    };
    return createPaginatedRequest(executor, { paginatedExecutor, autoPaginate });
  },

  /**
   * Get records modified since
   *
   * Checks for record changes on the current table and crawls the record dependency graph based on a provided field list. This determines if records on the table changed after the provided timestamp, when factoring in their dependencies. This API requires app admin permissions and only reviews lookup and summary fields in supported relationships.
  To return deleted records for the current table, 'Index record changes' must be enabled.
  Dependent tables only evaluate current records, and deleted records are not supported.
   *
   * @param body - Request body (optional)
   * @param body.after - A timestamp, formatted in ISO-8601 UTC, representing the date and time to search.
   * @param body.fieldList - List of field IDs. Each field is crawled across the entire record dependency graph to find its source record's date modified. If one is not provided, only the current table will be referenced. (optional)
   * @param body.includeDetails - When true, the individual record IDs and timestamps will be returned. If false, only the count of changes will be returned. (optional)
   * @param body.from - The table identifier.
   *
   * @returns Success
   *
   * @see https://developer.quickbase.com/operation/recordsModifiedSince
   */
  recordsModifiedSince(body?: RecordsModifiedSinceRequest): Promise<RecordsModifiedSinceResponse> {
    return request<RecordsModifiedSinceResponse>({
      method: 'POST',
      path: '/records/modifiedSince',
      body,
    });
  },

  /**
   * Get a temporary token for a dbid
   *
   * Use this endpoint to get a temporary authorization token, scoped to either an app or a table. It can only be used inside of code pages for client-side authentication because it relies on the browser session. Learn more about [extending Quickbase](https://helpv2.quickbase.com/hc/en-us/articles/4570341709844-Extending-Quickbase). You can then use this token to make other API calls (see [authorization](../auth)).  This token expires in 5 minutes.
   *
   * @param params.dbid - The unique identifier of an app or table.
   *
   * @returns This token is used in the authorization header value (similar to the QB-USER-TOKEN), except it uses the QB-TEMP-TOKEN prefix header['Authorization'] = 'QB-TEMP-TOKEN {token}'
   *
   * @see https://developer.quickbase.com/operation/getTempTokenDBID
   */
  getTempTokenDBID(params: GetTempTokenDBIDParams): Promise<GetTempTokenDBIDResponse> {
    return request<GetTempTokenDBIDResponse>({
      method: 'GET',
      path: `/auth/temporary/${params.dbid}`,
    });
  },

  /**
   * Exchange an SSO token
   *
   * Use this endpoint to exchange a SAML assertion for a Quickbase token following [RFC 8693](https://www.rfc-editor.org/rfc/rfc8693.html). Callers can choose to return a token compatible with SCIM, XML, or RESTful APIs. The token duration is determined by the [SAML timeout session time](https://helpv2.quickbase.com/hc/en-us/articles/4570410646420-SAML-assertion-example#:~:text=Setting%20SAML%20timeout%20session%20time). You must be able to create a SAML assertion in your code to use this endpoint. The SAML assertion is verified against the configuration on the realm. Learn more about about [SAML assertions](https://helpv2.quickbase.com/hc/en-us/articles/4570410646420-SAML-assertion-example).
   *
   * @param body - Request body
   * @param body.grant_type - The value `urn:ietf:params:oauth:grant-type:token-exchange` indicates that a token exchange is being performed.
   * @param body.requested_token_type - An identifier for the type of the requested security token. For the RESTful API, use `urn:quickbase:params:oauth:token-type:temp_token`. For the XML or SCIM APIs use `urn:quickbase:params:oauth:token-type:temp_ticket`.
   * @param body.subject_token - A security token that represents the identity of the party on behalf of whom the request is being made. For SAML 2.0, the value should be a base64url-encoded SAML 2.0 assertion.
   * @param body.subject_token_type - An identifier that indicates the type of the security token in the `subject_token` parameter.
   *
   * @returns Success
   *
   * @see https://developer.quickbase.com/operation/exchangeSsoToken
   */
  exchangeSsoToken(body: ExchangeSsoTokenRequest): Promise<ExchangeSsoTokenResponse> {
    return request<ExchangeSsoTokenResponse>({
      method: 'POST',
      path: '/auth/oauth/token',
      body,
    });
  },

  /**
   * Clone a user token
   *
   * Clones the authenticated user token. All applications associated with that token are automatically associated with the new token.
   *
   * @param body - Request body
   * @param body.name - The new name for the cloned user token. (optional)
   * @param body.description - The description for the cloned user token. (optional)
   *
   * @returns Response
   *
   * @see https://developer.quickbase.com/operation/cloneUserToken
   */
  cloneUserToken(body: CloneUserTokenRequest): Promise<CloneUserTokenResponse> {
    return request<CloneUserTokenResponse>({
      method: 'POST',
      path: '/usertoken/clone',
      body,
    });
  },

  /**
   * Transfer a user token
   *
   * Transfers the specified user token. Application associations will remain intact. For security, permissions must manually be reconciled.
   *
   * @param body - Request body
   * @param body.id - The id of the user token to transfer (optional)
   * @param body.from - The id of the user to transfer the user token from (optional)
   * @param body.to - The id of the user to transfer the user token to (optional)
   *
   * @returns Response
   *
   * @see https://developer.quickbase.com/operation/transferUserToken
   */
  transferUserToken(body: TransferUserTokenRequest): Promise<TransferUserTokenResponse> {
    return request<TransferUserTokenResponse>({
      method: 'POST',
      path: '/usertoken/transfer',
      body,
    });
  },

  /**
   * Deactivate a user token
   *
   * Deactivates the authenticated user token. Once this is done, the user token must be reactivated in the user interface.
   *
   * @returns Response
   *
   * @see https://developer.quickbase.com/operation/deactivateUserToken
   */
  deactivateUserToken(): Promise<DeactivateUserTokenResponse> {
    return request<DeactivateUserTokenResponse>({
      method: 'POST',
      path: '/usertoken/deactivate',
    });
  },

  /**
   * Delete a user token
   *
   * Deletes the authenticated user token. This is not reversible.
   *
   * @returns Response
   *
   * @see https://developer.quickbase.com/operation/deleteUserToken
   */
  deleteUserToken(): Promise<DeleteUserTokenResponse> {
    return request<DeleteUserTokenResponse>({
      method: 'DELETE',
      path: '/usertoken',
    });
  },

  /**
   * Download file
   *
   * Downloads the file attachment, with the file attachment content encoded in base64 format. The API response returns the file name in the `Content-Disposition` header. Meta-data about files can be retrieved from the /records and /reports endpoints, where applicable. Use those endpoints to get the necessary information to fetch files.
   *
   * @param params.tableId - The unique identifier of the table.
   * @param params.recordId - The unique identifier of the record.
   * @param params.fieldId - The unique identifier of the field.
   * @param params.versionNumber - The file attachment version number.
   *
   * @returns Success
   *
   * @see https://developer.quickbase.com/operation/downloadFile
   */
  downloadFile(params: DownloadFileParams): Promise<DownloadFileResponse> {
    return request<DownloadFileResponse>({
      method: 'GET',
      path: `/files/${params.tableId}/${params.recordId}/${params.fieldId}/${params.versionNumber}`,
    });
  },

  /**
   * Delete file
   *
   * Deletes one file attachment version. Meta-data about files can be retrieved from the /records and /reports endpoints, where applicable. Use those endpoints to get the necessary information to delete file versions.
   *
   * @param params.tableId - The unique identifier of the table.
   * @param params.recordId - The unique identifier of the record.
   * @param params.fieldId - The unique identifier of the field.
   * @param params.versionNumber - The file attachment version number.
   *
   * @returns Successfully Deleted the File Attachment
   *
   * @see https://developer.quickbase.com/operation/deleteFile
   */
  deleteFile(params: DeleteFileParams): Promise<DeleteFileResponse> {
    return request<DeleteFileResponse>({
      method: 'DELETE',
      path: `/files/${params.tableId}/${params.recordId}/${params.fieldId}/${params.versionNumber}`,
    });
  },

  /**
   * Get users
   *
   * Get all users in an account or narrowed down list of users filtered by email(s). The returned users may be paginated depending on the user count. The count of the returned users may vary. When `nextPageToken` value in the response is not empty, that indicates that there are more results to be returned, you can use this value to get the next result set ('page').
   *
   * @param params.accountId - The account id being used to get users. If no value is specified, the first account associated with the requesting user token is chosen. (optional)
   *
   * @param body - Request body (optional)
   * @param body.emails - When provided, the returned users will be narrowed down only to the users included in this list. (optional)
   * @param body.appIds - When provided, the returned users will be narrowed down only to the users assigned to the app id's provided in this list. The provided app id's should belong to the same account. (optional)
   * @param body.nextPageToken - Next page token used to get the next 'page' of results when available. When this field is empty, the first page is returned. (optional)
   *
   * @returns Success
   *
   * @see https://developer.quickbase.com/operation/getUsers
   */
  getUsers(params: GetUsersParams, body?: GetUsersRequest): PaginatedRequest<GetUsersResponse> {
    const executor = () => {
      return request<GetUsersResponse>({
        method: 'POST',
        path: '/users',
        query: { accountId: params.accountId },
        body,
      });
    };
    const paginatedExecutor = (paginationParams: { skip?: number; nextPageToken?: string; nextToken?: string }) => {
      const bodyRecord = body as unknown as Record<string, unknown> | undefined;
      const paginatedBody = paginationParams.skip !== undefined || paginationParams.nextPageToken || paginationParams.nextToken
        ? {
            ...(bodyRecord || {}),
            options: {
              ...(bodyRecord?.options as Record<string, unknown> || {}),
              ...(paginationParams.skip !== undefined ? { skip: paginationParams.skip } : {}),
            },
            ...(paginationParams.nextPageToken ? { nextPageToken: paginationParams.nextPageToken } : {}),
            ...(paginationParams.nextToken ? { nextToken: paginationParams.nextToken } : {}),
          }
        : body;
      return request<GetUsersResponse>({
        method: 'POST',
        path: '/users',
        query: { accountId: params.accountId },
        body: paginatedBody,
      });
    };
    return createPaginatedRequest(executor, { paginatedExecutor, autoPaginate });
  },

  /**
   * Deny users
   *
   * Denies users access to the realm but leaves them listed in groups they have been added to.
   *
   * @param params.accountId - The account id being used to deny users. If no value is specified, the first account associated with the requesting user token is chosen. (optional)
   *
   * @param body - Request body
   *
   * @returns Success
   *
   * @see https://developer.quickbase.com/operation/denyUsers
   */
  denyUsers(params: DenyUsersParams, body: DenyUsersRequest): Promise<DenyUsersResponse> {
    return request<DenyUsersResponse>({
      method: 'PUT',
      path: '/users/deny',
      query: { accountId: params.accountId },
      body,
    });
  },

  /**
   * Deny and remove users from groups
   *
   * Denies users access to the realm and allows you to remove them from groups.
   *
   * @param params.accountId - The account id being used to deny users. If no value is specified, the first account associated with the requesting user token is chosen. (optional)
   * @param params.shouldDeleteFromGroups - Specifies if the users should also be removed from all groups.
   *
   * @param body - Request body
   *
   * @returns Success
   *
   * @see https://developer.quickbase.com/operation/denyUsersAndGroups
   */
  denyUsersAndGroups(params: DenyUsersAndGroupsParams, body: DenyUsersAndGroupsRequest): Promise<DenyUsersAndGroupsResponse> {
    return request<DenyUsersAndGroupsResponse>({
      method: 'PUT',
      path: `/users/deny/${params.shouldDeleteFromGroups}`,
      query: { accountId: params.accountId },
      body,
    });
  },

  /**
   * Undeny users
   *
   * Grants users that have previously been denied access to the realm.
   *
   * @param params.accountId - The account id being used to undeny users. If no value is specified, the first account associated with the requesting user token is chosen. (optional)
   *
   * @param body - Request body
   *
   * @returns Success
   *
   * @see https://developer.quickbase.com/operation/undenyUsers
   */
  undenyUsers(params: UndenyUsersParams, body: UndenyUsersRequest): Promise<UndenyUsersResponse> {
    return request<UndenyUsersResponse>({
      method: 'PUT',
      path: '/users/undeny',
      query: { accountId: params.accountId },
      body,
    });
  },

  /**
   * Add members
   *
   * Adds a list of users to a given group as members.
   *
   * @param params.gid - This is the ID of the group being modified.
   *
   * @param body - Request body
   *
   * @returns Success
   *
   * @see https://developer.quickbase.com/operation/addMembersToGroup
   */
  addMembersToGroup(params: AddMembersToGroupParams, body: AddMembersToGroupRequest): Promise<AddMembersToGroupResponse> {
    return request<AddMembersToGroupResponse>({
      method: 'POST',
      path: `/groups/${params.gid}/members`,
      body,
    });
  },

  /**
   * Remove members
   *
   * Removes a list of members from a given group.
   *
   * @param params.gid - This is the ID of the group being modified.
   *
   * @param body - Request body
   *
   * @returns Success
   *
   * @see https://developer.quickbase.com/operation/removeMembersFromGroup
   */
  removeMembersFromGroup(params: RemoveMembersFromGroupParams, body: RemoveMembersFromGroupRequest): Promise<RemoveMembersFromGroupResponse> {
    return request<RemoveMembersFromGroupResponse>({
      method: 'DELETE',
      path: `/groups/${params.gid}/members`,
      body,
    });
  },

  /**
   * Add managers
   *
   * Adds a list of users to a given group as managers.
   *
   * @param params.gid - This is the ID of the group being modified.
   *
   * @param body - Request body
   *
   * @returns Success
   *
   * @see https://developer.quickbase.com/operation/addManagersToGroup
   */
  addManagersToGroup(params: AddManagersToGroupParams, body: AddManagersToGroupRequest): Promise<AddManagersToGroupResponse> {
    return request<AddManagersToGroupResponse>({
      method: 'POST',
      path: `/groups/${params.gid}/managers`,
      body,
    });
  },

  /**
   * Remove managers
   *
   * Removes a list of managers from a given group.
   *
   * @param params.gid - This is the ID of the group being modified.
   *
   * @param body - Request body
   *
   * @returns Success
   *
   * @see https://developer.quickbase.com/operation/removeManagersFromGroup
   */
  removeManagersFromGroup(params: RemoveManagersFromGroupParams, body: RemoveManagersFromGroupRequest): Promise<RemoveManagersFromGroupResponse> {
    return request<RemoveManagersFromGroupResponse>({
      method: 'DELETE',
      path: `/groups/${params.gid}/managers`,
      body,
    });
  },

  /**
   * Add child groups
   *
   * Adds a list of groups to a given group.
   *
   * @param params.gid - This is the ID of the group being modified.
   *
   * @param body - Request body
   *
   * @returns Success
   *
   * @see https://developer.quickbase.com/operation/addSubgroupsToGroup
   */
  addSubgroupsToGroup(params: AddSubgroupsToGroupParams, body: AddSubgroupsToGroupRequest): Promise<AddSubgroupsToGroupResponse> {
    return request<AddSubgroupsToGroupResponse>({
      method: 'POST',
      path: `/groups/${params.gid}/subgroups`,
      body,
    });
  },

  /**
   * Remove child groups
   *
   * Removes a list of groups from a given group.
   *
   * @param params.gid - This is the ID of the group being modified.
   *
   * @param body - Request body
   *
   * @returns Success
   *
   * @see https://developer.quickbase.com/operation/removeSubgroupsFromGroup
   */
  removeSubgroupsFromGroup(params: RemoveSubgroupsFromGroupParams, body: RemoveSubgroupsFromGroupRequest): Promise<RemoveSubgroupsFromGroupResponse> {
    return request<RemoveSubgroupsFromGroupResponse>({
      method: 'DELETE',
      path: `/groups/${params.gid}/subgroups`,
      body,
    });
  },

  /**
   * Get audit logs
   *
   * Gathers the audit logs for a single day from a realm. By default, this API returns 10,000 entries. This can be changed with the numRows parameter. Integrators can iterate through batches to get an entire day's worth of logs. Each realm has a maximum entitlement of querying 1,000 days per year (allowing lookbacks for up to two years). Requests for paginated data do not count towards the annual limit. Transactional rate limits are 10 per 10 seconds.  
  **Note:** This API is available for enterprise users only.
   *
   * @param body - Request body
   * @param body.nextToken - Token specifying start of page. For first page don't supply this. (optional)
   * @param body.numRows - Number of logs to return per page, default is 10000, minimum is 1000, max is 50000. (optional)
   * @param body.queryId - The query id of an audit log request. This id is needed to fetch subsequent paged results of a single query. (optional)
   * @param body.date - The date for which audit logs need to be fetched. This must be date-time only, as YYYY-MM-DD, and a valid date in the past. (optional)
   * @param body.topics - An array that may contain up to 20 [topics](https://resources.quickbase.com/nav/app/budurkasx/action/showpage/2b2941e4-f34d-4d41-9b0e-db790d20e9ab?pageIdV2=quickbase.com-DashboardGroup-15760d74-2243-4ce9-9495-7cc8790f12e7) to filter by. If empty, all topics are returned. (optional)
   *
   * @returns Query ran successfully and has returned the events for the given time period.
   *
   * @see https://developer.quickbase.com/operation/audit
   */
  audit(body: AuditRequest): Promise<AuditResponse> {
    return request<AuditResponse>({
      method: 'POST',
      path: '/audit',
      body,
    });
  },

  /**
   * Get read summaries
   *
   * Get user read and integration read summaries for any day in the past.  
  **Note:** This API is available for enterprise users only.
   *
   * @param params.day - The date for which read summaries need to be fetched. This must be date-time only, as YYYY-MM-DD, and a valid date in the past. (optional)
   *
   * @returns Summaries returned succesfully
   *
   * @see https://developer.quickbase.com/operation/platformAnalyticReads
   */
  platformAnalyticReads(params: PlatformAnalyticReadsParams): Promise<PlatformAnalyticReadsResponse> {
    return request<PlatformAnalyticReadsResponse>({
      method: 'GET',
      path: '/analytics/reads',
      query: { day: params.day },
    });
  },

  /**
   * Get event summaries
   *
   * Get event summaries for any span of days up to one year and excluding future dates.
  **Note:** This API is available for enterprise users only. Data is updated hourly; to ensure accuracy, query dates should be at least one hour in the past. Transactional rate limits are 100 per hour.
   *
   * @param params.accountId - The ID of the account to query. If no value is specified, the first account matching the provided domain is chosen. (optional)
   *
   * @param body - Request body
   * @param body.start - The start date and time of the requested summaries in ISO 8601 time format.
   * @param body.end - The end date and time of the requested summaries in ISO 8601 time format.
   * @param body.nextToken - A pagination token from a previous response made using the same parameters. Used to fetch the next page. (optional)
   * @param body.groupBy - How the events should be grouped.
   * @param body.where - A list of items to filter events by. Only events which match ALL criteria will be included in the results. (optional)
   *
   * @returns Event summaries returned succesfully
   *
   * @see https://developer.quickbase.com/operation/platformAnalyticEventSummaries
   */
  platformAnalyticEventSummaries(params: PlatformAnalyticEventSummariesParams, body: PlatformAnalyticEventSummariesRequest): PaginatedRequest<PlatformAnalyticEventSummariesResponse> {
    const executor = () => {
      return request<PlatformAnalyticEventSummariesResponse>({
        method: 'POST',
        path: '/analytics/events/summaries',
        query: { accountId: params.accountId },
        body,
      });
    };
    const paginatedExecutor = (paginationParams: { skip?: number; nextPageToken?: string; nextToken?: string }) => {
      const bodyRecord = body as unknown as Record<string, unknown> | undefined;
      const paginatedBody = paginationParams.skip !== undefined || paginationParams.nextPageToken || paginationParams.nextToken
        ? {
            ...(bodyRecord || {}),
            options: {
              ...(bodyRecord?.options as Record<string, unknown> || {}),
              ...(paginationParams.skip !== undefined ? { skip: paginationParams.skip } : {}),
            },
            ...(paginationParams.nextPageToken ? { nextPageToken: paginationParams.nextPageToken } : {}),
            ...(paginationParams.nextToken ? { nextToken: paginationParams.nextToken } : {}),
          }
        : body;
      return request<PlatformAnalyticEventSummariesResponse>({
        method: 'POST',
        path: '/analytics/events/summaries',
        query: { accountId: params.accountId },
        body: paginatedBody,
      });
    };
    return createPaginatedRequest(executor, { paginatedExecutor, autoPaginate });
  },

  /**
   * Export a solution
   *
   * Returns the QBL for the specified solution. Learn more about [QBL syntax](https://help.quickbase.com/docs/qbl-definition-structure-and-syntax).  
   We are releasing schema coverage for QBL in stages. See [what's supported today](https://help.quickbase.com/docs/qbl-versions) in our QBL documentation.
   *
   * @param params.solutionId - The unique identifier (UUID) or the alias of the solution.
   *
   * @returns Success
   *
   * @see https://developer.quickbase.com/operation/exportSolution
   */
  exportSolution(params: ExportSolutionParams): Promise<ExportSolutionResponse> {
    return request<ExportSolutionResponse>({
      method: 'GET',
      path: `/solutions/${params.solutionId}`,
    });
  },

  /**
   * Update a solution
   *
   * Updates the solution using the provided QBL. Learn more about [QBL syntax](https://help.quickbase.com/hc/en-us/articles/24845511223828-What-is-QBL).  
   We are releasing schema coverage for QBL in stages. See [what's supported today](https://helpv2.quickbase.com/hc/en-us/sections/26699387198228-QBL-Versions) in our QBL documentation.
   *
   * @param params.solutionId - The unique identifier (UUID) or the alias of the solution.
   *
   * @param body - The QBL to be used for the update. (optional)
   *
   * @returns Success
   *
   * @see https://developer.quickbase.com/operation/updateSolution
   */
  updateSolution(params: UpdateSolutionParams, body?: UpdateSolutionRequest): Promise<UpdateSolutionResponse> {
    return request<UpdateSolutionResponse>({
      method: 'PUT',
      path: `/solutions/${params.solutionId}`,
      body,
    });
  },

  /**
   * Create a solution
   *
   * Creates a solution using the provided QBL. Learn more about [QBL syntax](https://help.quickbase.com/hc/en-us/articles/24845511223828-What-is-QBL).  
   We are releasing schema coverage for QBL in stages. See [what's supported today](https://helpv2.quickbase.com/hc/en-us/sections/26699387198228-QBL-Versions) in our QBL documentation.
   *
   * @param body - The QBL to be used for the create.
   *
   * @returns Success
   *
   * @see https://developer.quickbase.com/operation/createSolution
   */
  createSolution(body: CreateSolutionRequest): Promise<CreateSolutionResponse> {
    return request<CreateSolutionResponse>({
      method: 'POST',
      path: '/solutions',
      body,
    });
  },

  /**
   * Export solution to record
   *
   * Exports the solution and outputs the resulting QBL in a new record in the specified table. The QBL will be saved to a file in the file attachment field that is specified. The table cannot have any required fields besides the file attachment field.  
   We are releasing schema coverage for QBL in stages. See [what's supported today](https://helpv2.quickbase.com/hc/en-us/sections/26699387198228-QBL-Versions) in our QBL documentation.
   *
   * @param params.solutionId - The unique identifier of the solution.
   * @param params.tableId - The unique identifier (dbid) of the table.
   * @param params.fieldId - The unique identifier (fid) of the field. It needs to be a file attachment field.
   *
   * @returns Success
   *
   * @see https://developer.quickbase.com/operation/exportSolutionToRecord
   */
  exportSolutionToRecord(params: ExportSolutionToRecordParams): Promise<ExportSolutionToRecordResponse> {
    return request<ExportSolutionToRecordResponse>({
      method: 'GET',
      path: `/solutions/${params.solutionId}/torecord`,
      query: { tableId: params.tableId, fieldId: params.fieldId },
    });
  },

  /**
   * Create solution from record
   *
   * Creates a solution using the QBL from the specified record.  
   We are releasing schema coverage for QBL in stages. See [what's supported today](https://helpv2.quickbase.com/hc/en-us/sections/26699387198228-QBL-Versions) in our QBL documentation.
   *
   * @param params.tableId - The unique identifier (dbid) of the table.
   * @param params.fieldId - The unique identifier (fid) of the field. It needs to be a file attachment field.
   * @param params.recordId - The unique identifier of the record.
   *
   * @returns Success
   *
   * @see https://developer.quickbase.com/operation/createSolutionFromRecord
   */
  createSolutionFromRecord(params: CreateSolutionFromRecordParams): Promise<CreateSolutionFromRecordResponse> {
    return request<CreateSolutionFromRecordResponse>({
      method: 'GET',
      path: '/solutions/fromrecord',
      query: { tableId: params.tableId, fieldId: params.fieldId, recordId: params.recordId },
    });
  },

  /**
   * Update solution from record
   *
   * Updates a solution using the QBL from the specified record.  
   We are releasing schema coverage for QBL in stages. See [what's supported today](https://helpv2.quickbase.com/hc/en-us/sections/26699387198228-QBL-Versions) in our QBL documentation.
   *
   * @param params.solutionId - The unique identifier of the solution.
   * @param params.tableId - The unique identifier (dbid) of the table.
   * @param params.fieldId - The unique identifier (fid) of the field. It needs to be a file attachment field.
   * @param params.recordId - The unique identifier of the record.
   *
   * @returns Success
   *
   * @see https://developer.quickbase.com/operation/updateSolutionToRecord
   */
  updateSolutionToRecord(params: UpdateSolutionToRecordParams): Promise<UpdateSolutionToRecordResponse> {
    return request<UpdateSolutionToRecordResponse>({
      method: 'GET',
      path: `/solutions/${params.solutionId}/fromrecord`,
      query: { tableId: params.tableId, fieldId: params.fieldId, recordId: params.recordId },
    });
  },

  /**
   * List solution changes
   *
   * Returns a list of changes that would occur if the provided QBL were to be applied. Learn more about [QBL syntax](https://help.quickbase.com/hc/en-us/articles/24845511223828-What-is-QBL).  
   We are releasing schema coverage for QBL in stages. See [what's supported today](https://helpv2.quickbase.com/hc/en-us/sections/26699387198228-QBL-Versions) in our QBL documentation.
   *
   * @param params.solutionId - The unique identifier of the solution.
   *
   * @param body - The QBL to be used for the changeset.
   *
   * @returns Success
   *
   * @see https://developer.quickbase.com/operation/changesetSolution
   */
  changesetSolution(params: ChangesetSolutionParams, body: ChangesetSolutionRequest): Promise<ChangesetSolutionResponse> {
    return request<ChangesetSolutionResponse>({
      method: 'PUT',
      path: `/solutions/${params.solutionId}/changeset`,
      body,
    });
  },

  /**
   * List solution changes from record
   *
   * Returns a list of changes that would occur if the QBL from the provided record were to be applied.  
   We are releasing schema coverage for QBL in stages. See [what's supported today](https://helpv2.quickbase.com/hc/en-us/sections/26699387198228-QBL-Versions) in our QBL documentation.
   *
   * @param params.solutionId - The unique identifier of the solution.
   * @param params.tableId - The unique identifier (dbid) of the table.
   * @param params.fieldId - The unique identifier (fid) of the field. It needs to be a file attachment field.
   * @param params.recordId - The unique identifier of the record.
   *
   * @returns Success
   *
   * @see https://developer.quickbase.com/operation/changesetSolutionFromRecord
   */
  changesetSolutionFromRecord(params: ChangesetSolutionFromRecordParams): Promise<ChangesetSolutionFromRecordResponse> {
    return request<ChangesetSolutionFromRecordResponse>({
      method: 'GET',
      path: `/solutions/${params.solutionId}/changeset/fromrecord`,
      query: { tableId: params.tableId, fieldId: params.fieldId, recordId: params.recordId },
    });
  },

  /**
   * Generate a document
   *
   * Generates a document from a template. After changing a template, allow up to 15 minutes for documents generated via the API to reflect the changes. This feature is only available on business or enterprise plans.
   *
   * @param params.templateId - This is the ID of document template.
   * @param params.tableId - The unique identifier of the table.
   * @param params.recordId - The ID of the record (optional)
   * @param params.filename - File name for the downloaded file
   * @param params.format - The format of the file that is returned. Default is "pdf". (optional)
   * @param params.margin - Margin formatted as top right bottom left, separated by spaces. Add to override the value set in the template builder. (optional)
   * @param params.unit - Unit of measurement for the margin. Default is "in". Add to override the value set in the template builder. (optional)
   * @param params.pageSize - Page size. Default is "A4". Add to override the value set in the template builder. (optional)
   * @param params.orientation - Page orientation. Default is "portrait". Add to override the value set in the template builder. (optional)
   * @param params.realm - Your Quickbase domain, for example demo.quickbase.com (optional)
   *
   * @returns Success
   *
   * @see https://developer.quickbase.com/operation/generateDocument
   */
  generateDocument(params: GenerateDocumentParams): Promise<GenerateDocumentResponse> {
    return request<GenerateDocumentResponse>({
      method: 'GET',
      path: `/docTemplates/${params.templateId}/generate`,
      query: { tableId: params.tableId, recordId: params.recordId, filename: params.filename, format: params.format, margin: params.margin, unit: params.unit, pageSize: params.pageSize, orientation: params.orientation, realm: params.realm },
    });
  },

  /**
   * Get solution information
   *
   * Returns the metadata and resource information for a solution, including both real and logical IDs of apps and pipelines contained within the solution. This endpoint provides programmatic access to solution structure information.
   *
   * @param params.solutionId - The unique identifier (UUID) or the alias of the solution.
   *
   * @returns Success
   *
   * @see https://developer.quickbase.com/operation/getSolutionPublic
   */
  getSolutionPublic(params: GetSolutionPublicParams): Promise<GetSolutionPublicResponse> {
    return request<GetSolutionPublicResponse>({
      method: 'GET',
      path: `/solutions/${params.solutionId}/resources`,
    });
  },

  /**
   * Get trustees for an app
   *
   * Returns the list of trustees for a specific application. Trustees include users, groups and email domain groups.
   *
   * @param params.appId - The unique identifier of an app
   *
   * @returns Success
   *
   * @see https://developer.quickbase.com/operation/getTrustees
   */
  getTrustees(params: GetTrusteesParams): Promise<GetTrusteesResponse> {
    return request<GetTrusteesResponse>({
      method: 'GET',
      path: `/app/${params.appId}/trustees`,
    });
  },

  /**
   * Add trustees to an app
   *
   * Add trustees to the specified application. Trustees include users, groups and email domain groups.
   *
   * @param params.appId - The unique identifier of an app
   *
   * @param body - Request body (optional)
   *
   * @returns Success
   *
   * @see https://developer.quickbase.com/operation/addTrustees
   */
  addTrustees(params: AddTrusteesParams, body?: AddTrusteesRequest): Promise<AddTrusteesResponse> {
    return request<AddTrusteesResponse>({
      method: 'POST',
      path: `/app/${params.appId}/trustees`,
      body,
    });
  },

  /**
   * Remove trustees from an app
   *
   * Remove trustees from the specified application. Trustees include users, groups and email domain groups.
   *
   * @param params.appId - The unique identifier of an app
   *
   * @param body - Request body (optional)
   *
   * @returns Success
   *
   * @see https://developer.quickbase.com/operation/removeTrustees
   */
  removeTrustees(params: RemoveTrusteesParams, body?: RemoveTrusteesRequest): Promise<RemoveTrusteesResponse> {
    return request<RemoveTrusteesResponse>({
      method: 'DELETE',
      path: `/app/${params.appId}/trustees`,
      body,
    });
  },

  /**
   * Update trustees of an app
   *
   * Update trustees for the specified application. Trustees include users, groups and email domain groups.
   *
   * @param params.appId - The unique identifier of an app
   *
   * @param body - Request body (optional)
   *
   * @returns Success
   *
   * @see https://developer.quickbase.com/operation/updateTrustees
   */
  updateTrustees(params: UpdateTrusteesParams, body?: UpdateTrusteesRequest): Promise<UpdateTrusteesResponse> {
    return request<UpdateTrusteesResponse>({
      method: 'PATCH',
      path: `/app/${params.appId}/trustees`,
      body,
    });
  },
  };
}
