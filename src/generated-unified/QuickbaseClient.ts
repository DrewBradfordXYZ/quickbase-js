// Generated on 2025-04-05T20:37:56.374Z
import { AddManagersToGroup200Response, AddManagersToGroupRequest, AddMembersToGroup200Response, AddMembersToGroupRequest, AddSubgroupsToGroup200Response, AddSubgroupsToGroupRequest, Audit200Response, ChangesetSolution200Response, ChangesetSolutionFromRecord200Response, CloneUserToken200Response, CopyApp200Response, CopyAppRequest, CreateApp200Response, CreateAppRequest, CreateField200Response, CreateFieldRequest, CreateRelationship200Response, CreateRelationshipRequest, CreateSolution200Response, CreateSolutionFromRecord200Response, CreateTable200Response, CreateTableRequest, DeactivateUserToken200Response, DeleteApp200Response, DeleteAppRequest, DeleteFields200Response, DeleteFieldsRequest, DeleteFile200Response, DeleteRecords200Response, DeleteRecordsRequest, DeleteRelationship200Response, DeleteTable200Response, DeleteUserToken200Response, DenyUsers200Response, DenyUsersAndGroups200Response, DenyUsersAndGroupsRequest, DenyUsersRequest, DownloadFile200Response, ExchangeSsoToken200Response, ExportSolution200Response, ExportSolutionToRecord200Response, GenerateDocument200Response, GetApp200Response, GetAppEvents200Response, GetAppTables200Response, GetField200Response, GetFieldUsage200Response, GetFields200Response, GetFieldsUsage200Response, GetRelationships200Response, GetReport200Response, GetTable200Response, GetTableReports200Response, GetTempTokenDBID200Response, GetUsers200Response, GetUsersRequest, PlatformAnalyticEventSummaries200Response, PlatformAnalyticReads200Response, RemoveManagersFromGroup200Response, RemoveManagersFromGroupRequest, RemoveMembersFromGroup200Response, RemoveMembersFromGroupRequest, RemoveSubgroupsFromGroup200Response, RemoveSubgroupsFromGroupRequest, RunFormula200Response, RunQuery200Response, RunQueryRequest, RunReport200Response, TransferUserToken200Response, UndenyUsers200Response, UndenyUsersRequest, UpdateApp200Response, UpdateAppRequest, UpdateField200Response, UpdateFieldRequest, UpdateRelationship200Response, UpdateRelationshipRequest, UpdateSolution200Response, UpdateSolutionToRecord200Response, UpdateTable200Response, UpdateTableRequest, Upsert200Response, Upsert207Response, UpsertRequest } from "../generated/models";

export interface QuickbaseClient {
  /**
   * Create an app
   *
   * @param {Object} params - Object containing the parameters for createApp.
   * @param {CreateAppRequest} [params.body] - No description provided. (Optional)
   *   - **name** (`string`, required) - The name of the app.
   *   - **description** (`string`, optional) - A description for the app.
   *   - **assignToken** (`boolean`, required) - Whether to assign the user token.
   *
   * @returns {Promise<CreateApp200Response>} - Promise resolving to the createApp response.
   *   - **name** (`string`, required) - The app name. You are allowed to create multiple apps with the same name, in the same realm, because they will have different dbid values. We urge you to be careful about doing this.
   *   - **description** (`string`, optional) - The description for the app. If this property is left out, the app description will be blank.
   *   - **created** (`string`, optional) - The time and date the app was created, in the ISO 8601 time format YYYY-MM-DDThh:mm:ss.sssZ (in UTC time zone).
   *   - **updated** (`string`, optional) - The time and date the app was last updated, in the ISO 8601 time format YYYY-MM-DDThh:mm:ss.sssZ (in UTC time zone).
   *   - **dateFormat** (`string`, optional) - A description of the format used when displaying date values in this app. Note that this is a browser-only parameter - see the [Field type details](../fieldInfo) page in the API Guide for how time values are returned in API calls. See [About Localizing Dates](https://help.quickbase.com/user-assistance/about_localizing_dates_numbers.html) to set the app’s date format.
   *   - **timeZone** (`string`, optional) - A description of the time zone used when displaying time values in this app. Note that this is a browser-only parameter - see the [Field type details](../fieldInfo) page in the portal for how time values are returned in API calls. See [Set the Time Zone for Both the Application and the Account](https://help.quickbase.com/user-assistance/application_local_timezone.html) to set the application’s time zone.
   *   - **memoryInfo** (`object`, optional) - Application memory info
   *   - **id** (`string`, optional) - The unique identifier for this application.
   *   - **hasEveryoneOnTheInternet** (`boolean`, optional) - Indicates whether app includes Everyone On The Internet access. See [Sharing apps with Everyone on the Internet (EOTI).](https://help.quickbase.com/user-assistance/share_with_everyone_on_internet.html)
   *   - **variables** (`any`, optional) - The app variables. See [About Application Variables](https://help.quickbase.com/user-assistance/variables.html)
   *   - **dataClassification** (`string`, optional) - The Data Classification label assigned to the application. If Data Classification is not turned on, this will not be returned. If Data Classification is turned on, but application is not labeled, we return “None".  Data Classification labels can be added in the Admin Console by a Realm Administrator for Platform+ plans.
   *   - **securityProperties** (`object`, optional) - Security properties of the application
   *
   * @see https://developer.quickbase.com/operation/createApp - Official Quickbase API documentation
   */
  createApp: (params: { body?: CreateAppRequest }) => Promise<CreateApp200Response>;
  /**
   * Get an app
   *
   * @param {Object} params - Object containing the parameters for getApp.
   * @param {string} params.appId - The unique identifier of an app
   *
   * @returns {Promise<GetApp200Response>} - Promise resolving to the getApp response.
   *   - **ancestorId** (`string`, optional) - The id of the app from which this app was copied
   *   - **name** (`string`, required) - The app name. You are allowed to create multiple apps with the same name, in the same realm, because they will have different dbid values. We urge you to be careful about doing this.
   *   - **description** (`string`, optional) - The description for the app. If this property is left out, the app description will be blank.
   *   - **created** (`string`, optional) - The time and date the app was created, in the ISO 8601 time format YYYY-MM-DDThh:mm:ss.sssZ (in UTC time zone).
   *   - **updated** (`string`, optional) - The time and date the app was last updated, in the ISO 8601 time format YYYY-MM-DDThh:mm:ss.sssZ (in UTC time zone).
   *   - **dateFormat** (`string`, optional) - A description of the format used when displaying date values in this app. Note that this is a browser-only parameter - see the [Field type details](../fieldInfo) page in the API Guide for how time values are returned in API calls. See [About Localizing Dates](https://help.quickbase.com/user-assistance/about_localizing_dates_numbers.html) to set the app’s date format.
   *   - **timeZone** (`string`, optional) - A description of the time zone used when displaying time values in this app. Note that this is a browser-only parameter - see the [Field type details](../fieldInfo) page in the portal for how time values are returned in API calls. See [Set the Time Zone for Both the Application and the Account](https://help.quickbase.com/user-assistance/application_local_timezone.html) to set the application’s time zone.
   *   - **memoryInfo** (`object`, optional) - Application memory info
   *   - **id** (`string`, optional) - The unique identifier for this application.
   *   - **hasEveryoneOnTheInternet** (`boolean`, optional) - Indicates whether app includes Everyone On The Internet access. See [Sharing apps with Everyone on the Internet (EOTI).](https://help.quickbase.com/user-assistance/share_with_everyone_on_internet.html)
   *   - **variables** (`any`, optional) - The app variables. See [About Application Variables](https://help.quickbase.com/user-assistance/variables.html)
   *   - **dataClassification** (`string`, optional) - The Data Classification label assigned to the application. If Data Classification is not turned on, this will not be returned. If Data Classification is turned on, but application is not labeled, we return “None".  Data Classification labels can be added in the Admin Console by a Realm Administrator for Platform+ plans.
   *   - **securityProperties** (`object`, optional) - Security properties of the application
   *
   * @see https://developer.quickbase.com/operation/getApp - Official Quickbase API documentation
   */
  getApp: (params: { appId: string }) => Promise<GetApp200Response>;
  /**
   * Update an app
   *
   * @param {Object} params - Object containing the parameters for updateApp.
   * @param {string} params.appId - The unique identifier of an app
   * @param {UpdateAppRequest} [params.body] - No description provided. (Optional)
   *   - **name** (`string`, required) - The name of the app.
   *   - **description** (`string`, optional) - A description for the app.
   *   - **assignToken** (`boolean`, required) - Whether to assign the user token.
   *
   * @returns {Promise<UpdateApp200Response>} - Promise resolving to the updateApp response.
   *   - **ancestorId** (`string`, optional) - The id of the app from which this app was copied
   *   - **name** (`string`, required) - The app name. You are allowed to create multiple apps with the same name, in the same realm, because they will have different dbid values. We urge you to be careful about doing this.
   *   - **description** (`string`, optional) - The description for the app. If this property is left out, the app description will be blank.
   *   - **created** (`string`, optional) - The time and date the app was created, in the ISO 8601 time format YYYY-MM-DDThh:mm:ss.sssZ (in UTC time zone).
   *   - **updated** (`string`, optional) - The time and date the app was last updated, in the ISO 8601 time format YYYY-MM-DDThh:mm:ss.sssZ (in UTC time zone).
   *   - **dateFormat** (`string`, optional) - A description of the format used when displaying date values in this app. Note that this is a browser-only parameter - see the [Field type details](../fieldInfo) page in the API Guide for how time values are returned in API calls. See [About Localizing Dates](https://help.quickbase.com/user-assistance/about_localizing_dates_numbers.html) to set the app’s date format.
   *   - **timeZone** (`string`, optional) - A description of the time zone used when displaying time values in this app. Note that this is a browser-only parameter - see the [Field type details](../fieldInfo) page in the portal for how time values are returned in API calls. See [Set the Time Zone for Both the Application and the Account](https://help.quickbase.com/user-assistance/application_local_timezone.html) to set the application’s time zone.
   *   - **memoryInfo** (`object`, optional) - Application memory info
   *   - **id** (`string`, optional) - The unique identifier for this application.
   *   - **hasEveryoneOnTheInternet** (`boolean`, optional) - Indicates whether app includes Everyone On The Internet access. See [Sharing apps with Everyone on the Internet (EOTI).](https://help.quickbase.com/user-assistance/share_with_everyone_on_internet.html)
   *   - **variables** (`any`, optional) - The app variables. See [About Application Variables](https://help.quickbase.com/user-assistance/variables.html)
   *   - **dataClassification** (`string`, optional) - The Data Classification label assigned to the application. If Data Classification is not turned on, this will not be returned. If Data Classification is turned on, but application is not labeled, we return “None".  Data Classification labels can be added in the Admin Console by a Realm Administrator for Platform+ plans.
   *   - **securityProperties** (`object`, optional) - Security properties of the application
   *
   * @see https://developer.quickbase.com/operation/updateApp - Official Quickbase API documentation
   */
  updateApp: (params: { appId: string; body?: UpdateAppRequest }) => Promise<UpdateApp200Response>;
  /**
   * Delete an app
   *
   * @param {Object} params - Object containing the parameters for deleteApp.
   * @param {string} params.appId - The unique identifier of an app
   * @param {DeleteAppRequest} [params.body] - No description provided. (Optional)
   *   - **name** (`string`, required) - The name of the app.
   *   - **description** (`string`, optional) - A description for the app.
   *   - **assignToken** (`boolean`, required) - Whether to assign the user token.
   *
   * @returns {Promise<DeleteApp200Response>} - Promise resolving to the deleteApp response.
   *   - **deletedAppId** (`string`, optional) - An ID of deleted application.
   *
   * @see https://developer.quickbase.com/operation/deleteApp - Official Quickbase API documentation
   */
  deleteApp: (params: { appId: string; body?: DeleteAppRequest }) => Promise<DeleteApp200Response>;
  /**
   * Get app events
   *
   * @param {Object} params - Object containing the parameters for getAppEvents.
   * @param {string} params.appId - The unique identifier of an app
   *
   * @returns {Promise<GetAppEvents200Response>} - Promise resolving to the getAppEvents response.
   *   - **isActive** (`boolean`, optional) - Indication of whether current event is active.
   *   - **type** (`string`, optional) - Type of an event.
   *   - **name** (`string`, optional) - The name of the event. This property is not returned for automations.
   *   - **url** (`string`, optional) - The url to automation that can be accessed from the browser. Only returned for automations.
   *   - **owner** (`object`, optional) - The user that owns the event.
   *   - **tableId** (`string`, optional) - The unique identifier of the table to which event belongs to.
   *
   * @see https://developer.quickbase.com/operation/getAppEvents - Official Quickbase API documentation
   */
  getAppEvents: (params: { appId: string }) => Promise<GetAppEvents200Response>;
  /**
   * Copy an app
   *
   * @param {Object} params - Object containing the parameters for copyApp.
   * @param {string} params.appId - The unique identifier of an app
   * @param {CopyAppRequest} [params.body] - No description provided. (Optional)
   *   - **name** (`string`, required) - The name of the new app.
   *   - **description** (`string`, optional) - A description for the new app.
   *   - **properties** (`CopyAppRequestProperties`, optional) - Type: CopyAppRequestProperties
   *
   * @returns {Promise<CopyApp200Response>} - Promise resolving to the copyApp response.
   *   - **name** (`string`, required) - The app name. You are allowed to create multiple apps with the same name, in the same realm, because they will have different dbid values. We urge you to be careful about doing this.
   *   - **description** (`string`, optional) - The description for the app
   *   - **created** (`string`, optional) - The time and date the app was created, in the ISO 8601 time format YYYY-MM-DDThh:mm:ss.sssZ (in UTC time zone).
   *   - **updated** (`string`, optional) - The time and date the app was last updated, in the ISO 8601 time format YYYY-MM-DDThh:mm:ss.sssZ (in UTC time zone).
   *   - **dateFormat** (`string`, optional) - A description of the format used when displaying date values in this app. Note that this is a browser-only parameter - see the [Field type details](../fieldInfo) page in the API Guide for how time values are returned in API calls. See [About Localizing Dates](https://help.quickbase.com/user-assistance/about_localizing_dates_numbers.html) to set the app’s date format.
   *   - **timeZone** (`string`, optional) - A description of the time zone used when displaying time values in this app. Note that this is a browser-only parameter - see the [Field type details](../fieldInfo) page in the portal for how time values are returned in API calls. See [Set the Time Zone for Both the Application and the Account](https://help.quickbase.com/user-assistance/application_local_timezone.html) to set the application’s time zone.
   *   - **id** (`string`, optional) - The unique identifier for this application.
   *   - **hasEveryoneOnTheInternet** (`boolean`, optional) - Indicates whether app includes Everyone On The Internet access. See [Sharing apps with Everyone on the Internet (EOTI).](https://help.quickbase.com/user-assistance/share_with_everyone_on_internet.html)
   *   - **variables** (`any`, optional) - The app variables. See [About Application Variables](https://help.quickbase.com/user-assistance/variables.html)
   *   - **ancestorId** (`string`, optional) - The id of the app from which this app was copied
   *   - **dataClassification** (`string`, optional) - The Data Classification label assigned to the application. If Data Classification is not turned on, this will not be returned. If Data Classification is turned on, but application is not labeled, we return “None".  Data Classification labels can be added in the Admin Console by a Realm Administrator for Platform+ plans.
   *
   * @see https://developer.quickbase.com/operation/copyApp - Official Quickbase API documentation
   */
  copyApp: (params: { appId: string; body?: CopyAppRequest }) => Promise<CopyApp200Response>;
  /**
   * Create a table
   *
   * @param {Object} params - Object containing the parameters for createTable.
   * @param {string} params.appId - The unique identifier of an app
   * @param {CreateTableRequest} [params.body] - No description provided. (Optional)
   *   - **name** (`string`, required) - The name for the table.
   *   - **description** (`string`, optional) - The description for the table...
   *   - **singleRecordName** (`string`, optional) - The singular noun for records...
   *   - **pluralRecordName** (`string`, optional) - The plural noun for records...
   *
   * @returns {Promise<CreateTable200Response>} - Promise resolving to the createTable response.
   *   - **name** (`string`, optional) - The name of the table.
   *   - **id** (`string`, optional) - The unique identifier (dbid) of the table.
   *   - **alias** (`string`, optional) - The automatically-created table alias for the table.
   *   - **description** (`string`, optional) - The description of the table, as configured by an application administrator.
   *   - **created** (`string`, optional) - The time and date when the table was created, in the ISO 8601 time format YYYY-MM-DDThh:mm:ss.sssZ (in UTC time zone).
   *   - **updated** (`string`, optional) - The time and date when the table schema or data was last updated, in the ISO 8601 time format YYYY-MM-DDThh:mm:ss.sssZ (in UTC time zone).
   *   - **nextRecordId** (`number`, optional) - The incremental Record ID that will be used when the next record is created, as determined when the API call was ran.
   *   - **nextFieldId** (`number`, optional) - The incremental Field ID that will be used when the next field is created, as determined when the API call was ran.
   *   - **defaultSortFieldId** (`number`, optional) - The id of the field that is configured for default sorting.
   *   - **defaultSortOrder** (`string`, optional) - The configuration of the default sort order on the table.
   *   - **keyFieldId** (`number`, optional) - The id of the field that is configured to be the key on this table, which is usually the Quickbase Record ID.
   *   - **singleRecordName** (`string`, optional) - The builder-configured singular noun of the table.
   *   - **pluralRecordName** (`string`, optional) - The builder-configured plural noun of the table.
   *   - **sizeLimit** (`string`, optional) - The size limit for the table.
   *   - **spaceUsed** (`string`, optional) - The amount of space currently being used by the table.
   *   - **spaceRemaining** (`string`, optional) - The amount of space remaining for use by the table.
   *
   * @see https://developer.quickbase.com/operation/createTable - Official Quickbase API documentation
   */
  createTable: (params: { appId: string; body?: CreateTableRequest }) => Promise<CreateTable200Response>;
  /**
   * Get tables for an app
   *
   * @param {Object} params - Object containing the parameters for getAppTables.
   * @param {string} params.appId - The unique identifier of an app
   *
   * @returns {Promise<GetAppTables200Response>} - Promise resolving to the getAppTables response.
   *   - **name** (`string`, optional) - The name of the table.
   *   - **id** (`string`, optional) - The unique identifier (dbid) of the table.
   *   - **alias** (`string`, optional) - The automatically-created table alias for the table.
   *   - **description** (`string`, optional) - The description of the table, as configured by an application administrator.
   *   - **created** (`string`, optional) - The time and date when the table was created, in the ISO 8601 time format YYYY-MM-DDThh:mm:ss.sssZ (in UTC time zone).
   *   - **updated** (`string`, optional) - The time and date when the table schema or data was last updated, in the ISO 8601 time format YYYY-MM-DDThh:mm:ss.sssZ (in UTC time zone).
   *   - **nextRecordId** (`number`, optional) - The incremental Record ID that will be used when the next record is created, as determined when the API call was ran.
   *   - **nextFieldId** (`number`, optional) - The incremental Field ID that will be used when the next field is created, as determined when the API call was ran.
   *   - **defaultSortFieldId** (`number`, optional) - The id of the field that is configured for default sorting.
   *   - **defaultSortOrder** (`string`, optional) - The configuration of the default sort order on the table.
   *   - **keyFieldId** (`number`, optional) - The id of the field that is configured to be the key on this table, which is usually the Quickbase Record ID.
   *   - **singleRecordName** (`string`, optional) - The builder-configured singular noun of the table.
   *   - **pluralRecordName** (`string`, optional) - The builder-configured plural noun of the table.
   *   - **sizeLimit** (`string`, optional) - The size limit for the table.
   *   - **spaceUsed** (`string`, optional) - The amount of space currently being used by the table.
   *   - **spaceRemaining** (`string`, optional) - The amount of space remaining for use by the table.
   *
   * @see https://developer.quickbase.com/operation/getAppTables - Official Quickbase API documentation
   */
  getAppTables: (params: { appId: string }) => Promise<GetAppTables200Response>;
  /**
   * Get a table
   *
   * @param {Object} params - Object containing the parameters for getTable.
   * @param {string} params.appId - The unique identifier of an app
   * @param {string} params.tableId - The unique identifier (dbid) of the table.
   *
   * @returns {Promise<GetTable200Response>} - Promise resolving to the getTable response.
   *   - **name** (`string`, optional) - The name of the table.
   *   - **id** (`string`, optional) - The unique identifier (dbid) of the table.
   *   - **alias** (`string`, optional) - The automatically-created table alias for the table.
   *   - **description** (`string`, optional) - The description of the table, as configured by an application administrator.
   *   - **created** (`string`, optional) - The time and date when the table was created, in the ISO 8601 time format YYYY-MM-DDThh:mm:ss.sssZ (in UTC time zone).
   *   - **updated** (`string`, optional) - The time and date when the table schema or data was last updated, in the ISO 8601 time format YYYY-MM-DDThh:mm:ss.sssZ (in UTC time zone).
   *   - **nextRecordId** (`number`, optional) - The incremental Record ID that will be used when the next record is created, as determined when the API call was ran.
   *   - **nextFieldId** (`number`, optional) - The incremental Field ID that will be used when the next field is created, as determined when the API call was ran.
   *   - **defaultSortFieldId** (`number`, optional) - The id of the field that is configured for default sorting.
   *   - **defaultSortOrder** (`string`, optional) - The configuration of the default sort order on the table.
   *   - **keyFieldId** (`number`, optional) - The id of the field that is configured to be the key on this table, which is usually the Quickbase Record ID.
   *   - **singleRecordName** (`string`, optional) - The builder-configured singular noun of the table.
   *   - **pluralRecordName** (`string`, optional) - The builder-configured plural noun of the table.
   *   - **sizeLimit** (`string`, optional) - The size limit for the table.
   *   - **spaceUsed** (`string`, optional) - The amount of space currently being used by the table.
   *   - **spaceRemaining** (`string`, optional) - The amount of space remaining for use by the table.
   *
   * @see https://developer.quickbase.com/operation/getTable - Official Quickbase API documentation
   */
  getTable: (params: { appId: string; tableId: string }) => Promise<GetTable200Response>;
  /**
   * Update a table
   *
   * @param {Object} params - Object containing the parameters for updateTable.
   * @param {string} params.appId - The unique identifier of an app
   * @param {string} params.tableId - The unique identifier (dbid) of the table.
   * @param {UpdateTableRequest} [params.body] - No description provided. (Optional)
   *   - **name** (`string`, optional) - The updated name of the table.
   *   - **description** (`string`, optional) - The updated description for the table.
   *
   * @returns {Promise<UpdateTable200Response>} - Promise resolving to the updateTable response.
   *   - **name** (`string`, optional) - The name of the table.
   *   - **id** (`string`, optional) - The unique identifier (dbid) of the table.
   *   - **alias** (`string`, optional) - The automatically-created table alias for the table.
   *   - **description** (`string`, optional) - The description of the table, as configured by an application administrator.
   *   - **created** (`string`, optional) - The time and date when the table was created, in the ISO 8601 time format YYYY-MM-DDThh:mm:ss.sssZ (in UTC time zone).
   *   - **updated** (`string`, optional) - The time and date when the table schema or data was last updated, in the ISO 8601 time format YYYY-MM-DDThh:mm:ss.sssZ (in UTC time zone).
   *   - **nextRecordId** (`number`, optional) - The incremental Record ID that will be used when the next record is created, as determined when the API call was ran.
   *   - **nextFieldId** (`number`, optional) - The incremental Field ID that will be used when the next field is created, as determined when the API call was ran.
   *   - **defaultSortFieldId** (`number`, optional) - The id of the field that is configured for default sorting.
   *   - **defaultSortOrder** (`string`, optional) - The configuration of the default sort order on the table.
   *   - **keyFieldId** (`number`, optional) - The id of the field that is configured to be the key on this table, which is usually the Quickbase Record ID.
   *   - **singleRecordName** (`string`, optional) - The builder-configured singular noun of the table.
   *   - **pluralRecordName** (`string`, optional) - The builder-configured plural noun of the table.
   *   - **sizeLimit** (`string`, optional) - The size limit for the table.
   *   - **spaceUsed** (`string`, optional) - The amount of space currently being used by the table.
   *   - **spaceRemaining** (`string`, optional) - The amount of space remaining for use by the table.
   *
   * @see https://developer.quickbase.com/operation/updateTable - Official Quickbase API documentation
   */
  updateTable: (params: { appId: string; tableId: string; body?: UpdateTableRequest }) => Promise<UpdateTable200Response>;
  /**
   * Delete a table
   *
   * @param {Object} params - Object containing the parameters for deleteTable.
   * @param {string} params.appId - The unique identifier of an app
   * @param {string} params.tableId - The unique identifier (dbid) of the table.
   *
   * @returns {Promise<DeleteTable200Response>} - Promise resolving to the deleteTable response.
   *   - **deletedTableId** (`string`, optional) - The deleted table id.
   *
   * @see https://developer.quickbase.com/operation/deleteTable - Official Quickbase API documentation
   */
  deleteTable: (params: { appId: string; tableId: string }) => Promise<DeleteTable200Response>;
  /**
   * Get all relationships
   *
   * @param {Object} params - Object containing the parameters for getRelationships.
   * @param {number} [params.skip] - The number of relationships to skip. (Optional)
   * @param {string} params.tableId - The unique identifier (dbid) of the child table.
   *
   * @returns {Promise<GetRelationships200Response>} - Promise resolving to the getRelationships response.
   *   - **relationships** (`any`, required) - The relationships in a table.
   *   - **metadata** (`object`, optional) - Additional information about the results that may be helpful.
   *
   * @see https://developer.quickbase.com/operation/getRelationships - Official Quickbase API documentation
   */
  getRelationships: (params: { skip?: number; tableId: string }) => Promise<GetRelationships200Response>;
  /**
   * Create a relationship
   *
   * @param {Object} params - Object containing the parameters for createRelationship.
   * @param {string} params.tableId - The unique identifier (dbid) of the table. This will be the child table.
   * @param {CreateRelationshipRequest} [params.body] - No description provided. (Optional)
   *   - **parentTableId** (`string`, required) - The parent table id for the relationship.
   *   - **foreignKeyField** (`{ [key: string]: any; }`, optional) - Type: { [key: string]: any; }
   *   - **lookupFieldIds** (`number[]`, optional) - Array of field ids...
   *   - **summaryFields** (`{ [key: string]: any; }[]`, optional) - Array of summary field objects...
   *
   * @returns {Promise<CreateRelationship200Response>} - Promise resolving to the createRelationship response.
   *   - **id** (`number`, required) - The relationship id (foreign key field id).
   *   - **parentTableId** (`string`, required) - The parent table id of the relationship.
   *   - **childTableId** (`string`, required) - The child table id of the relationship.
   *   - **foreignKeyField** (`object`, optional) - The foreign key field information.
   *   - **isCrossApp** (`boolean`, required) - Whether this is a cross-app relationship.
   *   - **lookupFields** (`any`, optional) - The lookup fields array.
   *   - **summaryFields** (`any`, optional) - The summary fields array.
   *
   * @see https://developer.quickbase.com/operation/createRelationship - Official Quickbase API documentation
   */
  createRelationship: (params: { tableId: string; body?: CreateRelationshipRequest }) => Promise<CreateRelationship200Response>;
  /**
   * Update a relationship
   *
   * @param {Object} params - Object containing the parameters for updateRelationship.
   * @param {string} params.tableId - The unique identifier (dbid) of the table. This will be the child table.
   * @param {number} params.relationshipId - The relationship id. This is the field id of the reference field on the child table.
   * @param {UpdateRelationshipRequest} [params.body] - No description provided. (Optional)
   *   - **parentTableId** (`string`, optional) - The updated parent table id...
   *   - **foreignKeyField** (`{ [key: string]: any; }`, optional) - Type: { [key: string]: any; }
   *   - **lookupFieldIds** (`number[]`, optional) - Updated array of field ids...
   *   - **summaryFields** (`{ [key: string]: any; }[]`, optional) - Type: { [key: string]: any; }[]
   *
   * @returns {Promise<UpdateRelationship200Response>} - Promise resolving to the updateRelationship response.
   *   - **id** (`number`, required) - The relationship id (foreign key field id).
   *   - **parentTableId** (`string`, required) - The parent table id of the relationship.
   *   - **childTableId** (`string`, required) - The child table id of the relationship.
   *   - **foreignKeyField** (`object`, optional) - The foreign key field information.
   *   - **isCrossApp** (`boolean`, required) - Whether this is a cross-app relationship.
   *   - **lookupFields** (`any`, optional) - The lookup fields array.
   *   - **summaryFields** (`any`, optional) - The summary fields array.
   *
   * @see https://developer.quickbase.com/operation/updateRelationship - Official Quickbase API documentation
   */
  updateRelationship: (params: { tableId: string; relationshipId: number; body?: UpdateRelationshipRequest }) => Promise<UpdateRelationship200Response>;
  /**
   * Delete a relationship
   *
   * @param {Object} params - Object containing the parameters for deleteRelationship.
   * @param {string} params.tableId - The unique identifier (dbid) of the table. This will be the child table.
   * @param {number} params.relationshipId - The relationship id. This is the field id of the reference field on the child table.
   *
   * @returns {Promise<DeleteRelationship200Response>} - Promise resolving to the deleteRelationship response.
   *   - **relationshipId** (`number`, required) - The relationship id.
   *
   * @see https://developer.quickbase.com/operation/deleteRelationship - Official Quickbase API documentation
   */
  deleteRelationship: (params: { tableId: string; relationshipId: number }) => Promise<DeleteRelationship200Response>;
  /**
   * Get reports for a table
   *
   * @param {Object} params - Object containing the parameters for getTableReports.
   * @param {string} params.tableId - The unique identifier of the table.
   *
   * @returns {Promise<GetTableReports200Response>} - Promise resolving to the getTableReports response.
   *   - **id** (`string`, optional) - The identifier of the report, unique to the table.
   *   - **name** (`string`, optional) - The configured name of the report.
   *   - **type** (`string`, optional) - The type of report in Quickbase (e.g., chart).
   *   - **description** (`string`, optional) - The configured description of a report.
   *   - **ownerId** (`number`, optional) - Optional, showed only for personal reports. The user ID of report owner.
   *   - **query** (`object`, optional) - The query definition as configured in Quickbase that gets executed when the report is run.
   *   - **properties** (`{ [key: string]: any; }`, optional) - A list of properties specific to the report type. To see a detailed description of the properties for each report type, See [Report Types.](../reportTypes)
   *   - **usedLast** (`string`, optional) - The instant at which a report was last used.
   *   - **usedCount** (`number`, optional) - The number of times a report has been used.
   *
   * @see https://developer.quickbase.com/operation/getTableReports - Official Quickbase API documentation
   */
  getTableReports: (params: { tableId: string }) => Promise<GetTableReports200Response>;
  /**
   * Get a report
   *
   * @param {Object} params - Object containing the parameters for getReport.
   * @param {string} params.tableId - The unique identifier of table.
   * @param {string} params.reportId - The identifier of the report, unique to the table.
   *
   * @returns {Promise<GetReport200Response>} - Promise resolving to the getReport response.
   *   - **id** (`string`, optional) - The identifier of the report, unique to the table.
   *   - **name** (`string`, optional) - The configured name of the report.
   *   - **type** (`string`, optional) - The type of report in Quickbase (e.g., chart).
   *   - **description** (`string`, optional) - The configured description of a report.
   *   - **ownerId** (`number`, optional) - Optional, showed only for personal reports. The user ID of report owner.
   *   - **query** (`object`, optional) - The query definition as configured in Quickbase that gets executed when the report is run.
   *   - **properties** (`{ [key: string]: any; }`, optional) - A list of properties specific to the report type. To see a detailed description of the properties for each report type, See [Report Types.](../reportTypes)
   *   - **usedLast** (`string`, optional) - The instant at which a report was last used.
   *   - **usedCount** (`number`, optional) - The number of times a report has been used.
   *
   * @see https://developer.quickbase.com/operation/getReport - Official Quickbase API documentation
   */
  getReport: (params: { tableId: string; reportId: string }) => Promise<GetReport200Response>;
  /**
   * Run a report
   *
   * @param {Object} params - Object containing the parameters for runReport.
   * @param {string} params.tableId - The identifier of the table for the report.
   * @param {number} [params.skip] - The number of records to skip. You can set this value when paginating through a set of results. (Optional)
   * @param {number} [params.top] - The maximum number of records to return. You can override the default Quickbase pagination to get more or fewer results. If your requested value here exceeds the dynamic maximums, we will return a subset of results and the rest can be gathered in subsequent API calls. (Optional)
   * @param {string} params.reportId - The identifier of the report, unique to the table.
   * @param {any} [params.body] - No description provided. (Optional)
   *
   * @returns {Promise<RunReport200Response>} - Promise resolving to the runReport response.
   *   - **fields** (`any`, optional) - An array of objects that contains limited meta-data of each field displayed in the report. This assists in building logic that depends on field types and IDs.
   *   - **data** (`any`, optional) - An array of objects that either represents the record data or summarized values, depending on the report type.
   *   - **metadata** (`object`, optional) - Additional information about the results that may be helpful. Pagination may be needed if either you specify a smaller number of results to skip than is available, or if the API automatically returns fewer results. numRecords can be compared to totalRecords to determine if further pagination is needed.
   *
   * @see https://developer.quickbase.com/operation/runReport - Official Quickbase API documentation
   */
  runReport: (params: { tableId: string; skip?: number; top?: number; reportId: string; body?: any }) => Promise<RunReport200Response>;
  /**
   * Get fields for a table
   *
   * @param {Object} params - Object containing the parameters for getFields.
   * @param {string} params.tableId - The unique identifier (dbid) of the table.
   * @param {boolean} [params.includeFieldPerms] - Set to 'true' if you'd like to get back the custom permissions for the field(s). (Optional)
   *
   * @returns {Promise<GetFields200Response>} - Promise resolving to the getFields response.
   *   - **id** (`number`, required) - The id of the field, unique to this table.
   *   - **fieldType** (`string`, optional) - The type of field, as described [here](https://help.quickbase.com/user-assistance/field_types.html).
   *   - **mode** (`string`, optional) - For derived fields, this will be 'lookup', 'summary', or 'formula', to indicate the type of derived field.  For non-derived fields, this will be blank.
   *   - **label** (`string`, optional) - The label (name) of the field.
   *   - **noWrap** (`boolean`, optional) - Indicates if the field is configured to not wrap when displayed in the product.
   *   - **bold** (`boolean`, optional) - Indicates if the field is configured to display in bold in the product.
   *   - **required** (`boolean`, optional) - Indicates if the field is marked required.
   *   - **appearsByDefault** (`boolean`, optional) - Indicates if the field is marked as a default in reports.
   *   - **findEnabled** (`boolean`, optional) - Indicates if the field is marked as searchable.
   *   - **unique** (`boolean`, optional) - Indicates if the field is marked unique.
   *   - **doesDataCopy** (`boolean`, optional) - Indicates if the field data will copy when a user copies the record.
   *   - **fieldHelp** (`string`, optional) - The configured help text shown to users within the product.
   *   - **audited** (`boolean`, optional) - Indicates if the field is being tracked as part of Quickbase Audit Logs.
   *   - **properties** (`{ [key: string]: any; }`, optional) - Additional properties for the field. Please see [Field type details](../fieldInfo) page for more details on the properties for each field type.
   *   - **permissions** (`Permission[]`, optional) - Field Permissions for different roles.
   *     *   - **role** (`string`, required) - The role name
   *     *   - **permissionType** (`string`, required) - Permission type (e.g., View, Modify)
   *     *   - **roleId** (`number`, required) - The role identifier
   *
   * @see https://developer.quickbase.com/operation/getFields - Official Quickbase API documentation
   */
  getFields: (params: { tableId: string; includeFieldPerms?: boolean }) => Promise<GetFields200Response>;
  /**
   * Create a field
   *
   * @param {Object} params - Object containing the parameters for createField.
   * @param {string} params.tableId - The unique identifier of the table.
   * @param {CreateFieldRequest} [params.body] - No description provided. (Optional)
   *   - **label** (`string`, required) - The label of the field
   *   - **fieldType** (`CreateFieldRequestFieldTypeEnum`, required) - The type of the field
   *   - **fieldHelp** (`string`, optional) - Help text for the field
   *   - **addToForms** (`boolean`, optional) - Whether to add the field to forms
   *   - **permissions** (`object`, optional) - Custom permissions for the field
   *   - **required** (`boolean`, optional) - Whether the field is required
   *   - **unique** (`boolean`, optional) - Whether the field must have unique values
   *   - **noWrap** (`boolean`, optional) - Whether text wrapping is disabled
   *   - **bold** (`boolean`, optional) - Whether the field is bolded
   *   - **appearsByDefault** (`boolean`, optional) - Whether the field appears by default in reports
   *   - **findEnabled** (`boolean`, optional) - Whether the field is searchable
   *   - **doesDataCopy** (`boolean`, optional) - Whether the field copies data
   *   - **audited** (`boolean`, optional) - Whether changes to the field are audited
   *   - **properties** (`CreateFieldRequestProperties`, optional) - Type: CreateFieldRequestProperties
   *
   * @returns {Promise<CreateField200Response>} - Promise resolving to the createField response.
   *   - **id** (`number`, required) - The id of the field, unique to this table.
   *   - **fieldType** (`string`, optional) - The type of field, as described [here](https://help.quickbase.com/user-assistance/field_types.html).
   *   - **mode** (`string`, optional) - For derived fields, this will be 'lookup', 'summary', or 'formula', to indicate the type of derived field.  For non-derived fields, this will be blank.
   *   - **label** (`string`, optional) - The label (name) of the field.
   *   - **noWrap** (`boolean`, optional) - Indicates if the field is configured to not wrap when displayed in the product.
   *   - **bold** (`boolean`, optional) - Indicates if the field is configured to display in bold in the product.
   *   - **required** (`boolean`, optional) - Indicates if the field is marked required.
   *   - **appearsByDefault** (`boolean`, optional) - Indicates if the field is marked as a default in reports.
   *   - **findEnabled** (`boolean`, optional) - Indicates if the field is marked as searchable.
   *   - **unique** (`boolean`, optional) - Indicates if the field is marked unique.
   *   - **doesDataCopy** (`boolean`, optional) - Indicates if the field data will copy when a user copies the record.
   *   - **fieldHelp** (`string`, optional) - The configured help text shown to users within the product.
   *   - **audited** (`boolean`, optional) - Indicates if the field is being tracked as part of Quickbase Audit Logs.
   *   - **properties** (`{ [key: string]: any; }`, optional) - Additional properties for the field. Please see [Field type details](../fieldInfo) page for more details on the properties for each field type.
   *   - **permissions** (`Permission[]`, optional) - Field Permissions for different roles.
   *     *   - **role** (`string`, required) - The role name
   *     *   - **permissionType** (`string`, required) - Permission type (e.g., View, Modify)
   *     *   - **roleId** (`number`, required) - The role identifier
   *
   * @see https://developer.quickbase.com/operation/createField - Official Quickbase API documentation
   */
  createField: (params: { tableId: string; body?: CreateFieldRequest }) => Promise<CreateField200Response>;
  /**
   * Delete field(s)
   *
   * @param {Object} params - Object containing the parameters for deleteFields.
   * @param {string} params.tableId - The unique identifier of the table.
   * @param {DeleteFieldsRequest} [params.body] - No description provided. (Optional)
   *   - **fieldIds** (`number[]`, required) - Type: number[]
   *
   * @returns {Promise<DeleteFields200Response>} - Promise resolving to the deleteFields response.
   *   - **deletedFieldIds** (`any`, required) - List of field ids to were deleted.
   *   - **errors** (`any`, required) - List of errors found.
   *
   * @see https://developer.quickbase.com/operation/deleteFields - Official Quickbase API documentation
   */
  deleteFields: (params: { tableId: string; body?: DeleteFieldsRequest }) => Promise<DeleteFields200Response>;
  /**
   * Get field
   *
   * @param {Object} params - Object containing the parameters for getField.
   * @param {string} params.tableId - The unique identifier (dbid) of the table.
   * @param {boolean} [params.includeFieldPerms] - Set to 'true' if you'd like to get back the custom permissions for the field(s). (Optional)
   * @param {number} params.fieldId - The unique identifier (fid) of the field.
   *
   * @returns {Promise<GetField200Response>} - Promise resolving to the getField response.
   *   - **id** (`number`, required) - The id of the field, unique to this table.
   *   - **fieldType** (`string`, optional) - The type of field, as described [here](https://help.quickbase.com/user-assistance/field_types.html).
   *   - **mode** (`string`, optional) - For derived fields, this will be 'lookup', 'summary', or 'formula', to indicate the type of derived field.  For non-derived fields, this will be blank.
   *   - **label** (`string`, optional) - The label (name) of the field.
   *   - **noWrap** (`boolean`, optional) - Indicates if the field is configured to not wrap when displayed in the product.
   *   - **bold** (`boolean`, optional) - Indicates if the field is configured to display in bold in the product.
   *   - **required** (`boolean`, optional) - Indicates if the field is marked required.
   *   - **appearsByDefault** (`boolean`, optional) - Indicates if the field is marked as a default in reports.
   *   - **findEnabled** (`boolean`, optional) - Indicates if the field is marked as searchable.
   *   - **unique** (`boolean`, optional) - Indicates if the field is marked unique.
   *   - **doesDataCopy** (`boolean`, optional) - Indicates if the field data will copy when a user copies the record.
   *   - **fieldHelp** (`string`, optional) - The configured help text shown to users within the product.
   *   - **audited** (`boolean`, optional) - Indicates if the field is being tracked as part of Quickbase Audit Logs.
   *   - **properties** (`{ [key: string]: any; }`, optional) - Additional properties for the field. Please see [Field type details](../fieldInfo) page for more details on the properties for each field type.
   *   - **permissions** (`Permission[]`, optional) - Field Permissions for different roles.
   *     *   - **role** (`string`, required) - The role name
   *     *   - **permissionType** (`string`, required) - Permission type (e.g., View, Modify)
   *     *   - **roleId** (`number`, required) - The role identifier
   *
   * @see https://developer.quickbase.com/operation/getField - Official Quickbase API documentation
   */
  getField: (params: { tableId: string; includeFieldPerms?: boolean; fieldId: number }) => Promise<GetField200Response>;
  /**
   * Update a field
   *
   * @param {Object} params - Object containing the parameters for updateField.
   * @param {string} params.tableId - The unique identifier of the table.
   * @param {number} params.fieldId - The unique identifier (fid) of the field.
   * @param {UpdateFieldRequest} [params.body] - No description provided. (Optional)
   *   - **label** (`string`, required) - The label of the field
   *   - **fieldType** (`UpdateFieldRequestFieldTypeEnum`, optional) - The type of the field
   *   - **fieldHelp** (`string`, optional) - Help text for the field
   *   - **addToForms** (`boolean`, optional) - Whether to add the field to forms
   *   - **permissions** (`object`, optional) - Custom permissions for the field
   *   - **required** (`boolean`, optional) - Whether the field is required
   *   - **unique** (`boolean`, optional) - Whether the field must have unique values
   *   - **noWrap** (`boolean`, optional) - Whether text wrapping is disabled
   *   - **bold** (`boolean`, optional) - Whether the field is bolded
   *   - **appearsByDefault** (`boolean`, optional) - Whether the field appears by default in reports
   *   - **findEnabled** (`boolean`, optional) - Whether the field is searchable
   *   - **doesDataCopy** (`boolean`, optional) - Whether the field copies data
   *   - **audited** (`boolean`, optional) - Whether changes to the field are audited
   *   - **properties** (`CreateFieldRequestProperties`, optional) - Type: CreateFieldRequestProperties
   *
   * @returns {Promise<UpdateField200Response>} - Promise resolving to the updateField response.
   *   - **id** (`number`, required) - The id of the field, unique to this table.
   *   - **fieldType** (`string`, optional) - The type of field, as described [here](https://help.quickbase.com/user-assistance/field_types.html).
   *   - **mode** (`string`, optional) - For derived fields, this will be 'lookup', 'summary', or 'formula', to indicate the type of derived field.  For non-derived fields, this will be blank.
   *   - **label** (`string`, optional) - The label (name) of the field.
   *   - **noWrap** (`boolean`, optional) - Indicates if the field is configured to not wrap when displayed in the product.
   *   - **bold** (`boolean`, optional) - Indicates if the field is configured to display in bold in the product.
   *   - **required** (`boolean`, optional) - Indicates if the field is marked required.
   *   - **appearsByDefault** (`boolean`, optional) - Indicates if the field is marked as a default in reports.
   *   - **findEnabled** (`boolean`, optional) - Indicates if the field is marked as searchable.
   *   - **unique** (`boolean`, optional) - Indicates if the field is marked unique.
   *   - **doesDataCopy** (`boolean`, optional) - Indicates if the field data will copy when a user copies the record.
   *   - **fieldHelp** (`string`, optional) - The configured help text shown to users within the product.
   *   - **audited** (`boolean`, optional) - Indicates if the field is being tracked as part of Quickbase Audit Logs.
   *   - **properties** (`{ [key: string]: any; }`, optional) - Additional properties for the field. Please see [Field type details](../fieldInfo) page for more details on the properties for each field type.
   *   - **permissions** (`Permission[]`, optional) - Field Permissions for different roles.
   *     *   - **role** (`string`, required) - The role name
   *     *   - **permissionType** (`string`, required) - Permission type (e.g., View, Modify)
   *     *   - **roleId** (`number`, required) - The role identifier
   *
   * @see https://developer.quickbase.com/operation/updateField - Official Quickbase API documentation
   */
  updateField: (params: { tableId: string; fieldId: number; body?: UpdateFieldRequest }) => Promise<UpdateField200Response>;
  /**
   * Get usage for all fields
   *
   * @param {Object} params - Object containing the parameters for getFieldsUsage.
   * @param {string} params.tableId - The unique identifier (dbid) of the table.
   * @param {number} [params.skip] - The number of fields to skip from the list. (Optional)
   * @param {number} [params.top] - The maximum number of fields to return. (Optional)
   *
   * @returns {Promise<GetFieldsUsage200Response>} - Promise resolving to the getFieldsUsage response.
   *   - **field** (`object`, required) - Basic information about the field.
   *   - **usage** (`object`, required) - Usage Information about the field.
   *
   * @see https://developer.quickbase.com/operation/getFieldsUsage - Official Quickbase API documentation
   */
  getFieldsUsage: (params: { tableId: string; skip?: number; top?: number }) => Promise<GetFieldsUsage200Response>;
  /**
   * Get usage for a field
   *
   * @param {Object} params - Object containing the parameters for getFieldUsage.
   * @param {string} params.tableId - The unique identifier (dbid) of the table.
   * @param {number} params.fieldId - The unique identifier (fid) of the field.
   *
   * @returns {Promise<GetFieldUsage200Response>} - Promise resolving to the getFieldUsage response.
   *   - **field** (`object`, required) - Basic information about the field.
   *   - **usage** (`object`, required) - Usage Information about the field.
   *
   * @see https://developer.quickbase.com/operation/getFieldUsage - Official Quickbase API documentation
   */
  getFieldUsage: (params: { tableId: string; fieldId: number }) => Promise<GetFieldUsage200Response>;
  /**
   * Run a formula
   *
   * @param {Object} params - Object containing the parameters for runFormula.
   * @param {{ formula?: string; rid?: number; from?: string }} [params.body] - No description provided. (Optional)
   *
   * @returns {Promise<RunFormula200Response>} - Promise resolving to the runFormula response.
   *   - **result** (`string`, optional) - The formula execution result.
   *
   * @see https://developer.quickbase.com/operation/runFormula - Official Quickbase API documentation
   */
  runFormula: (params: { body?: { formula?: string; rid?: number; from?: string } }) => Promise<RunFormula200Response>;
  /**
   * Insert/Update record(s)
   *
   * @param {Object} params - Object containing the parameters for upsert.
   * @param {UpsertRequest} [params.body] - No description provided. (Optional)
   *   - **data** (`Record[]`, optional) - Type: Record[]
   *   - **to** (`string`, optional) - Type: string
   *   - **fieldsToReturn** (`number[]`, optional) - Type: number[]
   *
   * @returns {Promise<Upsert200Response | Upsert207Response>} - Promise resolving to the upsert response.
   *   - **metadata** (`object`, optional) - Information about created records, updated records, referenced but unchanged records, and records having any errors while being processed.
   *   - **data** (`any`, optional) - The data that is expected to be returned.
   *   - **metadata** (`{ [key: string]: any; }`, optional) - Information about created records, updated records, referenced but unchanged records, and records having any errors while being processed.
   *   - **data** (`string[]`, optional) - The data that is expected to be returned.
   *
   * @see https://developer.quickbase.com/operation/upsert - Official Quickbase API documentation
   */
  upsert: (params: { body?: UpsertRequest }) => Promise<Upsert200Response | Upsert207Response>;
  /**
   * Delete record(s)
   *
   * @param {Object} params - Object containing the parameters for deleteRecords.
   * @param {DeleteRecordsRequest} [params.body] - No description provided. (Optional)
   *   - **from** (`string`, required) - Type: string
   *   - **where** (`string`, optional) - Type: string
   *
   * @returns {Promise<DeleteRecords200Response>} - Promise resolving to the deleteRecords response.
   *   - **numberDeleted** (`number`, optional) - The number of records deleted.
   *
   * @see https://developer.quickbase.com/operation/deleteRecords - Official Quickbase API documentation
   */
  deleteRecords: (params: { body?: DeleteRecordsRequest }) => Promise<DeleteRecords200Response>;
  /**
   * Query for data
   *
   * @param {Object} params - Object containing the parameters for runQuery.
   * @param {RunQueryRequest} [params.body] - No description provided. (Optional)
   *   - **from** (`string`, required) - The table identifier.
   *   - **select** (`number[]`, optional) - An array of field ids...
   *   - **where** (`string`, optional) - The filter, using the Quickbase query language...
   *   - **sortBy** (`RunQueryRequestSortByInner[]`, optional) - An array of field IDs and sort directions...
   *   - **groupBy** (`RunQueryRequestGroupByInner[]`, optional) - An array that contains the fields to group the records by.
   *   - **options** (`RunQueryRequestOptions`, optional) - Type: RunQueryRequestOptions
   *
   * @returns {Promise<RunQuery200Response>} - Promise resolving to the runQuery response.
   *   - **fields** (`any`, optional) - An array of objects that contains limited meta-data of each field displayed in the report. This assists in building logic that depends on field types and IDs.
   *   - **data** (`any`, optional) - An array of objects that either represents the record data or summarized values, depending on the report type.
   *   - **metadata** (`object`, optional) - Additional information about the results that may be helpful. Pagination may be needed if either you specify a smaller number of results to skip than is available, or if the API automatically returns fewer results. numRecords can be compared to totalRecords to determine if further pagination is needed.
   *
   * @see https://developer.quickbase.com/operation/runQuery - Official Quickbase API documentation
   */
  runQuery: (params: { body?: RunQueryRequest }) => Promise<RunQuery200Response>;
  /**
   * Get a temporary token for a dbid
   *
   * @param {Object} params - Object containing the parameters for getTempTokenDBID.
   * @param {string} params.dbid - The unique identifier of an app or table.
   * @param {string} [params.qBAppToken] - Your Quickbase app token (Optional)
   *
   * @returns {Promise<GetTempTokenDBID200Response>} - Promise resolving to the getTempTokenDBID response.
   *   - **temporaryAuthorization** (`string`, optional) - Temporary authorization token.
   *
   * @see https://developer.quickbase.com/operation/getTempTokenDBID - Official Quickbase API documentation
   */
  getTempTokenDBID: (params: { dbid: string; qBAppToken?: string }) => Promise<GetTempTokenDBID200Response>;
  /**
   * Exchange an SSO token
   *
   * @param {Object} params - Object containing the parameters for exchangeSsoToken.
   * @param {{ grant_type?: string; requested_token_type?: string; subject_token?: string; subject_token_type?: string }} [params.body] - No description provided. (Optional)
   *
   * @returns {Promise<ExchangeSsoToken200Response>} - Promise resolving to the exchangeSsoToken response.
   *   - **access_token** (`string`, optional) - The security token issued by the authorization server in response to the token exchange request. The identifier `access_token` is used for historical reasons and the issued token need not be an OAuth access token.
   *   - **issued_token_type** (`string`, optional) - An identifier for the representation of the issued security token.
   *   - **token_type** (`string`, optional) - Will always return `N_A`
   *
   * @see https://developer.quickbase.com/operation/exchangeSsoToken - Official Quickbase API documentation
   */
  exchangeSsoToken: (params: { body?: { grant_type?: string; requested_token_type?: string; subject_token?: string; subject_token_type?: string } }) => Promise<ExchangeSsoToken200Response>;
  /**
   * Clone a user token
   *
   * @param {Object} params - Object containing the parameters for cloneUserToken.
   * @param {{ name?: string; description?: string }} [params.body] - No description provided. (Optional)
   *
   * @returns {Promise<CloneUserToken200Response>} - Promise resolving to the cloneUserToken response.
   *   - **active** (`boolean`, optional) - Whether the user token is active.
   *   - **apps** (`any`, optional) - The list of apps this user token is assigned to.
   *   - **lastUsed** (`string`, optional) - The last date this user token was used, in the ISO 8601 time format YYYY-MM-DDThh:mm:ss.sssZ (in UTC time zone).
   *   - **description** (`string`, optional) - User Token description.
   *   - **id** (`number`, optional) - User Token id.
   *   - **name** (`string`, optional) - User Token name.
   *   - **token** (`string`, optional) - User Token value.
   *
   * @see https://developer.quickbase.com/operation/cloneUserToken - Official Quickbase API documentation
   */
  cloneUserToken: (params: { body?: { name?: string; description?: string } }) => Promise<CloneUserToken200Response>;
  /**
   * Transfer a user token
   *
   * @param {Object} params - Object containing the parameters for transferUserToken.
   * @param {{ id?: number; from?: string; to?: string }} [params.body] - No description provided. (Optional)
   *
   * @returns {Promise<TransferUserToken200Response>} - Promise resolving to the transferUserToken response.
   *   - **active** (`boolean`, optional) - Whether the user token is active.
   *   - **apps** (`any`, optional) - The list of apps this user token is assigned to.
   *   - **lastUsed** (`string`, optional) - The last date this user token was used, in the ISO 8601 time format YYYY-MM-DDThh:mm:ss.sssZ (in UTC time zone).
   *   - **description** (`string`, optional) - User Token description.
   *   - **id** (`number`, optional) - User Token id.
   *   - **name** (`string`, optional) - User Token name.
   *
   * @see https://developer.quickbase.com/operation/transferUserToken - Official Quickbase API documentation
   */
  transferUserToken: (params: { body?: { id?: number; from?: string; to?: string } }) => Promise<TransferUserToken200Response>;
  /**
   * Deactivate a user token
   *
   * No parameters.
   *
   * @returns {Promise<DeactivateUserToken200Response>} - Promise resolving to the deactivateUserToken response.
   *   - **id** (`number`, optional) - The user token id.
   *
   * @see https://developer.quickbase.com/operation/deactivateUserToken - Official Quickbase API documentation
   */
  deactivateUserToken: (params: {  }) => Promise<DeactivateUserToken200Response>;
  /**
   * Delete a user token
   *
   * No parameters.
   *
   * @returns {Promise<DeleteUserToken200Response>} - Promise resolving to the deleteUserToken response.
   *   - **id** (`number`, optional) - The user token id.
   *
   * @see https://developer.quickbase.com/operation/deleteUserToken - Official Quickbase API documentation
   */
  deleteUserToken: (params: {  }) => Promise<DeleteUserToken200Response>;
  /**
   * Download file
   *
   * @param {Object} params - Object containing the parameters for downloadFile.
   * @param {string} params.tableId - The unique identifier of the table.
   * @param {number} params.recordId - The unique identifier of the record.
   * @param {number} params.fieldId - The unique identifier of the field.
   * @param {number} params.versionNumber - The file attachment version number.
   *
   * @returns {Promise<DownloadFile200Response>} - Promise resolving to the downloadFile response.
   *   - **data** (`string`, optional) - Type: string
   *
   * @see https://developer.quickbase.com/operation/downloadFile - Official Quickbase API documentation
   */
  downloadFile: (params: { tableId: string; recordId: number; fieldId: number; versionNumber: number }) => Promise<DownloadFile200Response>;
  /**
   * Delete file
   *
   * @param {Object} params - Object containing the parameters for deleteFile.
   * @param {string} params.tableId - The unique identifier of the table.
   * @param {number} params.recordId - The unique identifier of the record.
   * @param {number} params.fieldId - The unique identifier of the field.
   * @param {number} params.versionNumber - The file attachment version number.
   *
   * @returns {Promise<DeleteFile200Response>} - Promise resolving to the deleteFile response.
   *   - **versionNumber** (`number`, optional) - The number of deleted version.
   *   - **fileName** (`string`, optional) - The name of file associated with deleted version.
   *   - **uploaded** (`string`, optional) - The timestamp when the version was originally uploaded.
   *   - **creator** (`object`, optional) - The user that uploaded version.
   *
   * @see https://developer.quickbase.com/operation/deleteFile - Official Quickbase API documentation
   */
  deleteFile: (params: { tableId: string; recordId: number; fieldId: number; versionNumber: number }) => Promise<DeleteFile200Response>;
  /**
   * Get users
   *
   * @param {Object} params - Object containing the parameters for getUsers.
   * @param {number} [params.accountId] - The account id being used to get users. If no value is specified, the first account associated with the requesting user token is chosen. (Optional)
   * @param {GetUsersRequest} [params.body] - No description provided. (Optional)
   *   - **userIds** (`string[]`, required) - Type: string[]
   *
   * @returns {Promise<GetUsers200Response>} - Promise resolving to the getUsers response.
   *   - **users** (`any`, required) - A list of users found in an account with the given criterias
   *   - **metadata** (`object`, required) - Additional request information
   *
   * @see https://developer.quickbase.com/operation/getUsers - Official Quickbase API documentation
   */
  getUsers: (params: { accountId?: number; body?: GetUsersRequest }) => Promise<GetUsers200Response>;
  /**
   * Deny users
   *
   * @param {Object} params - Object containing the parameters for denyUsers.
   * @param {number} [params.accountId] - The account id being used to deny users. If no value is specified, the first account associated with the requesting user token is chosen. (Optional)
   * @param {DenyUsersRequest} [params.body] - No description provided. (Optional)
   *   - **userIds** (`string[]`, required) - Type: string[]
   *
   * @returns {Promise<DenyUsers200Response>} - Promise resolving to the denyUsers response.
   *   - **failure** (`any`, required) - A list of users that couldn't be denied. This also includes the ID's of users that are not valid.
   *   - **success** (`any`, required) - A list of users that have successfully been denied.
   *
   * @see https://developer.quickbase.com/operation/denyUsers - Official Quickbase API documentation
   */
  denyUsers: (params: { accountId?: number; body?: DenyUsersRequest }) => Promise<DenyUsers200Response>;
  /**
   * Deny and remove users from groups
   *
   * @param {Object} params - Object containing the parameters for denyUsersAndGroups.
   * @param {number} [params.accountId] - The account id being used to deny users. If no value is specified, the first account associated with the requesting user token is chosen. (Optional)
   * @param {boolean} params.shouldDeleteFromGroups - Specifies if the users should also be removed from all groups.
   * @param {DenyUsersAndGroupsRequest} [params.body] - No description provided. (Optional)
   *   - **userIds** (`string[]`, required) - Type: string[]
   *
   * @returns {Promise<DenyUsersAndGroups200Response>} - Promise resolving to the denyUsersAndGroups response.
   *   - **failure** (`any`, required) - A list of users that couldn't be denied. This also includes the ID's of users that are not valid.
   *   - **success** (`any`, required) - A list of users that have successfully been denied.
   *
   * @see https://developer.quickbase.com/operation/denyUsersAndGroups - Official Quickbase API documentation
   */
  denyUsersAndGroups: (params: { accountId?: number; shouldDeleteFromGroups: boolean; body?: DenyUsersAndGroupsRequest }) => Promise<DenyUsersAndGroups200Response>;
  /**
   * Undeny users
   *
   * @param {Object} params - Object containing the parameters for undenyUsers.
   * @param {number} [params.accountId] - The account id being used to undeny users. If no value is specified, the first account associated with the requesting user token is chosen. (Optional)
   * @param {UndenyUsersRequest} [params.body] - No description provided. (Optional)
   *   - **userIds** (`string[]`, required) - Type: string[]
   *
   * @returns {Promise<UndenyUsers200Response>} - Promise resolving to the undenyUsers response.
   *   - **failure** (`any`, required) - A list of users that couldn't be undenied. This also includes the ID's of users that are not valid.
   *   - **success** (`any`, required) - A list of users that have successfully been undenied.
   *
   * @see https://developer.quickbase.com/operation/undenyUsers - Official Quickbase API documentation
   */
  undenyUsers: (params: { accountId?: number; body?: UndenyUsersRequest }) => Promise<UndenyUsers200Response>;
  /**
   * Add members
   *
   * @param {Object} params - Object containing the parameters for addMembersToGroup.
   * @param {number} params.gid - This is the ID of the group being modified.
   * @param {AddMembersToGroupRequest} [params.body] - No description provided. (Optional)
   *   - **userIds** (`string[]`, required) - Type: string[]
   *
   * @returns {Promise<AddMembersToGroup200Response>} - Promise resolving to the addMembersToGroup response.
   *   - **failure** (`any`, required) - A list of users that couldn’t be added to the group. This includes a list of IDs that represent invalid users and users who have already been added to the group.
   *   - **success** (`any`, required) - A list of users that have been added to the group successfully.
   *
   * @see https://developer.quickbase.com/operation/addMembersToGroup - Official Quickbase API documentation
   */
  addMembersToGroup: (params: { gid: number; body?: AddMembersToGroupRequest }) => Promise<AddMembersToGroup200Response>;
  /**
   * Remove members
   *
   * @param {Object} params - Object containing the parameters for removeMembersFromGroup.
   * @param {number} params.gid - This is the ID of the group being modified.
   * @param {RemoveMembersFromGroupRequest} [params.body] - No description provided. (Optional)
   *   - **userIds** (`string[]`, required) - Type: string[]
   *
   * @returns {Promise<RemoveMembersFromGroup200Response>} - Promise resolving to the removeMembersFromGroup response.
   *   - **failure** (`any`, required) - A list of users that couldn’t be removed from the group. This includes a list of IDs that represent invalid users.
   *   - **success** (`any`, required) - A list of users that have been removed from the group successfully.
   *
   * @see https://developer.quickbase.com/operation/removeMembersFromGroup - Official Quickbase API documentation
   */
  removeMembersFromGroup: (params: { gid: number; body?: RemoveMembersFromGroupRequest }) => Promise<RemoveMembersFromGroup200Response>;
  /**
   * Add managers
   *
   * @param {Object} params - Object containing the parameters for addManagersToGroup.
   * @param {number} params.gid - This is the ID of the group being modified.
   * @param {AddManagersToGroupRequest} [params.body] - No description provided. (Optional)
   *   - **userIds** (`string[]`, required) - Type: string[]
   *
   * @returns {Promise<AddManagersToGroup200Response>} - Promise resolving to the addManagersToGroup response.
   *   - **failure** (`any`, required) - A list of users that couldn’t be added to the group. This includes a list of IDs that represent invalid users and users who have already been added to the group.
   *   - **success** (`any`, required) - A list of users that have been added to the group successfully.
   *
   * @see https://developer.quickbase.com/operation/addManagersToGroup - Official Quickbase API documentation
   */
  addManagersToGroup: (params: { gid: number; body?: AddManagersToGroupRequest }) => Promise<AddManagersToGroup200Response>;
  /**
   * Remove managers
   *
   * @param {Object} params - Object containing the parameters for removeManagersFromGroup.
   * @param {number} params.gid - This is the ID of the group being modified.
   * @param {RemoveManagersFromGroupRequest} [params.body] - No description provided. (Optional)
   *   - **userIds** (`string[]`, required) - Type: string[]
   *
   * @returns {Promise<RemoveManagersFromGroup200Response>} - Promise resolving to the removeManagersFromGroup response.
   *   - **failure** (`any`, required) - A list of users that couldn’t be removed from the group. This includes a list of IDs that represent invalid users.
   *   - **success** (`any`, required) - A list of users that have been removed from the group successfully.
   *
   * @see https://developer.quickbase.com/operation/removeManagersFromGroup - Official Quickbase API documentation
   */
  removeManagersFromGroup: (params: { gid: number; body?: RemoveManagersFromGroupRequest }) => Promise<RemoveManagersFromGroup200Response>;
  /**
   * Add child groups
   *
   * @param {Object} params - Object containing the parameters for addSubgroupsToGroup.
   * @param {number} params.gid - This is the ID of the group being modified.
   * @param {AddSubgroupsToGroupRequest} [params.body] - No description provided. (Optional)
   *   - **userIds** (`string[]`, required) - Type: string[]
   *
   * @returns {Promise<AddSubgroupsToGroup200Response>} - Promise resolving to the addSubgroupsToGroup response.
   *   - **failure** (`any`, required) - A list of child groups that couldn’t be added to the group. This includes a list of IDs that represent invalid groups and groups that have already been added to the group.
   *   - **success** (`any`, required) - A list of child groups that have been added to the group successfully.
   *
   * @see https://developer.quickbase.com/operation/addSubgroupsToGroup - Official Quickbase API documentation
   */
  addSubgroupsToGroup: (params: { gid: number; body?: AddSubgroupsToGroupRequest }) => Promise<AddSubgroupsToGroup200Response>;
  /**
   * Remove child groups
   *
   * @param {Object} params - Object containing the parameters for removeSubgroupsFromGroup.
   * @param {number} params.gid - This is the ID of the group being modified.
   * @param {RemoveSubgroupsFromGroupRequest} [params.body] - No description provided. (Optional)
   *   - **userIds** (`string[]`, required) - Type: string[]
   *
   * @returns {Promise<RemoveSubgroupsFromGroup200Response>} - Promise resolving to the removeSubgroupsFromGroup response.
   *   - **failure** (`any`, required) - A list of child groups that couldn’t be removed from the group. This includes a list of IDs that represent invalid groups.
   *   - **success** (`any`, required) - A list of child groups that have been removed from the group successfully.
   *
   * @see https://developer.quickbase.com/operation/removeSubgroupsFromGroup - Official Quickbase API documentation
   */
  removeSubgroupsFromGroup: (params: { gid: number; body?: RemoveSubgroupsFromGroupRequest }) => Promise<RemoveSubgroupsFromGroup200Response>;
  /**
   * Get audit logs
   *
   * @param {Object} params - Object containing the parameters for audit.
   * @param {{ nextToken?: string; numRows?: number; queryId?: string; date?: string; topics?: string[] }} [params.body] - No description provided. (Optional)
   *
   * @returns {Promise<Audit200Response>} - Promise resolving to the audit response.
   *   - **queryId** (`string`, required) - Query id of the requested audit log.
   *   - **events** (`any`, optional) - All events of the audit log.
   *   - **nextToken** (`string`, optional) - Token to fetch the next 1000 logs.
   *
   * @see https://developer.quickbase.com/operation/audit - Official Quickbase API documentation
   */
  audit: (params: { body?: { nextToken?: string; numRows?: number; queryId?: string; date?: string; topics?: string[] } }) => Promise<Audit200Response>;
  /**
   * Get read summaries
   *
   * @param {Object} params - Object containing the parameters for platformAnalyticReads.
   * @param {string} [params.day] - The date for which read summaries need to be fetched. This must be date-time only, as YYYY-MM-DD, and a valid date in the past. (Optional)
   *
   * @returns {Promise<PlatformAnalyticReads200Response>} - Promise resolving to the platformAnalyticReads response.
   *   - **date** (`string`, required) - The date of the requested summary.
   *   - **reads** (`object`, required) - Total reads for the specified date.
   *
   * @see https://developer.quickbase.com/operation/platformAnalyticReads - Official Quickbase API documentation
   */
  platformAnalyticReads: (params: { day?: string }) => Promise<PlatformAnalyticReads200Response>;
  /**
   * Get event summaries
   *
   * @param {Object} params - Object containing the parameters for platformAnalyticEventSummaries.
   * @param {number} [params.accountId] - The ID of the account to query. If no value is specified, the first account matching the provided domain is chosen. (Optional)
   * @param {{ start?: string; end?: string; groupBy?: string; nextToken?: string; where?: { id?: string; type?: string }[] }} [params.body] - No description provided. (Optional)
   *
   * @returns {Promise<PlatformAnalyticEventSummaries200Response>} - Promise resolving to the platformAnalyticEventSummaries response.
   *   - **accountId** (`string`, required) - The ID of the account the events are associated with.
   *   - **start** (`string`, required) - The start date and time of the requested summaries in ISO 8601 time format.
   *   - **end** (`string`, required) - The end date and time of the requested summaries in ISO 8601 time format.
   *   - **groupBy** (`string`, required) - How the events should be grouped.
   *   - **where** (`any`, required) - Type: any
   *   - **results** (`any`, required) - An array of objects that contains Application/User information and an events object with summaries by event type.
   *   - **metadata** (`object`, optional) - Additional information about the results that may be helpful.
   *   - **totals** (`object`, optional) - Totals by billing category for all queried events.
   *
   * @see https://developer.quickbase.com/operation/platformAnalyticEventSummaries - Official Quickbase API documentation
   */
  platformAnalyticEventSummaries: (params: { accountId?: number; body?: { start?: string; end?: string; groupBy?: string; nextToken?: string; where?: { id?: string; type?: string }[] } }) => Promise<PlatformAnalyticEventSummaries200Response>;
  /**
   * Export a solution
   *
   * @param {Object} params - Object containing the parameters for exportSolution.
   * @param {string} params.solutionId - The unique identifier of a solution
   * @param {string} [params.qBLVersion] - The QBL version to be used for the export. If not specified the default would be used. (Optional)
   *
   * @returns {Promise<ExportSolution200Response>} - Promise resolving to the exportSolution response.
   *   - **content** (`string`, optional) - Type: string
   *
   * @see https://developer.quickbase.com/operation/exportSolution - Official Quickbase API documentation
   */
  exportSolution: (params: { solutionId: string; qBLVersion?: string }) => Promise<ExportSolution200Response>;
  /**
   * Update a solution
   *
   * @param {Object} params - Object containing the parameters for updateSolution.
   * @param {string} params.solutionId - The unique identifier of a solution
   * @param {any} [params.body] - The QBL to be used for the update. (Optional)
   * @param {boolean} [params.xQBLErrorsAsSuccess] - If this header is set to true, the API will return a 207 status code even if there are errors. The errors will be returned in the response body. (Optional)
   *
   * @returns {Promise<UpdateSolution200Response>} - Promise resolving to the updateSolution response.
   *   - **solutionId** (`string`, optional) - Type: string
   *   - **alias** (`object`, optional) - Type: object
   *   - **createdResources** (`any`, optional) - Type: any
   *   - **warnings** (`any`, optional) - Type: any
   *
   * @see https://developer.quickbase.com/operation/updateSolution - Official Quickbase API documentation
   */
  updateSolution: (params: { solutionId: string; body?: any; xQBLErrorsAsSuccess?: boolean }) => Promise<UpdateSolution200Response>;
  /**
   * Create a solution
   *
   * @param {Object} params - Object containing the parameters for createSolution.
   * @param {any} [params.body] - The QBL to be used for the create. (Optional)
   * @param {boolean} [params.xQBLErrorsAsSuccess] - If this header is set to true, the API will return a 207 status code even if there are errors. The errors will be returned in the response body. (Optional)
   *
   * @returns {Promise<CreateSolution200Response>} - Promise resolving to the createSolution response.
   *   - **solutionId** (`string`, optional) - Type: string
   *   - **alias** (`object`, optional) - Type: object
   *   - **createdResources** (`any`, optional) - Type: any
   *   - **warnings** (`any`, optional) - Type: any
   *
   * @see https://developer.quickbase.com/operation/createSolution - Official Quickbase API documentation
   */
  createSolution: (params: { body?: any; xQBLErrorsAsSuccess?: boolean }) => Promise<CreateSolution200Response>;
  /**
   * Export solution to record
   *
   * @param {Object} params - Object containing the parameters for exportSolutionToRecord.
   * @param {string} params.solutionId - The unique identifier of the solution.
   * @param {string} params.tableId - The unique identifier (dbid) of the table.
   * @param {number} params.fieldId - The unique identifier (fid) of the field. It needs to be a file attachment field.
   * @param {boolean} [params.xQBLErrorsAsSuccess] - If this header is set to true, the API will return a 207 status code even if there are errors. The errors will be returned in the response body. (Optional)
   * @param {string} [params.qBLVersion] - The QBL version to be used for the export. If not specified the default would be used. (Optional)
   *
   * @returns {Promise<ExportSolutionToRecord200Response>} - Promise resolving to the exportSolutionToRecord response.
   *   - **record_id** (`number`, optional) - Type: number
   *   - **filename** (`string`, optional) - Type: string
   *
   * @see https://developer.quickbase.com/operation/exportSolutionToRecord - Official Quickbase API documentation
   */
  exportSolutionToRecord: (params: { solutionId: string; tableId: string; fieldId: number; xQBLErrorsAsSuccess?: boolean; qBLVersion?: string }) => Promise<ExportSolutionToRecord200Response>;
  /**
   * Create solution from record
   *
   * @param {Object} params - Object containing the parameters for createSolutionFromRecord.
   * @param {string} params.tableId - The unique identifier (dbid) of the table.
   * @param {number} params.fieldId - The unique identifier (fid) of the field. It needs to be a file attachment field.
   * @param {number} params.recordId - The unique identifier of the record.
   * @param {boolean} [params.xQBLErrorsAsSuccess] - If this header is set to true, the API will return a 207 status code even if there are errors. The errors will be returned in the response body. (Optional)
   *
   * @returns {Promise<CreateSolutionFromRecord200Response>} - Promise resolving to the createSolutionFromRecord response.
   *   - **solutionId** (`string`, optional) - Type: string
   *   - **alias** (`object`, optional) - Type: object
   *   - **createdResources** (`any`, optional) - Type: any
   *   - **warnings** (`any`, optional) - Type: any
   *
   * @see https://developer.quickbase.com/operation/createSolutionFromRecord - Official Quickbase API documentation
   */
  createSolutionFromRecord: (params: { tableId: string; fieldId: number; recordId: number; xQBLErrorsAsSuccess?: boolean }) => Promise<CreateSolutionFromRecord200Response>;
  /**
   * Update solution from record
   *
   * @param {Object} params - Object containing the parameters for updateSolutionToRecord.
   * @param {string} params.solutionId - The unique identifier of the solution.
   * @param {string} params.tableId - The unique identifier (dbid) of the table.
   * @param {number} params.fieldId - The unique identifier (fid) of the field. It needs to be a file attachment field.
   * @param {number} params.recordId - The unique identifier of the record.
   * @param {boolean} [params.xQBLErrorsAsSuccess] - If this header is set to true, the API will return a 207 status code even if there are errors. The errors will be returned in the response body. (Optional)
   *
   * @returns {Promise<UpdateSolutionToRecord200Response>} - Promise resolving to the updateSolutionToRecord response.
   *   - **solutionId** (`string`, optional) - Type: string
   *   - **alias** (`object`, optional) - Type: object
   *   - **resources** (`any`, optional) - Type: any
   *   - **warnings** (`any`, optional) - Type: any
   *
   * @see https://developer.quickbase.com/operation/updateSolutionToRecord - Official Quickbase API documentation
   */
  updateSolutionToRecord: (params: { solutionId: string; tableId: string; fieldId: number; recordId: number; xQBLErrorsAsSuccess?: boolean }) => Promise<UpdateSolutionToRecord200Response>;
  /**
   * List solution changes
   *
   * @param {Object} params - Object containing the parameters for changesetSolution.
   * @param {string} params.solutionId - The unique identifier of the solution.
   * @param {any} [params.body] - The QBL to be used for the changeset. (Optional)
   * @param {boolean} [params.xQBLErrorsAsSuccess] - If this header is set to true, the API will return a 207 status code even if there are errors. The errors will be returned in the response body. (Optional)
   *
   * @returns {Promise<ChangesetSolution200Response>} - Promise resolving to the changesetSolution response.
   *   - **id** (`string`, optional) - Type: string
   *   - **changes** (`any`, optional) - Type: any
   *
   * @see https://developer.quickbase.com/operation/changesetSolution - Official Quickbase API documentation
   */
  changesetSolution: (params: { solutionId: string; body?: any; xQBLErrorsAsSuccess?: boolean }) => Promise<ChangesetSolution200Response>;
  /**
   * List solution changes from record
   *
   * @param {Object} params - Object containing the parameters for changesetSolutionFromRecord.
   * @param {string} params.solutionId - The unique identifier of the solution.
   * @param {string} params.tableId - The unique identifier (dbid) of the table.
   * @param {number} params.fieldId - The unique identifier (fid) of the field. It needs to be a file attachment field.
   * @param {number} params.recordId - The unique identifier of the record.
   * @param {boolean} [params.xQBLErrorsAsSuccess] - If this header is set to true, the API will return a 207 status code even if there are errors. The errors will be returned in the response body. (Optional)
   *
   * @returns {Promise<ChangesetSolutionFromRecord200Response>} - Promise resolving to the changesetSolutionFromRecord response.
   *   - **id** (`string`, optional) - Type: string
   *   - **changes** (`any`, optional) - Type: any
   *
   * @see https://developer.quickbase.com/operation/changesetSolutionFromRecord - Official Quickbase API documentation
   */
  changesetSolutionFromRecord: (params: { solutionId: string; tableId: string; fieldId: number; recordId: number; xQBLErrorsAsSuccess?: boolean }) => Promise<ChangesetSolutionFromRecord200Response>;
  /**
   * Generate a document
   *
   * @param {Object} params - Object containing the parameters for generateDocument.
   * @param {number} params.templateId - This is the ID of document template.
   * @param {string} params.tableId - The unique identifier of the table.
   * @param {number} [params.recordId] - The ID of the record (Optional)
   * @param {string} params.filename - File name for the downloaded file
   * @param {string} [params.accept] - The content-type of the response. application/json will return a JSON payload with a base64 encoded file. application/octet-stream will download the file directly. (Optional)
   * @param {string} [params.format] - The format of the file that is returned. Default is "pdf". (Optional)
   * @param {string} [params.margin] - Margin formatted as top right bottom left, separated by spaces. Add to override the value set in the template builder. (Optional)
   * @param {string} [params.unit] - Unit of measurement for the margin. Default is "in". Add to override the value set in the template builder. (Optional)
   * @param {string} [params.pageSize] - Page size. Default is "A4". Add to override the value set in the template builder. (Optional)
   * @param {string} [params.orientation] - Page orientation. Default is "portrait". Add to override the value set in the template builder. (Optional)
   * @param {string} [params.realm] - Your Quickbase domain, for example demo.quickbase.com (Optional)
   *
   * @returns {Promise<GenerateDocument200Response>} - Promise resolving to the generateDocument response.
   *   - **fileName** (`string`, optional) - The file name.
   *   - **data** (`string`, optional) - Base64 encoded file content.
   *   - **contentType** (`string`, optional) - The document content type.
   *
   * @see https://developer.quickbase.com/operation/generateDocument - Official Quickbase API documentation
   */
  generateDocument: (params: { templateId: number; tableId: string; recordId?: number; filename: string; accept?: string; format?: string; margin?: string; unit?: string; pageSize?: string; orientation?: string; realm?: string }) => Promise<GenerateDocument200Response>;
}
