/**
 * Auto-generated TypeScript types from OpenAPI spec
 * DO NOT EDIT - Regenerate with: npm run spec:generate
 */

/* eslint-disable @typescript-eslint/no-empty-interface */

import type { PaginatedRequest } from '../client/pagination.js';

/**
 * A field value in a QuickBase record.
 * The value type depends on the field type:
 * - string: text, email, URL, date/time (ISO format)
 * - number: numeric fields, record IDs
 * - boolean: checkbox fields
 * - string[]: multi-select text lists
 * - { id: string }[]: file attachments
 */
export interface FieldValue {
  value: string | number | boolean | string[] | { id: string }[];
}

/**
 * A QuickBase record where keys are field IDs (as strings) and values are FieldValue objects.
 */
export interface QuickbaseRecord {
  [fieldId: string]: FieldValue;
}

/**
 * A field to sort by in a query.
 */
export interface SortField {
  /** The unique identifier of a field in a table. */
  fieldId: number;
  /** Sort direction: 'ASC' (ascending), 'DESC' (descending), or 'equal-values'. */
  order: 'ASC' | 'DESC' | 'equal-values';
}

/**
 * Sort configuration for queries.
 * Can be an array of sort fields, or false to disable sorting for better performance.
 */
export type SortByUnion = SortField[] | false;

/**
 * The user ID of the owner.
 * May be returned as integer or string depending on context.
 */
export type OwnerId = string | number;

// createApp
/** Create an app */
export interface CreateAppRequest {
  /** Set to true if you would like to assign the app to the user token you used to create the application. The default is false. */
  assignToken?: boolean;
  /** The app variables. A maximum of 10 variables can be inserted at a time. See [About Application Variables](https://help.quickbase.com/user-assistance/variables.html) */
  variables?: {
    /** The name for the variable. */
    name: string;
    /** The value for the variable. */
    value: string;
  }[];
  /** The app name. You are allowed to create multiple apps with the same name, in the same realm, because they will have different dbid values. We urge you to be careful about doing this. */
  name: string;
  /** Application security properties. */
  securityProperties?: {
    /** Hide from public application searches */
    hideFromPublic?: boolean;
    /** Only "approved" users may access this application */
    mustBeRealmApproved?: boolean;
    /** Allow users who are not administrators to copy */
    allowClone?: boolean;
    /** Only users logging in from "approved" IP addresses may access this application */
    useIPFilter?: boolean;
    /** Allow users who are not administrators to export data */
    allowExport?: boolean;
    /** Require Application Tokens */
    enableAppTokens?: boolean;
  };
  /** The description for the app. If this property is left out, the app description will be blank. */
  description?: string;
}

export interface CreateAppResponse {
  /** The app name. You are allowed to create multiple apps with the same name, in the same realm, because they will have different dbid values. We urge you to be careful about doing this. */
  name: string;
  /** The description for the app. If this property is left out, the app description will be blank. */
  description?: string;
  /** The time and date the app was created, in the ISO 8601 time format YYYY-MM-DDThh:mm:ss.sssZ (in UTC time zone). */
  created?: string;
  /** The time and date the app was last updated, in the ISO 8601 time format YYYY-MM-DDThh:mm:ss.sssZ (in UTC time zone). */
  updated?: string;
  /** A description of the format used when displaying date values in this app. Note that this is a browser-only parameter - see the [Field type details](../fieldInfo) page in the API Guide for how time values are returned in API calls. See [About Localizing Dates](https://help.quickbase.com/docs/how-to-localize-dates) to set the app's date format. */
  dateFormat?: string;
  /** A description of the time zone used when displaying time values in this app. Note that this is a browser-only parameter - see the [Field type details](../fieldInfo) page in the portal for how time values are returned in API calls. See [Set the Time Zone for Both the Application and the Account](https://help.quickbase.com/docs/set-the-time-zone-for-both-the-application-and-the-account) to set the application's time zone. */
  timeZone?: string;
  /** Application memory info */
  memoryInfo?: {
    /** The estimated memory of this application in gigabytes */
    estMemory?: number;
    /** The estimated memory of this application and all dependent applications in gigabytes */
    estMemoryInclDependentApps?: number;
  };
  /** The unique identifier for this application. */
  id?: string;
  /** Indicates whether app includes Everyone On The Internet access. See [Sharing apps with Everyone on the Internet (EOTI).](https://help.quickbase.com/docs/sharing-apps-publicly) */
  hasEveryoneOnTheInternet?: boolean;
  /** The app variables. See [About Application Variables](https://help.quickbase.com/user-assistance/variables.html) */
  variables?: {
    /** Variable name. */
    name?: string;
    /** Variable value. */
    value?: string;
    [key: string]: unknown;
  }[];
  /** The Data Classification label assigned to the application. If Data Classification is not turned on, this will not be returned. If Data Classification is turned on, but application is not labeled, we return “None".  Data Classification labels can be added in the Admin Console by a Realm Administrator for Platform+ plans. */
  dataClassification?: string;
  /** Security properties of the application */
  securityProperties?: {
    /** Allow users who are not administrators to copy */
    allowClone?: boolean;
    /** Allow users who are not administrators to export data */
    allowExport?: boolean;
    /** Hide from public application searches */
    hideFromPublic?: boolean;
    /** Require Application Tokens */
    enableAppTokens?: boolean;
    /** Only users logging in from "approved" IP addresses may access this application */
    useIPFilter?: boolean;
    /** Only "approved" users may access this application */
    mustBeRealmApproved?: boolean;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

// getApp
/** Get an app */
export interface GetAppParams {
  /** The unique identifier of an app */
  appId: string;
}

export interface GetAppResponse {
  /** The id of the app from which this app was copied */
  ancestorId?: string;
  /** The app name. You are allowed to create multiple apps with the same name, in the same realm, because they will have different dbid values. We urge you to be careful about doing this. */
  name: string;
  /** The description for the app. If this property is left out, the app description will be blank. */
  description?: string;
  /** The time and date the app was created, in the ISO 8601 time format YYYY-MM-DDThh:mm:ss.sssZ (in UTC time zone). */
  created?: string;
  /** The time and date the app was last updated, in the ISO 8601 time format YYYY-MM-DDThh:mm:ss.sssZ (in UTC time zone). */
  updated?: string;
  /** A description of the format used when displaying date values in this app. Note that this is a browser-only parameter - see the [Field type details](../fieldInfo) page in the API Guide for how time values are returned in API calls. See [About Localizing Dates](https://help.quickbase.com/user-assistance/about_localizing_dates_numbers.html) to set the app's date format. */
  dateFormat?: string;
  /** A description of the time zone used when displaying time values in this app. Note that this is a browser-only parameter - see the [Field type details](../fieldInfo) page in the portal for how time values are returned in API calls. See [Set the Time Zone for Both the Application and the Account](https://help.quickbase.com/user-assistance/application_local_timezone.html) to set the application's time zone. */
  timeZone?: string;
  /** Application memory info */
  memoryInfo?: {
    /** The estimated memory of this application in gigabytes */
    estMemory?: number;
    /** The estimated memory of this application and all dependent applications in gigabytes */
    estMemoryInclDependentApps?: number;
  };
  /** The unique identifier for this application. */
  id?: string;
  /** Indicates whether app includes Everyone On The Internet access. See [Sharing apps with Everyone on the Internet (EOTI).](https://help.quickbase.com/user-assistance/share_with_everyone_on_internet.html) */
  hasEveryoneOnTheInternet?: boolean;
  /** The app variables. See [About Application Variables](https://help.quickbase.com/docs/creating-and-using-application-variables) */
  variables?: {
    /** Variable name. */
    name?: string;
    /** Variable value. */
    value?: string;
    [key: string]: unknown;
  }[];
  /** The Data Classification label assigned to the application. If Data Classification is not turned on, this will not be returned. If Data Classification is turned on, but application is not labeled, we return “None".  Data Classification labels can be added in the Admin Console by a Realm Administrator for Platform+ plans. */
  dataClassification?: string;
  /** Security properties of the application */
  securityProperties?: {
    /** Allow users who are not administrators to copy */
    allowClone?: boolean;
    /** Allow users who are not administrators to export data */
    allowExport?: boolean;
    /** Hide from public application searches */
    hideFromPublic?: boolean;
    /** Require Application Tokens */
    enableAppTokens?: boolean;
    /** Only users logging in from "approved" IP addresses may access this application */
    useIPFilter?: boolean;
    /** Only "approved" users may access this application */
    mustBeRealmApproved?: boolean;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

// updateApp
/** Update an app */
export interface UpdateAppParams {
  /** The unique identifier of an app */
  appId: string;
}

export interface UpdateAppRequest {
  /** The app variables. A maximum of 10 variables can be updated at a time. See [About Application Variables](https://help.quickbase.com/user-assistance/variables.html) */
  variables?: {
    /** The name for the variable. */
    name: string;
    /** The value for the variable. */
    value: string;
  }[];
  /** The name for the app. */
  name?: string;
  /** Security properties of the application */
  securityProperties?: {
    /** Hide from public application searches */
    hideFromPublic?: boolean;
    /** Only "approved" users may access this application */
    mustBeRealmApproved?: boolean;
    /** Allow users who are not administrators to copy */
    allowClone?: boolean;
    /** Only users logging in from "approved" IP addresses may access this application */
    useIPFilter?: boolean;
    /** Allow users who are not administrators to export data */
    allowExport?: boolean;
    /** Require Application Tokens */
    enableAppTokens?: boolean;
  };
  /** The description for the app. */
  description?: string;
}

export interface UpdateAppResponse {
  /** The id of the app from which this app was copied */
  ancestorId?: string;
  /** The app name. You are allowed to create multiple apps with the same name, in the same realm, because they will have different dbid values. We urge you to be careful about doing this. */
  name: string;
  /** The description for the app. If this property is left out, the app description will be blank. */
  description?: string;
  /** The time and date the app was created, in the ISO 8601 time format YYYY-MM-DDThh:mm:ss.sssZ (in UTC time zone). */
  created?: string;
  /** The time and date the app was last updated, in the ISO 8601 time format YYYY-MM-DDThh:mm:ss.sssZ (in UTC time zone). */
  updated?: string;
  /** A description of the format used when displaying date values in this app. Note that this is a browser-only parameter - see the [Field type details](../fieldInfo) page in the API Guide for how time values are returned in API calls. See [About Localizing Dates](https://help.quickbase.com/user-assistance/about_localizing_dates_numbers.html) to set the app's date format. */
  dateFormat?: string;
  /** A description of the time zone used when displaying time values in this app. Note that this is a browser-only parameter - see the [Field type details](../fieldInfo) page in the portal for how time values are returned in API calls. See [Set the Time Zone for Both the Application and the Account](https://help.quickbase.com/user-assistance/application_local_timezone.html) to set the application's time zone. */
  timeZone?: string;
  /** Application memory info */
  memoryInfo?: {
    /** The estimated memory of this application in gigabytes */
    estMemory?: number;
    /** The estimated memory of this application and all dependent applications in gigabytes */
    estMemoryInclDependentApps?: number;
  };
  /** The unique identifier for this application. */
  id?: string;
  /** Indicates whether app includes Everyone On The Internet access. See [Sharing apps with Everyone on the Internet (EOTI).](https://help.quickbase.com/user-assistance/share_with_everyone_on_internet.html) */
  hasEveryoneOnTheInternet?: boolean;
  /** The app variables. See [About Application Variables](https://help.quickbase.com/user-assistance/variables.html) */
  variables?: {
    /** Variable name. */
    name?: string;
    /** Variable value. */
    value?: string;
    [key: string]: unknown;
  }[];
  /** The Data Classification label assigned to the application. If Data Classification is not turned on, this will not be returned. If Data Classification is turned on, but application is not labeled, we return “None".  Data Classification labels can be added in the Admin Console by a Realm Administrator for Platform+ plans. */
  dataClassification?: string;
  /** Security properties of the application */
  securityProperties?: {
    /** Allow users who are not administrators to copy */
    allowClone?: boolean;
    /** Allow users who are not administrators to export data */
    allowExport?: boolean;
    /** Hide from public application searches */
    hideFromPublic?: boolean;
    /** Require Application Tokens */
    enableAppTokens?: boolean;
    /** Only users logging in from "approved" IP addresses may access this application */
    useIPFilter?: boolean;
    /** Only "approved" users may access this application */
    mustBeRealmApproved?: boolean;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

// deleteApp
/** Delete an app */
export interface DeleteAppParams {
  /** The unique identifier of an app */
  appId: string;
}

export interface DeleteAppRequest {
  /** To confirm application deletion we ask for application name. */
  name: string;
}

export interface DeleteAppResponse {
  /** An ID of deleted application. */
  deletedAppId?: string;
  [key: string]: unknown;
}

// getAppEvents
/** Get app events */
export interface GetAppEventsParams {
  /** The unique identifier of an app */
  appId: string;
}

export type GetAppEventsResponse = ({
  /** Indication of whether current event is active. */
  isActive?: boolean;
  /** Type of an event. */
  type?: 'webhook' | 'qb-action' | 'email-notification' | 'subscription' | 'reminder' | 'automation';
  /** The name of the event. This property is not returned for automations. */
  name?: string;
  /** The url to automation that can be accessed from the browser. Only returned for automations. */
  url?: string;
  /** The user that owns the event. */
  owner?: {
    /** User full name. */
    name?: string;
    /** User Id. */
    id?: string;
    /** User email. */
    email?: string;
    /** User Name as updated in user properties. Optional, appears if not the same as user email. */
    userName?: string;
    [key: string]: unknown;
  };
  /** The unique identifier of the table to which event belongs to. */
  tableId?: string;
  [key: string]: unknown;
})[];

// copyApp
/** Copy an app */
export interface CopyAppParams {
  /** The unique identifier of an app */
  appId: string;
}

export interface CopyAppRequest {
  /** The name of the newly copied app */
  name: string;
  /** The description of the newly copied app */
  description?: string;
  /** The configuration properties for performing the app copy */
  properties?: {
    /** Whether to add the user token used to make this request to the new app */
    assignUserToken?: boolean;
    /** If keepData is true, whether to copy the file attachments as well. If keepData is false, this property is ignored */
    excludeFiles?: boolean;
    /** Whether to copy the app's data along with the schema */
    keepData?: boolean;
    /** If true, users will be copied along with their assigned roles. If false, users and roles will be copied but roles will not be assigned */
    usersAndRoles?: boolean;
  };
}

export interface CopyAppResponse {
  /** The app name. You are allowed to create multiple apps with the same name, in the same realm, because they will have different dbid values. We urge you to be careful about doing this. */
  name: string;
  /** The description for the app */
  description?: string;
  /** The time and date the app was created, in the ISO 8601 time format YYYY-MM-DDThh:mm:ss.sssZ (in UTC time zone). */
  created?: string;
  /** The time and date the app was last updated, in the ISO 8601 time format YYYY-MM-DDThh:mm:ss.sssZ (in UTC time zone). */
  updated?: string;
  /** A description of the format used when displaying date values in this app. Note that this is a browser-only parameter - see the [Field type details](../fieldInfo) page in the API Guide for how time values are returned in API calls. See [About Localizing Dates](https://help.quickbase.com/user-assistance/about_localizing_dates_numbers.html) to set the app's date format. */
  dateFormat?: string;
  /** A description of the time zone used when displaying time values in this app. Note that this is a browser-only parameter - see the [Field type details](../fieldInfo) page in the portal for how time values are returned in API calls. See [Set the Time Zone for Both the Application and the Account](https://help.quickbase.com/user-assistance/application_local_timezone.html) to set the application's time zone. */
  timeZone?: string;
  /** The unique identifier for this application. */
  id?: string;
  /** Indicates whether app includes Everyone On The Internet access. See [Sharing apps with Everyone on the Internet (EOTI).](https://help.quickbase.com/user-assistance/share_with_everyone_on_internet.html) */
  hasEveryoneOnTheInternet?: boolean;
  /** The app variables. See [About Application Variables](https://help.quickbase.com/user-assistance/variables.html) */
  variables?: {
    /** Variable name. */
    name?: string;
    /** Variable value. */
    value?: string;
    [key: string]: unknown;
  }[];
  /** The id of the app from which this app was copied */
  ancestorId?: string;
  /** The Data Classification label assigned to the application. If Data Classification is not turned on, this will not be returned. If Data Classification is turned on, but application is not labeled, we return “None".  Data Classification labels can be added in the Admin Console by a Realm Administrator for Platform+ plans. */
  dataClassification?: string;
  [key: string]: unknown;
}

// getRoles
/** Get app roles */
export interface GetRolesParams {
  /** The unique identifier of an app */
  appId: string;
}

export type GetRolesResponse = ({
  /** The role id. */
  id?: number;
  /** The role name. */
  name?: string;
  /** The role access properties. */
  access?: {
    /** The ID of the access type the role is given. (0 = None, 1 = Administrator, 2 = Basic Access with Share, 3 = Basic Access, 4 = Partial Administrator). */
    id?: number;
    /** The type of access the role is given. */
    type?: 'None' | 'Administrator' | 'Basic Access with Share' | 'Basic Access' | 'Partial Administrator';
    [key: string]: unknown;
  };
  [key: string]: unknown;
})[];

// getAppTables
/** Get tables for an app */
export interface GetAppTablesParams {
  /** The unique identifier of an app */
  appId: string;
}

export type GetAppTablesResponse = ({
  /** The name of the table. */
  name?: string;
  /** The unique identifier (dbid) of the table. */
  id?: string;
  /** The automatically-created table alias for the table. */
  alias?: string;
  /** The description of the table, as configured by an application administrator. */
  description?: string;
  /** The time and date when the table was created, in the ISO 8601 time format YYYY-MM-DDThh:mm:ss.sssZ (in UTC time zone). */
  created?: string;
  /** The time and date when the table schema or data was last updated, in the ISO 8601 time format YYYY-MM-DDThh:mm:ss.sssZ (in UTC time zone). */
  updated?: string;
  /** The incremental Record ID that will be used when the next record is created, as determined when the API call was ran. */
  nextRecordId?: number;
  /** The incremental Field ID that will be used when the next field is created, as determined when the API call was ran. */
  nextFieldId?: number;
  /** The id of the field that is configured for default sorting. */
  defaultSortFieldId?: number;
  /** The configuration of the default sort order on the table. */
  defaultSortOrder?: 'ASC' | 'DESC';
  /** The id of the field that is configured to be the key on this table, which is usually the Quickbase Record ID. */
  keyFieldId?: number;
  /** The builder-configured singular noun of the table. */
  singleRecordName?: string;
  /** The builder-configured plural noun of the table. */
  pluralRecordName?: string;
  /** The size limit for the table. */
  sizeLimit?: string;
  /** The amount of space currently being used by the table. */
  spaceUsed?: string;
  /** The amount of space remaining for use by the table. */
  spaceRemaining?: string;
  [key: string]: unknown;
})[];

// createTable
/** Create a table */
export interface CreateTableParams {
  /** The unique identifier of an app */
  appId: string;
}

export interface CreateTableRequest {
  /** The name for the table. */
  name: string;
  /** The plural noun for records in the table. If this value is not passed the default value is 'Records'. */
  pluralRecordName?: string;
  /** The singular noun for records in the table. If this value is not passed the default value is 'Record'. */
  singleRecordName?: string;
  /** The description for the table. If this value is not passed the default value is blank. */
  description?: string;
  [key: string]: unknown;
}

export interface CreateTableResponse {
  /** The name of the table. */
  name?: string;
  /** The unique identifier (dbid) of the table. */
  id?: string;
  /** The automatically-created table alias for the table. */
  alias?: string;
  /** The description of the table, as configured by an application administrator. */
  description?: string;
  /** The time and date when the table was created, in the ISO 8601 time format YYYY-MM-DDThh:mm:ss.sssZ (in UTC time zone). */
  created?: string;
  /** The time and date when the table schema or data was last updated, in the ISO 8601 time format YYYY-MM-DDThh:mm:ss.sssZ (in UTC time zone). */
  updated?: string;
  /** The incremental Record ID that will be used when the next record is created, as determined when the API call was ran. */
  nextRecordId?: number;
  /** The incremental Field ID that will be used when the next field is created, as determined when the API call was ran. */
  nextFieldId?: number;
  /** The id of the field that is configured for default sorting. */
  defaultSortFieldId?: number;
  /** The configuration of the default sort order on the table. */
  defaultSortOrder?: 'ASC' | 'DESC';
  /** The id of the field that is configured to be the key on this table, which is usually the Quickbase Record ID. */
  keyFieldId?: number;
  /** The builder-configured singular noun of the table. */
  singleRecordName?: string;
  /** The builder-configured plural noun of the table. */
  pluralRecordName?: string;
  /** The size limit for the table. */
  sizeLimit?: string;
  /** The amount of space currently being used by the table. */
  spaceUsed?: string;
  /** The amount of space remaining for use by the table. */
  spaceRemaining?: string;
  [key: string]: unknown;
}

// getTable
/** Get a table */
export interface GetTableParams {
  /** The unique identifier of an app */
  appId: string;
  /** The unique identifier (dbid) of the table. */
  tableId: string;
}

export interface GetTableResponse {
  /** The name of the table. */
  name?: string;
  /** The unique identifier (dbid) of the table. */
  id?: string;
  /** The automatically-created table alias for the table. */
  alias?: string;
  /** The description of the table, as configured by an application administrator. */
  description?: string;
  /** The time and date when the table was created, in the ISO 8601 time format YYYY-MM-DDThh:mm:ss.sssZ (in UTC time zone). */
  created?: string;
  /** The time and date when the table schema or data was last updated, in the ISO 8601 time format YYYY-MM-DDThh:mm:ss.sssZ (in UTC time zone). */
  updated?: string;
  /** The incremental Record ID that will be used when the next record is created, as determined when the API call was ran. */
  nextRecordId?: number;
  /** The incremental Field ID that will be used when the next field is created, as determined when the API call was ran. */
  nextFieldId?: number;
  /** The id of the field that is configured for default sorting. */
  defaultSortFieldId?: number;
  /** The configuration of the default sort order on the table. */
  defaultSortOrder?: 'ASC' | 'DESC';
  /** The id of the field that is configured to be the key on this table, which is usually the Quickbase Record ID. */
  keyFieldId?: number;
  /** The builder-configured singular noun of the table. */
  singleRecordName?: string;
  /** The builder-configured plural noun of the table. */
  pluralRecordName?: string;
  /** The size limit for the table. */
  sizeLimit?: string;
  /** The amount of space currently being used by the table. */
  spaceUsed?: string;
  /** The amount of space remaining for use by the table. */
  spaceRemaining?: string;
  [key: string]: unknown;
}

// updateTable
/** Update a table */
export interface UpdateTableParams {
  /** The unique identifier of an app */
  appId: string;
  /** The unique identifier (dbid) of the table. */
  tableId: string;
}

export interface UpdateTableRequest {
  /** The name for the table. */
  name?: string;
  /** The plural noun for records in the table. If this value is not passed the default value is 'Records'. */
  pluralRecordName?: string;
  /** The singular noun for records in the table. If this value is not passed the default value is 'Record'. */
  singleRecordName?: string;
  /** The description for the table. If this value is not passed the default value is blank. */
  description?: string;
  [key: string]: unknown;
}

export interface UpdateTableResponse {
  /** The name of the table. */
  name?: string;
  /** The unique identifier (dbid) of the table. */
  id?: string;
  /** The automatically-created table alias for the table. */
  alias?: string;
  /** The description of the table, as configured by an application administrator. */
  description?: string;
  /** The time and date when the table was created, in the ISO 8601 time format YYYY-MM-DDThh:mm:ss.sssZ (in UTC time zone). */
  created?: string;
  /** The time and date when the table schema or data was last updated, in the ISO 8601 time format YYYY-MM-DDThh:mm:ss.sssZ (in UTC time zone). */
  updated?: string;
  /** The incremental Record ID that will be used when the next record is created, as determined when the API call was ran. */
  nextRecordId?: number;
  /** The incremental Field ID that will be used when the next field is created, as determined when the API call was ran. */
  nextFieldId?: number;
  /** The id of the field that is configured for default sorting. */
  defaultSortFieldId?: number;
  /** The configuration of the default sort order on the table. */
  defaultSortOrder?: 'ASC' | 'DESC';
  /** The id of the field that is configured to be the key on this table, which is usually the Quickbase Record ID. */
  keyFieldId?: number;
  /** The builder-configured singular noun of the table. */
  singleRecordName?: string;
  /** The builder-configured plural noun of the table. */
  pluralRecordName?: string;
  /** The size limit for the table. */
  sizeLimit?: string;
  /** The amount of space currently being used by the table. */
  spaceUsed?: string;
  /** The amount of space remaining for use by the table. */
  spaceRemaining?: string;
  [key: string]: unknown;
}

// deleteTable
/** Delete a table */
export interface DeleteTableParams {
  /** The unique identifier of an app */
  appId: string;
  /** The unique identifier (dbid) of the table. */
  tableId: string;
}

export interface DeleteTableResponse {
  /** The deleted table id. */
  deletedTableId?: string;
  [key: string]: unknown;
}

// getRelationships
/** Get all relationships */
export interface GetRelationshipsParams {
  /** The number of relationships to skip. */
  skip?: number;
  /** The unique identifier (dbid) of the child table. */
  tableId: string;
}

export interface GetRelationshipsResponse {
  /** The relationships in a table. */
  relationships: {
    /** The relationship id (foreign key field id). */
    id: number;
    /** The parent table id of the relationship. */
    parentTableId: string;
    /** The child table id of the relationship. */
    childTableId: string;
    /** The foreign key field information. */
    foreignKeyField?: {
      /** Field id. */
      id?: number;
      /** Field label. */
      label?: string;
      /** Field type. */
      type?: string;
      [key: string]: unknown;
    };
    /** Whether this is a cross-app relationship. */
    isCrossApp: boolean;
    /** The lookup fields array. */
    lookupFields?: {
      /** Field id. */
      id?: number;
      /** Field label. */
      label?: string;
      /** Field type. */
      type?: string;
      [key: string]: unknown;
    }[];
    /** The summary fields array. */
    summaryFields?: {
      /** Field id. */
      id?: number;
      /** Field label. */
      label?: string;
      /** Field type. */
      type?: string;
      [key: string]: unknown;
    }[];
    [key: string]: unknown;
  }[];
  /** Additional information about the results that may be helpful. */
  metadata?: {
    /** The number of relationships to skip. */
    skip?: number;
    /** The total number of relationships. */
    totalRelationships?: number;
    /** The number of relationships in the current response object. */
    numRelationships?: number;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

// createRelationship
/** Create a relationship */
export interface CreateRelationshipParams {
  /** The unique identifier (dbid) of the table. This will be the child table. */
  tableId: string;
}

export interface CreateRelationshipRequest {
  /** Array of summary field objects which will turn into summary fields in the parent table. When you specify the 'COUNT' accumulation type, you have to specify 0 as the summaryFid (or not set it in the request). 'DISTINCT-COUNT' requires that summaryFid be set to an actual fid. */
  summaryFields?: ({
    /** The field id to summarize. */
    summaryFid?: number;
    /** The label for the summary field. */
    label?: string;
    /** The accumulation type for the summary field. */
    accumulationType: 'AVG' | 'SUM' | 'MAX' | 'MIN' | 'STD-DEV' | 'COUNT' | 'COMBINED-TEXT' | 'COMBINED-USER' | 'DISTINCT-COUNT';
    /** The filter, using the Quickbase query language, which determines the records to return. */
    where?: string;
    [key: string]: unknown;
  })[];
  /** Array of field IDs in the parent table that will become lookup fields in the child table. */
  lookupFieldIds?: number[];
  /** The parent table id for the relationship. */
  parentTableId: string;
  /** This property is optional.  If it is not provided, the foreign key field will be created with the label ‘Related <record>', where <record> is the name of a record in the parent table. */
  foreignKeyField?: {
    /** The label for the foreign key field. */
    label?: string;
    [key: string]: unknown;
  };
}

export interface CreateRelationshipResponse {
  /** The relationship id (foreign key field id). */
  id: number;
  /** The parent table id of the relationship. */
  parentTableId: string;
  /** The child table id of the relationship. */
  childTableId: string;
  /** The foreign key field information. */
  foreignKeyField?: {
    /** Field id. */
    id?: number;
    /** Field label. */
    label?: string;
    /** Field type. */
    type?: string;
    [key: string]: unknown;
  };
  /** Whether this is a cross-app relationship. */
  isCrossApp: boolean;
  /** The lookup fields array. */
  lookupFields?: {
    /** Field id. */
    id?: number;
    /** Field label. */
    label?: string;
    /** Field type. */
    type?: string;
    [key: string]: unknown;
  }[];
  /** The summary fields array. */
  summaryFields?: {
    /** Field id. */
    id?: number;
    /** Field label. */
    label?: string;
    /** Field type. */
    type?: string;
    [key: string]: unknown;
  }[];
  [key: string]: unknown;
}

// updateRelationship
/** Update a relationship */
export interface UpdateRelationshipParams {
  /** The unique identifier (dbid) of the table. This will be the child table. */
  tableId: string;
  /** The relationship id. This is the field id of the reference field on the child table. */
  relationshipId: number;
}

export interface UpdateRelationshipRequest {
  /** An array of objects, each representing a configuration of one field from the child table, that will become summary fields on the parent table. When you specify the 'COUNT' accumulation type, you have to specify 0 as the summaryFid (or not set it in the request). 'DISTINCT-COUNT' requires that summaryFid be set to an actual fid. */
  summaryFields?: ({
    /** The field id to summarize. */
    summaryFid?: number;
    /** The label for the summary field. */
    label?: string;
    /** The accumulation type for the summary field. */
    accumulationType: 'AVG' | 'SUM' | 'MAX' | 'MIN' | 'STD-DEV' | 'COUNT' | 'COMBINED-TEXT' | 'COMBINED-USER' | 'DISTINCT-COUNT';
    /** The filter, using the Quickbase query language, which determines the records to return. */
    where?: string;
    [key: string]: unknown;
  })[];
  /** An array of field IDs on the parent table that will become lookup fields on the child table. */
  lookupFieldIds?: number[];
}

export interface UpdateRelationshipResponse {
  /** The relationship id (foreign key field id). */
  id: number;
  /** The parent table id of the relationship. */
  parentTableId: string;
  /** The child table id of the relationship. */
  childTableId: string;
  /** The foreign key field information. */
  foreignKeyField?: {
    /** Field id. */
    id?: number;
    /** Field label. */
    label?: string;
    /** Field type. */
    type?: string;
    [key: string]: unknown;
  };
  /** Whether this is a cross-app relationship. */
  isCrossApp: boolean;
  /** The lookup fields array. */
  lookupFields?: {
    /** Field id. */
    id?: number;
    /** Field label. */
    label?: string;
    /** Field type. */
    type?: string;
    [key: string]: unknown;
  }[];
  /** The summary fields array. */
  summaryFields?: {
    /** Field id. */
    id?: number;
    /** Field label. */
    label?: string;
    /** Field type. */
    type?: string;
    [key: string]: unknown;
  }[];
  [key: string]: unknown;
}

// deleteRelationship
/** Delete a relationship */
export interface DeleteRelationshipParams {
  /** The unique identifier (dbid) of the table. This will be the child table. */
  tableId: string;
  /** The relationship id. This is the field id of the reference field on the child table. */
  relationshipId: number;
}

export interface DeleteRelationshipResponse {
  /** The relationship id. */
  relationshipId: number;
  [key: string]: unknown;
}

// getTableReports
/** Get reports for a table */
export interface GetTableReportsParams {
  /** The unique identifier of the table. */
  tableId: string;
}

export type GetTableReportsResponse = ({
  /** The identifier of the report, unique to the table. */
  id?: string;
  /** The configured name of the report. */
  name?: string;
  /** The type of report in Quickbase (e.g., chart). */
  type?: string;
  /** The configured description of a report. */
  description?: string;
  ownerId?: OwnerId;
  /** The query definition as configured in Quickbase that gets executed when the report is run. */
  query?: {
    /** The table identifier for the report. */
    tableId?: string;
    /** Filter used to query for data. */
    filter?: string;
    /** Calculated formula fields. */
    formulaFields?: ({
      /** Formula field identifier. */
      id?: number;
      /** Formula field label. */
      label?: string;
      /** Resulting formula value type. */
      fieldType?: 'rich-text' | 'text' | 'numeric' | 'currency' | 'percent' | 'rating' | 'date' | 'timestamp' | 'timeofday' | 'duration' | 'checkbox' | 'phone' | 'email' | 'user' | 'multiuser' | 'url';
      /** Formula text. */
      formula?: string;
      /** For numeric formula the number precision. */
      decimalPrecision?: number;
      [key: string]: unknown;
    })[];
    [key: string]: unknown;
  };
  /** A list of properties specific to the report type. To see a detailed description of the properties for each report type, See [Report Types.](../reportTypes) */
  properties?: Record<string, unknown>;
  /** The instant at which a report was last used. */
  usedLast?: string;
  /** The number of times a report has been used. */
  usedCount?: number;
  [key: string]: unknown;
})[];

// getReport
/** Get a report */
export interface GetReportParams {
  /** The unique identifier of table. */
  tableId: string;
  /** The identifier of the report, unique to the table. */
  reportId: string;
}

export interface GetReportResponse {
  /** The identifier of the report, unique to the table. */
  id?: string;
  /** The configured name of the report. */
  name?: string;
  /** The type of report in Quickbase (e.g., chart). */
  type?: string;
  /** The configured description of a report. */
  description?: string;
  ownerId?: OwnerId;
  /** The query definition as configured in Quickbase that gets executed when the report is run. */
  query?: {
    /** The table identifier for the report. */
    tableId?: string;
    /** Filter used to query for data. */
    filter?: string;
    /** Calculated formula fields. */
    formulaFields?: ({
      /** Formula field identifier. */
      id?: number;
      /** Formula field label. */
      label?: string;
      /** Resulting formula value type. */
      fieldType?: 'rich-text' | 'text' | 'numeric' | 'currency' | 'percent' | 'rating' | 'date' | 'timestamp' | 'timeofday' | 'duration' | 'checkbox' | 'phone' | 'email' | 'user' | 'multiuser' | 'url';
      /** Formula text. */
      formula?: string;
      /** For numeric formula the number precision. */
      decimalPrecision?: number;
      [key: string]: unknown;
    })[];
    [key: string]: unknown;
  };
  /** A list of properties specific to the report type. To see a detailed description of the properties for each report type, See [Report Types.](../reportTypes) */
  properties?: Record<string, unknown>;
  /** The instant at which a report was last used. */
  usedLast?: string;
  /** The number of times a report has been used. */
  usedCount?: number;
  [key: string]: unknown;
}

// runReport
/** Run a report */
export interface RunReportParams {
  /** The identifier of the table for the report. */
  tableId: string;
  /** The number of records to skip. You can set this value when paginating through a set of results. */
  skip?: number;
  /** The maximum number of records to return. You can override the default Quickbase pagination to get more or fewer results. If your requested value here exceeds the dynamic maximums, we will return a subset of results and the rest can be gathered in subsequent API calls. */
  top?: number;
  /** The identifier of the report, unique to the table. */
  reportId: string;
}

export type RunReportRequest = unknown;

export interface RunReportResponse {
  /** An array of objects that contains limited meta-data of each field displayed in the report. This assists in building logic that depends on field types and IDs. */
  fields?: {
    /** Field id. */
    id?: number;
    /** Field label. */
    label?: string;
    /** Field type. */
    type?: string;
    /** Column heading label override for field in report. */
    labelOverride?: string;
    [key: string]: unknown;
  }[];
  /** An array of objects that either represents the record data or summarized values, depending on the report type. */
  data?: QuickbaseRecord[];
  /** Additional information about the results that may be helpful. Pagination may be needed if either you specify a smaller number of results to skip than is available, or if the API automatically returns fewer results. numRecords can be compared to totalRecords to determine if further pagination is needed. */
  metadata?: {
    /** The number of records to skip */
    skip?: number;
    /** The number of fields in each record in the current response object */
    numFields: number;
    /** If present, the maximum number of records requested by the caller */
    top?: number;
    /** The total number of records in the result set */
    totalRecords: number;
    /** The number of records in the current response object */
    numRecords: number;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

// getFields
/** Get fields for a table */
export interface GetFieldsParams {
  /** The unique identifier (dbid) of the table. */
  tableId: string;
  /** Set to 'true' if you'd like to get back the custom permissions for the field(s). */
  includeFieldPerms?: boolean;
}

export type GetFieldsResponse = ({
  /** The id of the field, unique to this table. */
  id: number;
  /** The type of field, as described [here](https://help.quickbase.com/user-assistance/field_types.html). */
  fieldType?: string;
  /** For derived fields, this will be 'lookup', 'summary', or 'formula', to indicate the type of derived field.  For non-derived fields, this will be blank. */
  mode?: string;
  /** The label (name) of the field. */
  label?: string;
  /** Indicates if the field is configured to not wrap when displayed in the product. */
  noWrap?: boolean;
  /** Indicates if the field is configured to display in bold in the product. */
  bold?: boolean;
  /** Indicates if the field is marked required. */
  required?: boolean;
  /** Indicates if the field is marked as a default in reports. */
  appearsByDefault?: boolean;
  /** Indicates if the field is marked as searchable. */
  findEnabled?: boolean;
  /** Indicates if the field is marked unique. */
  unique?: boolean;
  /** Indicates if the field data will copy when a user copies the record. */
  doesDataCopy?: boolean;
  /** The configured help text shown to users within the product. */
  fieldHelp?: string;
  /** Indicates if the field is being tracked as part of Quickbase Audit Logs. */
  audited?: boolean;
  /** Additional properties for the field. Please see [Field type details](../fieldInfo) page for more details on the properties for each field type. */
  properties?: {
    /** If someone can @mention users in the rich text field to generate an email notification. */
    allowMentions?: boolean;
    /** The comments entered on the field properties by an administrator. */
    comments?: string;
    /** Whether this field totals in reports within the product. */
    doesTotal?: boolean;
    /** Whether the link field will auto save. */
    autoSave?: boolean;
    /** Default user id value. */
    defaultValueLuid?: number;
    /** Whether phone numbers should be in E.164 standard international format. */
    useI18NFormat?: boolean;
    /** The maximum number of versions configured for a file attachment. */
    maxVersions?: number;
    /** Whether the field should carry its multiple choice fields when copied. */
    carryChoices?: boolean;
    /** The format to display time. */
    format?: number;
    /** The maximum number of characters allowed for entry in Quickbase for this field. */
    maxLength?: number;
    /** The configured text value that replaces the URL that users see within the product. */
    linkText?: string;
    /** The id of the parent composite field, when applicable. */
    parentFieldId?: number;
    /** Indicates whether to display the timezone within the product. */
    displayTimezone?: boolean;
    /** The id of the field that is used to aggregate values from the child, when applicable. This displays 0 if the summary function doesn't require a field selection (like count). */
    summaryTargetFieldId?: number;
    /** Indicates if users can add new choices to a selection list. */
    allowNewChoices?: boolean;
    /** The id of the field that is the reference in the relationship. */
    masterChoiceFieldId?: number;
    /** Indicates if the field value is defaulted today for new records. */
    defaultToday?: boolean;
    /** The units label. */
    units?: string;
    /** The id of the field that is the target on the master table for this lookup. */
    lookupTargetFieldId?: number;
    /** The summary accumulation function type. */
    summaryFunction?: 'AVG' | 'SUM' | 'MAX' | 'MIN' | 'STD-DEV' | 'COUNT' | 'COMBINED-TEXT' | 'COMBINED-USER' | 'DISTINCT-COUNT';
    /** The id of the source field. */
    sourceFieldId?: number;
    /** The table alias for the master table in the relationship this field is part of. */
    masterTableTag?: string;
    /** Whether this field averages in reports within the product. */
    doesAverage?: boolean;
    /** The formula of the field as configured in Quickbase. */
    formula?: string;
    /** The number of decimal places displayed in the product for this field. */
    decimalPlaces?: number;
    /** Controls the default country shown on international phone widgets on forms. Country code should be entered in the ISO 3166-1 alpha-2 format. */
    defaultCountryCode?: string;
    /** Indicates if the user can see other versions, aside from the most recent, of a file attachment within the product. */
    seeVersions?: boolean;
    /** How to display months. */
    displayMonth?: string;
    /** The number of lines shown in Quickbase for this text field. */
    numLines?: number;
    /** How the email is displayed. */
    displayEmail?: string;
    /** The user default type. */
    defaultKind?: string;
    /** An alternate user friendly text that can be used to display a link in the browser. */
    coverText?: string;
    /** The current symbol used when displaying field values within the product. */
    currencySymbol?: string;
    /** The id of the table that is the master in this relationship. */
    masterChoiceTableId?: string;
    /** The id of the target field. */
    targetFieldId?: number;
    /** The configured option for how users display within the product. */
    displayUser?: string;
    /** Whether a blank value is treated the same as 0 in calculations within the product. */
    blankIsZero?: boolean;
    /** Whether an exact match is required for a report link. */
    exact?: boolean;
    /** The start field id. */
    startField?: number;
    /** Default email domain. */
    defaultDomain?: string;
    /** The default value configured for a field when a new record is added. */
    defaultValue?: string;
    /** List of user choices. */
    choicesLuid?: string[];
    /** Don't show the URL protocol when showing the URL. */
    abbreviate?: boolean;
    /** The field's xml tag. */
    xmlTag?: string;
    /** The field's target table name. */
    targetTableName?: string;
    /** The format used for displaying numeric values in the product (decimal, separators, digit group). */
    numberFormat?: number;
    /** The link text, if empty, the url will be used as link text. */
    appearsAs?: string;
    /** The field's html input width in the product. */
    width?: number;
    /** The currency format used when displaying field values within the product. */
    currencyFormat?: 'left' | 'right' | 'middle';
    /** Indicates if the field is a foreign key (or reference field) in a relationship. */
    foreignKey?: boolean;
    /** Indicates whether to display the day of the week within the product. */
    displayDayOfWeek?: boolean;
    /** The id of the field that is the reference in the relationship for this summary. */
    summaryReferenceFieldId?: number;
    /** The number of digits before commas display in the product, when applicable. */
    commaStart?: number;
    /** An array of entries that exist for a field that offers choices to the user. */
    choices?: string[];
    /** The id of the target table. */
    targetTableId?: string;
    /** Whether to display time as relative. */
    displayRelative?: boolean;
    /** An array of the fields that make up a composite field (e.g., address). */
    compositeFields?: (number | Record<string, unknown>)[];
    /** Indicates whether the checkbox values will be shown as text in reports. */
    displayCheckboxAsText?: boolean;
    /** Version modes for files. Keep all versions vs keep last version. */
    versionMode?: 'keepallversions' | 'keeplastversions';
    /** Indicates whether to display the time, in addition to the date. */
    displayTime?: boolean;
    /** The duration field id. */
    durationField?: number;
    /** The id of the field that is used to snapshot values from, when applicable. */
    snapFieldId?: number;
    /** Indicates whether or not to display time in the 24-hour format within the product. */
    hours24?: boolean;
    /** Whether to sort alphabetically, default sort is by record ID. */
    sortAlpha?: boolean;
    /** Indicates if the listed entries sort as entered vs alphabetically. */
    sortAsGiven?: boolean;
    /** Whether this field has a phone extension. */
    hasExtension?: boolean;
    /** The work week type. */
    workWeek?: number;
    /** Indicates if the URL should open a new window when a user clicks it within the product. */
    useNewWindow?: boolean;
    /** POSTs a temporary token to the first URL when clicked by a user. [Learn more](https://help.quickbase.com/docs/post-temporary-token-from-a-quickbase-field) */
    postTempToken?: boolean;
    /** Whether this field is append only. */
    appendOnly?: boolean;
    /** Indicates if a field that is part of the relationship should be shown as a hyperlink to the parent record within the product. */
    displayAsLink?: boolean;
    /** Whether this field allows html. */
    allowHTML?: boolean;
    /** The id of the field that is the reference in the relationship for this lookup. */
    lookupReferenceFieldId?: number;
    [key: string]: unknown;
  };
  /** Field Permissions for different roles. */
  permissions?: {
    /** The role associated with a given permission for the field */
    role?: string;
    /** The permission given to the role for this field */
    permissionType?: string;
    /** The Id of the given role */
    roleId?: number;
  }[];
  [key: string]: unknown;
})[];

// createField
/** Create a field */
export interface CreateFieldParams {
  /** The unique identifier of the table. */
  tableId: string;
}

export interface CreateFieldRequest {
  /** Indicates if the field is being tracked as part of Quickbase Audit Logs. You can only set this property to "true" if the app has audit logs enabled. See Enable data change logs under [Quickbase Audit Logs](https://help.quickbase.com/docs/audit-logs). Defaults to false. */
  audited?: boolean;
  /** The configured help text shown to users within the product. */
  fieldHelp?: string;
  /** Indicates if the field is configured to display in bold in the product. Defaults to false. */
  bold?: boolean;
  /** Specific field properties. */
  properties?: {
    /** If someone can @mention users in the rich text field to generate an email notification. */
    allowMentions?: boolean;
    /** The comments entered on the field properties by an administrator. */
    comments?: string;
    /** Whether this field totals in reports within the product. */
    doesTotal?: boolean;
    /** Whether the link field will auto save. */
    autoSave?: boolean;
    /** Default user id value. */
    defaultValueLuid?: number;
    /** Whether phone numbers should be in E.164 standard international format */
    useI18NFormat?: boolean;
    /** The maximum number of versions configured for a file attachment. */
    maxVersions?: number;
    /** The format to display time. */
    format?: number;
    /** Whether the field should carry its multiple choice fields when copied. */
    carryChoices?: boolean;
    /** The maximum number of characters allowed for entry in Quickbase for this field. */
    maxLength?: number;
    /** The configured text value that replaces the URL that users see within the product. */
    linkText?: string;
    /** The id of the parent composite field, when applicable. */
    parentFieldId?: number;
    /** Indicates whether to display the timezone within the product. */
    displayTimezone?: boolean;
    /** Indicates if users can add new choices to a selection list. */
    allowNewChoices?: boolean;
    /** Indicates if the field value is defaulted today for new records. */
    defaultToday?: boolean;
    /** The units label. */
    units?: string;
    /** Indicates which target the URL should open in when a user clicks it within the product. */
    openTargetIn?: 'sameWindow' | 'newWindow' | 'popup';
    /** The id of the source field. */
    sourceFieldId?: number;
    /** Whether this field averages in reports within the product. */
    doesAverage?: boolean;
    /** The formula of the field as configured in Quickbase. */
    formula?: string;
    /** The number of decimal places displayed in the product for this field. */
    decimalPlaces?: number;
    /** Controls the default country shown on international phone widgets on forms. Country code should be entered in the ISO 3166-1 alpha-2 format. */
    defaultCountryCode?: string;
    /** How to display months. */
    displayMonth?: string;
    /** Indicates if the user can see other versions, aside from the most recent, of a file attachment within the product. */
    seeVersions?: boolean;
    /** The number of lines shown in Quickbase for this text field. */
    numLines?: number;
    /** The user default type. */
    defaultKind?: string;
    /** How the email is displayed. */
    displayEmail?: string;
    /** An alternate user friendly text that can be used to display a link in the browser. */
    coverText?: string;
    /** The current symbol used when displaying field values within the product. */
    currencySymbol?: string;
    /** The id of the target field. */
    targetFieldId?: number;
    /** The configured option for how users display within the product. */
    displayUser?: string;
    /** Whether a blank value is treated the same as 0 in calculations within the product. */
    blankIsZero?: boolean;
    /** Whether an exact match is required for a report link. */
    exact?: boolean;
    /** Default email domain. */
    defaultDomain?: string;
    /** The default value configured for a field when a new record is added. */
    defaultValue?: string;
    /** Don't show the URL protocol when showing the URL. */
    abbreviate?: boolean;
    /** The format used for displaying numeric values in the product (decimal, separators, digit group). */
    numberFormat?: number;
    /** The field's target table name. */
    targetTableName?: string;
    /** The link text, if empty, the url will be used as link text. */
    appearsAs?: string;
    /** The field's html input width in the product. */
    width?: number;
    /** The currency format used when displaying field values within the product. */
    currencyFormat?: 'left' | 'right' | 'middle';
    /** Indicates whether to display the day of the week within the product. */
    displayDayOfWeek?: boolean;
    /** The number of digits before commas display in the product, when applicable. */
    commaStart?: number;
    /** An array of entries that exist for a field that offers choices to the user. Note that these choices refer to the valid values of any records added in the future. You are allowed to remove values from the list of choices even if there are existing records with those values in this field. They will be displayed in red when users look at the data in the browser but there is no other effect. While updating a field with this property, the old choices are removed and replaced by the new choices. */
    choices?: string[];
    /** The id of the target table. */
    targetTableId?: string;
    /** Whether to display time as relative. */
    displayRelative?: boolean;
    /** An array of the fields that make up a composite field (e.g., address). */
    compositeFields?: (number | Record<string, unknown>)[];
    /** Indicates whether the checkbox values will be shown as text in reports. */
    displayCheckboxAsText?: boolean;
    /** Indicates whether to display the time, in addition to the date. */
    displayTime?: boolean;
    /** Version modes for files. Keep all versions vs keep last version. */
    versionMode?: 'keepallversions' | 'keeplastversions';
    /** The id of the field that is used to snapshot values from, when applicable. */
    snapFieldId?: number;
    /** Indicates whether or not to display time in the 24-hour format within the product. */
    hours24?: boolean;
    /** Whether to sort alphabetically, default sort is by record ID. */
    sortAlpha?: boolean;
    /** Indicates if the listed entries sort as entered vs alphabetically. */
    sortAsGiven?: boolean;
    /** Whether this field has a phone extension. */
    hasExtension?: boolean;
    /** Indicates if the file should open a new window when a user clicks it within the product. */
    useNewWindow?: boolean;
    /** POSTs a temporary token to the first URL when clicked by a user. [Learn more](https://help.quickbase.com/docs/post-temporary-token-from-a-quickbase-field) */
    postTempToken?: boolean;
    /** Whether this field is append only. */
    appendOnly?: boolean;
    /** Indicates if a field that is part of the relationship should be shown as a hyperlink to the parent record within the product. */
    displayAsLink?: boolean;
  };
  /** Indicates if the field is marked as a default in reports. Defaults to true. */
  appearsByDefault?: boolean;
  /** The [field types](https://help.quickbase.com/docs/field-types), click on any of the field type links for more info. */
  fieldType: 'text' | 'text-multiple-choice' | 'text-multi-line' | 'rich-text' | 'numeric' | 'currency' | 'rating' | 'percent' | 'multitext' | 'email' | 'url' | 'duration' | 'date' | 'datetime' | 'timestamp' | 'timeofday' | 'checkbox' | 'user' | 'multiuser' | 'address' | 'phone' | 'file';
  /** Field Permissions for different roles. */
  permissions?: {
    /** The role associated with a given permission for the field */
    role?: string;
    /** The permission given to the role for this field */
    permissionType?: string;
    /** The Id of the given role */
    roleId?: number;
  }[];
  /** Whether the field you are adding should appear on forms. Defaults to false. */
  addToForms?: boolean;
  /** The label (name) of the field. */
  label: string;
  /** Indicates if the field is marked as searchable. Defaults to true. */
  findEnabled?: boolean;
  /** Indicates if the field is configured to not wrap when displayed in the product. Defaults to false. */
  noWrap?: boolean;
}

export interface CreateFieldResponse {
  /** The id of the field, unique to this table. */
  id: number;
  /** The type of field, as described [here](https://help.quickbase.com/user-assistance/field_types.html). */
  fieldType?: string;
  /** For derived fields, this will be 'lookup', 'summary', or 'formula', to indicate the type of derived field.  For non-derived fields, this will be blank. */
  mode?: string;
  /** The label (name) of the field. */
  label?: string;
  /** Indicates if the field is configured to not wrap when displayed in the product. */
  noWrap?: boolean;
  /** Indicates if the field is configured to display in bold in the product. */
  bold?: boolean;
  /** Indicates if the field is marked required. */
  required?: boolean;
  /** Indicates if the field is marked as a default in reports. */
  appearsByDefault?: boolean;
  /** Indicates if the field is marked as searchable. */
  findEnabled?: boolean;
  /** Indicates if the field is marked unique. */
  unique?: boolean;
  /** Indicates if the field data will copy when a user copies the record. */
  doesDataCopy?: boolean;
  /** The configured help text shown to users within the product. */
  fieldHelp?: string;
  /** Indicates if the field is being tracked as part of Quickbase Audit Logs. */
  audited?: boolean;
  /** Additional properties for the field. Please see [Field type details](../fieldInfo) page for more details on the properties for each field type. */
  properties?: {
    /** If someone can @mention users in the rich text field to generate an email notification. */
    allowMentions?: boolean;
    /** The comments entered on the field properties by an administrator. */
    comments?: string;
    /** Whether this field totals in reports within the product. */
    doesTotal?: boolean;
    /** Whether the link field will auto save. */
    autoSave?: boolean;
    /** Default user id value. */
    defaultValueLuid?: number;
    /** Whether phone numbers should be in E.164 standard international format. */
    useI18NFormat?: boolean;
    /** The maximum number of versions configured for a file attachment. */
    maxVersions?: number;
    /** Whether the field should carry its multiple choice fields when copied. */
    carryChoices?: boolean;
    /** The format to display time. */
    format?: number;
    /** The maximum number of characters allowed for entry in Quickbase for this field. */
    maxLength?: number;
    /** The configured text value that replaces the URL that users see within the product. */
    linkText?: string;
    /** The id of the parent composite field, when applicable. */
    parentFieldId?: number;
    /** Indicates whether to display the timezone within the product. */
    displayTimezone?: boolean;
    /** The id of the field that is used to aggregate values from the child, when applicable. This displays 0 if the summary function doesn't require a field selection (like count). */
    summaryTargetFieldId?: number;
    /** Indicates if users can add new choices to a selection list. */
    allowNewChoices?: boolean;
    /** The id of the field that is the reference in the relationship. */
    masterChoiceFieldId?: number;
    /** Indicates if the field value is defaulted today for new records. */
    defaultToday?: boolean;
    /** The units label. */
    units?: string;
    /** The id of the field that is the target on the master table for this lookup. */
    lookupTargetFieldId?: number;
    /** The summary accumulation function type. */
    summaryFunction?: 'AVG' | 'SUM' | 'MAX' | 'MIN' | 'STD-DEV' | 'COUNT' | 'COMBINED-TEXT' | 'COMBINED-USER' | 'DISTINCT-COUNT';
    /** The id of the source field. */
    sourceFieldId?: number;
    /** The table alias for the master table in the relationship this field is part of. */
    masterTableTag?: string;
    /** Whether this field averages in reports within the product. */
    doesAverage?: boolean;
    /** The formula of the field as configured in Quickbase. */
    formula?: string;
    /** The number of decimal places displayed in the product for this field. */
    decimalPlaces?: number;
    /** Controls the default country shown on international phone widgets on forms. Country code should be entered in the ISO 3166-1 alpha-2 format. */
    defaultCountryCode?: string;
    /** Indicates if the user can see other versions, aside from the most recent, of a file attachment within the product. */
    seeVersions?: boolean;
    /** How to display months. */
    displayMonth?: string;
    /** The number of lines shown in Quickbase for this text field. */
    numLines?: number;
    /** How the email is displayed. */
    displayEmail?: string;
    /** The user default type. */
    defaultKind?: string;
    /** An alternate user friendly text that can be used to display a link in the browser. */
    coverText?: string;
    /** The current symbol used when displaying field values within the product. */
    currencySymbol?: string;
    /** The id of the table that is the master in this relationship. */
    masterChoiceTableId?: string;
    /** The id of the target field. */
    targetFieldId?: number;
    /** The configured option for how users display within the product. */
    displayUser?: string;
    /** Whether a blank value is treated the same as 0 in calculations within the product. */
    blankIsZero?: boolean;
    /** Whether an exact match is required for a report link. */
    exact?: boolean;
    /** The start field id. */
    startField?: number;
    /** Default email domain. */
    defaultDomain?: string;
    /** The default value configured for a field when a new record is added. */
    defaultValue?: string;
    /** List of user choices. */
    choicesLuid?: string[];
    /** Don't show the URL protocol when showing the URL. */
    abbreviate?: boolean;
    /** The field's xml tag. */
    xmlTag?: string;
    /** The field's target table name. */
    targetTableName?: string;
    /** The format used for displaying numeric values in the product (decimal, separators, digit group). */
    numberFormat?: number;
    /** The link text, if empty, the url will be used as link text. */
    appearsAs?: string;
    /** The field's html input width in the product. */
    width?: number;
    /** The currency format used when displaying field values within the product. */
    currencyFormat?: 'left' | 'right' | 'middle';
    /** Indicates if the field is a foreign key (or reference field) in a relationship. */
    foreignKey?: boolean;
    /** Indicates whether to display the day of the week within the product. */
    displayDayOfWeek?: boolean;
    /** The id of the field that is the reference in the relationship for this summary. */
    summaryReferenceFieldId?: number;
    /** The number of digits before commas display in the product, when applicable. */
    commaStart?: number;
    /** An array of entries that exist for a field that offers choices to the user. */
    choices?: string[];
    /** The id of the target table. */
    targetTableId?: string;
    /** Whether to display time as relative. */
    displayRelative?: boolean;
    /** An array of the fields that make up a composite field (e.g., address). */
    compositeFields?: (number | Record<string, unknown>)[];
    /** Indicates whether the checkbox values will be shown as text in reports. */
    displayCheckboxAsText?: boolean;
    /** Version modes for files. Keep all versions vs keep last version. */
    versionMode?: 'keepallversions' | 'keeplastversions';
    /** Indicates whether to display the time, in addition to the date. */
    displayTime?: boolean;
    /** The duration field id. */
    durationField?: number;
    /** The id of the field that is used to snapshot values from, when applicable. */
    snapFieldId?: number;
    /** Indicates whether or not to display time in the 24-hour format within the product. */
    hours24?: boolean;
    /** Whether to sort alphabetically, default sort is by record ID. */
    sortAlpha?: boolean;
    /** Indicates if the listed entries sort as entered vs alphabetically. */
    sortAsGiven?: boolean;
    /** Whether this field has a phone extension. */
    hasExtension?: boolean;
    /** The work week type. */
    workWeek?: number;
    /** Indicates if the URL should open a new window when a user clicks it within the product. */
    useNewWindow?: boolean;
    /** POSTs a temporary token to the first URL when clicked by a user. [Learn more](https://help.quickbase.com/docs/post-temporary-token-from-a-quickbase-field) */
    postTempToken?: boolean;
    /** Whether this field is append only. */
    appendOnly?: boolean;
    /** Indicates if a field that is part of the relationship should be shown as a hyperlink to the parent record within the product. */
    displayAsLink?: boolean;
    /** Whether this field allows html. */
    allowHTML?: boolean;
    /** The id of the field that is the reference in the relationship for this lookup. */
    lookupReferenceFieldId?: number;
    [key: string]: unknown;
  };
  /** Field Permissions for different roles. */
  permissions?: {
    /** The role associated with a given permission for the field */
    role?: string;
    /** The permission given to the role for this field */
    permissionType?: string;
    /** The Id of the given role */
    roleId?: number;
  }[];
  [key: string]: unknown;
}

// deleteFields
/** Delete field(s) */
export interface DeleteFieldsParams {
  /** The unique identifier of the table. */
  tableId: string;
}

export interface DeleteFieldsRequest {
  /** List of field IDs to be deleted. */
  fieldIds: number[];
  [key: string]: unknown;
}

export interface DeleteFieldsResponse {
  /** List of field IDs to were deleted. */
  deletedFieldIds: number[];
  /** List of errors found. */
  errors: string[];
  [key: string]: unknown;
}

// getField
/** Get field */
export interface GetFieldParams {
  /** The unique identifier (dbid) of the table. */
  tableId: string;
  /** Set to 'true' if you'd like to get back the custom permissions for the field(s). */
  includeFieldPerms?: boolean;
  /** The unique identifier (fid) of the field. */
  fieldId: number;
}

export interface GetFieldResponse {
  /** The id of the field, unique to this table. */
  id: number;
  /** The type of field, as described [here](https://help.quickbase.com/user-assistance/field_types.html). */
  fieldType?: string;
  /** For derived fields, this will be 'lookup', 'summary', or 'formula', to indicate the type of derived field.  For non-derived fields, this will be blank. */
  mode?: string;
  /** The label (name) of the field. */
  label?: string;
  /** Indicates if the field is configured to not wrap when displayed in the product. */
  noWrap?: boolean;
  /** Indicates if the field is configured to display in bold in the product. */
  bold?: boolean;
  /** Indicates if the field is marked required. */
  required?: boolean;
  /** Indicates if the field is marked as a default in reports. */
  appearsByDefault?: boolean;
  /** Indicates if the field is marked as searchable. */
  findEnabled?: boolean;
  /** Indicates if the field is marked unique. */
  unique?: boolean;
  /** Indicates if the field data will copy when a user copies the record. */
  doesDataCopy?: boolean;
  /** The configured help text shown to users within the product. */
  fieldHelp?: string;
  /** Indicates if the field is being tracked as part of Quickbase Audit Logs. */
  audited?: boolean;
  /** Additional properties for the field. Please see [Field type details](../fieldInfo) page for more details on the properties for each field type. */
  properties?: {
    /** If someone can @mention users in the rich text field to generate an email notification. */
    allowMentions?: boolean;
    /** The comments entered on the field properties by an administrator. */
    comments?: string;
    /** Whether this field totals in reports within the product. */
    doesTotal?: boolean;
    /** Whether the link field will auto save. */
    autoSave?: boolean;
    /** Default user id value. */
    defaultValueLuid?: number;
    /** Whether phone numbers should be in E.164 standard international format. */
    useI18NFormat?: boolean;
    /** The maximum number of versions configured for a file attachment. */
    maxVersions?: number;
    /** Whether the field should carry its multiple choice fields when copied. */
    carryChoices?: boolean;
    /** The format to display time. */
    format?: number;
    /** The maximum number of characters allowed for entry in Quickbase for this field. */
    maxLength?: number;
    /** The configured text value that replaces the URL that users see within the product. */
    linkText?: string;
    /** The id of the parent composite field, when applicable. */
    parentFieldId?: number;
    /** Indicates whether to display the timezone within the product. */
    displayTimezone?: boolean;
    /** The id of the field that is used to aggregate values from the child, when applicable. This displays 0 if the summary function doesn't require a field selection (like count). */
    summaryTargetFieldId?: number;
    /** Indicates if users can add new choices to a selection list. */
    allowNewChoices?: boolean;
    /** The id of the field that is the reference in the relationship. */
    masterChoiceFieldId?: number;
    /** Indicates if the field value is defaulted today for new records. */
    defaultToday?: boolean;
    /** The units label. */
    units?: string;
    /** The id of the field that is the target on the master table for this lookup. */
    lookupTargetFieldId?: number;
    /** The summary accumulation function type. */
    summaryFunction?: 'AVG' | 'SUM' | 'MAX' | 'MIN' | 'STD-DEV' | 'COUNT' | 'COMBINED-TEXT' | 'COMBINED-USER' | 'DISTINCT-COUNT';
    /** The id of the source field. */
    sourceFieldId?: number;
    /** The table alias for the master table in the relationship this field is part of. */
    masterTableTag?: string;
    /** Whether this field averages in reports within the product. */
    doesAverage?: boolean;
    /** The formula of the field as configured in Quickbase. */
    formula?: string;
    /** The number of decimal places displayed in the product for this field. */
    decimalPlaces?: number;
    /** Controls the default country shown on international phone widgets on forms. Country code should be entered in the ISO 3166-1 alpha-2 format. */
    defaultCountryCode?: string;
    /** Indicates if the user can see other versions, aside from the most recent, of a file attachment within the product. */
    seeVersions?: boolean;
    /** How to display months. */
    displayMonth?: string;
    /** The number of lines shown in Quickbase for this text field. */
    numLines?: number;
    /** How the email is displayed. */
    displayEmail?: string;
    /** The user default type. */
    defaultKind?: string;
    /** An alternate user friendly text that can be used to display a link in the browser. */
    coverText?: string;
    /** The current symbol used when displaying field values within the product. */
    currencySymbol?: string;
    /** The id of the table that is the master in this relationship. */
    masterChoiceTableId?: string;
    /** The id of the target field. */
    targetFieldId?: number;
    /** The configured option for how users display within the product. */
    displayUser?: string;
    /** Whether a blank value is treated the same as 0 in calculations within the product. */
    blankIsZero?: boolean;
    /** Whether an exact match is required for a report link. */
    exact?: boolean;
    /** The start field id. */
    startField?: number;
    /** Default email domain. */
    defaultDomain?: string;
    /** The default value configured for a field when a new record is added. */
    defaultValue?: string;
    /** List of user choices. */
    choicesLuid?: string[];
    /** Don't show the URL protocol when showing the URL. */
    abbreviate?: boolean;
    /** The field's xml tag. */
    xmlTag?: string;
    /** The field's target table name. */
    targetTableName?: string;
    /** The format used for displaying numeric values in the product (decimal, separators, digit group). */
    numberFormat?: number;
    /** The link text, if empty, the url will be used as link text. */
    appearsAs?: string;
    /** The field's html input width in the product. */
    width?: number;
    /** The currency format used when displaying field values within the product. */
    currencyFormat?: 'left' | 'right' | 'middle';
    /** Indicates if the field is a foreign key (or reference field) in a relationship. */
    foreignKey?: boolean;
    /** Indicates whether to display the day of the week within the product. */
    displayDayOfWeek?: boolean;
    /** The id of the field that is the reference in the relationship for this summary. */
    summaryReferenceFieldId?: number;
    /** The number of digits before commas display in the product, when applicable. */
    commaStart?: number;
    /** An array of entries that exist for a field that offers choices to the user. */
    choices?: string[];
    /** The id of the target table. */
    targetTableId?: string;
    /** Whether to display time as relative. */
    displayRelative?: boolean;
    /** An array of the fields that make up a composite field (e.g., address). */
    compositeFields?: (number | Record<string, unknown>)[];
    /** Indicates whether the checkbox values will be shown as text in reports. */
    displayCheckboxAsText?: boolean;
    /** Version modes for files. Keep all versions vs keep last version. */
    versionMode?: 'keepallversions' | 'keeplastversions';
    /** Indicates whether to display the time, in addition to the date. */
    displayTime?: boolean;
    /** The duration field id. */
    durationField?: number;
    /** The id of the field that is used to snapshot values from, when applicable. */
    snapFieldId?: number;
    /** Indicates whether or not to display time in the 24-hour format within the product. */
    hours24?: boolean;
    /** Whether to sort alphabetically, default sort is by record ID. */
    sortAlpha?: boolean;
    /** Indicates if the listed entries sort as entered vs alphabetically. */
    sortAsGiven?: boolean;
    /** Whether this field has a phone extension. */
    hasExtension?: boolean;
    /** The work week type. */
    workWeek?: number;
    /** Indicates if the URL should open a new window when a user clicks it within the product. */
    useNewWindow?: boolean;
    /** POSTs a temporary token to the first URL when clicked by a user. [Learn more](https://help.quickbase.com/docs/post-temporary-token-from-a-quickbase-field) */
    postTempToken?: boolean;
    /** Whether this field is append only. */
    appendOnly?: boolean;
    /** Indicates if a field that is part of the relationship should be shown as a hyperlink to the parent record within the product. */
    displayAsLink?: boolean;
    /** Whether this field allows html. */
    allowHTML?: boolean;
    /** The id of the field that is the reference in the relationship for this lookup. */
    lookupReferenceFieldId?: number;
    [key: string]: unknown;
  };
  /** Field Permissions for different roles. */
  permissions?: {
    /** The role associated with a given permission for the field */
    role?: string;
    /** The permission given to the role for this field */
    permissionType?: string;
    /** The Id of the given role */
    roleId?: number;
  }[];
  [key: string]: unknown;
}

// updateField
/** Update a field */
export interface UpdateFieldParams {
  /** The unique identifier of the table. */
  tableId: string;
  /** The unique identifier (fid) of the field. */
  fieldId: number;
}

export interface UpdateFieldRequest {
  /** Indicates if the field is being tracked as part of Quickbase Audit Logs. You can only set this property to "true" if the app has audit logs enabled. See Enable data change logs under [Quickbase Audit Logs](https://help.quickbase.com/user-assistance/audit_logs.html). */
  audited?: boolean;
  /** The configured help text shown to users within the product. */
  fieldHelp?: string;
  /** Indicates if the field is configured to display in bold in the product. */
  bold?: boolean;
  /** Indicates if the field is required (i.e. if every record must have a non-null value in this field). If you attempt to change a field from not-required to required, and the table currently contains records that have null values in that field, you will get an error indicating that there are null values of the field. In this case you need to find and update those records with null values of the field before changing the field to required. */
  required?: boolean;
  /** Specific field properties. */
  properties?: {
    /** If someone can @mention users in the rich text field to generate an email notification. */
    allowMentions?: boolean;
    /** The comments entered on the field properties by an administrator. */
    comments?: string;
    /** Whether this field totals in reports within the product. */
    doesTotal?: boolean;
    /** Whether the link field will auto save. */
    autoSave?: boolean;
    /** Default user id value. */
    defaultValueLuid?: number;
    /** Whether phone numbers should be in E.164 standard international format */
    useI18NFormat?: boolean;
    /** The maximum number of versions configured for a file attachment. */
    maxVersions?: number;
    /** The format to display time. */
    format?: number;
    /** Whether the field should carry its multiple choice fields when copied. */
    carryChoices?: boolean;
    /** The maximum number of characters allowed for entry in Quickbase for this field. */
    maxLength?: number;
    /** The configured text value that replaces the URL that users see within the product. */
    linkText?: string;
    /** The id of the parent composite field, when applicable. */
    parentFieldId?: number;
    /** Indicates whether to display the timezone within the product. */
    displayTimezone?: boolean;
    /** The id of the field that is used to aggregate values from the child, when applicable. This displays 0 if the summary function doesn't require a field selection (like count). */
    summaryTargetFieldId?: number;
    /** Indicates if users can add new choices to a selection list. */
    allowNewChoices?: boolean;
    /** Indicates if the field value is defaulted today for new records. */
    defaultToday?: boolean;
    /** The units label. */
    units?: string;
    /** Indicates which target the URL should open in when a user clicks it within the product. */
    openTargetIn?: 'sameWindow' | 'newWindow' | 'popup';
    /** The id of the field that is the target on the parent table for this lookup. */
    lookupTargetFieldId?: number;
    /** The accumulation type for the summary field. */
    summaryFunction?: 'AVG' | 'SUM' | 'MAX' | 'MIN' | 'STD-DEV' | 'COUNT' | 'COMBINED-TEXT' | 'COMBINED-USER' | 'DISTINCT-COUNT';
    /** The id of the source field. */
    sourceFieldId?: number;
    /** Whether this field averages in reports within the product. */
    doesAverage?: boolean;
    /** The formula of the field as configured in Quickbase. */
    formula?: string;
    /** The number of decimal places displayed in the product for this field. */
    decimalPlaces?: number;
    /** Controls the default country shown on international phone widgets on forms. Country code should be entered in the ISO 3166-1 alpha-2 format. */
    defaultCountryCode?: string;
    /** How to display months. */
    displayMonth?: string;
    /** Indicates if the user can see other versions, aside from the most recent, of a file attachment within the product. */
    seeVersions?: boolean;
    /** The number of lines shown in Quickbase for this text field. */
    numLines?: number;
    /** The user default type. */
    defaultKind?: string;
    /** How the email is displayed. */
    displayEmail?: string;
    /** An alternate user friendly text that can be used to display a link in the browser. */
    coverText?: string;
    /** The current symbol used when displaying field values within the product. */
    currencySymbol?: string;
    /** The summary query. */
    summaryQuery?: string;
    /** The id of the target field. */
    targetFieldId?: number;
    /** The configured option for how users display within the product. */
    displayUser?: string;
    /** Whether a blank value is treated the same as 0 in calculations within the product. */
    blankIsZero?: boolean;
    /** Whether an exact match is required for a report link. */
    exact?: boolean;
    /** Default email domain. */
    defaultDomain?: string;
    /** The default value configured for a field when a new record is added. */
    defaultValue?: string;
    /** Don't show the URL protocol when showing the URL. */
    abbreviate?: boolean;
    /** The format used for displaying numeric values in the product (decimal, separators, digit group). */
    numberFormat?: number;
    /** The field's target table name. */
    targetTableName?: string;
    /** The link text, if empty, the url will be used as link text. */
    appearsAs?: string;
    /** The field's html input width in the product. */
    width?: number;
    /** The currency format used when displaying field values within the product. */
    currencyFormat?: 'left' | 'right' | 'middle';
    /** Indicates whether to display the day of the week within the product. */
    displayDayOfWeek?: boolean;
    /** The id of the field that is the reference in the relationship for this summary. */
    summaryReferenceFieldId?: number;
    /** The number of digits before commas display in the product, when applicable. */
    commaStart?: number;
    /** An array of entries that exist for a field that offers choices to the user. Note that these choices refer to the valid values of any records added in the future. You are allowed to remove values from the list of choices even if there are existing records with those values in this field. They will be displayed in red when users look at the data in the browser but there is no other effect. While updating a field with this property, the old choices are removed and replaced by the new choices. */
    choices?: string[];
    /** The id of the target table. */
    targetTableId?: string;
    /** Whether to display time as relative. */
    displayRelative?: boolean;
    /** An array of the fields that make up a composite field (e.g., address). */
    compositeFields?: (number | Record<string, unknown>)[];
    /** Indicates whether the checkbox values will be shown as text in reports. */
    displayCheckboxAsText?: boolean;
    /** The table the summary field references fields from. */
    summaryTableId?: string;
    /** Indicates whether to display the time, in addition to the date. */
    displayTime?: boolean;
    /** Version modes for files. Keep all versions vs keep last version. */
    versionMode?: 'keepallversions' | 'keeplastversions';
    /** The id of the field that is used to snapshot values from, when applicable. */
    snapFieldId?: number;
    /** Indicates whether or not to display time in the 24-hour format within the product. */
    hours24?: boolean;
    /** Whether to sort alphabetically, default sort is by record ID. */
    sortAlpha?: boolean;
    /** Indicates if the listed entries sort as entered vs alphabetically. */
    sortAsGiven?: boolean;
    /** Whether this field has a phone extension. */
    hasExtension?: boolean;
    /** Indicates if the file should open a new window when a user clicks it within the product. */
    useNewWindow?: boolean;
    /** POSTs a temporary token to the first URL when clicked by a user. [Learn more](https://help.quickbase.com/docs/post-temporary-token-from-a-quickbase-field) */
    postTempToken?: boolean;
    /** Whether this field is append only. */
    appendOnly?: boolean;
    /** Indicates if a field that is part of the relationship should be shown as a hyperlink to the parent record within the product. */
    displayAsLink?: boolean;
    /** The id of the field that is the reference in the relationship for this lookup. */
    lookupReferenceFieldId?: number;
  };
  /** Indicates if the field is marked as a default in reports. */
  appearsByDefault?: boolean;
  /** Indicates if every record in the table must contain a unique value of this field. If you attempt to change a field from not-unique to unique, and the table currently contains records with the same value of this field, you will get an error. In this case you need to find and update those records with duplicate values of the field before changing the field to unique. */
  unique?: boolean;
  /** Field Permissions for different roles. */
  permissions?: {
    /** The role associated with a given permission for the field */
    role?: string;
    /** The permission given to the role for this field */
    permissionType?: string;
    /** The Id of the given role */
    roleId?: number;
  }[];
  /** Whether the field you are adding should appear on forms. */
  addToForms?: boolean;
  /** The label (name) of the field. */
  label?: string;
  /** Indicates if the field is marked as searchable. */
  findEnabled?: boolean;
  /** Indicates if the field is configured to not wrap when displayed in the product. */
  noWrap?: boolean;
}

export interface UpdateFieldResponse {
  /** The id of the field, unique to this table. */
  id: number;
  /** The type of field, as described [here](https://help.quickbase.com/user-assistance/field_types.html). */
  fieldType?: string;
  /** For derived fields, this will be 'lookup', 'summary', or 'formula', to indicate the type of derived field.  For non-derived fields, this will be blank. */
  mode?: string;
  /** The label (name) of the field. */
  label?: string;
  /** Indicates if the field is configured to not wrap when displayed in the product. */
  noWrap?: boolean;
  /** Indicates if the field is configured to display in bold in the product. */
  bold?: boolean;
  /** Indicates if the field is marked required. */
  required?: boolean;
  /** Indicates if the field is marked as a default in reports. */
  appearsByDefault?: boolean;
  /** Indicates if the field is marked as searchable. */
  findEnabled?: boolean;
  /** Indicates if the field is marked unique. */
  unique?: boolean;
  /** Indicates if the field data will copy when a user copies the record. */
  doesDataCopy?: boolean;
  /** The configured help text shown to users within the product. */
  fieldHelp?: string;
  /** Indicates if the field is being tracked as part of Quickbase Audit Logs. */
  audited?: boolean;
  /** Additional properties for the field. Please see [Field type details](../fieldInfo) page for more details on the properties for each field type. */
  properties?: {
    /** If someone can @mention users in the rich text field to generate an email notification. */
    allowMentions?: boolean;
    /** The comments entered on the field properties by an administrator. */
    comments?: string;
    /** Whether this field totals in reports within the product. */
    doesTotal?: boolean;
    /** Whether the link field will auto save. */
    autoSave?: boolean;
    /** Default user id value. */
    defaultValueLuid?: number;
    /** Whether phone numbers should be in E.164 standard international format. */
    useI18NFormat?: boolean;
    /** The maximum number of versions configured for a file attachment. */
    maxVersions?: number;
    /** Whether the field should carry its multiple choice fields when copied. */
    carryChoices?: boolean;
    /** The format to display time. */
    format?: number;
    /** The maximum number of characters allowed for entry in Quickbase for this field. */
    maxLength?: number;
    /** The configured text value that replaces the URL that users see within the product. */
    linkText?: string;
    /** The id of the parent composite field, when applicable. */
    parentFieldId?: number;
    /** Indicates whether to display the timezone within the product. */
    displayTimezone?: boolean;
    /** The id of the field that is used to aggregate values from the child, when applicable. This displays 0 if the summary function doesn't require a field selection (like count). */
    summaryTargetFieldId?: number;
    /** Indicates if users can add new choices to a selection list. */
    allowNewChoices?: boolean;
    /** The id of the field that is the reference in the relationship. */
    masterChoiceFieldId?: number;
    /** Indicates if the field value is defaulted today for new records. */
    defaultToday?: boolean;
    /** The units label. */
    units?: string;
    /** The id of the field that is the target on the master table for this lookup. */
    lookupTargetFieldId?: number;
    /** The summary accumulation function type. */
    summaryFunction?: 'AVG' | 'SUM' | 'MAX' | 'MIN' | 'STD-DEV' | 'COUNT' | 'COMBINED-TEXT' | 'COMBINED-USER' | 'DISTINCT-COUNT';
    /** The id of the source field. */
    sourceFieldId?: number;
    /** The table alias for the master table in the relationship this field is part of. */
    masterTableTag?: string;
    /** Whether this field averages in reports within the product. */
    doesAverage?: boolean;
    /** The formula of the field as configured in Quickbase. */
    formula?: string;
    /** The number of decimal places displayed in the product for this field. */
    decimalPlaces?: number;
    /** Controls the default country shown on international phone widgets on forms. Country code should be entered in the ISO 3166-1 alpha-2 format. */
    defaultCountryCode?: string;
    /** Indicates if the user can see other versions, aside from the most recent, of a file attachment within the product. */
    seeVersions?: boolean;
    /** How to display months. */
    displayMonth?: string;
    /** The number of lines shown in Quickbase for this text field. */
    numLines?: number;
    /** How the email is displayed. */
    displayEmail?: string;
    /** The user default type. */
    defaultKind?: string;
    /** An alternate user friendly text that can be used to display a link in the browser. */
    coverText?: string;
    /** The current symbol used when displaying field values within the product. */
    currencySymbol?: string;
    /** The id of the table that is the master in this relationship. */
    masterChoiceTableId?: string;
    /** The id of the target field. */
    targetFieldId?: number;
    /** The configured option for how users display within the product. */
    displayUser?: string;
    /** Whether a blank value is treated the same as 0 in calculations within the product. */
    blankIsZero?: boolean;
    /** Whether an exact match is required for a report link. */
    exact?: boolean;
    /** The start field id. */
    startField?: number;
    /** Default email domain. */
    defaultDomain?: string;
    /** The default value configured for a field when a new record is added. */
    defaultValue?: string;
    /** List of user choices. */
    choicesLuid?: string[];
    /** Don't show the URL protocol when showing the URL. */
    abbreviate?: boolean;
    /** The field's xml tag. */
    xmlTag?: string;
    /** The field's target table name. */
    targetTableName?: string;
    /** The format used for displaying numeric values in the product (decimal, separators, digit group). */
    numberFormat?: number;
    /** The link text, if empty, the url will be used as link text. */
    appearsAs?: string;
    /** The field's html input width in the product. */
    width?: number;
    /** The currency format used when displaying field values within the product. */
    currencyFormat?: 'left' | 'right' | 'middle';
    /** Indicates if the field is a foreign key (or reference field) in a relationship. */
    foreignKey?: boolean;
    /** Indicates whether to display the day of the week within the product. */
    displayDayOfWeek?: boolean;
    /** The id of the field that is the reference in the relationship for this summary. */
    summaryReferenceFieldId?: number;
    /** The number of digits before commas display in the product, when applicable. */
    commaStart?: number;
    /** An array of entries that exist for a field that offers choices to the user. */
    choices?: string[];
    /** The id of the target table. */
    targetTableId?: string;
    /** Whether to display time as relative. */
    displayRelative?: boolean;
    /** An array of the fields that make up a composite field (e.g., address). */
    compositeFields?: (number | Record<string, unknown>)[];
    /** Indicates whether the checkbox values will be shown as text in reports. */
    displayCheckboxAsText?: boolean;
    /** Version modes for files. Keep all versions vs keep last version. */
    versionMode?: 'keepallversions' | 'keeplastversions';
    /** Indicates whether to display the time, in addition to the date. */
    displayTime?: boolean;
    /** The duration field id. */
    durationField?: number;
    /** The id of the field that is used to snapshot values from, when applicable. */
    snapFieldId?: number;
    /** Indicates whether or not to display time in the 24-hour format within the product. */
    hours24?: boolean;
    /** Whether to sort alphabetically, default sort is by record ID. */
    sortAlpha?: boolean;
    /** Indicates if the listed entries sort as entered vs alphabetically. */
    sortAsGiven?: boolean;
    /** Whether this field has a phone extension. */
    hasExtension?: boolean;
    /** The work week type. */
    workWeek?: number;
    /** Indicates if the URL should open a new window when a user clicks it within the product. */
    useNewWindow?: boolean;
    /** POSTs a temporary token to the first URL when clicked by a user. [Learn more](https://help.quickbase.com/docs/post-temporary-token-from-a-quickbase-field) */
    postTempToken?: boolean;
    /** Whether this field is append only. */
    appendOnly?: boolean;
    /** Indicates if a field that is part of the relationship should be shown as a hyperlink to the parent record within the product. */
    displayAsLink?: boolean;
    /** Whether this field allows html. */
    allowHTML?: boolean;
    /** The id of the field that is the reference in the relationship for this lookup. */
    lookupReferenceFieldId?: number;
    [key: string]: unknown;
  };
  /** Field Permissions for different roles. */
  permissions?: {
    /** The role associated with a given permission for the field */
    role?: string;
    /** The permission given to the role for this field */
    permissionType?: string;
    /** The Id of the given role */
    roleId?: number;
  }[];
  [key: string]: unknown;
}

// getFieldsUsage
/** Get usage for all fields */
export interface GetFieldsUsageParams {
  /** The unique identifier (dbid) of the table. */
  tableId: string;
  /** The number of fields to skip from the list. */
  skip?: number;
  /** The maximum number of fields to return. */
  top?: number;
}

export interface GetFieldsUsageResponse {
  /** Basic information about the field. */
  field: {
    /** Field name. */
    name: string;
    /** Field id. */
    id: number;
    /** Field type. */
    type: string;
    [key: string]: unknown;
  };
  /** Usage Information about the field. */
  usage: {
    /** The number of quickbase actions where the given field is referenced. */
    actions: {
      /** the number of times a field has been used for the given item. */
      count: number;
      [key: string]: unknown;
    };
    /** The number of app home pages where the given field is referenced. */
    appHomePages: {
      /** the number of times a field has been used for the given item. */
      count: number;
      [key: string]: unknown;
    };
    /** The number of dashboards where the given field is referenced. */
    dashboards: {
      /** the number of times a field has been used for the given item. */
      count: number;
    };
    /** The number of default reports where the given field is referenced. */
    defaultReports: {
      /** the number of times a field has been used for the given item. */
      count: number;
      [key: string]: unknown;
    };
    /** The number of exact forms where the given field is referenced. */
    exactForms: {
      /** the number of times a field has been used for the given item. */
      count: number;
      [key: string]: unknown;
    };
    /** The number of fields where the given field is referenced. */
    fields: {
      /** the number of times a field has been used for the given item. */
      count: number;
      [key: string]: unknown;
    };
    /** The number of forms where the given field is referenced. */
    forms: {
      /** the number of times a field has been used for the given item. */
      count: number;
      [key: string]: unknown;
    };
    /** The number of notifications where the given field is referenced. */
    notifications: {
      /** the number of times a field has been used for the given item. */
      count: number;
      [key: string]: unknown;
    };
    /** The number of personal reports where the given field is referenced. */
    personalReports: {
      /** the number of times a field has been used for the given item. */
      count: number;
      [key: string]: unknown;
    };
    /** The number of pipelines where the given field is referenced. */
    pipelines: {
      /** the number of times a field has been used for the given item. */
      count: number;
      [key: string]: unknown;
    };
    /** The number of relationships where the given field is referenced. */
    relationships: {
      /** the number of times a field has been used for the given item. */
      count: number;
      [key: string]: unknown;
    };
    /** The number of reminders where the given field is referenced. */
    reminders: {
      /** the number of times a field has been used for the given item. */
      count: number;
      [key: string]: unknown;
    };
    /** The number of reports where the given field is referenced. */
    reports: {
      /** the number of times a field has been used for the given item. */
      count: number;
      [key: string]: unknown;
    };
    /** The number of roles where the given field is referenced. */
    roles: {
      /** the number of times a field has been used for the given item. */
      count: number;
      [key: string]: unknown;
    };
    /** The number of table imports where the given field is referenced. */
    tableImports: {
      /** the number of times a field has been used for the given item. */
      count: number;
    };
    /** The number of table rules where the given field is referenced. */
    tableRules: {
      /** the number of times a field has been used for the given item. */
      count: number;
    };
    /** The number of webhooks where the given field is referenced. */
    webhooks: {
      /** the number of times a field has been used for the given item. */
      count: number;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  [key: string]: unknown;
}[]

// getFieldUsage
/** Get usage for a field */
export interface GetFieldUsageParams {
  /** The unique identifier (dbid) of the table. */
  tableId: string;
  /** The unique identifier (fid) of the field. */
  fieldId: number;
}

export interface GetFieldUsageResponse {
  /** Basic information about the field. */
  field: {
    /** Field name. */
    name: string;
    /** Field id. */
    id: number;
    /** Field type. */
    type: string;
    [key: string]: unknown;
  };
  /** Usage Information about the field. */
  usage: {
    /** The number of quickbase actions where the given field is referenced. */
    actions: {
      /** the number of times a field has been used for the given item. */
      count: number;
      [key: string]: unknown;
    };
    /** The number of app home pages where the given field is referenced. */
    appHomePages: {
      /** the number of times a field has been used for the given item. */
      count: number;
      [key: string]: unknown;
    };
    /** The number of dashboards where the given field is referenced. */
    dashboards: {
      /** the number of times a field has been used for the given item. */
      count: number;
    };
    /** The number of default reports where the given field is referenced. */
    defaultReports: {
      /** the number of times a field has been used for the given item. */
      count: number;
      [key: string]: unknown;
    };
    /** The number of exact forms where the given field is referenced. */
    exactForms: {
      /** the number of times a field has been used for the given item. */
      count: number;
      [key: string]: unknown;
    };
    /** The number of fields where the given field is referenced. */
    fields: {
      /** the number of times a field has been used for the given item. */
      count: number;
      [key: string]: unknown;
    };
    /** The number of forms where the given field is referenced. */
    forms: {
      /** the number of times a field has been used for the given item. */
      count: number;
      [key: string]: unknown;
    };
    /** The number of notifications where the given field is referenced. */
    notifications: {
      /** the number of times a field has been used for the given item. */
      count: number;
      [key: string]: unknown;
    };
    /** The number of personal reports where the given field is referenced. */
    personalReports: {
      /** the number of times a field has been used for the given item. */
      count: number;
      [key: string]: unknown;
    };
    /** The number of pipelines where the given field is referenced. */
    pipelines: {
      /** the number of times a field has been used for the given item. */
      count: number;
      [key: string]: unknown;
    };
    /** The number of relationships where the given field is referenced. */
    relationships: {
      /** the number of times a field has been used for the given item. */
      count: number;
      [key: string]: unknown;
    };
    /** The number of reminders where the given field is referenced. */
    reminders: {
      /** the number of times a field has been used for the given item. */
      count: number;
      [key: string]: unknown;
    };
    /** The number of reports where the given field is referenced. */
    reports: {
      /** the number of times a field has been used for the given item. */
      count: number;
      [key: string]: unknown;
    };
    /** The number of roles where the given field is referenced. */
    roles: {
      /** the number of times a field has been used for the given item. */
      count: number;
      [key: string]: unknown;
    };
    /** The number of table imports where the given field is referenced. */
    tableImports: {
      /** the number of times a field has been used for the given item. */
      count: number;
    };
    /** The number of table rules where the given field is referenced. */
    tableRules: {
      /** the number of times a field has been used for the given item. */
      count: number;
    };
    /** The number of webhooks where the given field is referenced. */
    webhooks: {
      /** the number of times a field has been used for the given item. */
      count: number;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  [key: string]: unknown;
}[]

// runFormula
/** Run a formula */
export interface RunFormulaRequest {
  /** The formula to run. This must be a valid Quickbase formula. */
  formula: string;
  /** The record ID to run the formula against. Only necessary for formulas that are run in the context of a record. For example, the formula User() does not need a record ID. */
  rid?: number;
  /** The unique identifier (dbid) of the table. */
  from: string;
}

export interface RunFormulaResponse {
  /** The formula execution result. */
  result?: string;
  [key: string]: unknown;
}

// upsert
/** Insert/Update record(s) */
export interface UpsertRequest {
  /** The table identifier. */
  to: string;
  /** Record data array, where each record contains key-value mappings of fields to be defined/updated and their values. */
  data?: QuickbaseRecord[];
  /** The merge field id. */
  mergeFieldId?: number;
  /** Specify an array of field IDs that will return data for any updates or added record. Record ID (FID 3) is always returned if any field ID is requested. */
  fieldsToReturn?: number[];
  [key: string]: unknown;
}

export interface UpsertResponse {
  /** Information about created records, updated records, referenced but unchanged records, and records having any errors while being processed. */
  metadata?: {
    /** Array containing the created record ids. */
    createdRecordIds?: number[];
    /** This will only be returned in the case of failed records. It is a collection of errors that occurred when processing the incoming data that resulted in records not being processed. Each object has a key representing the sequence number of the record in the original payload (starting from 1). The value is a list of errors occurred. */
    lineErrors?: Record<string, string[]>;
    /** Array containing the unchanged record ids. */
    unchangedRecordIds?: number[];
    /** Array containing the updated record ids. */
    updatedRecordIds?: number[];
    /** Number of records processed. Includes successful and failed record updates. */
    totalNumberOfRecordsProcessed?: number;
    [key: string]: unknown;
  };
  /** The data that is expected to be returned. */
  data?: QuickbaseRecord[];
  [key: string]: unknown;
}

// deleteRecords
/** Delete record(s) */
export interface DeleteRecordsRequest {
  /** The unique identifier of the table. */
  from: string;
  /** The filter to delete records. To delete all records specify a filter that will include all records, for example {3.GT.0} where 3 is the ID of the Record ID field. Or supply a JSON array of Record IDs. */
  where: string | number[];
  [key: string]: unknown;
}

export interface DeleteRecordsResponse {
  /** The number of records deleted. */
  numberDeleted?: number;
  [key: string]: unknown;
}

// runQuery
/** Query for data */
export interface RunQueryRequest {
  /** Additional query options. */
  options?: {
    /** The number of records to skip. */
    skip?: number;
    /** Whether to run the query against a date time field with respect to the application's local time. The query is run with UTC time by default.  This parameter is ignored when querying by ISO8601, which is always in UTC. */
    compareWithAppLocalTime?: boolean;
    /** The maximum number of records to display. */
    top?: number;
    [key: string]: unknown;
  };
  /** The filter, using the Quickbase query language, which determines the records to return. Or supply a JSON array of Record IDs. If this parameter is omitted, the query will return all records. */
  where?: string | number[];
  /** An array that contains the fields to group the records by. */
  groupBy?: {
    /** The unique identifier of a field in a table. */
    fieldId?: number;
    /** Group by based on equal values (equal-values) */
    grouping?: 'equal-values';
    [key: string]: unknown;
  }[];
  sortBy?: SortByUnion;
  /** An array of field IDs for the fields that should be returned in the response. If empty, the default columns on the table will be returned. */
  select?: number[];
  /** The table identifier. */
  from: string;
  [key: string]: unknown;
}

export interface RunQueryResponse {
  /** An array of objects that contains limited meta-data of each field displayed in the report. This assists in building logic that depends on field types and IDs. */
  fields?: {
    /** Field id. */
    id?: number;
    /** Field label. */
    label?: string;
    /** Field type. */
    type?: string;
    [key: string]: unknown;
  }[];
  /** An array of objects that either represents the record data or summarized values, depending on the report type. */
  data?: QuickbaseRecord[];
  /** Additional information about the results that may be helpful. Pagination may be needed if either you specify a smaller number of results to skip than is available, or if the API automatically returns fewer results. numRecords can be compared to totalRecords to determine if further pagination is needed. */
  metadata?: {
    /** The number of records to skip */
    skip?: number;
    /** The number of fields in each record in the current response object */
    numFields: number;
    /** If present, the maximum number of records requested by the caller */
    top?: number;
    /** The total number of records in the result set */
    totalRecords: number;
    /** The number of records in the current response object */
    numRecords: number;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

// recordsModifiedSince
/** Get records modified since */
export interface RecordsModifiedSinceRequest {
  /** A timestamp, formatted in ISO-8601 UTC, representing the date and time to search. */
  after: string;
  /** List of field IDs. Each field is crawled across the entire record dependency graph to find its source record's date modified. If one is not provided, only the current table will be referenced. */
  fieldList?: number[];
  /** When true, the individual record IDs and timestamps will be returned. If false, only the count of changes will be returned. */
  includeDetails?: boolean;
  /** The table identifier. */
  from: string;
}

export interface RecordsModifiedSinceResponse {
  /** The count of changes found. */
  count: number;
  /** When includeDetails is true, this array contains the individual record changes. If includeDetails is false, this array will not be returned. */
  changes?: ({
    /** A record whose dependencies were found to have been updated after the time provided. */
    recordId?: number;
    /** The timestamp that Quickbase found that exceeded the after time. This does not represent the latest date modified in the record graph. */
    timestamp?: string;
    /** The type of change that was detected. */
    changeType?: 'CREATE' | 'MODIFY' | 'DELETE';
    [key: string]: unknown;
  })[];
  /** When true, this indicates that the number of deletes detected exceeded the limit and details could not be returned. */
  deletesTruncated?: boolean;
  [key: string]: unknown;
}

// getTempTokenDBID
/** Get a temporary token for a dbid */
export interface GetTempTokenDBIDParams {
  /** The unique identifier of an app or table. */
  dbid: string;
}

export interface GetTempTokenDBIDResponse {
  /** Temporary authorization token. */
  temporaryAuthorization?: string;
  [key: string]: unknown;
}

// exchangeSsoToken
/** Exchange an SSO token */
export interface ExchangeSsoTokenRequest {
  /** The value `urn:ietf:params:oauth:grant-type:token-exchange` indicates that a token exchange is being performed. */
  grant_type: 'urn:ietf:params:oauth:grant-type:token-exchange';
  /** An identifier for the type of the requested security token. For the RESTful API, use `urn:quickbase:params:oauth:token-type:temp_token`. For the XML or SCIM APIs use `urn:quickbase:params:oauth:token-type:temp_ticket`. */
  requested_token_type: 'urn:quickbase:params:oauth:token-type:temp_ticket' | 'urn:quickbase:params:oauth:token-type:temp_token';
  /** A security token that represents the identity of the party on behalf of whom the request is being made. For SAML 2.0, the value should be a base64url-encoded SAML 2.0 assertion. */
  subject_token: string;
  /** An identifier that indicates the type of the security token in the `subject_token` parameter. */
  subject_token_type: 'urn:ietf:params:oauth:token-type:saml2';
}

export interface ExchangeSsoTokenResponse {
  /** The security token issued by the authorization server in response to the token exchange request. The identifier `access_token` is used for historical reasons and the issued token need not be an OAuth access token. */
  access_token?: string;
  /** An identifier for the representation of the issued security token. */
  issued_token_type?: 'urn:quickbase:params:oauth:token-type:temp_ticket' | 'urn:quickbase:params:oauth:token-type:temp_token';
  /** Will always return `N_A` */
  token_type?: 'N_A';
  [key: string]: unknown;
}

// cloneUserToken
/** Clone a user token */
export interface CloneUserTokenRequest {
  /** The new name for the cloned user token. */
  name?: string;
  /** The description for the cloned user token. */
  description?: string;
}

export interface CloneUserTokenResponse {
  /** Whether the user token is active. */
  active?: boolean;
  /** The list of apps this user token is assigned to. */
  apps?: {
    /** The unique identifier for this application. */
    id?: string;
    /** The application's name. */
    name?: string;
    [key: string]: unknown;
  }[];
  /** The last date this user token was used, in the ISO 8601 time format YYYY-MM-DDThh:mm:ss.sssZ (in UTC time zone). */
  lastUsed?: string;
  /** User Token description. */
  description?: string;
  /** User Token id. */
  id?: number;
  /** User Token name. */
  name?: string;
  /** User Token value. */
  token?: string;
  [key: string]: unknown;
}

// transferUserToken
/** Transfer a user token */
export interface TransferUserTokenRequest {
  /** The id of the user token to transfer */
  id?: number;
  /** The id of the user to transfer the user token from */
  from?: string;
  /** The id of the user to transfer the user token to */
  to?: string;
}

export interface TransferUserTokenResponse {
  /** Whether the user token is active. */
  active?: boolean;
  /** The list of apps this user token is assigned to. */
  apps?: {
    /** The unique identifier for this application. */
    id?: string;
    /** The application's name. */
    name?: string;
    [key: string]: unknown;
  }[];
  /** The last date this user token was used, in the ISO 8601 time format YYYY-MM-DDThh:mm:ss.sssZ (in UTC time zone). */
  lastUsed?: string;
  /** User Token description. */
  description?: string;
  /** User Token id. */
  id?: number;
  /** User Token name. */
  name?: string;
  [key: string]: unknown;
}

// deactivateUserToken
/** Deactivate a user token */
export interface DeactivateUserTokenResponse {
  /** The user token id. */
  id?: number;
  [key: string]: unknown;
}

// deleteUserToken
/** Delete a user token */
export interface DeleteUserTokenResponse {
  /** The user token id. */
  id?: number;
  [key: string]: unknown;
}

// downloadFile
/** Download file */
export interface DownloadFileParams {
  /** The unique identifier of the table. */
  tableId: string;
  /** The unique identifier of the record. */
  recordId: number;
  /** The unique identifier of the field. */
  fieldId: number;
  /** The file attachment version number. */
  versionNumber: number;
}

export type DownloadFileResponse = unknown;

// deleteFile
/** Delete file */
export interface DeleteFileParams {
  /** The unique identifier of the table. */
  tableId: string;
  /** The unique identifier of the record. */
  recordId: number;
  /** The unique identifier of the field. */
  fieldId: number;
  /** The file attachment version number. */
  versionNumber: number;
}

export interface DeleteFileResponse {
  /** The number of deleted version. */
  versionNumber?: number;
  /** The name of file associated with deleted version. */
  fileName?: string;
  /** The timestamp when the version was originally uploaded. */
  uploaded?: string;
  /** The user that uploaded version. */
  creator?: {
    /** User full name. */
    name?: string;
    /** User Id. */
    id?: string;
    /** User email. */
    email?: string;
    /** User Name as updated in user properties. Optional, appears if not the same as user email. */
    userName?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

// getUsers
/** Get users */
export interface GetUsersParams {
  /** The account id being used to get users. If no value is specified, the first account associated with the requesting user token is chosen. */
  accountId?: number;
}

export interface GetUsersRequest {
  /** When provided, the returned users will be narrowed down only to the users included in this list. */
  emails?: string[];
  /** When provided, the returned users will be narrowed down only to the users assigned to the app id's provided in this list. The provided app id's should belong to the same account. */
  appIds?: string[];
  /** Next page token used to get the next 'page' of results when available. When this field is empty, the first page is returned. */
  nextPageToken?: string;
  [key: string]: unknown;
}

export interface GetUsersResponse {
  /** A list of users found in an account with the given criterias */
  users: {
    userName: string;
    firstName: string;
    lastName: string;
    emailAddress: string;
    hashId: string;
    [key: string]: unknown;
  }[];
  /** Additional request information */
  metadata: {
    nextPageToken: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

// denyUsers
/** Deny users */
export interface DenyUsersParams {
  /** The account id being used to deny users. If no value is specified, the first account associated with the requesting user token is chosen. */
  accountId?: number;
}

export type DenyUsersRequest = string[];

export interface DenyUsersResponse {
  /** A list of users that couldn't be denied. This also includes the ID's of users that are not valid. */
  failure: string[];
  /** A list of users that have successfully been denied. */
  success: string[];
  [key: string]: unknown;
}

// denyUsersAndGroups
/** Deny and remove users from groups */
export interface DenyUsersAndGroupsParams {
  /** The account id being used to deny users. If no value is specified, the first account associated with the requesting user token is chosen. */
  accountId?: number;
  /** Specifies if the users should also be removed from all groups. */
  shouldDeleteFromGroups: boolean;
}

export type DenyUsersAndGroupsRequest = string[];

export interface DenyUsersAndGroupsResponse {
  /** A list of users that couldn't be denied. This also includes the ID's of users that are not valid. */
  failure: string[];
  /** A list of users that have successfully been denied. */
  success: string[];
  [key: string]: unknown;
}

// undenyUsers
/** Undeny users */
export interface UndenyUsersParams {
  /** The account id being used to undeny users. If no value is specified, the first account associated with the requesting user token is chosen. */
  accountId?: number;
}

export type UndenyUsersRequest = string[];

export interface UndenyUsersResponse {
  /** A list of users that couldn't be undenied. This also includes the ID's of users that are not valid. */
  failure: string[];
  /** A list of users that have successfully been undenied. */
  success: string[];
  [key: string]: unknown;
}

// addMembersToGroup
/** Add members */
export interface AddMembersToGroupParams {
  /** This is the ID of the group being modified. */
  gid: number;
}

export type AddMembersToGroupRequest = string[];

export interface AddMembersToGroupResponse {
  /** A list of users that couldn't be added to the group. This includes a list of IDs that represent invalid users and users who have already been added to the group. */
  failure: string[];
  /** A list of users that have been added to the group successfully. */
  success: string[];
  [key: string]: unknown;
}

// removeMembersFromGroup
/** Remove members */
export interface RemoveMembersFromGroupParams {
  /** This is the ID of the group being modified. */
  gid: number;
}

export type RemoveMembersFromGroupRequest = string[];

export interface RemoveMembersFromGroupResponse {
  /** A list of users that couldn't be removed from the group. This includes a list of IDs that represent invalid users. */
  failure: string[];
  /** A list of users that have been removed from the group successfully. */
  success: string[];
  [key: string]: unknown;
}

// addManagersToGroup
/** Add managers */
export interface AddManagersToGroupParams {
  /** This is the ID of the group being modified. */
  gid: number;
}

export type AddManagersToGroupRequest = string[];

export interface AddManagersToGroupResponse {
  /** A list of users that couldn't be added to the group. This includes a list of IDs that represent invalid users and users who have already been added to the group. */
  failure: string[];
  /** A list of users that have been added to the group successfully. */
  success: string[];
  [key: string]: unknown;
}

// removeManagersFromGroup
/** Remove managers */
export interface RemoveManagersFromGroupParams {
  /** This is the ID of the group being modified. */
  gid: number;
}

export type RemoveManagersFromGroupRequest = string[];

export interface RemoveManagersFromGroupResponse {
  /** A list of users that couldn't be removed from the group. This includes a list of IDs that represent invalid users. */
  failure: string[];
  /** A list of users that have been removed from the group successfully. */
  success: string[];
  [key: string]: unknown;
}

// addSubgroupsToGroup
/** Add child groups */
export interface AddSubgroupsToGroupParams {
  /** This is the ID of the group being modified. */
  gid: number;
}

export type AddSubgroupsToGroupRequest = string[];

export interface AddSubgroupsToGroupResponse {
  /** A list of child groups that couldn't be added to the group. This includes a list of IDs that represent invalid groups and groups that have already been added to the group. */
  failure: string[];
  /** A list of child groups that have been added to the group successfully. */
  success: string[];
  [key: string]: unknown;
}

// removeSubgroupsFromGroup
/** Remove child groups */
export interface RemoveSubgroupsFromGroupParams {
  /** This is the ID of the group being modified. */
  gid: number;
}

export type RemoveSubgroupsFromGroupRequest = string[];

export interface RemoveSubgroupsFromGroupResponse {
  /** A list of child groups that couldn't be removed from the group. This includes a list of IDs that represent invalid groups. */
  failure: string[];
  /** A list of child groups that have been removed from the group successfully. */
  success: string[];
  [key: string]: unknown;
}

// audit
/** Get audit logs */
export interface AuditRequest {
  /** Token specifying start of page. For first page don't supply this. */
  nextToken?: string;
  /** Number of logs to return per page, default is 10000, minimum is 1000, max is 50000. */
  numRows?: number;
  /** The query id of an audit log request. This id is needed to fetch subsequent paged results of a single query. */
  queryId?: string;
  /** The date for which audit logs need to be fetched. This must be date-time only, as YYYY-MM-DD, and a valid date in the past. */
  date?: string;
  /** An array that may contain up to 20 [topics](https://resources.quickbase.com/nav/app/budurkasx/action/showpage/2b2941e4-f34d-4d41-9b0e-db790d20e9ab?pageIdV2=quickbase.com-DashboardGroup-15760d74-2243-4ce9-9495-7cc8790f12e7) to filter by. If empty, all topics are returned. */
  topics?: string[];
}

export interface AuditResponse {
  /** Query id of the requested audit log. */
  queryId: string;
  /** All events of the audit log. */
  events?: {
    /** Log ID. */
    id: string;
    /** User's first name. */
    firstname: string;
    /** User's last name. */
    lastname: string;
    /** User's email address. */
    email: string;
    /** What action was taken, such as log in, create app, report access, or table search. */
    topic: string;
    /** Exact time the action was taken, including date, and time with hour, minutes and seconds. Time zone is the browser time zone. */
    time: string;
    /** The IP address the action was taken from. */
    ipaddress: string;
    /** The browser and OS the action was taken from. */
    useragent: string;
    /** UI for user interface or API for an API call. */
    application: string;
    /** A brief description of the action that you can click to see additional details. */
    description: string;
    /** The data changes that have occured to a field that has been marked as audited. */
    payloadChanges?: {
      /** An object describing the changes that occured on record changes. */
      changes: {
        /** The current value of the fields that have been changed. */
        current: unknown[];
        /** The previous value of the fields that have been changed. */
        previous: unknown[];
        /** The list of fields and their types that have been changed. */
        fields: unknown[];
        [key: string]: unknown;
      };
      /** The recordId that has been edited. */
      rid: number;
      /** The change type that occured for a record. Could be one of add, edit, delete. */
      changeType: string;
      /** A placeholder for type changes. */
      type: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  }[];
  /** Token to fetch the next 1000 logs. */
  nextToken?: string;
  [key: string]: unknown;
}

// platformAnalyticReads
/** Get read summaries */
export interface PlatformAnalyticReadsParams {
  /** The date for which read summaries need to be fetched. This must be date-time only, as YYYY-MM-DD, and a valid date in the past. */
  day?: string;
}

export interface PlatformAnalyticReadsResponse {
  /** The data object containing the read summaries. */
  data: {
    /** Detailed read summaries for a specific date. */
    dailyDetailedReads: {
      /** The date of the requested summary. */
      date: string;
      /** Total reads for the specified date. */
      reads: {
        /** Total user reads for the realm on the specified date. */
        user: number;
        /** Total integration reads for the realm on the specified date. */
        integrations: {
          /** Total reads by anonymous users for the realm on the specified date. */
          eoti: number;
          /** Total API reads for the realm on the specified date. */
          api: number;
          /** Total pipeline reads for the realm on the specified date. */
          pipelines: number;
          [key: string]: unknown;
        };
        [key: string]: unknown;
      };
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

// platformAnalyticEventSummaries
/** Get event summaries */
export interface PlatformAnalyticEventSummariesParams {
  /** The ID of the account to query. If no value is specified, the first account matching the provided domain is chosen. */
  accountId?: number;
}

export interface PlatformAnalyticEventSummariesRequest {
  /** The start date and time of the requested summaries in ISO 8601 time format. */
  start: string;
  /** The end date and time of the requested summaries in ISO 8601 time format. */
  end: string;
  /** A pagination token from a previous response made using the same parameters. Used to fetch the next page. */
  nextToken?: string;
  /** How the events should be grouped. */
  groupBy: 'app' | 'user';
  /** A list of items to filter events by. Only events which match ALL criteria will be included in the results. */
  where?: ({
    /** Id of the item to filter by - the hash uid if filtering a user, or the app id if filtering an app. */
    id: string;
    /** The type of item to filter by. */
    type: 'app' | 'user';
  })[];
}

export interface PlatformAnalyticEventSummariesResponse {
  data: {
    eventsSummaries: {
      /** The ID of the account the events are associated with. */
      accountId: string;
      /** The start date and time of the requested summaries in ISO 8601 time format. */
      start: string;
      /** The end date and time of the requested summaries in ISO 8601 time format. */
      end: string;
      /** How the events should be grouped. */
      groupBy: 'app' | 'user';
      where: ({
        /** Id of the item to filter by. */
        id: string;
        /** The type of item to filter by. */
        type: 'app' | 'user';
      })[];
      /** An array of objects that contains Application/User information and an events object with summaries by event type. */
      results: ({
        /** Id of the Application/User. */
        id: string;
        /** Name of the Application/User. */
        name: string;
        /** Totals by billing category for the event grouping. */
        totals: {
          integration?: number;
          user?: number;
          all?: number;
        };
        /** An array of events that contains specific information associated with an Application/User broken down by event type. */
        eventTypes: ({
          /** Event type */
          eventType?: string;
          /** Count of events associated with that event type and Application/User. */
          count?: number;
          /** Billing category of the event type. */
          billingCategory?: 'user' | 'integration';
        })[];
      })[];
      /** Additional information about the results that may be helpful. */
      metadata: {
        /** Supply this token in a subsequent request to fetch the next page of results. */
        nextToken: string;
      };
      /** Totals by billing category for all queried events. */
      totals: {
        integration?: number;
        user?: number;
        all?: number;
      };
    };
  };
}

// exportSolution
/** Export a solution */
export interface ExportSolutionParams {
  /** The unique identifier (UUID) or the alias of the solution. */
  solutionId: string;
}

export type ExportSolutionResponse = unknown;

// updateSolution
/** Update a solution */
export interface UpdateSolutionParams {
  /** The unique identifier (UUID) or the alias of the solution. */
  solutionId: string;
}

export type UpdateSolutionRequest = unknown;

export type UpdateSolutionResponse = unknown;

// createSolution
/** Create a solution */
export type CreateSolutionRequest = unknown;

export type CreateSolutionResponse = unknown;

// exportSolutionToRecord
/** Export solution to record */
export interface ExportSolutionToRecordParams {
  /** The unique identifier of the solution. */
  solutionId: string;
  /** The unique identifier (dbid) of the table. */
  tableId: string;
  /** The unique identifier (fid) of the field. It needs to be a file attachment field. */
  fieldId: number;
}

export type ExportSolutionToRecordResponse = unknown;

// createSolutionFromRecord
/** Create solution from record */
export interface CreateSolutionFromRecordParams {
  /** The unique identifier (dbid) of the table. */
  tableId: string;
  /** The unique identifier (fid) of the field. It needs to be a file attachment field. */
  fieldId: number;
  /** The unique identifier of the record. */
  recordId: number;
}

export type CreateSolutionFromRecordResponse = unknown;

// updateSolutionToRecord
/** Update solution from record */
export interface UpdateSolutionToRecordParams {
  /** The unique identifier of the solution. */
  solutionId: string;
  /** The unique identifier (dbid) of the table. */
  tableId: string;
  /** The unique identifier (fid) of the field. It needs to be a file attachment field. */
  fieldId: number;
  /** The unique identifier of the record. */
  recordId: number;
}

export type UpdateSolutionToRecordResponse = unknown;

// changesetSolution
/** List solution changes */
export interface ChangesetSolutionParams {
  /** The unique identifier of the solution. */
  solutionId: string;
}

export type ChangesetSolutionRequest = unknown;

export type ChangesetSolutionResponse = unknown;

// changesetSolutionFromRecord
/** List solution changes from record */
export interface ChangesetSolutionFromRecordParams {
  /** The unique identifier of the solution. */
  solutionId: string;
  /** The unique identifier (dbid) of the table. */
  tableId: string;
  /** The unique identifier (fid) of the field. It needs to be a file attachment field. */
  fieldId: number;
  /** The unique identifier of the record. */
  recordId: number;
}

export type ChangesetSolutionFromRecordResponse = unknown;

// generateDocument
/** Generate a document */
export interface GenerateDocumentParams {
  /** This is the ID of document template. */
  templateId: number;
  /** The unique identifier of the table. */
  tableId: string;
  /** The ID of the record */
  recordId?: number;
  /** File name for the downloaded file */
  filename: string;
  /** The format of the file that is returned. Default is "pdf". */
  format?: 'html' | 'pdf' | 'docx';
  /** Margin formatted as top right bottom left, separated by spaces. Add to override the value set in the template builder. */
  margin?: string;
  /** Unit of measurement for the margin. Default is "in". Add to override the value set in the template builder. */
  unit?: 'in' | 'cm' | 'nm' | 'px';
  /** Page size. Default is "A4". Add to override the value set in the template builder. */
  pageSize?: 'Letter' | 'Legal' | 'Tabloid' | 'A3' | 'A4' | 'A5' | 'A6';
  /** Page orientation. Default is "portrait". Add to override the value set in the template builder. */
  orientation?: 'portrait' | 'landscape';
  /** Your Quickbase domain, for example demo.quickbase.com */
  realm?: string;
}

export interface GenerateDocumentResponse {
  /** The file name. */
  fileName?: string;
  /** Base64 encoded file content. */
  data?: string;
  /** The document content type. */
  contentType?: string;
  [key: string]: unknown;
}

// getSolutionPublic
/** Get solution information */
export interface GetSolutionPublicParams {
  /** The unique identifier (UUID) or the alias of the solution. */
  solutionId: string;
}

export type GetSolutionPublicResponse = unknown;

// getTrustees
/** Get trustees for an app */
export interface GetTrusteesParams {
  /** The unique identifier of an app */
  appId: string;
}

export type GetTrusteesResponse = ({
  /** The ID of the user, group, or email domain group to be added as a trustee. For users and groups, this is the user's or group's ID in Quickbase. For email domain groups, this is the email domain. */
  id: string;
  /** The ID of the role to be assigned or currently assigned to the trustee. */
  roleId: number;
  /** The type of trustee being added. This can be a user, group, or email domain group. */
  type: 'user' | 'group' | 'dom-group';
})[];

// addTrustees
/** Add trustees to an app */
export interface AddTrusteesParams {
  /** The unique identifier of an app */
  appId: string;
}

export type AddTrusteesRequest = ({
  /** The ID of the user, group, or email domain group to be added as a trustee. For users and groups, this is the user's or group's ID in Quickbase. For email domain groups, this is the email domain. */
  id: string;
  /** The ID of the role to be assigned or currently assigned to the trustee. */
  roleId: number;
  /** The type of trustee being added. This can be a user, group, or email domain group. */
  type: 'user' | 'group' | 'dom-group';
})[];

export interface AddTrusteesResponse {
  /** A list of trustees that were not updated. This includes invalid IDs or IDs that could not be processed. */
  failure: ({
    /** The error message associated with the trustee that could not be updated. */
    error?: string;
    /** Object used for operations to read, create, or update trustees in an app. */
    trustee?: {
      /** The ID of the user, group, or email domain group to be added as a trustee. For users and groups, this is the user's or group's ID in Quickbase. For email domain groups, this is the email domain. */
      id: string;
      /** The ID of the role to be assigned or currently assigned to the trustee. */
      roleId: number;
      /** The type of trustee being added. This can be a user, group, or email domain group. */
      type: 'user' | 'group' | 'dom-group';
    };
  })[];
  /** A list of trustees that have been successfully updated. */
  success: ({
    /** The ID of the user, group, or email domain group to be added as a trustee. For users and groups, this is the user's or group's ID in Quickbase. For email domain groups, this is the email domain. */
    id: string;
    /** The ID of the role to be assigned or currently assigned to the trustee. */
    roleId: number;
    /** The type of trustee being added. This can be a user, group, or email domain group. */
    type: 'user' | 'group' | 'dom-group';
  })[];
}

// removeTrustees
/** Remove trustees from an app */
export interface RemoveTrusteesParams {
  /** The unique identifier of an app */
  appId: string;
}

export type RemoveTrusteesRequest = ({
  /** The ID of the user, group, or email domain group to be added as a trustee. For users and groups, this is the user's or group's ID in Quickbase. For email domain groups, this is the email domain. */
  id: string;
  /** The ID of the role to be assigned or currently assigned to the trustee. */
  roleId: number;
  /** The type of trustee being added. This can be a user, group, or email domain group. */
  type: 'user' | 'group' | 'dom-group';
})[];

export interface RemoveTrusteesResponse {
  /** A list of trustees that were not updated. This includes invalid IDs or IDs that could not be processed. */
  failure: ({
    /** The error message associated with the trustee that could not be updated. */
    error?: string;
    /** Object used for operations to read, create, or update trustees in an app. */
    trustee?: {
      /** The ID of the user, group, or email domain group to be added as a trustee. For users and groups, this is the user's or group's ID in Quickbase. For email domain groups, this is the email domain. */
      id: string;
      /** The ID of the role to be assigned or currently assigned to the trustee. */
      roleId: number;
      /** The type of trustee being added. This can be a user, group, or email domain group. */
      type: 'user' | 'group' | 'dom-group';
    };
  })[];
  /** A list of trustees that have been successfully updated. */
  success: ({
    /** The ID of the user, group, or email domain group to be added as a trustee. For users and groups, this is the user's or group's ID in Quickbase. For email domain groups, this is the email domain. */
    id: string;
    /** The ID of the role to be assigned or currently assigned to the trustee. */
    roleId: number;
    /** The type of trustee being added. This can be a user, group, or email domain group. */
    type: 'user' | 'group' | 'dom-group';
  })[];
}

// updateTrustees
/** Update trustees of an app */
export interface UpdateTrusteesParams {
  /** The unique identifier of an app */
  appId: string;
}

export type UpdateTrusteesRequest = ({
  /** The ID of the user, group, or email domain group to be added as a trustee. For users and groups, this is the user's or group's ID in Quickbase. For email domain groups, this is the email domain. */
  id: string;
  /** The ID of the role to be assigned or currently assigned to the trustee. */
  roleId: number;
  /** The ID of the role to be changed for the trustee. This is used to identify the current role before updating it. */
  oldRoleId: number;
  /** The type of trustee being added. This can be a user, group, or email domain group. */
  type: 'user' | 'group' | 'dom-group';
})[];

export interface UpdateTrusteesResponse {
  /** A list of trustees that were not updated. This includes invalid IDs or IDs that could not be processed. */
  failure: ({
    /** The error message associated with the trustee that could not be updated. */
    error?: string;
    /** Object used for operations to read, create, or update trustees in an app. */
    trustee?: {
      /** The ID of the user, group, or email domain group to be added as a trustee. For users and groups, this is the user's or group's ID in Quickbase. For email domain groups, this is the email domain. */
      id: string;
      /** The ID of the role to be assigned or currently assigned to the trustee. */
      roleId: number;
      /** The ID of the role to be changed for the trustee. This is used to identify the current role before updating it. */
      oldRoleId: number;
      /** The type of trustee being added. This can be a user, group, or email domain group. */
      type: 'user' | 'group' | 'dom-group';
    };
  })[];
  /** A list of trustees that have been successfully updated. */
  success: ({
    /** The ID of the user, group, or email domain group to be added as a trustee. For users and groups, this is the user's or group's ID in Quickbase. For email domain groups, this is the email domain. */
    id: string;
    /** The ID of the role to be assigned or currently assigned to the trustee. */
    roleId: number;
    /** The ID of the role to be changed for the trustee. This is used to identify the current role before updating it. */
    oldRoleId: number;
    /** The type of trustee being added. This can be a user, group, or email domain group. */
    type: 'user' | 'group' | 'dom-group';
  })[];
}

/**
 * QuickBase API client interface
 */
export interface QuickbaseAPI {
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
  createApp(body: CreateAppRequest): Promise<CreateAppResponse>;
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
  getApp(params: GetAppParams): Promise<GetAppResponse>;
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
  updateApp(params: UpdateAppParams, body?: UpdateAppRequest): Promise<UpdateAppResponse>;
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
  deleteApp(params: DeleteAppParams, body: DeleteAppRequest): Promise<DeleteAppResponse>;
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
  getAppEvents(params: GetAppEventsParams): Promise<GetAppEventsResponse>;
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
  copyApp(params: CopyAppParams, body: CopyAppRequest): Promise<CopyAppResponse>;
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
  getRoles(params: GetRolesParams): Promise<GetRolesResponse>;
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
  getAppTables(params: GetAppTablesParams): Promise<GetAppTablesResponse>;
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
  createTable(params: CreateTableParams, body: CreateTableRequest): Promise<CreateTableResponse>;
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
  getTable(params: GetTableParams): Promise<GetTableResponse>;
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
  updateTable(params: UpdateTableParams, body?: UpdateTableRequest): Promise<UpdateTableResponse>;
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
  deleteTable(params: DeleteTableParams): Promise<DeleteTableResponse>;
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
  getRelationships(params: GetRelationshipsParams): PaginatedRequest<GetRelationshipsResponse>;
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
  createRelationship(params: CreateRelationshipParams, body: CreateRelationshipRequest): Promise<CreateRelationshipResponse>;
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
  updateRelationship(params: UpdateRelationshipParams, body?: UpdateRelationshipRequest): Promise<UpdateRelationshipResponse>;
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
  deleteRelationship(params: DeleteRelationshipParams): Promise<DeleteRelationshipResponse>;
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
  getTableReports(params: GetTableReportsParams): Promise<GetTableReportsResponse>;
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
  getReport(params: GetReportParams): Promise<GetReportResponse>;
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
  runReport(params: RunReportParams, body?: RunReportRequest): PaginatedRequest<RunReportResponse>;
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
  getFields(params: GetFieldsParams): Promise<GetFieldsResponse>;
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
  createField(params: CreateFieldParams, body: CreateFieldRequest): Promise<CreateFieldResponse>;
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
  deleteFields(params: DeleteFieldsParams, body: DeleteFieldsRequest): Promise<DeleteFieldsResponse>;
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
  getField(params: GetFieldParams): Promise<GetFieldResponse>;
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
  updateField(params: UpdateFieldParams, body?: UpdateFieldRequest): Promise<UpdateFieldResponse>;
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
  getFieldsUsage(params: GetFieldsUsageParams): Promise<GetFieldsUsageResponse>;
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
  getFieldUsage(params: GetFieldUsageParams): Promise<GetFieldUsageResponse>;
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
  runFormula(body: RunFormulaRequest): Promise<RunFormulaResponse>;
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
  upsert(body: UpsertRequest): PaginatedRequest<UpsertResponse>;
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
  deleteRecords(body: DeleteRecordsRequest): Promise<DeleteRecordsResponse>;
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
  runQuery(body: RunQueryRequest): PaginatedRequest<RunQueryResponse>;
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
  recordsModifiedSince(body?: RecordsModifiedSinceRequest): Promise<RecordsModifiedSinceResponse>;
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
  getTempTokenDBID(params: GetTempTokenDBIDParams): Promise<GetTempTokenDBIDResponse>;
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
  exchangeSsoToken(body: ExchangeSsoTokenRequest): Promise<ExchangeSsoTokenResponse>;
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
  cloneUserToken(body: CloneUserTokenRequest): Promise<CloneUserTokenResponse>;
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
  transferUserToken(body: TransferUserTokenRequest): Promise<TransferUserTokenResponse>;
  /**
   * Deactivate a user token
   *
   * Deactivates the authenticated user token. Once this is done, the user token must be reactivated in the user interface.
   *
   * @returns Response
   *
   * @see https://developer.quickbase.com/operation/deactivateUserToken
   */
  deactivateUserToken(): Promise<DeactivateUserTokenResponse>;
  /**
   * Delete a user token
   *
   * Deletes the authenticated user token. This is not reversible.
   *
   * @returns Response
   *
   * @see https://developer.quickbase.com/operation/deleteUserToken
   */
  deleteUserToken(): Promise<DeleteUserTokenResponse>;
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
  downloadFile(params: DownloadFileParams): Promise<DownloadFileResponse>;
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
  deleteFile(params: DeleteFileParams): Promise<DeleteFileResponse>;
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
  getUsers(params: GetUsersParams, body?: GetUsersRequest): PaginatedRequest<GetUsersResponse>;
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
  denyUsers(params: DenyUsersParams, body: DenyUsersRequest): Promise<DenyUsersResponse>;
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
  denyUsersAndGroups(params: DenyUsersAndGroupsParams, body: DenyUsersAndGroupsRequest): Promise<DenyUsersAndGroupsResponse>;
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
  undenyUsers(params: UndenyUsersParams, body: UndenyUsersRequest): Promise<UndenyUsersResponse>;
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
  addMembersToGroup(params: AddMembersToGroupParams, body: AddMembersToGroupRequest): Promise<AddMembersToGroupResponse>;
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
  removeMembersFromGroup(params: RemoveMembersFromGroupParams, body: RemoveMembersFromGroupRequest): Promise<RemoveMembersFromGroupResponse>;
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
  addManagersToGroup(params: AddManagersToGroupParams, body: AddManagersToGroupRequest): Promise<AddManagersToGroupResponse>;
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
  removeManagersFromGroup(params: RemoveManagersFromGroupParams, body: RemoveManagersFromGroupRequest): Promise<RemoveManagersFromGroupResponse>;
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
  addSubgroupsToGroup(params: AddSubgroupsToGroupParams, body: AddSubgroupsToGroupRequest): Promise<AddSubgroupsToGroupResponse>;
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
  removeSubgroupsFromGroup(params: RemoveSubgroupsFromGroupParams, body: RemoveSubgroupsFromGroupRequest): Promise<RemoveSubgroupsFromGroupResponse>;
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
  audit(body: AuditRequest): Promise<AuditResponse>;
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
  platformAnalyticReads(params: PlatformAnalyticReadsParams): Promise<PlatformAnalyticReadsResponse>;
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
  platformAnalyticEventSummaries(params: PlatformAnalyticEventSummariesParams, body: PlatformAnalyticEventSummariesRequest): PaginatedRequest<PlatformAnalyticEventSummariesResponse>;
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
  exportSolution(params: ExportSolutionParams): Promise<ExportSolutionResponse>;
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
  updateSolution(params: UpdateSolutionParams, body?: UpdateSolutionRequest): Promise<UpdateSolutionResponse>;
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
  createSolution(body: CreateSolutionRequest): Promise<CreateSolutionResponse>;
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
  exportSolutionToRecord(params: ExportSolutionToRecordParams): Promise<ExportSolutionToRecordResponse>;
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
  createSolutionFromRecord(params: CreateSolutionFromRecordParams): Promise<CreateSolutionFromRecordResponse>;
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
  updateSolutionToRecord(params: UpdateSolutionToRecordParams): Promise<UpdateSolutionToRecordResponse>;
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
  changesetSolution(params: ChangesetSolutionParams, body: ChangesetSolutionRequest): Promise<ChangesetSolutionResponse>;
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
  changesetSolutionFromRecord(params: ChangesetSolutionFromRecordParams): Promise<ChangesetSolutionFromRecordResponse>;
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
  generateDocument(params: GenerateDocumentParams): Promise<GenerateDocumentResponse>;
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
  getSolutionPublic(params: GetSolutionPublicParams): Promise<GetSolutionPublicResponse>;
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
  getTrustees(params: GetTrusteesParams): Promise<GetTrusteesResponse>;
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
  addTrustees(params: AddTrusteesParams, body?: AddTrusteesRequest): Promise<AddTrusteesResponse>;
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
  removeTrustees(params: RemoveTrusteesParams, body?: RemoveTrusteesRequest): Promise<RemoveTrusteesResponse>;
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
  updateTrustees(params: UpdateTrusteesParams, body?: UpdateTrusteesRequest): Promise<UpdateTrusteesResponse>;
}
