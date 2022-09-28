
import { Scalar } from '../types';

export interface DBModelData extends Object {
  id?: any;
}

export interface ClientData extends Object {
  uid?: number;
  gid?: number;
}

export interface StoreOptions {
  updateKeys?:    string[];
  create?:        number;
  skip?:          number;
  update?:        number;
  tab?:           string;    // from the caller. only process this tab. (Used only for Excel)
  notices?:       string[];
  warnings?:      string[];
  errors?:        string[];
  verbose?:       number;
  show_sql?:      number;
}

export interface DataOptions {
  id?: string;                      // [insert] use this ID to upsert data
  update?: string[];                // [insert] use these columns to upsert data
  updateKeys?: string[];            // [insert] use these keys to upsert data
  updateNoClobber?: string;         // [insert] ["anything"/truthy, "null"] on upsert, don't update non-null values with anything / nulls
  orderBy?: string[];               // [get] order by set of columns
  offset?: number;                  // [get] begin returning rows after <offset> rows have been skipped
  limit?: number;                   // [get] return max of <limit> rows (limit/offset work sometimes at native db level, but then at code level)
  limitNative?: number;             // [get] return max of <limitNative> rows (forces a limit at the native db level)
  schemaName?: string;              // [ALL] which physical schema to act on
  domainTableDefs?: DomainTableDefs;  // [ALL]
  preserveSnapshot?: boolean;       // [get] (straight pass-through to native db)
  raw?: boolean;                    // do not supplement with autoOwner, autoTimestamps, or auth
  // populateRefs?: boolean|string[];  // [get] join to other referenced tables based on keys
  distinct?: boolean;               // [get] only returns one row with identical values
  joinToOne?: boolean;              // [joinObjects] inhibits join from expanding the number of rows
  alias?: object;                   // [joinObjects] how to rename columns when they are joined in
  groupBy?: string[];               // [get] do grouping and accumulation of numeric values
  related?: object;                 // [insert] for insert on an associative entity that bears denormalized columns from each side
  useExpr?: boolean;                // [update] [future: get, insert, params] e.g. { "now": "{currentDttm}", "numUnread": "{numUnread+1}" }
  searchFields?: string[];          // [manage] create a "search" field with lower case, concatenated strings
  refresh?: number;                 // [manage] frequency of update (ms)
  skipChanges?: number;             // [manage] debounce (ms) rapid changes (default 300ms)
  userIdParam?: string;             // [manage]
  groupIdParam?: string;            // [manage]
  resultObject?: object;            // [manage] the object that [setname] and/or [readyPromiseName] are put on
  readyPromiseName?: string;        // [manage] name of the promise variable on the
  extended?: boolean;
  aggregate?: boolean;
  caseSensitive?: boolean;
  client?: ClientData;
  showSql?: boolean;
  tableDef?: any;    // DBTableDef;            // [IN/OUT] tableDef
  sql?: string[];                   // [OUT] array into which we return the SQL statement
  verbose?: number;
}

export interface DataParamOps {
  eq?: string|number|boolean|null;
  ne?: string|number|boolean|null;
  lt?: string|number;
  le?: string|number;
  gt?: string|number;
  ge?: string|number;
  in?: string[]|number[];
  notIn?: string[]|number[];
  startsWith?: string;
}

export interface DBQueryFlags {
  needsDefaults?: boolean;
  needsExprsComputed?: boolean;
  needsMoreFiltering?: boolean;
  needsMoreSorting?: boolean;
  needsMoreWindowing?: boolean;
}

export interface DBColumnDef extends Object {
  name?: string;           // not often used
  label?: string;          // not often used
  type?: string;           // [string, integer, float, date, datetime]
  required?: boolean;      // ???
  ref?: string;            // ???
  default?: string|number|boolean;   //
  lowercase?: boolean;
  expr?: string;
  exprColumns?: string[];
  dbexpr?: string;
  isAggregateKey?: boolean;
  relationshipName?: string;
  mergeQueryName?: string;
  columnModifier?: string;
  aggDbexpr?: string;
  nativeColumn?: string;
  nativeColumnType?: string;
  orderIdx?: number;
  defaultValue?: any;
  values?: Scalar[];
  notNullInd?: string;        // [Y,N]
  maxLength?: number;
  numberOfDecimals?: number;
  primaryKeyInd?: string;     // [Y,N]
  physicalInd?: string;       // [Y,N]
  autoIncrementInd?: string;  // [Y,N]
  // UI attributes
  viewType?: string;
  // viewSubtype?: string;
  editType?: string;
  // editSubtype?: string;
}

export interface DBColumnDefs {
  [columnName: string]: DBColumnDef;
}

export interface DBParameterDef extends Object {
  whereClause?: string;
  dependencies?: string[];
}

export interface DBParameterDefs {
  [parameterName: string]: DBParameterDef;
}

export interface DBValueDef extends Object {
  path: string;
  removePath?: string;
  value: string;
}

export interface DBValueDefs {
  [valueName: string]: DBValueDef;
}

export interface DBMergeQueryDef {
  tableName?:   string;  // logical name of table to merge a query from
  joinColumns?: object;  // lookup of logical column names on the base table to logical column names on the merged table (for key columns)
  columns?:     object;  // lookup of logical column names on the base table to logical column names on the merged table (for data columns)
  joinToOne?:   boolean;
}

export interface DBMergeQueryDefs {
  [mergeQueryName: string]: DBMergeQueryDef;
}

export interface DBRelationshipDef extends Object {
  reltype?: string;            // "toMany" ("push"/"copy"), "toOne" ("pull")
  tableName?: string;          // if not supplied (common), relationshipName is the tableName
  dependencies?: string[];     // alternate way. can specify multiple dependencies.
  columnPrefix?: string;       // e.g. "orig" causes "airport" to become "origAirport"
  // this is the complete way to define the join clause for the relationship
  joinOuter?: string;          // (default) "left", "right", "inner"
  fullTableName?: string;      // e.g. "insight360.group_memb" (physical)
  relationshipAlias?: string;  // used in the SQL statement as a table abbreviation (if not given, use the relationship name)
  joinOnClause?: string;
  // this is a simpler way to define a relationship, that gets automatically transformed into the complete way
  joinToColumn?: string;       // NOTE: logical column
  joinFromColumn?: string;     // NOTE: logical column
  columns?: string[];          // NOTE: logical columns
}

export interface DBRelationshipDefs {
  [relationshipName: string]: DBRelationshipDef;
}

export interface DBIndexDef {
  indexName?: string;
  primaryKeyInd?: string;   // [Y, N]
  uniqueInd?: string;       // [Y, N]
  columns?: string[];
}

export interface DBIndexColumnDef {
  indexName?: string;
  columnName?: string;
  uniqueInd?: string;       // [Y, N]
  orderIdx?: number;
}

export interface DBDefaults {
  [columnName: string]: string|number|boolean;
}

export interface DBExprs {
  [columnName: string]: string;
}

export interface DBTableDef {
  tableName?: string;
  nativeTableName?: string;
  tableAlias?: string;
  tableLabel?: string;
  autoUser?: boolean;
  autoGroup?: boolean;
  autoOwner?: boolean;  // deprecated
  autoTimestamps?: boolean;
  autoHistory?: boolean;
  autoColumns?: string[];
  autoValues?: string[];
  defaultColumns?: string[];
  physColumns?: string[];
  column?: DBColumnDefs;
  parameter?: DBParameterDefs;
  value?: DBValueDefs;
  uniqueIndexes?: DBIndexDef[];
  indexes?: DBIndexDef[];
  relationship?: DBRelationshipDefs;
  mergeQuery?: DBMergeQueryDefs;
  default?: DBDefaults;  // authoritatively defined in column[columnName].default. copied here for efficiency.
  expr?: DBExprs;        // authoritatively defined in column[columnName].expr.    copied here for efficiency.
  extended?: boolean;    // a flag to say whether the extendTableDef() function has been run.
  primaryKey?: string[];
  schemaName?: string;
  // UI attributes
  titleName?: string;     // singular name to use in a page title (e.g. of a view of a single item)
  titleNames?: string;    // plural name to use in a page title (e.g. of a list)
  routeName?: string;     // name to use for a URL route
  nameColumns?: string[]; // list of columns to use for a name
  formColumns?: string[]; // list of columns to use for a creating/editing an instance
}

export interface DBTableDefs {
  [tableName: string]: DBTableDef;
}

export interface DomainTableDef {
  tableName?: string;
  schemaName?: string;
}

export interface DomainTableDefs {
  [tableName: string]: DomainTableDef;
}
