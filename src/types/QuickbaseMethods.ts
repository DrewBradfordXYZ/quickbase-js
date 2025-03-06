// Auto-generated from QuickBase OpenAPI spec
export interface QuickbaseMethods {
  createApp: (params: {
  generated: CreateAppRequest
}) => Promise<CreateApp200Response>;
  getAppById: (params: {
  appId: string
}) => Promise<App>;
  updateApp: (params: {
  appId: string;
  generated: UpdateAppRequest
}) => Promise<UpdateApp200Response>;
  deleteApp: (params: {
  appId: string;
  generated: DeleteAppRequest
}) => Promise<DeleteApp200Response>;
  getAppEvents: (params: {
  appId: string
}) => Promise<object[]>;
  copyApp: (params: {
  appId: string;
  generated: CopyAppRequest
}) => Promise<CopyApp200Response>;
  createTable: (params: {
  appId: string;
  QB-Realm-Hostname: string;
  User-Agent?: string;
  Authorization: string;
  generated?: object
}) => Promise<object>;
  getAppTables: (params: {
  appId: string;
  QB-Realm-Hostname: string;
  User-Agent?: string;
  Authorization: string
}) => Promise<object[]>;
  getTable: (params: {
  appId: string;
  tableId: string
}) => Promise<Table>;
  updateTable: (params: {
  appId: string;
  tableId: string;
  QB-Realm-Hostname: string;
  User-Agent?: string;
  Authorization: string;
  generated?: object
}) => Promise<object>;
  deleteTable: (params: {
  appId: string;
  tableId: string;
  QB-Realm-Hostname: string;
  User-Agent?: string;
  Authorization: string
}) => Promise<object>;
  getRelationships: (params: {
  skip?: any;
  tableId: string;
  QB-Realm-Hostname: string;
  User-Agent?: string;
  Authorization: string
}) => Promise<object>;
  createRelationship: (params: {
  tableId: string;
  QB-Realm-Hostname: string;
  User-Agent?: string;
  Authorization: string;
  generated?: object
}) => Promise<object>;
  updateRelationship: (params: {
  tableId: string;
  relationshipId: any;
  QB-Realm-Hostname: string;
  User-Agent?: string;
  Authorization: string;
  generated?: object
}) => Promise<object>;
  deleteRelationship: (params: {
  tableId: string;
  relationshipId: any;
  QB-Realm-Hostname: string;
  User-Agent?: string;
  Authorization: string
}) => Promise<object>;
  getTableReports: (params: {
  tableId: string;
  QB-Realm-Hostname: string;
  User-Agent?: string;
  Authorization: string
}) => Promise<object[]>;
  getReport: (params: {
  tableId: string;
  reportId: string;
  QB-Realm-Hostname: string;
  User-Agent?: string;
  Authorization: string
}) => Promise<object>;
  runReport: (params: {
  tableId: string;
  skip?: any;
  top?: any;
  reportId: string;
  QB-Realm-Hostname: string;
  User-Agent?: string;
  Authorization: string;
  generated?: any
}) => Promise<object>;
  getFields: (params: {
  tableId: string;
  includeFieldPerms?: boolean
}) => Promise<Field[]>;
  createField: (params: {
  tableId: string;
  generated: object
}) => Promise<CreateField200Response>;
  deleteFields: (params: {
  tableId: string;
  generated: object
}) => Promise<DeleteFields200Response>;
  getField: (params: {
  tableId: string;
  includeFieldPerms?: boolean;
  fieldId: any;
  QB-Realm-Hostname: string;
  User-Agent?: string;
  Authorization: string
}) => Promise<object>;
  updateField: (params: {
  tableId: string;
  fieldId: any;
  QB-Realm-Hostname: string;
  User-Agent?: string;
  Authorization: string;
  generated?: object
}) => Promise<object>;
  getFieldsUsage: (params: {
  tableId: string;
  skip?: any;
  top?: any;
  QB-Realm-Hostname: string;
  User-Agent?: string;
  Authorization: string
}) => Promise<object[]>;
  getFieldUsage: (params: {
  tableId: string;
  fieldId: any;
  QB-Realm-Hostname: string;
  User-Agent?: string;
  Authorization: string
}) => Promise<object[]>;
  runFormula: (params: {
  QB-Realm-Hostname: string;
  User-Agent?: string;
  Authorization: string;
  generated?: object
}) => Promise<object>;
  upsert: (params: {
  generated: object
}) => Promise<Upsert200Response>;
  deleteRecords: (params: {
  QB-Realm-Hostname: string;
  User-Agent?: string;
  Authorization: string;
  generated?: object
}) => Promise<object>;
  runQuery: (params: {
  QB-Realm-Hostname: string;
  User-Agent?: string;
  Authorization: string;
  generated?: object
}) => Promise<object>;
  getTempTokenDBID: (params: {
  dbid: string;
  QB-Realm-Hostname: string;
  User-Agent?: string;
  QB-App-Token?: string
}) => Promise<object>;
  exchangeSsoToken: (params: {
  QB-Realm-Hostname: string;
  User-Agent?: string;
  generated?: object
}) => Promise<object>;
  cloneUserToken: (params: {
  QB-Realm-Hostname: string;
  User-Agent?: string;
  Authorization: string;
  generated?: object
}) => Promise<object>;
  transferUserToken: (params: {
  QB-Realm-Hostname: string;
  User-Agent?: string;
  Authorization: string;
  generated?: object
}) => Promise<object>;
  deactivateUserToken: (params: {
  QB-Realm-Hostname: string;
  User-Agent?: string;
  Authorization: string
}) => Promise<object>;
  deleteUserToken: (params: {
  QB-Realm-Hostname: string;
  User-Agent?: string;
  Authorization: string
}) => Promise<object>;
  downloadFile: (params: {
  tableId: string;
  recordId: any;
  fieldId: any;
  versionNumber: any;
  QB-Realm-Hostname: string;
  User-Agent?: string;
  Authorization: string
}) => Promise<any>;
  deleteFile: (params: {
  tableId: string;
  recordId: any;
  fieldId: any;
  versionNumber: any;
  QB-Realm-Hostname: string;
  User-Agent?: string;
  Authorization: string
}) => Promise<object>;
  getUsers: (params: {
  accountId?: any;
  QB-Realm-Hostname: string;
  User-Agent?: string;
  Authorization: string;
  generated?: object
}) => Promise<object>;
  denyUsers: (params: {
  accountId?: any;
  QB-Realm-Hostname: string;
  User-Agent?: string;
  Authorization: string;
  generated?: any[]
}) => Promise<object>;
  denyUsersAndGroups: (params: {
  accountId?: any;
  shouldDeleteFromGroups: boolean;
  QB-Realm-Hostname: string;
  User-Agent?: string;
  Authorization: string;
  generated?: any[]
}) => Promise<object>;
  undenyUsers: (params: {
  accountId?: any;
  QB-Realm-Hostname: string;
  User-Agent?: string;
  Authorization: string;
  generated?: any[]
}) => Promise<object>;
  addMembersToGroup: (params: {
  gid: any;
  QB-Realm-Hostname: string;
  User-Agent?: string;
  Authorization: string;
  generated?: any[]
}) => Promise<object>;
  removeMembersFromGroup: (params: {
  gid: any;
  QB-Realm-Hostname: string;
  User-Agent?: string;
  Authorization: string;
  generated?: any[]
}) => Promise<object>;
  addManagersToGroup: (params: {
  gid: any;
  QB-Realm-Hostname: string;
  User-Agent?: string;
  Authorization: string;
  generated?: any[]
}) => Promise<object>;
  removeManagersFromGroup: (params: {
  gid: any;
  QB-Realm-Hostname: string;
  User-Agent?: string;
  Authorization: string;
  generated?: any[]
}) => Promise<object>;
  addSubgroupsToGroup: (params: {
  gid: any;
  QB-Realm-Hostname: string;
  User-Agent?: string;
  Authorization: string;
  generated?: any[]
}) => Promise<object>;
  removeSubgroupsFromGroup: (params: {
  gid: any;
  QB-Realm-Hostname: string;
  User-Agent?: string;
  Authorization: string;
  generated?: any[]
}) => Promise<object>;
  audit: (params: {
  QB-Realm-Hostname: string;
  User-Agent?: string;
  Authorization: string;
  generated?: object
}) => Promise<object>;
  platformAnalyticReads: (params: {
  day?: string;
  QB-Realm-Hostname: string;
  User-Agent?: string;
  Authorization: string
}) => Promise<object>;
  platformAnalyticEventSummaries: (params: {
  QB-Realm-Hostname: string;
  User-Agent?: string;
  Authorization: string;
  accountId?: any;
  generated?: object
}) => Promise<object>;
  exportSolution: (params: {
  solutionId: string;
  QBL-Version?: string;
  QB-Realm-Hostname: string;
  User-Agent?: string;
  Authorization: string
}) => Promise<any>;
  updateSolution: (params: {
  solutionId: string;
  generated?: any;
  X-QBL-Errors-As-Success?: boolean;
  QB-Realm-Hostname: string;
  User-Agent?: string;
  Authorization: string
}) => Promise<any>;
  createSolution: (params: {
  generated?: any;
  X-QBL-Errors-As-Success?: boolean;
  QB-Realm-Hostname: string;
  User-Agent?: string;
  Authorization: string
}) => Promise<any>;
  exportSolutionToRecord: (params: {
  solutionId: string;
  tableId: string;
  fieldId: any;
  X-QBL-Errors-As-Success?: boolean;
  QB-Realm-Hostname: string;
  QBL-Version?: string;
  User-Agent?: string;
  Authorization: string
}) => Promise<any>;
  createSolutionFromRecord: (params: {
  tableId: string;
  fieldId: any;
  recordId: any;
  X-QBL-Errors-As-Success?: boolean;
  QB-Realm-Hostname: string;
  User-Agent?: string;
  Authorization: string
}) => Promise<any>;
  updateSolutionToRecord: (params: {
  solutionId: string;
  tableId: string;
  fieldId: any;
  recordId: any;
  X-QBL-Errors-As-Success?: boolean;
  QB-Realm-Hostname: string;
  User-Agent?: string;
  Authorization: string
}) => Promise<any>;
  changesetSolution: (params: {
  solutionId: string;
  generated?: any;
  X-QBL-Errors-As-Success?: boolean;
  QB-Realm-Hostname: string;
  User-Agent?: string;
  Authorization: string
}) => Promise<any>;
  changesetSolutionFromRecord: (params: {
  solutionId: string;
  tableId: string;
  fieldId: any;
  recordId: any;
  X-QBL-Errors-As-Success?: boolean;
  QB-Realm-Hostname: string;
  User-Agent?: string;
  Authorization: string
}) => Promise<any>;
  generateDocument: (params: {
  templateId: any;
  tableId: string;
  recordId?: any;
  filename: string;
  QB-Realm-Hostname?: string;
  User-Agent?: string;
  Authorization?: string;
  Accept?: string;
  format?: string;
  margin?: string;
  unit?: string;
  pageSize?: string;
  orientation?: string;
  realm?: string
}) => Promise<object>;
}
