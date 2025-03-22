// Generated on 2025-03-22T00:06:07.021Z
import { AddManagersToGroup200Response, AddManagersToGroupRequest, AddMembersToGroup200Response, AddMembersToGroupRequest, AddSubgroupsToGroup200Response, AddSubgroupsToGroupRequest, Audit200Response, ChangesetSolution200Response, ChangesetSolutionFromRecord200Response, CloneUserToken200Response, CopyApp200Response, CopyAppRequest, CreateApp200Response, CreateAppRequest, CreateField200Response, CreateFieldRequest, CreateRelationship200Response, CreateRelationshipRequest, CreateSolution200Response, CreateSolutionFromRecord200Response, CreateTable200Response, CreateTableRequest, DeactivateUserToken200Response, DeleteApp200Response, DeleteAppRequest, DeleteFields200Response, DeleteFieldsRequest, DeleteFile200Response, DeleteRecords200Response, DeleteRecordsRequest, DeleteRelationship200Response, DeleteTable200Response, DeleteUserToken200Response, DenyUsers200Response, DenyUsersAndGroups200Response, DenyUsersAndGroupsRequest, DenyUsersRequest, DownloadFile200Response, ExchangeSsoToken200Response, ExportSolution200Response, ExportSolutionToRecord200Response, GenerateDocument200Response, GetApp200Response, GetAppEvents200Response, GetAppTables200Response, GetField200Response, GetFieldUsage200Response, GetFields200Response, GetFieldsUsage200Response, GetRelationships200Response, GetReport200Response, GetTable200Response, GetTableReports200Response, GetTempTokenDBID200Response, GetUsers200Response, GetUsersRequest, PlatformAnalyticEventSummaries200Response, PlatformAnalyticReads200Response, RemoveManagersFromGroup200Response, RemoveManagersFromGroupRequest, RemoveMembersFromGroup200Response, RemoveMembersFromGroupRequest, RemoveSubgroupsFromGroup200Response, RemoveSubgroupsFromGroupRequest, RunFormula200Response, RunQuery200Response, RunQueryRequest, RunReport200Response, TransferUserToken200Response, UndenyUsers200Response, UndenyUsersRequest, UpdateApp200Response, UpdateAppRequest, UpdateField200Response, UpdateFieldRequest, UpdateRelationship200Response, UpdateRelationshipRequest, UpdateSolution200Response, UpdateSolutionToRecord200Response, UpdateTable200Response, UpdateTableRequest, Upsert200Response, Upsert207Response, UpsertRequest } from "../generated/models";

export interface QuickbaseClient {
  /**
   * Create an app
   *
   * @param {Object} params _Object containing the parameters for_ createApp
   *   @param {CreateAppRequest} params.body _Optional parameter with properties_
   *     - **name** (`string`, required) _The name of the app._
   *     - **description** (`string`, optional) _A description for the app._
   *     - **assignToken** (`boolean`, required) _Whether to assign the user token._
   *
   * @returns {Promise<CreateApp200Response>} _Promise resolving to the createApp response with properties_
   *   - **name** (`string`, required) _The app name. You are allowed to create multiple apps with the same name, in the same realm, because they will have different dbid values. We urge you to be careful about doing this._
   *   - **description** (`string`, optional) _The description for the app. If this property is left out, the app description will be blank._
   *   - **created** (`string`, optional) _The time and date the app was created, in the ISO 8601 time format YYYY-MM-DDThh:mm:ss.sssZ (in UTC time zone)._
   *   - **updated** (`string`, optional) _The time and date the app was last updated, in the ISO 8601 time format YYYY-MM-DDThh:mm:ss.sssZ (in UTC time zone)._
   *   - **dateFormat** (`string`, optional) _A description of the format used when displaying date values in this app. Note that this is a browser-only parameter - see the [Field type details](../fieldInfo) page in the API Guide for how time values are returned in API calls. See [About Localizing Dates](https://help.quickbase.com/user-assistance/about_localizing_dates_numbers.html) to set the app’s date format._
   *   - **timeZone** (`string`, optional) _A description of the time zone used when displaying time values in this app. Note that this is a browser-only parameter - see the [Field type details](../fieldInfo) page in the portal for how time values are returned in API calls. See [Set the Time Zone for Both the Application and the Account](https://help.quickbase.com/user-assistance/application_local_timezone.html) to set the application’s time zone._
   *   - **memoryInfo** (`object`, optional) _Application memory info_
   *   - **id** (`string`, optional) _The unique identifier for this application._
   *   - **hasEveryoneOnTheInternet** (`boolean`, optional) _Indicates whether app includes Everyone On The Internet access. See [Sharing apps with Everyone on the Internet (EOTI).](https://help.quickbase.com/user-assistance/share_with_everyone_on_internet.html)_
   *   - **variables** (`{ [key: string]: any; }[]`, optional) _The app variables. See [About Application Variables](https://help.quickbase.com/user-assistance/variables.html)_
   *   - **dataClassification** (`string`, optional) _The Data Classification label assigned to the application. If Data Classification is not turned on, this will not be returned. If Data Classification is turned on, but application is not labeled, we return “None".  Data Classification labels can be added in the Admin Console by a Realm Administrator for Platform+ plans._
   *   - **securityProperties** (`{ [key: string]: any; }`, optional) _Security properties of the application_
   *
   * @see {@link https://developer.quickbase.com/operation/createApp} Official Quickbase API documentation
   */
  createApp: (params: { body?: CreateAppRequest }) => Promise<CreateApp200Response>;
  /**
   * Get an app
   *
   * @param {Object} params _Object containing the parameters for_ getApp
   *   @param {string} params.appId _Required parameter with properties_
   *
   * @returns {Promise<GetApp200Response>} _Promise resolving to the getApp response with properties_
   *   - **ancestorId** (`string`, optional) _The id of the app from which this app was copied_
   *   - **name** (`string`, required) _The app name. You are allowed to create multiple apps with the same name, in the same realm, because they will have different dbid values. We urge you to be careful about doing this._
   *   - **description** (`string`, optional) _The description for the app. If this property is left out, the app description will be blank._
   *   - **created** (`string`, optional) _The time and date the app was created, in the ISO 8601 time format YYYY-MM-DDThh:mm:ss.sssZ (in UTC time zone)._
   *   - **updated** (`string`, optional) _The time and date the app was last updated, in the ISO 8601 time format YYYY-MM-DDThh:mm:ss.sssZ (in UTC time zone)._
   *   - **dateFormat** (`string`, optional) _A description of the format used when displaying date values in this app. Note that this is a browser-only parameter - see the [Field type details](../fieldInfo) page in the API Guide for how time values are returned in API calls. See [About Localizing Dates](https://help.quickbase.com/user-assistance/about_localizing_dates_numbers.html) to set the app’s date format._
   *   - **timeZone** (`string`, optional) _A description of the time zone used when displaying time values in this app. Note that this is a browser-only parameter - see the [Field type details](../fieldInfo) page in the portal for how time values are returned in API calls. See [Set the Time Zone for Both the Application and the Account](https://help.quickbase.com/user-assistance/application_local_timezone.html) to set the application’s time zone._
   *   - **memoryInfo** (`object`, optional) _Application memory info_
   *   - **id** (`string`, optional) _The unique identifier for this application._
   *   - **hasEveryoneOnTheInternet** (`boolean`, optional) _Indicates whether app includes Everyone On The Internet access. See [Sharing apps with Everyone on the Internet (EOTI).](https://help.quickbase.com/user-assistance/share_with_everyone_on_internet.html)_
   *   - **variables** (`{ [key: string]: any; }[]`, optional) _The app variables. See [About Application Variables](https://help.quickbase.com/user-assistance/variables.html)_
   *   - **dataClassification** (`string`, optional) _The Data Classification label assigned to the application. If Data Classification is not turned on, this will not be returned. If Data Classification is turned on, but application is not labeled, we return “None".  Data Classification labels can be added in the Admin Console by a Realm Administrator for Platform+ plans._
   *   - **securityProperties** (`{ [key: string]: any; }`, optional) _Security properties of the application_
   *
   * @see {@link https://developer.quickbase.com/operation/getApp} Official Quickbase API documentation
   */
  getApp: (params: { appId: string }) => Promise<GetApp200Response>;
  /**
   * Update an app
   *
   * @param {Object} params _Object containing the parameters for_ updateApp
   *   @param {string} params.appId _Required parameter with properties_
   *   @param {UpdateAppRequest} params.body _Optional parameter with properties_
   *     - **name** (`string`, required) _The name of the app._
   *     - **description** (`string`, optional) _A description for the app._
   *     - **assignToken** (`boolean`, required) _Whether to assign the user token._
   *
   * @returns {Promise<UpdateApp200Response>} _Promise resolving to the updateApp response with properties_
   *   - **ancestorId** (`string`, optional) _The id of the app from which this app was copied_
   *   - **name** (`string`, required) _The app name. You are allowed to create multiple apps with the same name, in the same realm, because they will have different dbid values. We urge you to be careful about doing this._
   *   - **description** (`string`, optional) _The description for the app. If this property is left out, the app description will be blank._
   *   - **created** (`string`, optional) _The time and date the app was created, in the ISO 8601 time format YYYY-MM-DDThh:mm:ss.sssZ (in UTC time zone)._
   *   - **updated** (`string`, optional) _The time and date the app was last updated, in the ISO 8601 time format YYYY-MM-DDThh:mm:ss.sssZ (in UTC time zone)._
   *   - **dateFormat** (`string`, optional) _A description of the format used when displaying date values in this app. Note that this is a browser-only parameter - see the [Field type details](../fieldInfo) page in the API Guide for how time values are returned in API calls. See [About Localizing Dates](https://help.quickbase.com/user-assistance/about_localizing_dates_numbers.html) to set the app’s date format._
   *   - **timeZone** (`string`, optional) _A description of the time zone used when displaying time values in this app. Note that this is a browser-only parameter - see the [Field type details](../fieldInfo) page in the portal for how time values are returned in API calls. See [Set the Time Zone for Both the Application and the Account](https://help.quickbase.com/user-assistance/application_local_timezone.html) to set the application’s time zone._
   *   - **memoryInfo** (`object`, optional) _Application memory info_
   *   - **id** (`string`, optional) _The unique identifier for this application._
   *   - **hasEveryoneOnTheInternet** (`boolean`, optional) _Indicates whether app includes Everyone On The Internet access. See [Sharing apps with Everyone on the Internet (EOTI).](https://help.quickbase.com/user-assistance/share_with_everyone_on_internet.html)_
   *   - **variables** (`{ [key: string]: any; }[]`, optional) _The app variables. See [About Application Variables](https://help.quickbase.com/user-assistance/variables.html)_
   *   - **dataClassification** (`string`, optional) _The Data Classification label assigned to the application. If Data Classification is not turned on, this will not be returned. If Data Classification is turned on, but application is not labeled, we return “None".  Data Classification labels can be added in the Admin Console by a Realm Administrator for Platform+ plans._
   *   - **securityProperties** (`{ [key: string]: any; }`, optional) _Security properties of the application_
   *
   * @see {@link https://developer.quickbase.com/operation/updateApp} Official Quickbase API documentation
   */
  updateApp: (params: { appId: string; body?: UpdateAppRequest }) => Promise<UpdateApp200Response>;
  /**
   * Delete an app
   *
   * @param {Object} params _Object containing the parameters for_ deleteApp
   *   @param {string} params.appId _Required parameter with properties_
   *   @param {DeleteAppRequest} params.body _Optional parameter with properties_
   *     - **name** (`string`, required) _The name of the app._
   *     - **description** (`string`, optional) _A description for the app._
   *     - **assignToken** (`boolean`, required) _Whether to assign the user token._
   *
   * @returns {Promise<DeleteApp200Response>} _Promise resolving to the deleteApp response with properties_
   *   - **deletedAppId** (`string`, optional) _An ID of deleted application._
   *
   * @see {@link https://developer.quickbase.com/operation/deleteApp} Official Quickbase API documentation
   */
  deleteApp: (params: { appId: string; body?: DeleteAppRequest }) => Promise<DeleteApp200Response>;
  /**
   * Get app events
   *
   * @param {Object} params _Object containing the parameters for_ getAppEvents
   *   @param {string} params.appId _Required parameter with properties_
   *
   * @returns {Promise<GetAppEvents200Response>} _Promise resolving to the getAppEvents response with properties_
   *   - **isActive** (`boolean`, optional) _Type: boolean_
   *   - **type** (`string`, optional) _Type: string_
   *   - **name** (`string`, optional) _Type: string_
   *   - **url** (`string`, optional) _Type: string_
   *   - **owner** (`object`, optional) _Type: object_
   *   - **tableId** (`string`, optional) _Type: string_
   *
   * @see {@link https://developer.quickbase.com/operation/getAppEvents} Official Quickbase API documentation
   */
  getAppEvents: (params: { appId: string }) => Promise<GetAppEvents200Response>;
  /**
   * Copy an app
   *
   * @param {Object} params _Object containing the parameters for_ copyApp
   *   @param {string} params.appId _Required parameter with properties_
   *   @param {CopyAppRequest} params.body _Optional parameter with properties_
   *     - **name** (`string`, required) _The name of the new app._
   *     - **description** (`string`, optional) _A description for the new app._
   *     - **properties** (`CopyAppRequestProperties`, optional) _Type: CopyAppRequestProperties_
   *
   * @returns {Promise<CopyApp200Response>} _Promise resolving to the copyApp response with properties_
   *   - **name** (`string`, required) _The app name. You are allowed to create multiple apps with the same name, in the same realm, because they will have different dbid values. We urge you to be careful about doing this._
   *   - **description** (`string`, optional) _The description for the app_
   *   - **created** (`string`, optional) _The time and date the app was created, in the ISO 8601 time format YYYY-MM-DDThh:mm:ss.sssZ (in UTC time zone)._
   *   - **updated** (`string`, optional) _The time and date the app was last updated, in the ISO 8601 time format YYYY-MM-DDThh:mm:ss.sssZ (in UTC time zone)._
   *   - **dateFormat** (`string`, optional) _A description of the format used when displaying date values in this app. Note that this is a browser-only parameter - see the [Field type details](../fieldInfo) page in the API Guide for how time values are returned in API calls. See [About Localizing Dates](https://help.quickbase.com/user-assistance/about_localizing_dates_numbers.html) to set the app’s date format._
   *   - **timeZone** (`string`, optional) _A description of the time zone used when displaying time values in this app. Note that this is a browser-only parameter - see the [Field type details](../fieldInfo) page in the portal for how time values are returned in API calls. See [Set the Time Zone for Both the Application and the Account](https://help.quickbase.com/user-assistance/application_local_timezone.html) to set the application’s time zone._
   *   - **id** (`string`, optional) _The unique identifier for this application._
   *   - **hasEveryoneOnTheInternet** (`boolean`, optional) _Indicates whether app includes Everyone On The Internet access. See [Sharing apps with Everyone on the Internet (EOTI).](https://help.quickbase.com/user-assistance/share_with_everyone_on_internet.html)_
   *   - **variables** (`{ [key: string]: any; }[]`, optional) _The app variables. See [About Application Variables](https://help.quickbase.com/user-assistance/variables.html)_
   *   - **ancestorId** (`string`, optional) _The id of the app from which this app was copied_
   *   - **dataClassification** (`string`, optional) _The Data Classification label assigned to the application. If Data Classification is not turned on, this will not be returned. If Data Classification is turned on, but application is not labeled, we return “None".  Data Classification labels can be added in the Admin Console by a Realm Administrator for Platform+ plans._
   *
   * @see {@link https://developer.quickbase.com/operation/copyApp} Official Quickbase API documentation
   */
  copyApp: (params: { appId: string; body?: CopyAppRequest }) => Promise<CopyApp200Response>;
  /**
   * Create a table
   *
   * @param {Object} params _Object containing the parameters for_ createTable
   *   @param {string} params.appId _Required parameter with properties_
   *   @param {CreateTableRequest} params.body _Optional parameter with properties_
   *     - **name** (`string`, required) _The name for the table._
   *     - **description** (`string`, optional) _The description for the table..._
   *     - **singleRecordName** (`string`, optional) _The singular noun for records..._
   *     - **pluralRecordName** (`string`, optional) _The plural noun for records..._
   *
   * @returns {Promise<CreateTable200Response>} _Promise resolving to the createTable response with properties_
   *   - **name** (`string`, optional) _The name of the table._
   *   - **id** (`string`, optional) _The unique identifier (dbid) of the table._
   *   - **alias** (`string`, optional) _The automatically-created table alias for the table._
   *   - **description** (`string`, optional) _The description of the table, as configured by an application administrator._
   *   - **created** (`string`, optional) _The time and date when the table was created, in the ISO 8601 time format YYYY-MM-DDThh:mm:ss.sssZ (in UTC time zone)._
   *   - **updated** (`string`, optional) _The time and date when the table schema or data was last updated, in the ISO 8601 time format YYYY-MM-DDThh:mm:ss.sssZ (in UTC time zone)._
   *   - **nextRecordId** (`number`, optional) _The incremental Record ID that will be used when the next record is created, as determined when the API call was ran._
   *   - **nextFieldId** (`number`, optional) _The incremental Field ID that will be used when the next field is created, as determined when the API call was ran._
   *   - **defaultSortFieldId** (`number`, optional) _The id of the field that is configured for default sorting._
   *   - **defaultSortOrder** (`CreateTable200ResponseDefaultSortOrderEnum`, optional) _The configuration of the default sort order on the table._
   *   - **keyFieldId** (`number`, optional) _The id of the field that is configured to be the key on this table, which is usually the Quickbase Record ID._
   *   - **singleRecordName** (`string`, optional) _The builder-configured singular noun of the table._
   *   - **pluralRecordName** (`string`, optional) _The builder-configured plural noun of the table._
   *   - **sizeLimit** (`string`, optional) _The size limit for the table._
   *   - **spaceUsed** (`string`, optional) _The amount of space currently being used by the table._
   *   - **spaceRemaining** (`string`, optional) _The amount of space remaining for use by the table._
   *
   * @see {@link https://developer.quickbase.com/operation/createTable} Official Quickbase API documentation
   */
  createTable: (params: { appId: string; body?: CreateTableRequest }) => Promise<CreateTable200Response>;
  /**
   * Get tables for an app
   *
   * @param {Object} params _Object containing the parameters for_ getAppTables
   *   @param {string} params.appId _Required parameter with properties_
   *
   * @returns {Promise<GetAppTables200Response>} _Promise resolving to the getAppTables response with properties_
   *   - **name** (`string`, optional) _Type: string_
   *   - **id** (`string`, optional) _Type: string_
   *   - **alias** (`string`, optional) _Type: string_
   *   - **description** (`string`, optional) _Type: string_
   *   - **created** (`string`, optional) _Type: string_
   *   - **updated** (`string`, optional) _Type: string_
   *   - **nextRecordId** (`number`, optional) _Type: number_
   *   - **nextFieldId** (`number`, optional) _Type: number_
   *   - **defaultSortFieldId** (`number`, optional) _Type: number_
   *   - **defaultSortOrder** (`string`, optional) _Type: string_
   *   - **keyFieldId** (`number`, optional) _Type: number_
   *   - **singleRecordName** (`string`, optional) _Type: string_
   *   - **pluralRecordName** (`string`, optional) _Type: string_
   *   - **sizeLimit** (`string`, optional) _Type: string_
   *   - **spaceUsed** (`string`, optional) _Type: string_
   *   - **spaceRemaining** (`string`, optional) _Type: string_
   *
   * @see {@link https://developer.quickbase.com/operation/getAppTables} Official Quickbase API documentation
   */
  getAppTables: (params: { appId: string }) => Promise<GetAppTables200Response>;
  /**
   * Get a table
   *
   * @param {Object} params _Object containing the parameters for_ getTable
   *   @param {string} params.appId _Required parameter with properties_
   *   @param {string} params.tableId _Required parameter with properties_
   *
   * @returns {Promise<GetTable200Response>} _Promise resolving to the getTable response with properties_
   *   - **name** (`string`, optional) _The name of the table._
   *   - **id** (`string`, optional) _The unique identifier (dbid) of the table._
   *   - **alias** (`string`, optional) _The automatically-created table alias for the table._
   *   - **description** (`string`, optional) _The description of the table, as configured by an application administrator._
   *   - **created** (`string`, optional) _The time and date when the table was created, in the ISO 8601 time format YYYY-MM-DDThh:mm:ss.sssZ (in UTC time zone)._
   *   - **updated** (`string`, optional) _The time and date when the table schema or data was last updated, in the ISO 8601 time format YYYY-MM-DDThh:mm:ss.sssZ (in UTC time zone)._
   *   - **nextRecordId** (`number`, optional) _The incremental Record ID that will be used when the next record is created, as determined when the API call was ran._
   *   - **nextFieldId** (`number`, optional) _The incremental Field ID that will be used when the next field is created, as determined when the API call was ran._
   *   - **defaultSortFieldId** (`number`, optional) _The id of the field that is configured for default sorting._
   *   - **defaultSortOrder** (`GetTable200ResponseDefaultSortOrderEnum`, optional) _The configuration of the default sort order on the table._
   *   - **keyFieldId** (`number`, optional) _The id of the field that is configured to be the key on this table, which is usually the Quickbase Record ID._
   *   - **singleRecordName** (`string`, optional) _The builder-configured singular noun of the table._
   *   - **pluralRecordName** (`string`, optional) _The builder-configured plural noun of the table._
   *   - **sizeLimit** (`string`, optional) _The size limit for the table._
   *   - **spaceUsed** (`string`, optional) _The amount of space currently being used by the table._
   *   - **spaceRemaining** (`string`, optional) _The amount of space remaining for use by the table._
   *
   * @see {@link https://developer.quickbase.com/operation/getTable} Official Quickbase API documentation
   */
  getTable: (params: { appId: string; tableId: string }) => Promise<GetTable200Response>;
  /**
   * Update a table
   *
   * @param {Object} params _Object containing the parameters for_ updateTable
   *   @param {string} params.appId _Required parameter with properties_
   *   @param {string} params.tableId _Required parameter with properties_
   *   @param {UpdateTableRequest} params.body _Optional parameter with properties_
   *     - **name** (`string`, optional) _The updated name of the table._
   *     - **description** (`string`, optional) _The updated description for the table._
   *
   * @returns {Promise<UpdateTable200Response>} _Promise resolving to the updateTable response with properties_
   *   - **name** (`string`, optional) _The name of the table._
   *   - **id** (`string`, optional) _The unique identifier (dbid) of the table._
   *   - **alias** (`string`, optional) _The automatically-created table alias for the table._
   *   - **description** (`string`, optional) _The description of the table, as configured by an application administrator._
   *   - **created** (`string`, optional) _The time and date when the table was created, in the ISO 8601 time format YYYY-MM-DDThh:mm:ss.sssZ (in UTC time zone)._
   *   - **updated** (`string`, optional) _The time and date when the table schema or data was last updated, in the ISO 8601 time format YYYY-MM-DDThh:mm:ss.sssZ (in UTC time zone)._
   *   - **nextRecordId** (`number`, optional) _The incremental Record ID that will be used when the next record is created, as determined when the API call was ran._
   *   - **nextFieldId** (`number`, optional) _The incremental Field ID that will be used when the next field is created, as determined when the API call was ran._
   *   - **defaultSortFieldId** (`number`, optional) _The id of the field that is configured for default sorting._
   *   - **defaultSortOrder** (`UpdateTable200ResponseDefaultSortOrderEnum`, optional) _The configuration of the default sort order on the table._
   *   - **keyFieldId** (`number`, optional) _The id of the field that is configured to be the key on this table, which is usually the Quickbase Record ID._
   *   - **singleRecordName** (`string`, optional) _The builder-configured singular noun of the table._
   *   - **pluralRecordName** (`string`, optional) _The builder-configured plural noun of the table._
   *   - **sizeLimit** (`string`, optional) _The size limit for the table._
   *   - **spaceUsed** (`string`, optional) _The amount of space currently being used by the table._
   *   - **spaceRemaining** (`string`, optional) _The amount of space remaining for use by the table._
   *
   * @see {@link https://developer.quickbase.com/operation/updateTable} Official Quickbase API documentation
   */
  updateTable: (params: { appId: string; tableId: string; body?: UpdateTableRequest }) => Promise<UpdateTable200Response>;
  /**
   * Delete a table
   *
   * @param {Object} params _Object containing the parameters for_ deleteTable
   *   @param {string} params.appId _Required parameter with properties_
   *   @param {string} params.tableId _Required parameter with properties_
   *
   * @returns {Promise<DeleteTable200Response>} _Promise resolving to the deleteTable response with properties_
   *   - **deletedTableId** (`string`, optional) _The deleted table id._
   *
   * @see {@link https://developer.quickbase.com/operation/deleteTable} Official Quickbase API documentation
   */
  deleteTable: (params: { appId: string; tableId: string }) => Promise<DeleteTable200Response>;
  /**
   * Get all relationships
   *
   * @param {Object} params _Object containing the parameters for_ getRelationships
   *   @param {number} params.skip _Optional parameter with properties_
   *   @param {string} params.tableId _Required parameter with properties_
   *
   * @returns {Promise<GetRelationships200Response>} _Promise resolving to the getRelationships response with properties_
   *   - **relationships** (`{ [key: string]: any; }[]`, required) _The relationships in a table._
   *   - **metadata** (`{ [key: string]: any; }`, optional) _Additional information about the results that may be helpful._
   *
   * @see {@link https://developer.quickbase.com/operation/getRelationships} Official Quickbase API documentation
   */
  getRelationships: (params: { skip?: number; tableId: string }) => Promise<GetRelationships200Response>;
  /**
   * Create a relationship
   *
   * @param {Object} params _Object containing the parameters for_ createRelationship
   *   @param {string} params.tableId _Required parameter with properties_
   *   @param {CreateRelationshipRequest} params.body _Optional parameter with properties_
   *     - **parentTableId** (`string`, required) _The parent table id for the relationship._
   *     - **foreignKeyField** (`{ [key: string]: any; }`, optional) _Type: { [key: string]: any; }_
   *     - **lookupFieldIds** (`number[]`, optional) _Array of field ids..._
   *     - **summaryFields** (`{ [key: string]: any; }[]`, optional) _Array of summary field objects..._
   *
   * @returns {Promise<CreateRelationship200Response>} _Promise resolving to the createRelationship response with properties_
   *   - **id** (`number`, required) _The relationship id (foreign key field id)._
   *   - **parentTableId** (`string`, required) _The parent table id of the relationship._
   *   - **childTableId** (`string`, required) _The child table id of the relationship._
   *   - **foreignKeyField** (`{ [key: string]: any; }`, optional) _The foreign key field information._
   *   - **isCrossApp** (`boolean`, required) _Whether this is a cross-app relationship._
   *   - **lookupFields** (`{ [key: string]: any; }[]`, optional) _The lookup fields array._
   *   - **summaryFields** (`{ [key: string]: any; }[]`, optional) _The summary fields array._
   *
   * @see {@link https://developer.quickbase.com/operation/createRelationship} Official Quickbase API documentation
   */
  createRelationship: (params: { tableId: string; body?: CreateRelationshipRequest }) => Promise<CreateRelationship200Response>;
  /**
   * Update a relationship
   *
   * @param {Object} params _Object containing the parameters for_ updateRelationship
   *   @param {string} params.tableId _Required parameter with properties_
   *   @param {number} params.relationshipId _Required parameter with properties_
   *   @param {UpdateRelationshipRequest} params.body _Optional parameter with properties_
   *     - **parentTableId** (`string`, optional) _The updated parent table id..._
   *     - **foreignKeyField** (`{ [key: string]: any; }`, optional) _Type: { [key: string]: any; }_
   *     - **lookupFieldIds** (`number[]`, optional) _Updated array of field ids..._
   *     - **summaryFields** (`{ [key: string]: any; }[]`, optional) _Type: { [key: string]: any; }[]_
   *
   * @returns {Promise<UpdateRelationship200Response>} _Promise resolving to the updateRelationship response with properties_
   *   - **id** (`number`, required) _The relationship id (foreign key field id)._
   *   - **parentTableId** (`string`, required) _The parent table id of the relationship._
   *   - **childTableId** (`string`, required) _The child table id of the relationship._
   *   - **foreignKeyField** (`{ [key: string]: any; }`, optional) _The foreign key field information._
   *   - **isCrossApp** (`boolean`, required) _Whether this is a cross-app relationship._
   *   - **lookupFields** (`{ [key: string]: any; }[]`, optional) _The lookup fields array._
   *   - **summaryFields** (`{ [key: string]: any; }[]`, optional) _The summary fields array._
   *
   * @see {@link https://developer.quickbase.com/operation/updateRelationship} Official Quickbase API documentation
   */
  updateRelationship: (params: { tableId: string; relationshipId: number; body?: UpdateRelationshipRequest }) => Promise<UpdateRelationship200Response>;
  /**
   * Delete a relationship
   *
   * @param {Object} params _Object containing the parameters for_ deleteRelationship
   *   @param {string} params.tableId _Required parameter with properties_
   *   @param {number} params.relationshipId _Required parameter with properties_
   *
   * @returns {Promise<DeleteRelationship200Response>} _Promise resolving to the deleteRelationship response with properties_
   *   - **relationshipId** (`number`, required) _The relationship id._
   *
   * @see {@link https://developer.quickbase.com/operation/deleteRelationship} Official Quickbase API documentation
   */
  deleteRelationship: (params: { tableId: string; relationshipId: number }) => Promise<DeleteRelationship200Response>;
  /**
   * Get reports for a table
   *
   * @param {Object} params _Object containing the parameters for_ getTableReports
   *   @param {string} params.tableId _Required parameter with properties_
   *
   * @returns {Promise<GetTableReports200Response>} _Promise resolving to the getTableReports response with properties_
   *   - **id** (`string`, optional) _Type: string_
   *   - **name** (`string`, optional) _Type: string_
   *   - **type** (`string`, optional) _Type: string_
   *   - **description** (`string`, optional) _Type: string_
   *   - **ownerId** (`number`, optional) _Type: number_
   *   - **query** (`object`, optional) _Type: object_
   *   - **properties** (`{ [key: string]: any; }`, optional) _Type: { [key: string]: any; }_
   *   - **usedLast** (`string`, optional) _Type: string_
   *   - **usedCount** (`number`, optional) _Type: number_
   *
   * @see {@link https://developer.quickbase.com/operation/getTableReports} Official Quickbase API documentation
   */
  getTableReports: (params: { tableId: string }) => Promise<GetTableReports200Response>;
  /**
   * Get a report
   *
   * @param {Object} params _Object containing the parameters for_ getReport
   *   @param {string} params.tableId _Required parameter with properties_
   *   @param {string} params.reportId _Required parameter with properties_
   *
   * @returns {Promise<GetReport200Response>} _Promise resolving to the getReport response with properties_
   *   - **id** (`string`, optional) _The identifier of the report, unique to the table._
   *   - **name** (`string`, optional) _The configured name of the report._
   *   - **type** (`string`, optional) _The type of report in Quickbase (e.g., chart)._
   *   - **description** (`string`, optional) _The configured description of a report._
   *   - **ownerId** (`number`, optional) _Optional, showed only for personal reports. The user ID of report owner._
   *   - **query** (`{ [key: string]: any; }`, optional) _The query definition as configured in Quickbase that gets executed when the report is run._
   *   - **properties** (`{ [key: string]: any; }`, optional) _A list of properties specific to the report type. To see a detailed description of the properties for each report type, See [Report Types.](../reportTypes)_
   *   - **usedLast** (`string`, optional) _The instant at which a report was last used._
   *   - **usedCount** (`number`, optional) _The number of times a report has been used._
   *
   * @see {@link https://developer.quickbase.com/operation/getReport} Official Quickbase API documentation
   */
  getReport: (params: { tableId: string; reportId: string }) => Promise<GetReport200Response>;
  /**
   * Run a report
   *
   * @param {Object} params _Object containing the parameters for_ runReport
   *   @param {string} params.tableId _Required parameter with properties_
   *   @param {number} params.skip _Optional parameter with properties_
   *   @param {number} params.top _Optional parameter with properties_
   *   @param {string} params.reportId _Required parameter with properties_
   *   @param {any} params.body _Optional parameter with properties_
   *
   * @returns {Promise<RunReport200Response>} _Promise resolving to the runReport response with properties_
   *   - **fields** (`{ [key: string]: any; }[]`, optional) _An array of objects that contains limited meta-data of each field displayed in the report. This assists in building logic that depends on field types and IDs._
   *   - **data** (`string[]`, optional) _An array of objects that either represents the record data or summarized values, depending on the report type._
   *   - **metadata** (`{ [key: string]: any; }`, optional) _Additional information about the results that may be helpful. Pagination may be needed if either you specify a smaller number of results to skip than is available, or if the API automatically returns fewer results. numRecords can be compared to totalRecords to determine if further pagination is needed._
   *
   * @see {@link https://developer.quickbase.com/operation/runReport} Official Quickbase API documentation
   */
  runReport: (params: { tableId: string; skip?: number; top?: number; reportId: string; body?: any }) => Promise<RunReport200Response>;
  /**
   * Get fields for a table
   *
   * @param {Object} params _Object containing the parameters for_ getFields
   *   @param {string} params.tableId _Required parameter with properties_
   *   @param {boolean} params.includeFieldPerms _Optional parameter with properties_
   *
   * @returns {Promise<GetFields200Response>} _Promise resolving to the getFields response with properties_
   *   - **id** (`number`, required) _Type: number_
   *   - **fieldType** (`string`, optional) _Type: string_
   *   - **mode** (`string`, optional) _Type: string_
   *   - **label** (`string`, optional) _Type: string_
   *   - **noWrap** (`boolean`, optional) _Type: boolean_
   *   - **bold** (`boolean`, optional) _Type: boolean_
   *   - **required** (`boolean`, optional) _Type: boolean_
   *   - **appearsByDefault** (`boolean`, optional) _Type: boolean_
   *   - **findEnabled** (`boolean`, optional) _Type: boolean_
   *   - **unique** (`boolean`, optional) _Type: boolean_
   *   - **doesDataCopy** (`boolean`, optional) _Type: boolean_
   *   - **fieldHelp** (`string`, optional) _Type: string_
   *   - **audited** (`boolean`, optional) _Type: boolean_
   *   - **properties** (`{ [key: string]: any; }`, optional) _Type: { [key: string]: any; }_
   *   - **permissions** (`Permission[]`, optional) __
   *     *   - **role** (`string`, required) _The role name_
   *     *   - **permissionType** (`string`, required) _Permission type (e.g., View, Modify)_
   *     *   - **roleId** (`number`, required) _The role identifier_
   *
   * @see {@link https://developer.quickbase.com/operation/getFields} Official Quickbase API documentation
   */
  getFields: (params: { tableId: string; includeFieldPerms?: boolean }) => Promise<GetFields200Response>;
  /**
   * Create a field
   *
   * @param {Object} params _Object containing the parameters for_ createField
   *   @param {string} params.tableId _Required parameter with properties_
   *   @param {CreateFieldRequest} params.body _Optional parameter with properties_
   *     - **label** (`string`, required) _The label of the field_
   *     - **fieldType** (`CreateFieldRequestFieldTypeEnum`, required) _The type of the field_
   *     - **fieldHelp** (`string`, optional) _Help text for the field_
   *     - **addToForms** (`boolean`, optional) _Whether to add the field to forms_
   *     - **permissions** (`object`, optional) _Custom permissions for the field_
   *     - **required** (`boolean`, optional) _Whether the field is required_
   *     - **unique** (`boolean`, optional) _Whether the field must have unique values_
   *     - **noWrap** (`boolean`, optional) _Whether text wrapping is disabled_
   *     - **bold** (`boolean`, optional) _Whether the field is bolded_
   *     - **appearsByDefault** (`boolean`, optional) _Whether the field appears by default in reports_
   *     - **findEnabled** (`boolean`, optional) _Whether the field is searchable_
   *     - **doesDataCopy** (`boolean`, optional) _Whether the field copies data_
   *     - **audited** (`boolean`, optional) _Whether changes to the field are audited_
   *     - **properties** (`CreateFieldRequestProperties`, optional) _Type: CreateFieldRequestProperties_
   *
   * @returns {Promise<CreateField200Response>} _Promise resolving to the createField response with properties_
   *   - **id** (`number`, required) _The id of the field, unique to this table._
   *   - **fieldType** (`string`, optional) _The type of field, as described [here](https://help.quickbase.com/user-assistance/field_types.html)._
   *   - **mode** (`string`, optional) _For derived fields, this will be 'lookup', 'summary', or 'formula', to indicate the type of derived field.  For non-derived fields, this will be blank._
   *   - **label** (`string`, optional) _The label (name) of the field._
   *   - **noWrap** (`boolean`, optional) _Indicates if the field is configured to not wrap when displayed in the product._
   *   - **bold** (`boolean`, optional) _Indicates if the field is configured to display in bold in the product._
   *   - **required** (`boolean`, optional) _Indicates if the field is marked required._
   *   - **appearsByDefault** (`boolean`, optional) _Indicates if the field is marked as a default in reports._
   *   - **findEnabled** (`boolean`, optional) _Indicates if the field is marked as searchable._
   *   - **unique** (`boolean`, optional) _Indicates if the field is marked unique._
   *   - **doesDataCopy** (`boolean`, optional) _Indicates if the field data will copy when a user copies the record._
   *   - **fieldHelp** (`string`, optional) _The configured help text shown to users within the product._
   *   - **audited** (`boolean`, optional) _Indicates if the field is being tracked as part of Quickbase Audit Logs._
   *   - **properties** (`{ [key: string]: any; }`, optional) _Additional properties for the field. Please see [Field type details](../fieldInfo) page for more details on the properties for each field type._
   *   - **permissions** (`object[]`, optional) _Field Permissions for different roles._
   *
   * @see {@link https://developer.quickbase.com/operation/createField} Official Quickbase API documentation
   */
  createField: (params: { tableId: string; body?: CreateFieldRequest }) => Promise<CreateField200Response>;
  /**
   * Delete field(s)
   *
   * @param {Object} params _Object containing the parameters for_ deleteFields
   *   @param {string} params.tableId _Required parameter with properties_
   *   @param {DeleteFieldsRequest} params.body _Optional parameter with properties_
   *     - **fieldIds** (`number[]`, required) _Type: number[]_
   *
   * @returns {Promise<DeleteFields200Response>} _Promise resolving to the deleteFields response with properties_
   *   - **deletedFieldIds** (`number[]`, required) _List of field ids to were deleted._
   *   - **errors** (`string[]`, required) _List of errors found._
   *
   * @see {@link https://developer.quickbase.com/operation/deleteFields} Official Quickbase API documentation
   */
  deleteFields: (params: { tableId: string; body?: DeleteFieldsRequest }) => Promise<DeleteFields200Response>;
  /**
   * Get field
   *
   * @param {Object} params _Object containing the parameters for_ getField
   *   @param {string} params.tableId _Required parameter with properties_
   *   @param {boolean} params.includeFieldPerms _Optional parameter with properties_
   *   @param {number} params.fieldId _Required parameter with properties_
   *
   * @returns {Promise<GetField200Response>} _Promise resolving to the getField response with properties_
   *   - **id** (`number`, required) _The id of the field, unique to this table._
   *   - **fieldType** (`string`, optional) _The type of field, as described [here](https://help.quickbase.com/user-assistance/field_types.html)._
   *   - **mode** (`string`, optional) _For derived fields, this will be 'lookup', 'summary', or 'formula', to indicate the type of derived field.  For non-derived fields, this will be blank._
   *   - **label** (`string`, optional) _The label (name) of the field._
   *   - **noWrap** (`boolean`, optional) _Indicates if the field is configured to not wrap when displayed in the product._
   *   - **bold** (`boolean`, optional) _Indicates if the field is configured to display in bold in the product._
   *   - **required** (`boolean`, optional) _Indicates if the field is marked required._
   *   - **appearsByDefault** (`boolean`, optional) _Indicates if the field is marked as a default in reports._
   *   - **findEnabled** (`boolean`, optional) _Indicates if the field is marked as searchable._
   *   - **unique** (`boolean`, optional) _Indicates if the field is marked unique._
   *   - **doesDataCopy** (`boolean`, optional) _Indicates if the field data will copy when a user copies the record._
   *   - **fieldHelp** (`string`, optional) _The configured help text shown to users within the product._
   *   - **audited** (`boolean`, optional) _Indicates if the field is being tracked as part of Quickbase Audit Logs._
   *   - **properties** (`{ [key: string]: any; }`, optional) _Additional properties for the field. Please see [Field type details](../fieldInfo) page for more details on the properties for each field type._
   *   - **permissions** (`object[]`, optional) _Field Permissions for different roles._
   *
   * @see {@link https://developer.quickbase.com/operation/getField} Official Quickbase API documentation
   */
  getField: (params: { tableId: string; includeFieldPerms?: boolean; fieldId: number }) => Promise<GetField200Response>;
  /**
   * Update a field
   *
   * @param {Object} params _Object containing the parameters for_ updateField
   *   @param {string} params.tableId _Required parameter with properties_
   *   @param {number} params.fieldId _Required parameter with properties_
   *   @param {UpdateFieldRequest} params.body _Optional parameter with properties_
   *     - **label** (`string`, required) _The label of the field_
   *     - **fieldType** (`UpdateFieldRequestFieldTypeEnum`, optional) _The type of the field_
   *     - **fieldHelp** (`string`, optional) _Help text for the field_
   *     - **addToForms** (`boolean`, optional) _Whether to add the field to forms_
   *     - **permissions** (`object`, optional) _Custom permissions for the field_
   *     - **required** (`boolean`, optional) _Whether the field is required_
   *     - **unique** (`boolean`, optional) _Whether the field must have unique values_
   *     - **noWrap** (`boolean`, optional) _Whether text wrapping is disabled_
   *     - **bold** (`boolean`, optional) _Whether the field is bolded_
   *     - **appearsByDefault** (`boolean`, optional) _Whether the field appears by default in reports_
   *     - **findEnabled** (`boolean`, optional) _Whether the field is searchable_
   *     - **doesDataCopy** (`boolean`, optional) _Whether the field copies data_
   *     - **audited** (`boolean`, optional) _Whether changes to the field are audited_
   *     - **properties** (`CreateFieldRequestProperties`, optional) _Type: CreateFieldRequestProperties_
   *
   * @returns {Promise<UpdateField200Response>} _Promise resolving to the updateField response with properties_
   *   - **id** (`number`, required) _The id of the field, unique to this table._
   *   - **fieldType** (`string`, optional) _The type of field, as described [here](https://help.quickbase.com/user-assistance/field_types.html)._
   *   - **mode** (`string`, optional) _For derived fields, this will be 'lookup', 'summary', or 'formula', to indicate the type of derived field.  For non-derived fields, this will be blank._
   *   - **label** (`string`, optional) _The label (name) of the field._
   *   - **noWrap** (`boolean`, optional) _Indicates if the field is configured to not wrap when displayed in the product._
   *   - **bold** (`boolean`, optional) _Indicates if the field is configured to display in bold in the product._
   *   - **required** (`boolean`, optional) _Indicates if the field is marked required._
   *   - **appearsByDefault** (`boolean`, optional) _Indicates if the field is marked as a default in reports._
   *   - **findEnabled** (`boolean`, optional) _Indicates if the field is marked as searchable._
   *   - **unique** (`boolean`, optional) _Indicates if the field is marked unique._
   *   - **doesDataCopy** (`boolean`, optional) _Indicates if the field data will copy when a user copies the record._
   *   - **fieldHelp** (`string`, optional) _The configured help text shown to users within the product._
   *   - **audited** (`boolean`, optional) _Indicates if the field is being tracked as part of Quickbase Audit Logs._
   *   - **properties** (`{ [key: string]: any; }`, optional) _Additional properties for the field. Please see [Field type details](../fieldInfo) page for more details on the properties for each field type._
   *   - **permissions** (`object[]`, optional) _Field Permissions for different roles._
   *
   * @see {@link https://developer.quickbase.com/operation/updateField} Official Quickbase API documentation
   */
  updateField: (params: { tableId: string; fieldId: number; body?: UpdateFieldRequest }) => Promise<UpdateField200Response>;
  /**
   * Get usage for all fields
   *
   * @param {Object} params _Object containing the parameters for_ getFieldsUsage
   *   @param {string} params.tableId _Required parameter with properties_
   *   @param {number} params.skip _Optional parameter with properties_
   *   @param {number} params.top _Optional parameter with properties_
   *
   * @returns {Promise<GetFieldsUsage200Response>} _Promise resolving to the getFieldsUsage response with properties_
   *   - **field** (`object`, required) _Type: object_
   *   - **usage** (`object`, required) _Type: object_
   *
   * @see {@link https://developer.quickbase.com/operation/getFieldsUsage} Official Quickbase API documentation
   */
  getFieldsUsage: (params: { tableId: string; skip?: number; top?: number }) => Promise<GetFieldsUsage200Response>;
  /**
   * Get usage for a field
   *
   * @param {Object} params _Object containing the parameters for_ getFieldUsage
   *   @param {string} params.tableId _Required parameter with properties_
   *   @param {number} params.fieldId _Required parameter with properties_
   *
   * @returns {Promise<GetFieldUsage200Response>} _Promise resolving to the getFieldUsage response with properties_
   *   - **field** (`object`, required) _Type: object_
   *   - **usage** (`object`, required) _Type: object_
   *
   * @see {@link https://developer.quickbase.com/operation/getFieldUsage} Official Quickbase API documentation
   */
  getFieldUsage: (params: { tableId: string; fieldId: number }) => Promise<GetFieldUsage200Response>;
  /**
   * Run a formula
   *
   * @param {Object} params _Object containing the parameters for_ runFormula
   *   @param {{ formula?: string; rid?: number; from?: string }} params.body _Optional parameter with properties_
   *
   * @returns {Promise<RunFormula200Response>} _Promise resolving to the runFormula response with properties_
   *   - **result** (`string`, optional) _The formula execution result._
   *
   * @see {@link https://developer.quickbase.com/operation/runFormula} Official Quickbase API documentation
   */
  runFormula: (params: { body?: { formula?: string; rid?: number; from?: string } }) => Promise<RunFormula200Response>;
  /**
   * Insert/Update record(s)
   *
   * @param {Object} params _Object containing the parameters for_ upsert
   *   @param {UpsertRequest} params.body _Optional parameter with properties_
   *     - **data** (`Record[]`, optional) _Type: Record[]_
   *     - **to** (`string`, optional) _Type: string_
   *     - **fieldsToReturn** (`number[]`, optional) _Type: number[]_
   *
   * @returns {Promise<Upsert200Response | Upsert207Response>} _Promise resolving to the upsert response with properties_
   *   - **metadata** (`{ [key: string]: any; }`, optional) _Information about created records, updated records, referenced but unchanged records, and records having any errors while being processed._
   *   - **data** (`string[]`, optional) _The data that is expected to be returned._
   *   - **metadata** (`{ [key: string]: any; }`, optional) _Information about created records, updated records, referenced but unchanged records, and records having any errors while being processed._
   *   - **data** (`string[]`, optional) _The data that is expected to be returned._
   *
   * @see {@link https://developer.quickbase.com/operation/upsert} Official Quickbase API documentation
   */
  upsert: (params: { body?: UpsertRequest }) => Promise<Upsert200Response | Upsert207Response>;
  /**
   * Delete record(s)
   *
   * @param {Object} params _Object containing the parameters for_ deleteRecords
   *   @param {DeleteRecordsRequest} params.body _Optional parameter with properties_
   *     - **from** (`string`, required) _Type: string_
   *     - **where** (`string`, optional) _Type: string_
   *
   * @returns {Promise<DeleteRecords200Response>} _Promise resolving to the deleteRecords response with properties_
   *   - **numberDeleted** (`number`, optional) _The number of records deleted._
   *
   * @see {@link https://developer.quickbase.com/operation/deleteRecords} Official Quickbase API documentation
   */
  deleteRecords: (params: { body?: DeleteRecordsRequest }) => Promise<DeleteRecords200Response>;
  /**
   * Query for data
   *
   * @param {Object} params _Object containing the parameters for_ runQuery
   *   @param {RunQueryRequest} params.body _Optional parameter with properties_
   *     - **from** (`string`, required) _The table identifier._
   *     - **select** (`number[]`, optional) _An array of field ids..._
   *     - **where** (`string`, optional) _The filter, using the Quickbase query language..._
   *     - **sortBy** (`RunQueryRequestSortByInner[]`, optional) _An array of field IDs and sort directions..._
   *     - **groupBy** (`RunQueryRequestGroupByInner[]`, optional) _An array that contains the fields to group the records by._
   *     - **options** (`RunQueryRequestOptions`, optional) _Type: RunQueryRequestOptions_
   *
   * @returns {Promise<RunQuery200Response>} _Promise resolving to the runQuery response with properties_
   *   - **fields** (`{ [key: string]: any; }[]`, optional) _An array of objects that contains limited meta-data of each field displayed in the report. This assists in building logic that depends on field types and IDs._
   *   - **data** (`string[]`, optional) _An array of objects that either represents the record data or summarized values, depending on the report type._
   *   - **metadata** (`{ [key: string]: any; }`, optional) _Additional information about the results that may be helpful. Pagination may be needed if either you specify a smaller number of results to skip than is available, or if the API automatically returns fewer results. numRecords can be compared to totalRecords to determine if further pagination is needed._
   *
   * @see {@link https://developer.quickbase.com/operation/runQuery} Official Quickbase API documentation
   */
  runQuery: (params: { body?: RunQueryRequest }) => Promise<RunQuery200Response>;
  /**
   * Get a temporary token for a dbid
   *
   * @param {Object} params _Object containing the parameters for_ getTempTokenDBID
   *   @param {string} params.dbid _Required parameter with properties_
   *   @param {string} params.qBAppToken _Optional parameter with properties_
   *
   * @returns {Promise<GetTempTokenDBID200Response>} _Promise resolving to the getTempTokenDBID response with properties_
   *   - **temporaryAuthorization** (`string`, optional) _Temporary authorization token._
   *
   * @see {@link https://developer.quickbase.com/operation/getTempTokenDBID} Official Quickbase API documentation
   */
  getTempTokenDBID: (params: { dbid: string; qBAppToken?: string }) => Promise<GetTempTokenDBID200Response>;
  /**
   * Exchange an SSO token
   *
   * @param {Object} params _Object containing the parameters for_ exchangeSsoToken
   *   @param {{ grant_type?: string; requested_token_type?: string; subject_token?: string; subject_token_type?: string }} params.body _Optional parameter with properties_
   *
   * @returns {Promise<ExchangeSsoToken200Response>} _Promise resolving to the exchangeSsoToken response with properties_
   *   - **access_token** (`string`, optional) _The security token issued by the authorization server in response to the token exchange request. The identifier `access_token` is used for historical reasons and the issued token need not be an OAuth access token._
   *   - **issued_token_type** (`ExchangeSsoToken200ResponseIssuedTokenTypeEnum`, optional) _An identifier for the representation of the issued security token._
   *   - **token_type** (`"N_A"`, optional) _Will always return `N_A`_
   *
   * @see {@link https://developer.quickbase.com/operation/exchangeSsoToken} Official Quickbase API documentation
   */
  exchangeSsoToken: (params: { body?: { grant_type?: string; requested_token_type?: string; subject_token?: string; subject_token_type?: string } }) => Promise<ExchangeSsoToken200Response>;
  /**
   * Clone a user token
   *
   * @param {Object} params _Object containing the parameters for_ cloneUserToken
   *   @param {{ name?: string; description?: string }} params.body _Optional parameter with properties_
   *
   * @returns {Promise<CloneUserToken200Response>} _Promise resolving to the cloneUserToken response with properties_
   *   - **active** (`boolean`, optional) _Whether the user token is active._
   *   - **apps** (`{ [key: string]: any; }[]`, optional) _The list of apps this user token is assigned to._
   *   - **lastUsed** (`string`, optional) _The last date this user token was used, in the ISO 8601 time format YYYY-MM-DDThh:mm:ss.sssZ (in UTC time zone)._
   *   - **description** (`string`, optional) _User Token description._
   *   - **id** (`number`, optional) _User Token id._
   *   - **name** (`string`, optional) _User Token name._
   *   - **token** (`string`, optional) _User Token value._
   *
   * @see {@link https://developer.quickbase.com/operation/cloneUserToken} Official Quickbase API documentation
   */
  cloneUserToken: (params: { body?: { name?: string; description?: string } }) => Promise<CloneUserToken200Response>;
  /**
   * Transfer a user token
   *
   * @param {Object} params _Object containing the parameters for_ transferUserToken
   *   @param {{ id?: number; from?: string; to?: string }} params.body _Optional parameter with properties_
   *
   * @returns {Promise<TransferUserToken200Response>} _Promise resolving to the transferUserToken response with properties_
   *   - **active** (`boolean`, optional) _Whether the user token is active._
   *   - **apps** (`{ [key: string]: any; }[]`, optional) _The list of apps this user token is assigned to._
   *   - **lastUsed** (`string`, optional) _The last date this user token was used, in the ISO 8601 time format YYYY-MM-DDThh:mm:ss.sssZ (in UTC time zone)._
   *   - **description** (`string`, optional) _User Token description._
   *   - **id** (`number`, optional) _User Token id._
   *   - **name** (`string`, optional) _User Token name._
   *
   * @see {@link https://developer.quickbase.com/operation/transferUserToken} Official Quickbase API documentation
   */
  transferUserToken: (params: { body?: { id?: number; from?: string; to?: string } }) => Promise<TransferUserToken200Response>;
  /**
   * Deactivate a user token
   *
   * @param {Object} params _Object containing the parameters for_ deactivateUserToken
   *   No parameters
   *
   * @returns {Promise<DeactivateUserToken200Response>} _Promise resolving to the deactivateUserToken response with properties_
   *   - **id** (`number`, optional) _The user token id._
   *
   * @see {@link https://developer.quickbase.com/operation/deactivateUserToken} Official Quickbase API documentation
   */
  deactivateUserToken: (params: {  }) => Promise<DeactivateUserToken200Response>;
  /**
   * Delete a user token
   *
   * @param {Object} params _Object containing the parameters for_ deleteUserToken
   *   No parameters
   *
   * @returns {Promise<DeleteUserToken200Response>} _Promise resolving to the deleteUserToken response with properties_
   *   - **id** (`number`, optional) _The user token id._
   *
   * @see {@link https://developer.quickbase.com/operation/deleteUserToken} Official Quickbase API documentation
   */
  deleteUserToken: (params: {  }) => Promise<DeleteUserToken200Response>;
  /**
   * Download file
   *
   * @param {Object} params _Object containing the parameters for_ downloadFile
   *   @param {string} params.tableId _Required parameter with properties_
   *   @param {number} params.recordId _Required parameter with properties_
   *   @param {number} params.fieldId _Required parameter with properties_
   *   @param {number} params.versionNumber _Required parameter with properties_
   *
   * @returns {Promise<DownloadFile200Response>} _Promise resolving to the downloadFile response with properties_
   *   - **data** (`Blob`, optional) _Type: Blob_
   *
   * @see {@link https://developer.quickbase.com/operation/downloadFile} Official Quickbase API documentation
   */
  downloadFile: (params: { tableId: string; recordId: number; fieldId: number; versionNumber: number }) => Promise<DownloadFile200Response>;
  /**
   * Delete file
   *
   * @param {Object} params _Object containing the parameters for_ deleteFile
   *   @param {string} params.tableId _Required parameter with properties_
   *   @param {number} params.recordId _Required parameter with properties_
   *   @param {number} params.fieldId _Required parameter with properties_
   *   @param {number} params.versionNumber _Required parameter with properties_
   *
   * @returns {Promise<DeleteFile200Response>} _Promise resolving to the deleteFile response with properties_
   *   - **versionNumber** (`number`, optional) _The number of deleted version._
   *   - **fileName** (`string`, optional) _The name of file associated with deleted version._
   *   - **uploaded** (`string`, optional) _The timestamp when the version was originally uploaded._
   *   - **creator** (`{ [key: string]: any; }`, optional) _The user that uploaded version._
   *
   * @see {@link https://developer.quickbase.com/operation/deleteFile} Official Quickbase API documentation
   */
  deleteFile: (params: { tableId: string; recordId: number; fieldId: number; versionNumber: number }) => Promise<DeleteFile200Response>;
  /**
   * Get users
   *
   * @param {Object} params _Object containing the parameters for_ getUsers
   *   @param {number} params.accountId _Optional parameter with properties_
   *   @param {GetUsersRequest} params.body _Optional parameter with properties_
   *     - **userIds** (`string[]`, required) _Type: string[]_
   *
   * @returns {Promise<GetUsers200Response>} _Promise resolving to the getUsers response with properties_
   *   - **users** (`{ [key: string]: any; }[]`, required) _A list of users found in an account with the given criterias_
   *   - **metadata** (`{ [key: string]: any; }`, required) _Additional request information_
   *
   * @see {@link https://developer.quickbase.com/operation/getUsers} Official Quickbase API documentation
   */
  getUsers: (params: { accountId?: number; body?: GetUsersRequest }) => Promise<GetUsers200Response>;
  /**
   * Deny users
   *
   * @param {Object} params _Object containing the parameters for_ denyUsers
   *   @param {number} params.accountId _Optional parameter with properties_
   *   @param {DenyUsersRequest} params.body _Optional parameter with properties_
   *     - **userIds** (`string[]`, required) _Type: string[]_
   *
   * @returns {Promise<DenyUsers200Response>} _Promise resolving to the denyUsers response with properties_
   *   - **failure** (`string[]`, required) _A list of users that couldn't be denied. This also includes the ID's of users that are not valid._
   *   - **success** (`string[]`, required) _A list of users that have successfully been denied._
   *
   * @see {@link https://developer.quickbase.com/operation/denyUsers} Official Quickbase API documentation
   */
  denyUsers: (params: { accountId?: number; body?: DenyUsersRequest }) => Promise<DenyUsers200Response>;
  /**
   * Deny and remove users from groups
   *
   * @param {Object} params _Object containing the parameters for_ denyUsersAndGroups
   *   @param {number} params.accountId _Optional parameter with properties_
   *   @param {boolean} params.shouldDeleteFromGroups _Required parameter with properties_
   *   @param {DenyUsersAndGroupsRequest} params.body _Optional parameter with properties_
   *     - **userIds** (`string[]`, required) _Type: string[]_
   *
   * @returns {Promise<DenyUsersAndGroups200Response>} _Promise resolving to the denyUsersAndGroups response with properties_
   *   - **failure** (`string[]`, required) _A list of users that couldn't be denied. This also includes the ID's of users that are not valid._
   *   - **success** (`string[]`, required) _A list of users that have successfully been denied._
   *
   * @see {@link https://developer.quickbase.com/operation/denyUsersAndGroups} Official Quickbase API documentation
   */
  denyUsersAndGroups: (params: { accountId?: number; shouldDeleteFromGroups: boolean; body?: DenyUsersAndGroupsRequest }) => Promise<DenyUsersAndGroups200Response>;
  /**
   * Undeny users
   *
   * @param {Object} params _Object containing the parameters for_ undenyUsers
   *   @param {number} params.accountId _Optional parameter with properties_
   *   @param {UndenyUsersRequest} params.body _Optional parameter with properties_
   *     - **userIds** (`string[]`, required) _Type: string[]_
   *
   * @returns {Promise<UndenyUsers200Response>} _Promise resolving to the undenyUsers response with properties_
   *   - **failure** (`string[]`, required) _A list of users that couldn't be undenied. This also includes the ID's of users that are not valid._
   *   - **success** (`string[]`, required) _A list of users that have successfully been undenied._
   *
   * @see {@link https://developer.quickbase.com/operation/undenyUsers} Official Quickbase API documentation
   */
  undenyUsers: (params: { accountId?: number; body?: UndenyUsersRequest }) => Promise<UndenyUsers200Response>;
  /**
   * Add members
   *
   * @param {Object} params _Object containing the parameters for_ addMembersToGroup
   *   @param {number} params.gid _Required parameter with properties_
   *   @param {AddMembersToGroupRequest} params.body _Optional parameter with properties_
   *     - **userIds** (`string[]`, required) _Type: string[]_
   *
   * @returns {Promise<AddMembersToGroup200Response>} _Promise resolving to the addMembersToGroup response with properties_
   *   - **failure** (`string[]`, required) _A list of users that couldn’t be added to the group. This includes a list of IDs that represent invalid users and users who have already been added to the group._
   *   - **success** (`string[]`, required) _A list of users that have been added to the group successfully._
   *
   * @see {@link https://developer.quickbase.com/operation/addMembersToGroup} Official Quickbase API documentation
   */
  addMembersToGroup: (params: { gid: number; body?: AddMembersToGroupRequest }) => Promise<AddMembersToGroup200Response>;
  /**
   * Remove members
   *
   * @param {Object} params _Object containing the parameters for_ removeMembersFromGroup
   *   @param {number} params.gid _Required parameter with properties_
   *   @param {RemoveMembersFromGroupRequest} params.body _Optional parameter with properties_
   *     - **userIds** (`string[]`, required) _Type: string[]_
   *
   * @returns {Promise<RemoveMembersFromGroup200Response>} _Promise resolving to the removeMembersFromGroup response with properties_
   *   - **failure** (`string[]`, required) _A list of users that couldn’t be removed from the group. This includes a list of IDs that represent invalid users._
   *   - **success** (`string[]`, required) _A list of users that have been removed from the group successfully._
   *
   * @see {@link https://developer.quickbase.com/operation/removeMembersFromGroup} Official Quickbase API documentation
   */
  removeMembersFromGroup: (params: { gid: number; body?: RemoveMembersFromGroupRequest }) => Promise<RemoveMembersFromGroup200Response>;
  /**
   * Add managers
   *
   * @param {Object} params _Object containing the parameters for_ addManagersToGroup
   *   @param {number} params.gid _Required parameter with properties_
   *   @param {AddManagersToGroupRequest} params.body _Optional parameter with properties_
   *     - **userIds** (`string[]`, required) _Type: string[]_
   *
   * @returns {Promise<AddManagersToGroup200Response>} _Promise resolving to the addManagersToGroup response with properties_
   *   - **failure** (`string[]`, required) _A list of users that couldn’t be added to the group. This includes a list of IDs that represent invalid users and users who have already been added to the group._
   *   - **success** (`string[]`, required) _A list of users that have been added to the group successfully._
   *
   * @see {@link https://developer.quickbase.com/operation/addManagersToGroup} Official Quickbase API documentation
   */
  addManagersToGroup: (params: { gid: number; body?: AddManagersToGroupRequest }) => Promise<AddManagersToGroup200Response>;
  /**
   * Remove managers
   *
   * @param {Object} params _Object containing the parameters for_ removeManagersFromGroup
   *   @param {number} params.gid _Required parameter with properties_
   *   @param {RemoveManagersFromGroupRequest} params.body _Optional parameter with properties_
   *     - **userIds** (`string[]`, required) _Type: string[]_
   *
   * @returns {Promise<RemoveManagersFromGroup200Response>} _Promise resolving to the removeManagersFromGroup response with properties_
   *   - **failure** (`string[]`, required) _A list of users that couldn’t be removed from the group. This includes a list of IDs that represent invalid users._
   *   - **success** (`string[]`, required) _A list of users that have been removed from the group successfully._
   *
   * @see {@link https://developer.quickbase.com/operation/removeManagersFromGroup} Official Quickbase API documentation
   */
  removeManagersFromGroup: (params: { gid: number; body?: RemoveManagersFromGroupRequest }) => Promise<RemoveManagersFromGroup200Response>;
  /**
   * Add child groups
   *
   * @param {Object} params _Object containing the parameters for_ addSubgroupsToGroup
   *   @param {number} params.gid _Required parameter with properties_
   *   @param {AddSubgroupsToGroupRequest} params.body _Optional parameter with properties_
   *     - **userIds** (`string[]`, required) _Type: string[]_
   *
   * @returns {Promise<AddSubgroupsToGroup200Response>} _Promise resolving to the addSubgroupsToGroup response with properties_
   *   - **failure** (`string[]`, required) _A list of child groups that couldn’t be added to the group. This includes a list of IDs that represent invalid groups and groups that have already been added to the group._
   *   - **success** (`string[]`, required) _A list of child groups that have been added to the group successfully._
   *
   * @see {@link https://developer.quickbase.com/operation/addSubgroupsToGroup} Official Quickbase API documentation
   */
  addSubgroupsToGroup: (params: { gid: number; body?: AddSubgroupsToGroupRequest }) => Promise<AddSubgroupsToGroup200Response>;
  /**
   * Remove child groups
   *
   * @param {Object} params _Object containing the parameters for_ removeSubgroupsFromGroup
   *   @param {number} params.gid _Required parameter with properties_
   *   @param {RemoveSubgroupsFromGroupRequest} params.body _Optional parameter with properties_
   *     - **userIds** (`string[]`, required) _Type: string[]_
   *
   * @returns {Promise<RemoveSubgroupsFromGroup200Response>} _Promise resolving to the removeSubgroupsFromGroup response with properties_
   *   - **failure** (`string[]`, required) _A list of child groups that couldn’t be removed from the group. This includes a list of IDs that represent invalid groups._
   *   - **success** (`string[]`, required) _A list of child groups that have been removed from the group successfully._
   *
   * @see {@link https://developer.quickbase.com/operation/removeSubgroupsFromGroup} Official Quickbase API documentation
   */
  removeSubgroupsFromGroup: (params: { gid: number; body?: RemoveSubgroupsFromGroupRequest }) => Promise<RemoveSubgroupsFromGroup200Response>;
  /**
   * Get audit logs
   *
   * @param {Object} params _Object containing the parameters for_ audit
   *   @param {{ nextToken?: string; numRows?: number; queryId?: string; date?: string; topics?: string[] }} params.body _Optional parameter with properties_
   *
   * @returns {Promise<Audit200Response>} _Promise resolving to the audit response with properties_
   *   - **queryId** (`string`, required) _Query id of the requested audit log._
   *   - **events** (`{ [key: string]: any; }[]`, optional) _All events of the audit log._
   *   - **nextToken** (`string`, optional) _Token to fetch the next 1000 logs._
   *
   * @see {@link https://developer.quickbase.com/operation/audit} Official Quickbase API documentation
   */
  audit: (params: { body?: { nextToken?: string; numRows?: number; queryId?: string; date?: string; topics?: string[] } }) => Promise<Audit200Response>;
  /**
   * Get read summaries
   *
   * @param {Object} params _Object containing the parameters for_ platformAnalyticReads
   *   @param {string} params.day _Optional parameter with properties_
   *
   * @returns {Promise<PlatformAnalyticReads200Response>} _Promise resolving to the platformAnalyticReads response with properties_
   *   - **date** (`Date`, required) _The date of the requested summary._
   *   - **reads** (`{ [key: string]: any; }`, required) _Total reads for the specified date._
   *
   * @see {@link https://developer.quickbase.com/operation/platformAnalyticReads} Official Quickbase API documentation
   */
  platformAnalyticReads: (params: { day?: string }) => Promise<PlatformAnalyticReads200Response>;
  /**
   * Get event summaries
   *
   * @param {Object} params _Object containing the parameters for_ platformAnalyticEventSummaries
   *   @param {number} params.accountId _Optional parameter with properties_
   *   @param {{ start?: string; end?: string; groupBy?: string; nextToken?: string; where?: { id?: string; type?: string }[] }} params.body _Optional parameter with properties_
   *
   * @returns {Promise<PlatformAnalyticEventSummaries200Response>} _Promise resolving to the platformAnalyticEventSummaries response with properties_
   *   - **accountId** (`string`, required) _The ID of the account the events are associated with._
   *   - **start** (`Date`, required) _The start date and time of the requested summaries in ISO 8601 time format._
   *   - **end** (`Date`, required) _The end date and time of the requested summaries in ISO 8601 time format._
   *   - **groupBy** (`PlatformAnalyticEventSummaries200ResponseGroupByEnum`, required) _How the events should be grouped._
   *   - **where** (`PlatformAnalyticEventSummaries200ResponseWhereInner[]`, required) __
   *     *   - **id** (`string`, required) _Id of the item to filter by._
   *     *   - **type** (`PlatformAnalyticEventSummaries200ResponseWhereInnerTypeEnum`, required) _The type of item to filter by._
   *   - **results** (`PlatformAnalyticEventSummaries200ResponseResultsInner[]`, required) __
   *     *   - **eventTypes** (`PlatformAnalyticEventSummaries200ResponseResultsInnerEventTypesInner[]`, required) __
   *     *     *   - **billingCategory** (`PlatformAnalyticEventSummaries200ResponseResultsInnerEventTypesInnerBillingCategoryEnum`, optional) _Billing category of the event type._
   *     *     *   - **count** (`number`, optional) _Count of events associated with that event type and Application/User._
   *     *     *   - **eventType** (`string`, optional) _Event type_
   *     *   - **id** (`string`, required) _Id of the Application/User._
   *     *   - **name** (`string`, required) _Name of the Application/User._
   *     *   - **totals** (`PlatformAnalyticEventSummaries200ResponseResultsInnerTotals`, required) _Type: PlatformAnalyticEventSummaries200ResponseResultsInnerTotals_
   *   - **metadata** (`PlatformAnalyticEventSummaries200ResponseMetadata`, optional) _Type: PlatformAnalyticEventSummaries200ResponseMetadata_
   *   - **totals** (`PlatformAnalyticEventSummaries200ResponseTotals`, optional) _Type: PlatformAnalyticEventSummaries200ResponseTotals_
   *
   * @see {@link https://developer.quickbase.com/operation/platformAnalyticEventSummaries} Official Quickbase API documentation
   */
  platformAnalyticEventSummaries: (params: { accountId?: number; body?: { start?: string; end?: string; groupBy?: string; nextToken?: string; where?: { id?: string; type?: string }[] } }) => Promise<PlatformAnalyticEventSummaries200Response>;
  /**
   * Export a solution
   *
   * @param {Object} params _Object containing the parameters for_ exportSolution
   *   @param {string} params.solutionId _Required parameter with properties_
   *   @param {string} params.qBLVersion _Optional parameter with properties_
   *
   * @returns {Promise<ExportSolution200Response>} _Promise resolving to the exportSolution response with properties_
   *   - **content** (`string`, optional) _Type: string_
   *
   * @see {@link https://developer.quickbase.com/operation/exportSolution} Official Quickbase API documentation
   */
  exportSolution: (params: { solutionId: string; qBLVersion?: string }) => Promise<ExportSolution200Response>;
  /**
   * Update a solution
   *
   * @param {Object} params _Object containing the parameters for_ updateSolution
   *   @param {string} params.solutionId _Required parameter with properties_
   *   @param {any} params.body _Optional parameter with properties_
   *   @param {boolean} params.xQBLErrorsAsSuccess _Optional parameter with properties_
   *
   * @returns {Promise<UpdateSolution200Response>} _Promise resolving to the updateSolution response with properties_
   *   - **solutionId** (`string`, optional) _Type: string_
   *   - **alias** (`object`, optional) _Type: object_
   *   - **createdResources** (`any`, optional) _Type: any_
   *   - **warnings** (`any`, optional) _Type: any_
   *
   * @see {@link https://developer.quickbase.com/operation/updateSolution} Official Quickbase API documentation
   */
  updateSolution: (params: { solutionId: string; body?: any; xQBLErrorsAsSuccess?: boolean }) => Promise<UpdateSolution200Response>;
  /**
   * Create a solution
   *
   * @param {Object} params _Object containing the parameters for_ createSolution
   *   @param {any} params.body _Optional parameter with properties_
   *   @param {boolean} params.xQBLErrorsAsSuccess _Optional parameter with properties_
   *
   * @returns {Promise<CreateSolution200Response>} _Promise resolving to the createSolution response with properties_
   *   - **solutionId** (`string`, optional) _Type: string_
   *   - **alias** (`object`, optional) _Type: object_
   *   - **createdResources** (`any`, optional) _Type: any_
   *   - **warnings** (`any`, optional) _Type: any_
   *
   * @see {@link https://developer.quickbase.com/operation/createSolution} Official Quickbase API documentation
   */
  createSolution: (params: { body?: any; xQBLErrorsAsSuccess?: boolean }) => Promise<CreateSolution200Response>;
  /**
   * Export solution to record
   *
   * @param {Object} params _Object containing the parameters for_ exportSolutionToRecord
   *   @param {string} params.solutionId _Required parameter with properties_
   *   @param {string} params.tableId _Required parameter with properties_
   *   @param {number} params.fieldId _Required parameter with properties_
   *   @param {boolean} params.xQBLErrorsAsSuccess _Optional parameter with properties_
   *   @param {string} params.qBLVersion _Optional parameter with properties_
   *
   * @returns {Promise<ExportSolutionToRecord200Response>} _Promise resolving to the exportSolutionToRecord response with properties_
   *   - **record_id** (`number`, optional) _Type: number_
   *   - **filename** (`string`, optional) _Type: string_
   *
   * @see {@link https://developer.quickbase.com/operation/exportSolutionToRecord} Official Quickbase API documentation
   */
  exportSolutionToRecord: (params: { solutionId: string; tableId: string; fieldId: number; xQBLErrorsAsSuccess?: boolean; qBLVersion?: string }) => Promise<ExportSolutionToRecord200Response>;
  /**
   * Create solution from record
   *
   * @param {Object} params _Object containing the parameters for_ createSolutionFromRecord
   *   @param {string} params.tableId _Required parameter with properties_
   *   @param {number} params.fieldId _Required parameter with properties_
   *   @param {number} params.recordId _Required parameter with properties_
   *   @param {boolean} params.xQBLErrorsAsSuccess _Optional parameter with properties_
   *
   * @returns {Promise<CreateSolutionFromRecord200Response>} _Promise resolving to the createSolutionFromRecord response with properties_
   *   - **solutionId** (`string`, optional) _Type: string_
   *   - **alias** (`object`, optional) _Type: object_
   *   - **createdResources** (`any`, optional) _Type: any_
   *   - **warnings** (`any`, optional) _Type: any_
   *
   * @see {@link https://developer.quickbase.com/operation/createSolutionFromRecord} Official Quickbase API documentation
   */
  createSolutionFromRecord: (params: { tableId: string; fieldId: number; recordId: number; xQBLErrorsAsSuccess?: boolean }) => Promise<CreateSolutionFromRecord200Response>;
  /**
   * Update solution from record
   *
   * @param {Object} params _Object containing the parameters for_ updateSolutionToRecord
   *   @param {string} params.solutionId _Required parameter with properties_
   *   @param {string} params.tableId _Required parameter with properties_
   *   @param {number} params.fieldId _Required parameter with properties_
   *   @param {number} params.recordId _Required parameter with properties_
   *   @param {boolean} params.xQBLErrorsAsSuccess _Optional parameter with properties_
   *
   * @returns {Promise<UpdateSolutionToRecord200Response>} _Promise resolving to the updateSolutionToRecord response with properties_
   *   - **solutionId** (`string`, optional) _Type: string_
   *   - **alias** (`object`, optional) _Type: object_
   *   - **resources** (`any`, optional) _Type: any_
   *   - **warnings** (`any`, optional) _Type: any_
   *
   * @see {@link https://developer.quickbase.com/operation/updateSolutionToRecord} Official Quickbase API documentation
   */
  updateSolutionToRecord: (params: { solutionId: string; tableId: string; fieldId: number; recordId: number; xQBLErrorsAsSuccess?: boolean }) => Promise<UpdateSolutionToRecord200Response>;
  /**
   * List solution changes
   *
   * @param {Object} params _Object containing the parameters for_ changesetSolution
   *   @param {string} params.solutionId _Required parameter with properties_
   *   @param {any} params.body _Optional parameter with properties_
   *   @param {boolean} params.xQBLErrorsAsSuccess _Optional parameter with properties_
   *
   * @returns {Promise<ChangesetSolution200Response>} _Promise resolving to the changesetSolution response with properties_
   *   - **id** (`string`, optional) _Type: string_
   *   - **changes** (`any`, optional) _Type: any_
   *
   * @see {@link https://developer.quickbase.com/operation/changesetSolution} Official Quickbase API documentation
   */
  changesetSolution: (params: { solutionId: string; body?: any; xQBLErrorsAsSuccess?: boolean }) => Promise<ChangesetSolution200Response>;
  /**
   * List solution changes from record
   *
   * @param {Object} params _Object containing the parameters for_ changesetSolutionFromRecord
   *   @param {string} params.solutionId _Required parameter with properties_
   *   @param {string} params.tableId _Required parameter with properties_
   *   @param {number} params.fieldId _Required parameter with properties_
   *   @param {number} params.recordId _Required parameter with properties_
   *   @param {boolean} params.xQBLErrorsAsSuccess _Optional parameter with properties_
   *
   * @returns {Promise<ChangesetSolutionFromRecord200Response>} _Promise resolving to the changesetSolutionFromRecord response with properties_
   *   - **id** (`string`, optional) _Type: string_
   *   - **changes** (`any`, optional) _Type: any_
   *
   * @see {@link https://developer.quickbase.com/operation/changesetSolutionFromRecord} Official Quickbase API documentation
   */
  changesetSolutionFromRecord: (params: { solutionId: string; tableId: string; fieldId: number; recordId: number; xQBLErrorsAsSuccess?: boolean }) => Promise<ChangesetSolutionFromRecord200Response>;
  /**
   * Generate a document
   *
   * @param {Object} params _Object containing the parameters for_ generateDocument
   *   @param {number} params.templateId _Required parameter with properties_
   *   @param {string} params.tableId _Required parameter with properties_
   *   @param {number} params.recordId _Optional parameter with properties_
   *   @param {string} params.filename _Required parameter with properties_
   *   @param {string} params.accept _Optional parameter with properties_
   *   @param {string} params.format _Optional parameter with properties_
   *   @param {string} params.margin _Optional parameter with properties_
   *   @param {string} params.unit _Optional parameter with properties_
   *   @param {string} params.pageSize _Optional parameter with properties_
   *   @param {string} params.orientation _Optional parameter with properties_
   *   @param {string} params.realm _Optional parameter with properties_
   *
   * @returns {Promise<GenerateDocument200Response>} _Promise resolving to the generateDocument response with properties_
   *   - **fileName** (`string`, optional) _The file name._
   *   - **data** (`string`, optional) _Base64 encoded file content._
   *   - **contentType** (`string`, optional) _The document content type._
   *
   * @see {@link https://developer.quickbase.com/operation/generateDocument} Official Quickbase API documentation
   */
  generateDocument: (params: { templateId: number; tableId: string; recordId?: number; filename: string; accept?: string; format?: string; margin?: string; unit?: string; pageSize?: string; orientation?: string; realm?: string }) => Promise<GenerateDocument200Response>;
}
