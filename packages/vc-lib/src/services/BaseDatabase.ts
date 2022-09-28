
import * as lodash from 'lodash';

import { ObjectLookup, ObjectArrayLookup, Scalar } from '../types';
import { DBModelData, DBTableDefs, DBQueryFlags, DBTableDef, DBColumnDefs, DBColumnDef, DBRelationshipDef, DataOptions, StoreOptions } from '../classes/DBInterfaces';
import { Config } from '../services/Config';

export class BaseDatabase {

  protected config: object = {};
  protected db: any = null;
  public debug: boolean = false;
  protected reservedWord: object = {};
  protected tableDefs: DBTableDefs = {};
  protected serverTimeOffsetMs: number = 0;

  // Values for ID-generation
  protected ID_BASE64_CHARS: string = '-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz';
  // Timestamp of last push, used to prevent local collisions if you push twice in one ms.
  protected lastId: number = 0;
  protected lastIdTime: number = 0;
  protected lastIdCache: any = {};
  // We generate 72-bits of randomness which get turned into 12 characters and appended to the
  // timestamp to prevent collisions with other clients.  We store the last characters we
  // generated because in the event of a collision, we'll use those same characters except
  // "incremented" by one.
  // protected lastRandNums: number[] = [];
  protected nativeFunctionSynonym = {};

  constructor () {
    // console.log("BaseDatabase.constructor()");
  }

  init(config: Config) {
    this.config = config;
    this.initBaseDatabase();
  }

  public getConnection() {
    return(this.db);
  }

  // this is called from outside (e.g. AppModule.constructor() in app.module.ts)
  // This initializes this general purpose data access layer with an application-specific set of tableDefs
  public registerTableDefs(tableDefs: DBTableDefs) : void {
    // console.log("BaseDatabase.registerTableDefs()");
    let tableAliasUsed = {};
    for (let tableName in tableDefs) {
      // console.log("BaseDatabase.registerDatabaseDefs()", tableName, typeof(tableDefs[tableName]), tableDefs[tableName]);
      let tableDef = tableDefs[tableName];
      tableDef.tableName = tableName;
      if (tableDef.tableAlias) {
        tableAliasUsed[tableDef.tableAlias] = tableName;
      }
      this.tableDefs[tableName] = tableDef;
    }
    for (let tableName in tableDefs) {
      let tableDef: DBTableDef = tableDefs[tableName];
      if (!tableDef.tableAlias) {
        tableDef.tableAlias = this.makeAlias(tableName, tableAliasUsed);
        tableAliasUsed[tableDef.tableAlias] = tableName;
      }
      if (!tableDef.column) tableDef.column = {};
      for (let columnName in tableDef.column) {
        let columnDef: DBColumnDef = tableDef.column[columnName];
        if (columnDef.type) {
          if (typeof(columnDef.type) === "string") columnDef.type = columnDef.type.toLowerCase();
          if (columnDef.type === "number") {
            columnDef.type = (columnDef.numberOfDecimals === 0) ? "integer" : "float";
          }
        }
        if (columnDef.defaultValue === undefined) {
          if (columnName === "createDttm") {
            columnDef.type = "timestamp";
            columnDef.defaultValue = "CURRENT_TIMESTAMP";
          }
          else if (columnName === "modifyDttm") {
            columnDef.type = "timestamp";
            columnDef.defaultValue = "CURRENT_TIMESTAMP_ON_UPDATE";
          }
        }
      }
      this.initTableDef(tableDef);
    }
    // console.log("BaseDatabase.registerTableDefs() tableDefs", tableDefs);
  }

  protected initTableDef (tableDef: DBTableDef) {
    // do nothing. this is available for a subclass to override
  }

  // call this ONLY from AuthService
  startOfflineDataAccess() {
    console.log("BaseDatabase.startOfflineDataAccess()");
    // throw new Error("startOfflineDataAccess() is not allowed on this database");
  }

  // call this ONLY from AuthService
  stopOfflineDataAccess() {
    console.log("BaseDatabase.stopOfflineDataAccess()");
    // throw new Error("stopOfflineDataAccess() is not allowed on this database");
  }

  // call this ONLY from AuthService
  startDatabaseDataAccess() {
    console.log("BaseDatabase.startDatabaseDataAccess()");
  }

  // call this ONLY from AuthService
  stopDatabaseDataAccess() {
    console.log("BaseDatabase.stopDatabaseDataAccess()");
  }

  public getCurrentServerTime() {
    let clientTimeMs = Date.now();
    let serverTimeMs = clientTimeMs + this.serverTimeOffsetMs;
    return(serverTimeMs);
  }

  public getTableDef(tableName: string): DBTableDef {
    // console.log("BaseDatabase.getTableDef(%s)", tableName, this.tableDefs);
    // if (!this.tableDefs[tableName]) { throw new Error("BaseDatabase.getTableDef(): "+tableName+" tableName not defined"); }
    if (!this.tableDefs[tableName]) {
      return(null);
    }
    else {
      let tableDef = this.tableDefs[tableName];
      if (!tableDef.extended) {
        this.extendTableDef(tableDef, tableName);
      }
      return(tableDef);
    }
  }

  protected extendTableDef (tableDef: DBTableDef, tableName: string) {
    tableDef.extended = true;
    let defaults = {};
    let exprs = {};
    let physColumns = [];
    let allColumns = [];
    let columnDefs = tableDef.column;
    let defaultNameColumns: string[] = [];
    let defaultFormColumns: string[] = [];

    if (!tableDef.tableName) tableDef.tableName = tableName;

    for (let columnName in columnDefs) {
      let columnDef = tableDef.column[columnName];
      allColumns.push(columnName);
      if (columnDef.physicalInd === "Y" || columnDef.nativeColumn) {
        physColumns.push(columnName);
        if (columnName.match(/[Nn]ame/) && defaultNameColumns.length === 0) defaultNameColumns.push(columnName);
        if (columnDef.type === "string" || columnDef.type === "integer" || columnDef.type === "float") {
          defaultFormColumns.push(columnName);
        }
      }
      if (!columnDef.label) {
        columnDef.label = this.makeLabel(columnName, tableName, tableDef);
      }
      if (columnDef.default !== undefined) {
        defaults[columnName] = columnDef.default;
      }
      if (columnDef.expr !== undefined) {
        exprs[columnName] = columnDef.expr;
      }
    }

    // IMPORTANT: defaults are supplied and exprs are computed in postProcessObjects
    if (!lodash.isEmpty(defaults)) {
      tableDef.default = defaults;
    }
    if (!lodash.isEmpty(exprs)) {
      tableDef.expr = exprs;
    }
    if (!tableDef.defaultColumns) {
      tableDef.defaultColumns = (physColumns.length > 0) ? physColumns : allColumns;
    }
    if (!tableDef.physColumns) {
      tableDef.physColumns = physColumns;
    }

    // titleName?: string;     // singular name to use in a page title (e.g. of a view of a single item)
    // titleNames?: string;    // plural name to use in a page title (e.g. of a list)
    // routeName?: string;     // name to use for a URL route
    // nameColumns?: string[]; // list of columns to use for a name
    // formColumns?: string[]; // list of columns to use for a creating/editing an instance
  
    if (!tableDef.titleName)  tableDef.titleName  = tableDef.tableName.replace(/([a-z])([A-Z])/g, (lcuc, lc, uc) => { return(lc + " " + uc); });
    if (!tableDef.titleNames) tableDef.titleNames = tableDef.titleName + "s";
    if (!tableDef.routeName)  tableDef.routeName  = tableDef.tableName.replace(/([a-z])([A-Z])/g, (lcuc, lc, uc) => { return(lc + "-" + uc); }).toLowerCase();
    if (!tableDef.nameColumns) {
      if (defaultNameColumns.length > 0) tableDef.nameColumns = defaultNameColumns;
      else if (tableDef.uniqueIndexes && tableDef.uniqueIndexes.length > 0 && tableDef.uniqueIndexes[0].columns) {
        tableDef.nameColumns = tableDef.uniqueIndexes[0].columns;
      }
    }
    if (!tableDef.formColumns) tableDef.formColumns = defaultFormColumns;
    // console.log("XXX BaseDatabase.extendTableDef()", tableDef);
    
    this.extendTableDef2(tableDef, tableName);
  }

  // this is a hook for overriding in a subclass
  protected extendTableDef2 (tableDef: DBTableDef, tableName: string) {
  }

  public async getTableNames (schemaName?: string) : Promise<string[]> {
    console.log("BaseDatabase.getTableNames()");
    let promise = new Promise<string[]>((resolve, reject) => {
      let tableNames = [];
      for (let tableName in this.tableDefs) {
        tableNames.push(tableName);
      }
      tableNames = tableNames.sort();
      resolve(tableNames);
    });
    return(promise);
  }

  public getColumnNames(tableName: string) {
    let tableDef = this.getTableDef(tableName);
    let columns = [];
    for (let column in tableDef.column) {
      columns.push(column);
    }
    return(columns);
  }

  public async getTableDefFromDb (tableName: string, schema?: string) : Promise<DBTableDef> {
    let tableDef = this.getTableDef(tableName);
    throw new Error("BaseDatabase.getTableDefFromDb() must be implemented in a subclass");
    return(tableDef);
  }

  public async getObjects(
    tableName: string,
    params?: object|string|number,
    columns?: string[],
    options: DataOptions = {}
  ) : Promise<object[]> {
    // This method needs to be overridden
    let objects = [];
    if (tableName) throw new Error("BaseDatabase.getObjects() must be implemented in a subclass");
    return(objects);
  }

  public async getObject(
    tableName: string,
    params?: object|string|number,
    columns?: string[],
    options: DataOptions = {}
  ) : Promise<object|null> {
    // console.log("BaseDatabase.getObject(%s)", tableName, params, columns, options);

    // let obs: ObservableObjects = this.getObservableObjects(tableName, params, columns, options);
    // let objects = await this.observeObjects(obs, tableName, params, columns, options);

    options.limit = 1;
    // console.log("BaseDatabase.getObject(%s) BEFORE", tableName, params);
    let objects = await this.getObjects(tableName, params, columns, options);
    // console.log("BaseDatabase.getObject(%s) =>", tableName, params, lodash.clone(objects));
    if (!objects || objects.length === 0) {
      return(null);
    }
    else {
      return(objects[0]);
    }
  }

  public async getValue(
    tableName: string,
    params?: object|string|number,
    column?: string,
    options: DataOptions = {}
  ) : Promise<string|number|boolean|null> {
    let obj = await this.getObject(tableName, params, [ column ], options);
    return obj ? obj[column] : null;
  }

  public async getValueArray(
    tableName: string,
    params?: object|string|number,
    column?: string,
    options: DataOptions = {}
  ) : Promise<any[]> {
    let objs = await this.getObjects(tableName, params, [ column ], options);
    let array = [];
    for (let obj of objs) {
      array.push(obj[column]);
    }
    return array;
  }

  public async insert(
    tableName: string,
    model: object,
    columns?: string[],
    options?: DataOptions)
    : Promise<number> {
    if (tableName) throw new Error("BaseDatabase.insert() must be implemented in a subclass");
    return(0);
  }

  public async insertObjects(
    tableName: string,
    models: object[],
    columns?: string[],
    options?: DataOptions)
    : Promise<object> {
    if (tableName) throw new Error("BaseDatabase.insertObjects() must be implemented in a subclass");
    return({});
  }


  public async update(
    tableName: string,
    params?: object|string|number,
    values?: object,
    columns?: string[],
    options?: DataOptions)
    : Promise<number> {
    if (tableName) throw new Error("BaseDatabase.update() must be implemented in a subclass");
    return(0);
  }


  public async delete(
    tableName: string,
    params?: object|string|number,
    options?: object)
    : Promise<number> {
    if (tableName) throw new Error("BaseDatabase.delete() must be implemented in a subclass");
    return(0);
  }

  public async executeSql(sql: string, options: DataOptions = {}) : Promise<object> {
    return({err: "not implemented"});
  }

  public async executeInsertSql(sql: string) : Promise<number> {
    return(0);
  }

  public async executeDml(sql: string, options: DataOptions = {}) : Promise<number> {
    return(0);
  }

  public async getColumn(
    tableName: string,
    params?: object|string|number,
    column?: string,
    options: DataOptions = {}
  ) : Promise<any[]> {
    // console.log("BaseDatabase.getObject(%s)", tableName, params, columns, options);
    let columns: string[];
    if (column !== undefined) columns = [ column ];

    let objects = await this.getObjects(tableName, params, columns, options);
    let columnValues:any[] = [];
    if (objects.length > 0) {
      if (!column) {
        for (let c in objects[0]) {
          column = c;
          break;
        }
      }
      for (let object of objects) {
        columnValues.push(object[column]);
      }
    }
    return(columnValues);
  }

  public async getArrays(
    tableName: string,
    params?: object|string|number,
    columns?: string[],
    options: DataOptions = {}
  ) : Promise<any[][]> {
    // console.log("BaseDatabase.getArrays(%s)", tableName, params, columns, options);
    let objects = await this.getObjects(tableName, params, columns, options);
    let arr:any[] = [];
    let row;
    if (objects.length > 0) {
      if (!columns) columns = [];
      if (columns.length === 0) {
        for (let column in objects[0]) {
          columns.push(column);
        }
      }
      for (let object of objects) {
        row = [];
        for (let column of columns) {
          row.push(object[column])
        }
        arr.push(row);
      }
    }
    return(arr);
  }

  public async getObjectOfObjectsByKey(
    tableName: string,
    params: object,
    columns: string[],
    keyColumn: string,
    options: DataOptions = {}
  ): Promise<ObjectLookup<object>> {
    let objects = await this.getObjects(tableName, params, columns, options);
    return(this.makeObjectOfObjectsByKey(objects, keyColumn, options));
  }

  public async getObjectOfObjectsByKeys(
    tableName: string,
    params: object,
    columns: string[],
    keyColumns: string[],
    options: DataOptions = {}
  ): Promise<ObjectLookup<object>> {
    let objects = await this.getObjects(tableName, params, columns, options);
    return(this.makeObjectOfObjectsByKeys(objects, keyColumns, options));
  }

  public async getObjectOfValuesByKey(
    tableName: string,
    params: object,
    columns: string[],
    keyColumn: string,
    valueColumn: string,
    options: DataOptions = {}
  ): Promise<ObjectLookup<Scalar>> {
    let objects = await this.getObjects(tableName, params, columns, options);
    return(this.makeObjectOfValuesByKey(objects, keyColumn, valueColumn, options));
  }

  public async getObjectOfObjectArraysByKey(
    tableName: string,
    params: object,
    columns: string[],
    keyColumn: string,
    options: DataOptions = {}
  ): Promise<ObjectArrayLookup<object>> {
    let objects = await this.getObjects(tableName, params, columns, options);
    return(this.makeObjectOfObjectArraysByKey(objects, keyColumn, options));
  }

  public async getObjectOfObjectArraysByKeys(
    tableName: string,
    params: object,
    columns: string[],
    keyColumns: string[],
    options: DataOptions = {}
  ): Promise<any> {
    let objects = await this.getObjects(tableName, params, columns, options);
    return(this.makeObjectOfObjectArraysByKeys(objects, keyColumns, options));
  }

  public makeObjectKeys(objects: object[], newColumn: string, existingColumns: string[]) {
    for (let obj of objects) {
      let keyvals: string[] = [];
      for (let column of existingColumns) {
        keyvals.push(obj[column]);
      }
      obj[newColumn] = keyvals.join(":");
    }
  }

  public makeObjectOfValuesByKey(objects: object[], keyColumn: string, valueColumn: string, options: DataOptions = {}): ObjectLookup<Scalar> {
    let dict: ObjectLookup<Scalar> = {};
    let key: string;
    let value: Scalar;
    let caseSensitive = options.caseSensitive;
    for (let obj of objects) {
      key = obj[keyColumn];
      value = obj[valueColumn];
      if (caseSensitive === false) {
        if (typeof(key) === "string") {
          key = key.toLowerCase();
        }
      }
      dict[key] = value;
    }
    return(dict);
  }

  public makeObjectOfObjectsByKey(objects: object[], keyColumn: string, options: DataOptions = {}): ObjectLookup<object> {
    let dict = {}, value;
    let caseSensitive = options.caseSensitive;
    for (let obj of objects) {
      value = obj[keyColumn];
      if (caseSensitive === false) {
        if (typeof(value) === "string") {
          value = value.toLowerCase();
        }
      }
      dict[value] = obj;
    }
    return(dict);
  }

  public makeObjectOfObjectsByKeys(objects: object[], keyColumns: string[], options: DataOptions = {}): any {
    let dict = {}, value, keyColumn;
    let caseSensitive = options.caseSensitive;
    let numKeysM1 = keyColumns.length - 1;
    for (let obj of objects) {
      let subdict = dict;
      for (let i = 0; i <= numKeysM1; i++) {
        keyColumn = keyColumns[i];
        value = obj[keyColumn];
        if (value === null) value = "null";
        if (caseSensitive === false) {
          if (typeof(value) === "string") {
            value = value.toLowerCase();
          }
        }
        if (i < numKeysM1) {
          if (!subdict[value]) subdict[value] = {};
          subdict = subdict[value];
        }
        else {
          subdict[value] = obj;
        }
      }
    }
    return(dict);
  }

  public makeObjectOfObjectArraysByKey(objects: object[], keyColumn: string, options: DataOptions = {}): ObjectArrayLookup<object> {
    let dict = {}, value;
    let caseSensitive = options.caseSensitive;
    for (let obj of objects) {
      value = obj[keyColumn];
      if (caseSensitive === false) {
        if (typeof(value) === "string") {
          value = value.toLowerCase();
        }
      }
      if (!dict[value]) dict[value] = [];
      dict[value].push(obj);
    }
    return(dict);
  }

  public makeObjectOfObjectArraysByKeys(objects: object[], keyColumns: string[], options: DataOptions = {}): any {
    let dict = {}, value, keyColumn;
    let caseSensitive = options.caseSensitive;
    let numKeysM1 = keyColumns.length - 1;
    for (let obj of objects) {
      let subdict = dict;
      for (let i = 0; i <= numKeysM1; i++) {
        keyColumn = keyColumns[i];
        value = obj[keyColumn];
        if (value === null) value = "null";
        if (caseSensitive === false) {
          if (typeof(value) === "string") {
            value = value.toLowerCase();
          }
        }
        if (i < numKeysM1) {
          if (!subdict[value]) subdict[value] = {};
          subdict = subdict[value];
        }
        else {
          if (!subdict[value]) subdict[value] = [];
          subdict[value].push(obj);
        }
      }
    }
    return(dict);
  }

  public makeObjectOfCounts(objects: object[], keyColumn: string|string[], options: DataOptions = {}): object {
    let counts = {}, value;
    let caseSensitive = options.caseSensitive;
    if (typeof(keyColumn) === "string") {
      for (let obj of objects) {
        value = obj[keyColumn];
        if (caseSensitive === false) {
          if (typeof(value) === "string") {
            value = value.toLowerCase();
          }
        }
        if (!counts[value]) counts[value] = 1;
        else                counts[value]++;
      }
    }
    else {
      for (let obj of objects) {
        value = this.makeKeyValue(keyColumn, obj, ",", caseSensitive);
        if (!counts[value]) counts[value] = 1;
        else                counts[value]++;
      }
    }
    return(counts);
  }

  public makeKeyValue(columns: string[], obj: object, delim: string = ":", caseSensitive: boolean = true) : string {
    let keyvals = [];
    for (let col of columns) {
      let value = obj[col];
      if (caseSensitive === false) {
        if (typeof(value) === "string") {
          value = value.toLowerCase();
        }
      }
      keyvals.push(value);
    }
    return(keyvals.join(delim));
  }

  protected async postProcessObjects(
    objects: object[],
    tableName: string,
    params: object|string|number,
    columns: string[],
    options: DataOptions,
    flags: DBQueryFlags
  ) : Promise<object[]> {
    // console.log("postProcessObjects() tableName, params, flags, objects", tableName, params, flags, objects);
    let len: number, i: number;
    let tableDef = this.getTableDef(tableName);
    let columnDefs: DBColumnDefs = tableDef.column || {};

    // #0. Merge Queries
    if (tableDef.mergeQuery) {
      let joinObjectsDefs: any = {};
      for (let column of columns) {
        if (columnDefs[column] && columnDefs[column].mergeQueryName) {
          let mergeQueryName = columnDefs[column].mergeQueryName;
          let mergeQueryDef = tableDef.mergeQuery[mergeQueryName];
          if (mergeQueryDef) {
            let joinObjectsDef = joinObjectsDefs[mergeQueryName];
            if (!joinObjectsDef) {
              // joinColumns: string|object, tableName: string, params: object = {}, columns?: string[], options: DataOptions = {}
              joinObjectsDef = { joinColumns: [], tableName: mergeQueryDef.tableName, params: {}, columns: [], options: { alias: {} } };
              joinObjectsDefs[mergeQueryName] = joinObjectsDef;
              if (mergeQueryDef.joinToOne) joinObjectsDef.options.joinToOne = true;
            }
            let targetColumn = mergeQueryDef.columns[column];
            if (column !== targetColumn) joinObjectsDef.options.alias[column] = targetColumn;
            joinObjectsDef.columns.push(column);
          }
        }
      }
      for (let mergeQueryName in joinObjectsDefs) {
        let joinObjectsDef = joinObjectsDefs[mergeQueryName];
        let mergeQueryDef = tableDef.mergeQuery[mergeQueryName];
        for (let column of columns) {
          let columnDef = columnDefs[column];
          let targetColumn = mergeQueryDef.joinColumns[column];
          if (columnDef && columnDef.isAggregateKey && targetColumn && !columnDef.mergeQueryName) {
            joinObjectsDef.columns.unshift(column);
            joinObjectsDef.joinColumns.push(column);
            if (column !== targetColumn) joinObjectsDef.options.alias[column] = targetColumn;
          }
        }
        if (params && typeof(params) === "object") {
          for (let param in params) {
            let targetColumn = mergeQueryDef[param];
            if (targetColumn) {
              joinObjectsDef.params[targetColumn] = params[param];
            }
          }
        }
        else {
          joinObjectsDef.params = params;
        }
        console.log("this.joinObjects()", joinObjectsDef);
        await this.joinObjects(objects, joinObjectsDef.joinColumns, joinObjectsDef.tableName, joinObjectsDef.params, joinObjectsDef.columns, joinObjectsDef.options);
      }
    }
    // #1. Apply defaults
    if (tableDef.default && flags.needsDefaults) {
      len = objects.length;
      for (i = 0; i < len; i++) {
        lodash.defaults(objects[i], tableDef.default);
      }
    }
    // #2. Compute exprs
    if (tableDef.expr && flags.needsExprsComputed) {
      len = objects.length;
      // for (i = 0; i < len; i++) {
      //   lodash.defaults(objects[i], tableDef.default);
      // }
    }
    // #3. Do more filtering based on all of the params
    if (typeof(params) === "object" && flags.needsMoreFiltering) {
      objects = objects.filter(object => this.objectMatchesParams(object, params));
    }
    // #4. Sort the objects according to options.orderBy
    if (flags.needsMoreSorting) {
      this.sortObjects(tableName, objects, options.orderBy);
    }
    // #5. Do windowing according to options.offset and options.limit
    if (flags.needsMoreWindowing) {
      this.windowObjects(objects, options.offset, options.limit);
    }
    // #6. Cut the objects down according to the columns requested
    if (columns) {
      len = objects.length;
      for (i = 0; i < len; i++) {
        objects[i] = lodash.pick(objects[i], columns);
      }
    }
    return(objects);
  }

  /**
   * joinObjects()
   *
   * @param {object[]} rows
   * @param {string|object} joinColumns - if an object, can contain only one pair: { joinColumn: joinTargetColumn }
   * @param {string} tableName
   * @param {object} params
   * @param {string[]} columns
   * @param {DataOptions} [options={}]
   * @memberof BaseDatabase
   */
  public async joinObjects(rows: object[], joinColumns: string|object, tableName: string, params: object = {}, columns?: string[], options: DataOptions = {}) : Promise<object[]> {
    console.log("BaseDatabase.joinObjects()", rows, joinColumns, tableName, params, columns);
    let alias = options.alias;
    let joinToOne: boolean = (options.joinToOne) ? true : false;
    let r: number, row: object, returnedRows: object[];
    let joinColumn: string, joinColumnValue: string, joinColumnValues: string[] = [], joinColumnValueSeen: any = {};
    let joinTargetColumns: string[], joinTargetColumn: string, jcolumns: string[];

    // console.log("BaseDatabase.joinObjects() joinColumns", joinColumns);
    if (typeof(joinColumns) === "string") {
      joinColumn = joinColumns;
      joinTargetColumn = joinColumns;
    }
    else if (joinColumns && typeof(joinColumns) === "object") {
      jcolumns = [];
      for (let jcolumn in joinColumns) {
        jcolumns.push(jcolumn);
        joinTargetColumns.push(joinColumns[jcolumn]);
      }
      if (jcolumns.length === 1) {
        joinColumn = jcolumns[0];
        joinTargetColumn = joinTargetColumns[0];
      }
      else {
        joinColumn = "_key";
        joinTargetColumn = "_key";
      }
    }
    else {
      console.log("BaseDatabase.joinObjects(): joinColumn must be a string or an object");
    }
    // console.log("BaseDatabase.joinObjects() joinColumn joinTargetColumn", joinColumn, joinTargetColumn);

    // get the list of unique joinColumnValues (to be used later as an IN clause on the next tableName)
    let nrows: number = rows.length;
    for (r = 0; r < nrows; r++) {
      row = rows[r];
      if (row[joinColumn] !== undefined) {
        joinColumnValue = row[joinColumn];
        if (joinColumnValue !== null && !joinColumnValueSeen[joinColumnValue]) {
          joinColumnValueSeen[joinColumnValue] = 1;
          joinColumnValues.push(joinColumnValue);
        }
      }
    }

    // console.log("BaseDatabase.joinObjects() joinColumnValues", joinColumnValues);
    if (joinColumnValues.length === 0) {
      // console.log("BaseDatabase.joinObjects() no joinColumValues");
      returnedRows = rows;
    }
    else {
      // params: supplement the params with the list of key values from the upstream data set being joined to
      // joinColumnValues = (joinColumnValues.length === 1) ? joinColumnValues[0] : (joinColumnValues.length > 1 ? joinColumnValues.join(",") : null);
      // joinColumnValues = (joinColumnValues.length === 1) ? joinColumnValues[0] : (joinColumnValues.length > 1 ? joinColumnValues : null);
      // NOTE: params now supports arrays for IN clause, so no .join() required
      if (joinColumnValues.length === 0) { joinColumnValues = null; }
      params[joinTargetColumn] = joinColumnValues;

      // ensure that the joinTargetColumn is in the list of columns returned so that we can join on it after being retrieved
      if (lodash.indexOf(columns, joinTargetColumn) === -1) {
        columns.push(joinTargetColumn);
      }

      // console.log("BaseDatabase.joinObjects() joinToOne", joinToOne);
      if (joinToOne) {
        let joinObjects = await this.getObjects(tableName, params, columns, options);
        if (joinTargetColumn === "_key") this.makeObjectKeys(joinObjects, joinTargetColumn, joinTargetColumns);
        let joinObjectLookup = this.makeObjectOfObjectsByKey(joinObjects, joinTargetColumn);
        if (!lodash.isEmpty(joinObjectLookup)) {
          let c: number, column: string, targetColumn: string, ncols: number = columns.length, joinRow: object;
          nrows = rows.length;
          for (r = 0; r < nrows; r++) {
            row = rows[r];
            joinColumnValue = row[joinColumn];
            if (typeof(joinColumnValue) === "number") {
                joinColumnValue = ""+joinColumnValue;
            }
            if (joinObjectLookup[joinColumnValue]) {
              joinRow = joinObjectLookup[joinColumnValue];
              if (!alias) {
                lodash.defaults(row, joinRow);
              }
              else if (columns) {
                //len = columns.length;
                for (c = 0; c < ncols; c++) {
                  column = columns[c];
                  targetColumn = alias[column] || column;
                  if (row[targetColumn] === undefined && joinRow[column] !== undefined) {
                    row[targetColumn] = joinRow[column];
                  }
                }
              }
              else {
                // Note: calling joinObjects without a columns arg is not really supported yet
                for (column in joinRow) {
                  targetColumn = alias[column] || column;
                  if (row[targetColumn] === undefined && joinRow[column] !== undefined) {
                    row[targetColumn] = joinRow[column];
                  }
                }
              }
            }
          }
        }
        // console.log("BaseDatabase.joinObjects() joinToOne");
        returnedRows = rows;
      }
      else {
        // let joinObjectLookup = await this.getObjectOfObjectArraysByKey(tableName, params, columns, joinTargetColumn, options);
        let joinObjects = await this.getObjects(tableName, params, columns, options);
        if (joinTargetColumn === "_key") this.makeObjectKeys(joinObjects, joinTargetColumn, joinTargetColumns);
        let joinObjectLookup = this.makeObjectOfObjectArraysByKey(joinObjects, joinTargetColumn);
        if (!lodash.isEmpty(joinObjectLookup)) {
          // console.log("BaseDatabase.joinObjects() joinObjectLookup", joinObjectLookup);
          let c, column, targetColumn, row, joinRow, joinRows, j, numj;
          let ncols = columns.length
          let newRows = [];
          nrows = rows.length;
          for (r = 0; r < nrows; r++) {
            row = rows[r];
            joinColumnValue = row[joinColumn];
            if (typeof(joinColumnValue) === "number") {
              joinColumnValue = ""+joinColumnValue;
            }
            // console.log("BaseDatabase.joinObjects() row joinColumn joinColumnValue", joinColumn, joinColumnValue);
            if (joinObjectLookup[joinColumnValue]) {
              joinRows = joinObjectLookup[joinColumnValue];
              numj = joinRows.length;
              if (numj === 0) {
                newRows.push(row);
              }
              else {
                for (j = 0; j < numj; j++) {
                  joinRow = lodash.clone(joinRows[j]);
                  if (!alias) {
                    lodash.assign(joinRow, row);
                    newRows.push(joinRow);
                  }
                  else if (columns) {
                    row = lodash.clone(rows[r]);
                    for (c = 0; c < ncols; c++) {
                      column = columns[c];
                      targetColumn = alias[column] || column;
                      if (row[targetColumn] === undefined && joinRow[column] !== undefined) {
                        row[targetColumn] = joinRow[column];
                      }
                    }
                    newRows.push(row);
                  }
                  else {
                    // Note: calling joinObjects without a columns arg is not really supported yet
                    row = lodash.clone(rows[r]);
                    for (column in joinRow) {
                      targetColumn = alias[column] || column;
                      if (row[targetColumn] === undefined && joinRow[column] !== undefined) {
                        row[targetColumn] = joinRow[column];
                      }
                    }
                    newRows.push(row);
                  }
                }
              }
            }
            else {
              newRows.push(row);
            }
          }
          // console.log("BaseDatabase.joinObjects() standard return (could include more rows)");
          returnedRows = newRows;
        }
        else {
          // console.log("BaseDatabase.joinObjects() joinObjectLookup empty");
          returnedRows = rows;
        }
      }
    }
    // console.log("BaseDatabase.joinObjects(%s) =>", tableName, lodash.clone(returnedRows));
    return(returnedRows);
  }

  public async syncObjects(tableName: string, objects: object[], keyColumns: string[], params: object = {}): Promise<void> {
    // console.log("BaseDatabase.syncObjects()", tableName, objects, keyColumns, params);
    let keyval, objIndexByKey = {}, objInDb = {};
    let numOriginalObjects, i, obj, id;
    numOriginalObjects = objects.length;
    for (i = 0; i < numOriginalObjects; i++) {
      obj = objects[i];
      keyval = this.makeKeyValue(keyColumns, obj);
      objIndexByKey[keyval] = i;
      // console.log("BaseDatabase.syncObjects() initial objects", obj, keyval, i);
    }
    let dbObjects = await this.getObjects(tableName, params);
    for (let dbObj of dbObjects) {
      keyval = this.makeKeyValue(keyColumns, dbObj);
      objInDb[keyval] = true;
      if (objIndexByKey[keyval] !== undefined) {
        i = objIndexByKey[keyval];
        lodash.assign(objects[i], dbObj);
      }
      else {
        objects.push(dbObj);
        i = objects.length - 1;
        objIndexByKey[keyval] = i;
      }
      // console.log("BaseDatabase.syncObjects() dbObjects", dbObj, keyval, i);
    }
    for (i = 0; i < numOriginalObjects; i++) {
      obj = objects[i];
      keyval = this.makeKeyValue(keyColumns, obj);
      if (!objInDb[keyval]) {
        id = await this.insert(tableName, obj);
        obj.id = id;
        objInDb[keyval] = true;
        // console.log("BaseDatabase.syncObjects() NEW dbObj", obj, keyval);
      }
    }
    // console.log("BaseDatabase.syncObjects() EXIT", tableName, objects, keyColumns, params);
  }

  public async syncObjectsById(tableName: string, objects: object[], keyColumns: string[], params: object = {}): Promise<void> {
    // console.log("BaseDatabase.syncObjectsById()", tableName, objects, keyColumns, params);
    let keyval, objIndexByKey = {}, objIndexById = {};
    let numOriginalObjects, i, obj, id;
    numOriginalObjects = objects.length;
    for (i = 0; i < numOriginalObjects; i++) {   // iterate over every object that is going into the database
      obj = objects[i];                          // get the object from its list
      keyval = this.makeKeyValue(keyColumns, obj);
      if (!obj.id) throw new Error("syncObjectsById("+tableName+") ["+keyval+"] has no id");
      if (objIndexByKey[keyval] !== undefined) throw new Error("syncObjectsById("+tableName+") ["+keyval+"] has a duplicate AK");
      objIndexByKey[keyval] = i;                 // save the index for the AK
      if (objIndexById[obj.id] !== undefined) throw new Error("syncObjectsById("+tableName+") ["+keyval+"] has a duplicate id ["+obj.id+"]");
      objIndexById[obj.id] = i;                  // save the index for the ID
      // console.log("BaseDatabase.syncObjectsById() initial objects", obj, keyval, i);
    }
    let dbObjects = await this.getObjects(tableName, params);
    let newId, relationshipName, relatedModelName, joinToColumn, updateParams, updateValues;
    let rel: DBRelationshipDef;
    let tableDef = this.getTableDef(tableName);
    for (let dbObj of dbObjects) {               // iterate over the objects in the database
      keyval = this.makeKeyValue(keyColumns, dbObj);
      id = dbObj["id"];
      //console.log("XXX BaseDatabase.syncObjectsById(): checking for duplicate AK ["+keyval+"] at id "+id);
      if (objIndexById[id] === undefined && objIndexByKey[keyval] !== undefined) {  // we intend to have this record but it's now under a different ID
        //console.log("XXX BaseDatabase.syncObjectsById(): ERROR duplicate AK detected ["+keyval+"] at id "+id);
        newId = objIndexByKey[keyval]["id"];             // look up the new ID
        if (tableDef && tableDef.relationship) {         // fix reference in other related tables that have this ID in them
          for (relationshipName in tableDef.relationship) {
            rel = tableDef.relationship[relationshipName];
            relatedModelName = rel.tableName || relationshipName;
            if (rel.reltype === "toMany") {
              if (rel.joinToColumn) {
                joinToColumn = rel.joinToColumn;
                updateParams = {};
                updateParams[joinToColumn] = id;
                updateValues = {};
                updateValues[joinToColumn] = newId;
                await this.update(relatedModelName, updateParams, updateValues);
              }
            }
          }
        }
        await this.delete(tableName, id);
      }
      // console.log("BaseDatabase.syncObjectsById() dbObjects", dbObj, keyval, i);
    }
    for (obj of objects) {   // iterate over every object that is going into the database
      await this.insert(tableName, obj);
    }
    // console.log("BaseDatabase.syncObjectsById() EXIT", tableName, objects, keyColumns, params);
  }

  public objectMatchesParams(obj: object, params: object) : boolean {
    let param, paramValue, objValue;
    let matches = true;
    for (param in params) {
      paramValue = params[param];
      objValue = obj[param];
      if (paramValue === null || paramValue === "NULL") {
        if (objValue !== undefined && objValue !== null) { matches = false; break; }
      }
      else if (paramValue === "NOTNULL" || paramValue === "!NULL") {
        if (objValue === undefined || objValue === null) { matches = false; break; }
      }
      else if (paramValue === "EMPTY") {
        if (objValue !== undefined && objValue !== null && objValue !== "") { matches = false; break; }
      }
      else if (paramValue === "NOTEMPTY" || paramValue === "!EMPTY") {
        if (objValue === undefined || objValue === null || objValue === "") { matches = false; break; }
      }
      else if (Array.isArray(paramValue)) {
        if (!this.foundInArray(paramValue, objValue)) { matches = false; break; }
      }
      else if (typeof(paramValue) === "object") {
        if (paramValue["eq"] !== undefined) {
          if (objValue !== paramValue["eq"]) { matches = false; break; }
        }
        if (paramValue["ne"] !== undefined) {
          if (objValue === paramValue["ne"]) { matches = false; break; }
        }
        if (paramValue["gt"] !== undefined) {
          if (objValue <= paramValue["gt"]) { matches = false; break; }
        }
        if (paramValue["ge"] !== undefined) {
          if (objValue < paramValue["ge"]) { matches = false; break; }
        }
        if (paramValue["lt"] !== undefined) {
          if (objValue >= paramValue["lt"]) { matches = false; break; }
        }
        if (paramValue["le"] !== undefined) {
          if (objValue > paramValue["le"]) { matches = false; break; }
        }
        if (Array.isArray(paramValue["in"])) {
          if (!this.foundInArray(paramValue["in"], objValue)) { matches = false; break; }
        }
        if (Array.isArray(paramValue["notIn"])) {
          if (this.foundInArray(paramValue["notIn"], objValue)) { matches = false; break; }
        }
        if (typeof(paramValue["startsWith"]) === "string") {
          let startsWithString = paramValue["startsWith"];
          if (objValue.substr(0, startsWithString.length) !== startsWithString) { matches = false; break; }
        }
        if (typeof(paramValue["contains"]) === "string") {
          let contains = paramValue["contains"];
          if (!objValue || typeof(objValue) !== "string" || objValue.indexOf(contains) === -1) { matches = false; break; }
        }
      }
      else {
        if (paramValue !== objValue) { matches = false; break; }
      }
    }
    // console.log("BaseDatabase.objectMatchesParams()", matches, obj, params)
    return(matches);
  }

  public sortObjects(tableName, rows, orderBy) {
    if (!orderBy || orderBy.length === 0) {
      return;
    }
    else {
      let ncols = orderBy.length;
      let columns = [], directions = [];
      let c, columnName, matches;
      for (c = 0; c < ncols; c++) {
        columns[c] = orderBy[c];
        directions[c] = 1;
        if (matches = columns[c].match(/^([a-zA-Z_][a-zA-Z0-9_]*)\.(asc|desc)$/)) {
          columns[c] = matches[1];
          directions[c] = (matches[2] === "desc") ? -1 : 1;
        }
      }
      let comparator = function (a, b) {
        let comparison = 0;
        for (c = 0; c < ncols; c++) {
          columnName = columns[c];
          if (a[columnName] !== b[columnName]) {
            comparison = (a[columnName] < b[columnName]) ? (-directions[c]) : (directions[c]);
            break;
          }
        }
        return(comparison);
      }
      rows.sort(comparator);
    }
  }

  // used to implement limit/offset (windowing) on queries
  public windowObjects (rows: object[], offset: number|string, limit: number|string) {
    if (!offset) offset = 0;
    if (!limit) limit = 0;
    if (offset && typeof(offset) === "string") offset = parseInt(offset, 10);
    if (limit && typeof(limit) === "string") limit = parseInt(limit, 10);
    if (offset && typeof(offset) === "number") {
      if (offset >= rows.length) {
        rows.splice(0);           // delete all rows. the offset was more than the entire number of rows.
      }
      else if (limit >= 0) {
        rows.splice(0, offset);   // delete <offset> rows from front
      }
      else {
        rows.splice(rows.length - offset);   // delete <offset> rows from the back
      }
    }
    if (limit && typeof(limit) === "number") {
      if (limit > 0) {
        if (limit < rows.length) {
          rows.splice(limit);     // delete all rows after the limit
        }
      }
      else if (limit < 0) {
        limit = -limit;
        if (limit < rows.length) {
          rows.splice(0, rows.length - limit);  // delete all rows after the limit
        }
      }
    }
  }

  // This method is used to convert an object from an associative entity which contains denormalized attributes of its two
  // related tables to an object which might have come directly from one of its related tables.
  public convertToRelated(sourceObject: object, sourceModelName: string, relatedModelName: string) : object {
    let relatedObject = null;
    let tableDef = this.getTableDef(sourceModelName);
    if (tableDef.relationship && tableDef.relationship[relatedModelName]) {
      let rel : DBRelationshipDef = tableDef.relationship[relatedModelName];
      // let relModelName = rel.tableName || relationshipName;
      if (rel.reltype === "toOne") {
        relatedObject = this.copyColumns(sourceObject, rel.columns);
        if (rel.joinFromColumn && sourceObject[rel.joinFromColumn]) {
          relatedObject.id = sourceObject[rel.joinFromColumn];
        }
      }
    }
    return(relatedObject);
  }

  // call this ONLY from AuthService
  startNativeDataAccess() {
    console.log("BaseDatabase.startNativeDataAccess()");
    // this.serverTimestamp = this.firestore.FieldValue.serverTimestamp();
    // let serverTimeOffsetRef = this.afs.doc<object>(".info/serverTimeOffset");
    // serverTimeOffsetRef.on("value", (snapshot) => {
    //   this.serverTimeOffsetMs = snapshot.val();
    //   console.log("BaseDatabase.startNativeDataAccess() serverTimeOffsetMs", this.serverTimeOffsetMs);
    // });
  }

  // call this ONLY from AuthService
  stopNativeDataAccess() {
    console.log("BaseDatabase.stopNativeDataAccess()");
  }

  public createId(randStr?: string, datetimeStr?: string, order?: number): number {
    let id = this._createId(randStr, datetimeStr, order);   // these ID's are compatible with Google Realtime Database
    return(id);
  }

  // NOTE: this only works on Google Realtime Database compatible ID's
  public extractIdTimestamp(id: string): number {
    return(this._extractIdTimestamp(id));
  }

  // This algorithm is modeled after the Firebase ID generation algorithm
  protected _createId(randStr: string = "", datetimeStr?: string, order?: number): number {
    // console.log("BaseDatabase.createId(%s, %s, %s)", randStr, datetimeStr, order);
    if (randStr && datetimeStr === undefined) datetimeStr = "2017-01-01Z";

    let now: number;
    if (datetimeStr) {
      now = new Date(datetimeStr).getTime();
    }
    else {
      now = Date.now();
      if (this.lastIdTime && now === this.lastIdTime) {
        now++;
      }
      this.lastIdTime = now;
    }
    // console.log("BaseDatabase.createId() datetimeStr, now", datetimeStr, now);

    randStr += "-" + now;

    let id: number;
    if (this.lastIdCache[randStr]) {
      id = this.lastIdCache[randStr];
    }
    else {
      this.lastId++;
      id = this.lastId;
      this.lastIdCache[randStr] = id;
    }
    // console.log("BaseDatabase.createId(%s, %s, %s) XXX : ", randStr, datetimeStr, order, id);
    return id;
  };

  protected _extractIdTimestamp(id: string): number {
    let timestamp: number = 0;
    return(timestamp);
  }

  protected getServerAutoTimestamp () {
    return(Date.now());   // assume that the server timestamp is the same as on the client
  }

  protected replaceMultDiv (matchedString, operand1, operator, operand2, offset, fullString) {
    // console.log("evaluateExpr() replaceMultDiv(%s, %s, %s, %s, %s, %s)", matchedString, operand1, operator, operand2, offset, fullString);
    if (typeof(operand1) === "string") operand1 = parseFloat(operand1);
    if (typeof(operand2) === "string") operand2 = parseFloat(operand2);
    if (operator === "/") { return((operand2 !== 0) ? operand1/operand2 : 0); }
    else                  { return(operand1 * operand2); }
  }

  protected replaceAddSub (matchedString, operand1, operator, operand2, offset, fullString) {
    // console.log("evaluateExpr() replaceAddSub(%s, %s, %s, %s, %s, %s)", matchedString, operand1, operator, operand2, offset, fullString);
    if (typeof(operand1) === "string") operand1 = parseFloat(operand1);
    if (typeof(operand2) === "string") operand2 = parseFloat(operand2);
    if (operator === "-") { return(operand1 - operand2); }
    else                  { return(operand1 + operand2); }
  }

  // "{origArp}-{destArp}"
  // "{numUnread}+1"
  public evaluateExpr(expr: any, newValues: object, oldValues: object = null, resultType: string = "string", columnName: string = "") : any {
    if (typeof(expr) !== "string") { return(expr); }
    // if (expr.indexOf("{") === -1) { return(expr); }
    let value: any = expr;
    let newvalue, loopvalue, matches;

    let replaceValue = function (matchedString, colname, offset, fullString) {
      // console.log("evaluateExpr() replaceValue(%s, %s, %s, %s) colname, newValues, oldValues", matchedString, colname, offset, fullString, columnName, newValues, oldValues);
      // console.log("eval()", fullString, colname, columnName, newValues[colname], oldValues ? oldValues[colname] : null);
      return (
        colname !== columnName && newValues[colname] !== undefined
          ? newValues[colname]
          : (oldValues && oldValues[colname] !== undefined
            ? oldValues[colname]
            : undefined));
    };

    // replace all variables with their values
    value = value.replace(/\{([_a-zA-Z][_a-zA-Z0-9]*)\}/g, replaceValue);

    let len = value.length;
    if (len >= 2 && (value[0] === '"' || value[0] === "'") && value[0] === value[len-1]) {
      // value is quoted inside single or double quotes
      value = value.substr(1, len-2);
    }
    else if (matches = value.match(/^([a-z]+)\((.*)\)$/)) {
      // function call
      let funcname = matches[1];
      let condition = false;
      let args = matches[2].split(",");
      if (funcname === "if") {
        if (args.length < 2 || args > 3) { return(undefined); }
        else {
          if (matches = args[0].match(/^([^!=]*)(!=|=)([^!=]*)$/)) {
            if      (matches[2] === "="  && matches[1] === matches[3]) { condition = true; }
            else if (matches[2] === "!=" && matches[1] !== matches[3]) { condition = true; }
          }
          else { return(undefined); }
          if (condition) { return(this.evaluateExpr(args[1], newValues, oldValues, resultType, columnName)); }
          else if (args.length === 3) { return(this.evaluateExpr(args[2], newValues, oldValues, resultType, columnName)); }
          else { return(undefined); }
        }
      }
      else {
        return(undefined);
      }
    }
    else if (value.match(/[^\(\)0-9\.\*\/\+\-]/)) {  // there are no parens and no operators. we don't know what else to do.
      // value is already as good as it is going to get
    }
    else if (matches = value.match(/^(-?[0-9]+\.?[0-9]*)([\+\-])(-?[0-9]+\.?[0-9]*)$/)) {  // simple add/subtract
      value = this.replaceAddSub(value, matches[1], matches[2], matches[3], 0, value);
    }
    else {   // the more thorough method

      loopvalue = value;
      while (1) {
        while (1) {
          newvalue = value.replace(/(-?[0-9]+\.?[0-9]*)([\*\/])(-?[0-9]+\.?[0-9]*)/, this.replaceMultDiv);
          if (newvalue === value) { break; }
          else { value = newvalue; }
        }

        while (1) {
          newvalue = value.replace(/(-?[0-9]+\.?[0-9]*)([\+\-])(-?[0-9]+\.?[0-9]*)/, this.replaceAddSub);
          if (newvalue === value) { break; }
          else { value = newvalue; }
        }

        while (1) {
          newvalue = value.replace(/\((-?[0-9]+\.?[0-9]*)\)/, "$1");
          if (newvalue === value) { break; }
          else { value = newvalue; }
        }

        if (loopvalue === value) { break; }
        else { loopvalue = value; }
      }
    }

    if (resultType === "number" || resultType === "timestamp") {
      if (typeof(value) === "string") { value = parseFloat(value); }
      else if (typeof(value) !== "number") { value = 0; }   // don't know what to do with this
      if (value === NaN) { value = 0; }
    }
    else {  // assume "string"
      if (typeof(value) === "number") { value = ""+value; }
      else if (typeof(value) !== "string") { value = "("+typeof(value)+")"; }    // don't know what to do with this
    }
    // console.log("BaseDatabase.evaluateExpr("+expr+")="+value, typeof(value), newValues);
    return(value);
  }

  protected copyColumns(sourceObject: object, columns: string[], destObject: object = {}): object {
    if (columns && columns.length > 0 && sourceObject) {
      for (let columnName of columns) {
        if (sourceObject[columnName] !== undefined) {
          destObject[columnName] = sourceObject[columnName];
        }
      }
    }
    return(destObject);
  }

  // I don't know what this does
  protected removeAutoValues(tableDef: DBTableDef, oldValuesList: object[] = [{}]) {
    if (tableDef.autoValues && tableDef.value) {
      let updates = {};
      for (let oldValues of oldValuesList) {
        for (let autoValue of tableDef.autoValues) {
          if (tableDef.value[autoValue]) {
            let autoValueDef = tableDef.value[autoValue];
            let rawpath = autoValueDef.removePath || autoValueDef.path;
            let path = this.evaluateExpr(rawpath, oldValues);
            if (typeof(path) === "string" && path.substr(0,6) === "Values") {
              updates[path] = null;
            }
          }
        }
      }
      // I don't know what this does
      // if (!lodash.isEmpty(updates)) {
      //   this.afs.doc<object>("/").update(updates);
      // }
    }
  }

  public cleanDataForDB (data: any) {
    let type = typeof(data);
    //console.log("XXX cleanDataForDB() ", type, data);
    if (data === undefined) data = null;
    else if (data === null) {}
    else if (type === "string") {}
    else if (type === "number" || type === "boolean") {}
    else {
      if (Array.isArray(data)) {
        let newArray = [];
        let wasCleaned = false;
        for (let i = 0; i < data.length; i++) {
          let value = data[i];
          //console.log("XXX cleanDataForDB() ["+i+"]", typeof(value), value);
          if (value === undefined) {
            newArray[i] = null;
            wasCleaned = true;
          }
          else if (value && typeof(value) === "object") {
            newArray[i] = this.cleanDataForDB(value);
            wasCleaned = true;
          }
          else {
            newArray[i] = value;
          }
        }
        if (wasCleaned) data = newArray;
      }
      else if (type === "object") {
        let name = data.constructor.name;
        let replace = (name !== "Object" && name !== "Date");
        //console.log("XXXX name, replace", name, replace);
        let newObject = {};
        if (replace) {
          for (let key in data) {
            let value = data[key];
            //console.log("XXX cleanDataForDB() ["+key+"]", typeof(value), value);
            if (value === undefined) {
            }
            else if (value && typeof(value) === "object") {
              newObject[key] = this.cleanDataForDB(value);
            }
            else {
              newObject[key] = value;
            }
          }
          data = newObject;
        }
        else {
          let wasCleaned = false;
          for (let key in data) {
            let value = data[key];
            //console.log("XXX cleanDataForDB() ["+key+"]", typeof(value), value);
            if (value === undefined) {
              wasCleaned = true;
            }
            else if (value && typeof(value) === "object") {
              newObject[key] = this.cleanDataForDB(value);
              wasCleaned = true;
            }
            else {
              newObject[key] = value;
            }
          }
          if (wasCleaned) data = newObject;
        }
      }
    }
    return(data);
  }

  // #######################################################################3
  // THIS SHOULD BE SILENT (no console.log()).
  async storeObjects(tableName: string, columns: string[], rows: any[][], globalVals: any, options: StoreOptions) {
    // console.log("Insight360ExtractLoader.loadRows()", pathname);
    let verbose: number = options.verbose || 0;
    let showSql    = options.show_sql || 0;
    let notices    = options.notices  || [];
    let warnings   = options.warnings || [];
    let errors     = options.errors   || [];
    let tableDef   = this.getTableDef(tableName);
    let numRows    = rows.length;
    let numDataRows = 0;
    let numCols    = columns.length;
    let matches: string[];

    if (verbose >= 3) console.log("DEBUG globalVals=%j", globalVals);

    if (!errors.length) {
      try {
        if (!tableName) {
          errors.push(`${tableName}: tableName was not provided`);
        }
        else if (!tableDef) {
          warnings.push(`${tableName}: tableDef could not be determined`);
        }
        else {
          notices.push(`${tableName}: ${numRows} new data rows being compared to data already in db...`);
          // console.log("XXX updateKeys columns %j", columns);
          let updateKeys = options.updateKeys || this.getUpdateKeys(tableDef, columns);
          // console.log("XXX updateKeys %j", updateKeys);

          // the following are all indexed by r and are only filled in for data rows
          let rowDataOk: boolean[] = [];
          let rowParams: any[] = [];
          let rowValues: any[] = [];
          let rowDbValues: any[] = [];
          let rowColumns: any[] = [];

          // console.log("numCols=%s numRows=%s", numCols, numRows);
          if (numCols < 1 || numRows < 1) {
            errors.push(`${tableName}: tab is empty with no data`);
          }
          else if (!tableDef) {
            errors.push(`${tableName}: tab is not a valid tableName for loading`);
          }
          else {
            let columnDefs = tableDef.column;
            let numDefinedColumns = 0;
            let numRowsChanged = 0;
            let numRowsUnchanged = 0;
            let numRowsLoaded = 0;
            let dataChanged = options.update ? true : false;

            for (let c = 0; c < columns.length; c++) {
              let column = columns[c];
              if (column) {
                if (verbose >= 5) console.log("DEBUG check if column [%s] is defined on %s", column, tableName);
                if (columnDefs[column]) {  // } && columnDefs[column].nativeColumn) {
                  numDefinedColumns ++;
                  if (verbose >= 5) console.log("DEBUG check if column [%s] is defined on %s: yes (%s columns defined)", column, tableName, numDefinedColumns);
                }
                else {
                  if (verbose >= 3) {
                    console.log("DEBUG check if column [%s] is defined on %s: NO (%s columns not defined)", column, tableName, c + 1 - numDefinedColumns);
                    // console.log("DEBUG columnDefs", columnDefs);
                  }
                }
              }
            }

            if (verbose >= 4) console.log("DEBUG num columns [%s] : defined [%s]", columns.length, numDefinedColumns);
            if (columns.length !== numCols) {
              errors.push(`${tableName}: column names in header row don't cover the width of the spreadsheet`);
            }
            else if (!columnDefs) {
              errors.push(`${tableName}: tab is not a valid tableName for loading (no column defs)`);
            }
            else if (numDefinedColumns === 0) {
              errors.push(`${tableName}: none of the column names in the tab are not valid`);
            }
            else {
              // let numrowsRows: number = 0;
              // console.log("XXX columns row[%s]: len[%s] ncols[%s] %j", 0, columns.length, numCols, columns);
              // console.log("XXX rows", rows.length);
              for (let r = 0; r < rows.length; r++) {
                let vals = rows[r];
                // console.log("XXX vals %j", vals);
                // let isEmpty = false;
                // let isEmpty = true;
                // for (let c = 0; c < row.length; c++) {
                //   if (row[c] !== "") {
                //     isEmpty = false;
                //     break;
                //   }
                // }
                // if (isEmpty) {
                //   numBlankRows++;
                //   if (verbose >= 5) console.log("DEBUG empty row[%s]=%j", r, row);
                //   // console.log("XXX blank   row[%s]: len[%s] ncols[%s] %j", r, row.length, numCols, row);
                // }
                {
                  numDataRows++;
                  let dataOk = true;
                  let params: any = {};
                  let physCols: string[] = [];
                  let dbvals: any = {};
                  let changedVals: string = "";
                  rowDataOk[r] = dataOk;
                  rowParams[r] = params;
                  rowValues[r] = vals;
                  rowColumns[r] = physCols;

                  // if      (tableName === "AirCarrier")           { dataOk = await this.extendAirCarrierData(db, vals, physCols, globalVals, options); }
                  // else if (tableName === "AirportYear")          { dataOk = await this.extendAirportYearData(db, vals, physCols, globalVals, options); }
                  // else if (tableName === "AirportMonth")         { dataOk = await this.extendAirportMonthData(db, vals, physCols, globalVals, options); }
                  // else if (tableName === "AirportDate")          { dataOk = await this.extendAirportDateData(db, vals, physCols, globalVals, options); }
                  // else if (tableName === "AirportTerminal")      { dataOk = await this.extendAirportTerminalData(db, vals, physCols, globalVals, options); }
                  // else if (tableName === "AirportTerminalMonth") { dataOk = await this.extendAirportTerminalMonthData(db, vals, physCols, globalVals, options); }
                  // else if (tableName === "AirportTerminalDate")  { dataOk = await this.extendAirportTerminalDateData(db, vals, physCols, globalVals, options); }
                  // else if (tableName === "AirportCarrierMonth")  { dataOk = await this.extendAirportCarrierMonthData(db, vals, physCols, globalVals, options); }
                  // else if (tableName === "AirportCarrierDate")   { dataOk = await this.extendAirportCarrierDateData(db, vals, physCols, globalVals, options); }
                  // else if (tableName === "AirportCarrierMarketMonth")  { dataOk = await this.extendAirportCarrierMarketMonthData(db, vals, physCols, globalVals, options); }
                  // else if (tableName === "AirportStore")         { dataOk = await this.extendAirportStoreData(db, vals, physCols, globalVals, options); }
                  // else if (tableName === "AirportStoreLease")    { dataOk = await this.extendAirportStoreLeaseData(db, vals, physCols, globalVals, options); }
                  // else if (tableName === "AirportStoreMonth")    { dataOk = await this.extendAirportStoreMonthData(db, vals, physCols, globalVals, options); }
                  // else if (tableName === "AirportStoreDate")     { dataOk = await this.extendAirportStoreDateData(db, vals, physCols, globalVals, options); }
                  // else if (tableName === "Company")              { dataOk = await this.extendCompanyData(db, vals, physCols, globalVals, options); }

                  rowDataOk[r] = dataOk;
                  if (verbose >= 9) console.log("DEBUG row [%j] ok [%j]", r, dataOk);

                  // console.log("XXX 0 columns %j", columns);
                  for (let c = 0; c < columns.length; c++) {
                    let column = columns[c];
                    // console.log("XXX 0 physCols %j", physCols);
                    // console.log("XXX 0 column=[%s] findIndex=[%s]", column, this.findIndex(physCols, column));
                    if (columnDefs[column] && this.findIndex(physCols, column) === -1) {
                      let val = vals[column];
                      if (val !== undefined && val !== null && val !== "") {
                        physCols.push(column);
                      }
                    }
                  }
                  // console.log("XXX 0 done physCols %j", physCols);

                  if (rowDataOk[r]) {
                    for (let c = 0; c < updateKeys.length; c++) {
                      let column = updateKeys[c];
                      params[column] = vals[column];
                    }
                    // console.log("XXX table [%s] cols %j", tableName, physCols);
                    // console.log("XXX params %j", params);
                    // console.log("XXX db=[%s]", this.constructor.name);
                    dbvals = await this.getObject(tableName, params, physCols, { showSql: (showSql >= 3 ? true : false) });
                    // console.log("XXX dbvals %j", dbvals);
                    rowDbValues[r] = dbvals;
                    let rowDataChanged = false;
                    if (dbvals) {
                      for (let c = 0; c < physCols.length; c++) {
                        let column = physCols[c];
                        if (dbvals[column] !== vals[column]) {
                          let val = vals[column];
                          let dbval = dbvals[column];
                          if (typeof(val) === "number" && typeof(dbval) === "string") {
                            dbval = parseFloat(dbval);
                          }
                          else if (typeof(val) === "string" && typeof(dbval) === "number") {
                            val = parseFloat(val);
                          }
                          if (dbval !== val) {
                            changedVals += ` ${column} [${dbval}] => [${val}]`;
                            rowDataChanged = true;
                          }
                        }
                        // console.log("XXX %s (%s ==? %s) changed? %s", column, dbvals[column], vals[column], rowDataChanged);
                      }
                    }
                    else {
                      rowDataChanged = true;
                    }
                    if (verbose >= 3) {
                      if (verbose >= 5 || rowDataChanged) {
                        console.log("XXX row[%s] ok[%j] params[%j] physCols[%j]", r, rowDataOk[r], params, physCols);
                        console.log("XXX row[%s] %s    vals[%j]", r, (rowDataChanged ? "*" : " "), vals);
                        console.log("XXX row[%s]    dbvals[%j]", r, dbvals);
                        if (verbose >= 4) {
                          console.log("XXX row[%s]  changes: %s", r, changedVals || "<none>");
                        }
                      }
                    }
                    if (rowDataChanged) {
                      numRowsChanged++;
                      dataChanged = true;
                    }
                    else {
                      numRowsUnchanged++;
                    }
                    if (rowDataChanged) {
                      if (options.update) {
                        // console.log("XXX 1 physCols %j", physCols);
                        this.reduceColsToPhysical(columnDefs, physCols);
                        // console.log("XXX 2 physCols %j", physCols);
                        let ok = await this.insert(tableName, vals, physCols, { updateKeys: updateKeys, showSql: (showSql ? true : false) });
                        if (ok) numRowsLoaded++;
                      }
                      else if (showSql >= 2) {
                        this.reduceColsToPhysical(columnDefs, physCols);
                        console.log("INSERT: ", tableName, vals, physCols, { updateKeys: updateKeys });
                        // let sql = this.makeInsertSql(tableName, vals, physCols, { updateKeys: updateKeys });
                        // console.log(sql);
                      }
                    }
                  }
                }
              }
              notices.push(`${tableName}: ${numDataRows} corresponding data row(s) were found in db`);
              if (numDataRows === 0) errors.push(`${tableName}: There were no corresponding data rows found in db`);
            }
            notices.push(`${tableName}: ${numRowsUnchanged} new data row(s) contain no changes to the db`);
            notices.push(`${tableName}: ${numRowsChanged} new data row(s) contain changes that are not yet in the database`);
            if (options.update) {
              notices.push(`${tableName}: ${numRowsLoaded} new data row(s) loaded`);
            }
          }
          // console.log("XXX rowDataOk %j", rowDataOk);
        }
      }
      catch (err) {
        errors.push(err.message);
      }
    }
  }
  
  public getUpdateKeys (tableDef: DBTableDef, columns: string[]): string[] {
    // console.log("XXX getUpdateKeys() tableDef.tableName", tableDef.tableName);
    // console.log("XXX getUpdateKeys() tableDef.primaryKey", tableDef.primaryKey);
    // console.log("XXX getUpdateKeys() tableDef.uniqueIndexes", tableDef.uniqueIndexes);
    // console.log("XXX getUpdateKeys() tableDef.indexes", tableDef.indexes);
    // console.log("XXX getUpdateKeys() columns", columns);
    let updateKeys: string[];
    // if (tableDef.tableName === "AirportStoreMonth") updateKeys = [ "storeId", "month" ];
    // else if (tableDef.tableName === "AirportStore") updateKeys = [ "airport", "storeName" ];
    // else
    {
      let columnIncluded: any = {};
      let column: string;
      for (column of columns) {
        columnIncluded[column] = true;
      }
      if (tableDef.primaryKey) {
        let keyIncluded = true;
        for (column of tableDef.primaryKey) {
          if (!columnIncluded[column]) {
            keyIncluded = false;
            break;
          }
        }
        if (keyIncluded) updateKeys = tableDef.primaryKey;
      }
      if (!updateKeys && tableDef.uniqueIndexes) {
        for (let uniqueIndex of tableDef.uniqueIndexes) {
          let keyIncluded = true;
          for (column of uniqueIndex.columns) {
            if (!columnIncluded[column]) {
              keyIncluded = false;
              break;
            }
          }
          if (keyIncluded) {
            updateKeys = uniqueIndex.columns;
            break;
          }
        }
      }
    }
    return(updateKeys);
  }

  findIndex(arr: Array<string>, val: string) {
    let foundIndex = -1;
    for (let i = 0; i < arr.length; i++) {
      if (arr[i] === val) {
        foundIndex = i;
        break;
      }
    }
    return(foundIndex);
  }

  private reduceColsToPhysical(columnDefs, cols) {
    for (let i = cols.length - 1; i >= 0; i--) {
      let col = cols[i];
      if (!columnDefs[col] || !columnDefs[col].nativeColumn) {
        cols.splice(i, 1);
      }
    }
  }

  // ##################################################################

  // detect if this is a duplicate row error (for insert statements)
  public isDuplicateError(code: string, message: string): boolean {
    if (typeof(code)    === "string" && code.match(/DUP/i))    { return(true); }
    if (typeof(message) === "string" && message.match(/DUP/i)) { return(true); }
    else                                                       { return(false); }
  }

  public makeNativeExpression (dbexpr: string) {
    if (dbexpr.indexOf('{') !== -1) {
      dbexpr = dbexpr.replace(/\{([a-z][a-zA-Z0-9]*)\}\(/g, (fullMatchStr: string, val1: string) => {
        return((this.nativeFunctionSynonym[val1] || val1) + "(");
      });
      dbexpr = dbexpr.replace(/\{([a-z][a-zA-Z0-9]*)\(([^()]*)\)\}/g, (fullMatchStr: string, val1: string, val2: string) => {
        let params = val2.split(/ *, */);
        // if      (val1 === "dateToISO")     { return(this.dateToISO(val2)); }
        // else if (val1 === "datetimeToISO") { return(this.datetimeToISO(val2)); }
        return(val1+"("+val2+")");
      });
    }
    return(dbexpr);
  }

  protected foundInArray(arr: any[], value: string|number) : boolean {
    let len = arr.length;
    let found = false;
    for (let i = 0; i < len; i++) {
      if (value === arr[i]) {
        found = true;
        break;
      }
    }
    return(found);
  }

  protected stringify (value: any, indent: string = "") {
    let str: string = "";
    let type = typeof(value);
    if (value === undefined) str = "undefined";
    else if (value === null) str = "null";
    else if (type === "string") str = '"' + value + '"';
    else if (type === "number" || type === "boolean") str = "" + value;
    else {
      let moreindent = indent + "  ";
      if (Array.isArray(value)) {
        str += "[\n";
        for (let i = 0; i < value.length; i++) {
          str += moreindent + this.stringify(value[i], moreindent) + ",\n";
        }
        str += indent + "]";
      }
      else if (type === "object") {
        let name = value.constructor.name;
        str += "{ // "+name+"\n";
        for (let key in value) {
          str += moreindent + key + ": " + this.stringify(value[key], moreindent) + ",\n";
        }
        str += indent + "}";
      }
    }
    return(str);
  }

  protected objectId (index: number, obj: DBModelData) {
    return(obj.id);
  }

  protected makeLabel (columnName: string, tableName?: string, tableDef?: object) {
    let matches, columnLabel;
    if (columnName.match(/_/)) {
      columnLabel = columnName;
    }
    else if (matches = columnName.match(/([A-Z]?[a-z]*)/g)) {
      let aggregatingSingleChars = false;
      for (let i = matches.length - 1; i >= 0; i--) {
        if (matches[i] === "") {
          matches.splice(i,1);
        }
        else {
          if (matches[i].match(/^[a-z]/)) {
            matches[i] = matches[i].substr(0, 1).toUpperCase() + matches[i].substr(1);
          }
          if (matches[i].length === 1) {
            if (aggregatingSingleChars) {
              matches[i] = matches[i] + matches[i+1];
              matches.splice(i+1);
            }
            aggregatingSingleChars = true;
          }
          else {
            aggregatingSingleChars = false;
          }
        }
      }
      // console.log("XXXXXX BaseDatabase.makeLabel()", columnName, matches);
      columnLabel = matches.join(" ");
    }
    else {
      columnLabel = columnName;
    }
    return(columnLabel);
  }

  protected makeAlias (symbol, aliasUsed) {
    let alias = "", i, len, tryAlias;
    if (symbol.match(/_/)) {
      let symparts = symbol.toLowerCase().split("_");
      len = symparts.length;
      for (i = 0; i < len; i++) {
          alias += symparts[i].substr(0, 1);
      }
    }
    else if (symbol.match(/[A-Z].*[A-Z]/) && symbol.match(/[a-z]/)) {
      alias = symbol.replace(/[a-z0-9]/g,"").toLowerCase();
    }
    else {
      if (symbol.match(/^...[AEIOUaeiou]/)) {
        alias = symbol.substr(0, 3).toLowerCase();
      }
      else {
        alias = symbol.substr(0, 4).toLowerCase();
      }
    }
    if (aliasUsed) {
      if (this.reservedWord[alias] || aliasUsed[alias]) {
        i = 2;
        tryAlias = alias + i;
        while (this.reservedWord[tryAlias] || aliasUsed[tryAlias]) {
          i++;
          tryAlias = alias + i;
        }
        alias = tryAlias;
      }
      aliasUsed[alias] = 1;
    }
    else {
      if (this.reservedWord[alias]) {
        i = 2;
        tryAlias = alias + i;
        while (this.reservedWord[tryAlias]) {
          i++;
          tryAlias = alias + i;
        }
        alias = tryAlias;
      }
    }
    return(alias);
  }

  protected ucfirst (symbol: string) {
    return(symbol.charAt(0).toUpperCase() + symbol.substr(1));
  }

  protected lcfirst (symbol: string) {
    return(symbol.charAt(0).toLowerCase() + symbol.substr(1));
  }

  printTableDef (tableDef: DBTableDef) {
    console.log("{");
    console.log(`  tableName: %j,`, tableDef.tableName);
    console.log(`  tableLabel: %j,`, tableDef.tableLabel);
    console.log(`  tableAlias: %j,`, tableDef.tableAlias);
    console.log(`  columns: {`);
    if (tableDef.column) {
      for (let columnName in tableDef.column) {
        this.printColumnDef(columnName, tableDef.column[columnName]);
      }
    }
    console.log(`  },`);
    console.log(`  primaryKey: %j,`, tableDef.primaryKey);
    console.log(`  uniqueIndexes: %j,`, tableDef.uniqueIndexes);
    console.log(`  indexes: %j,`, tableDef.indexes);
    console.log("}");
  }

  private printColumnDef (columnName: string, columnDef: DBColumnDef) {
    // console.log(`    // %j`, columnDef);
    let str = "    " + this.format(columnName, 28) + "  ";
    let type = columnDef.type;
    str += this.format(type, 28) + "  ";
    console.log(str);
  }

  protected format(str: any, width: number, prec?: number, right?: boolean) {
    let type: string = typeof(str);
    if (type === "number") {
      if (prec === undefined) str = '' + str;
      else str = str.toFixed(prec);
    }
    else if (!str) str = "";
    let len = str.length;
    if (width && len < width) {
      let buf = '                                                                                                                        '.substr(0, width - len);
      str = right ? (buf + str) : (str + buf);
      len = width;
    }
    if (type !== 'number' && prec && prec < len) str = str.substr(0, prec);
    return(str);
  }

  protected initBaseDatabase () {
    this.reservedWord = {
      "a": 1, "abort": 1, "abs": 1, "absolute": 1, "access": 1, "action": 1, "ada": 1, "add": 1, "admin": 1, "after": 1,
      "agent": 1, "aggregate": 1, "alias": 1, "all": 1, "allocate": 1, "allow": 1, "also": 1, "alter": 1, "always": 1, "analyse": 1,
      "analyze": 1, "and": 1, "any": 1, "are": 1, "array": 1, "arrow": 1, "as": 1, "asc": 1, "asensitive": 1, "assertion": 1,
      "assignment": 1, "associate": 1, "asutime": 1, "asymmetric": 1, "at": 1, "atomic": 1, "attribute": 1, "attributes": 1, "audit": 1, "authid": 1,
      "authorization": 1, "auto_increment": 1, "aux": 1, "auxiliary": 1, "avg": 1, "avg_row_length": 1, "backup": 1, "backward": 1, "before": 1, "begin": 1,
      "bernoulli": 1, "between": 1, "bfile_base": 1, "bigint": 1, "binary": 1, "bit": 1, "bit_length": 1, "bitvar": 1, "blob": 1, "blob_base": 1,
      "block": 1, "body": 1, "bool": 1, "boolean": 1, "both": 1, "bound": 1, "breadth": 1, "break": 1, "browse": 1, "bufferpool": 1,
      "bulk": 1, "by": 1, "byte": 1, "c": 1, "cache": 1, "call": 1, "called": 1, "calling": 1, "capture": 1, "cardinality": 1,
      "cascade": 1, "cascaded": 1, "case": 1, "cast": 1, "catalog": 1, "catalog_name": 1, "ccsid": 1, "ceil": 1, "ceiling": 1, "chain": 1,
      "change": 1, "char": 1, "character": 1, "characteristics": 1, "character_length": 1,
      "characters": 1, "character_set_catalog": 1, "character_set_name": 1, "character_set_schema": 1, "char_base": 1,
      "char_length": 1, "charset": 1, "charsetform": 1, "charsetid": 1, "check": 1, "checked": 1, "checkpoint": 1, "checksum": 1, "class": 1, "class_origin": 1,
      "clob": 1, "clob_base": 1, "clone": 1, "close": 1, "cluster": 1, "clustered": 1, "clusters": 1, "coalesce": 1, "cobol": 1, "colauth": 1,
      "collate": 1, "collation": 1, "collation_catalog": 1, "collation_name": 1, "collation_schema": 1, "collect": 1, "collection": 1, "collid": 1,
      "column": 1, "column_name": 1, "columns": 1, "command_function": 1, "command_function_code": 1, "comment": 1, "commit": 1, "committed": 1,
      "compiled": 1, "completion": 1, "compress": 1, "compute": 1, "concat": 1, "condition": 1, "condition_number": 1, "connect": 1, "connection": 1,
      "connection_name": 1, "constant": 1, "constraint": 1, "constraint_catalog": 1, "constraint_name": 1, "constraints": 1, "constraint_schema": 1,
      "constructor": 1, "contains": 1, "containstable": 1, "content": 1, "context": 1, "continue": 1, "conversion": 1, "convert": 1,
      "copy": 1, "corr": 1, "corresponding": 1, "count": 1, "covar_pop": 1, "covar_samp": 1, "crash": 1, "create": 1, "createdb": 1, "createrole": 1,
      "createuser": 1, "cross": 1, "csv": 1, "cube": 1, "cume_dist": 1, "current": 1, "current_catalog": 1, "current_date": 1,
      "current_default_transform_group": 1, "current_lc_ctype": 1, "current_path": 1, "current_role": 1, "current_schema": 1, "current_time": 1,
      "current_timestamp": 1, "current_transform_group_for_type": 1, "current_user": 1, "cursor": 1, "cursor_name": 1, "customdatum": 1,
      "cycle": 1, "dangling": 1, "data": 1, "database": 1, "databases": 1, "date": 1, "date_base": 1, "datetime": 1, "datetime_interval_code": 1,
      "datetime_interval_precision": 1, "day": 1, "day_hour": 1, "day_microsecond": 1, "day_minute": 1, "dayofmonth": 1, "dayofweek": 1,
      "dayofyear": 1, "days": 1, "day_second": 1, "dbcc": 1, "dbinfo": 1, "deallocate": 1, "dec": 1, "decimal": 1, "declare": 1, "default": 1,
      "defaults": 1, "deferrable": 1, "deferred": 1, "define": 1, "defined": 1, "definer": 1, "degree": 1, "delayed": 1, "delay_key_write": 1,
      "delete": 1, "delimiter": 1, "delimiters": 1, "dense_rank": 1, "deny": 1, "depth": 1, "deref": 1, "derived": 1, "desc": 1, "describe": 1,
      "descriptor": 1, "destroy": 1, "destructor": 1, "deterministic": 1, "diagnostics": 1,
      "dictionary": 1, "disable": 1, "disallow": 1, "disconnect": 1, "disk": 1, "dispatch": 1, "distinct": 1, "distinctrow": 1, "distributed": 1, "div": 1,
      "do": 1, "document": 1, "domain": 1, "double": 1, "drop": 1, "dssize": 1, "dual": 1, "dummy": 1, "dump": 1, "duration": 1,
      "dynamic": 1, "dynamic_function": 1, "dynamic_function_code": 1, "each": 1, "editproc": 1, "element": 1, "else": 1, "else if": 1, "elsif": 1, "empty": 1,
      "enable": 1, "enclosed": 1, "encoding": 1, "encrypted": 1, "encryption": 1, "end": 1, "end-exec": 1, "ending": 1, "enum": 1, "equals": 1,
      "erase": 1, "errlvl": 1, "escape": 1, "escaped": 1, "every": 1, "except": 1, "exception": 1, "exceptions": 1, "exclude": 1, "excluding": 1,
      "exclusive": 1, "exec": 1, "execute": 1, "existing": 1, "exists": 1, "exit": 1, "exp": 1, "explain": 1, "external": 1, "extract": 1,
      "false": 1, "fenced": 1, "fetch": 1, "fieldproc": 1, "fields": 1, "file": 1, "fillfactor": 1, "filter": 1, "final": 1, "first": 1,
      "fixed": 1, "float": 1, "float4": 1, "float8": 1, "floor": 1, "flush": 1, "following": 1, "for": 1, "forall": 1, "force": 1,
      "foreign": 1, "form": 1, "fortran": 1, "forward": 1, "found": 1, "free": 1, "freetext": 1, "freetexttable": 1, "freeze": 1, "from": 1,
      "full": 1, "fulltext": 1, "fulltexttable": 1, "function": 1, "fusion": 1, "g": 1, "general": 1, "generated": 1, "get": 1, "global": 1,
      "go": 1, "goto": 1, "grant": 1, "granted": 1, "grants": 1, "greatest": 1, "group": 1, "grouping": 1, "handler": 1, "hash": 1,
      "having": 1, "header": 1, "heap": 1, "hidden": 1, "hierarchy": 1, "high_priority": 1, "hold": 1, "holdlock": 1, "host": 1, "hosts": 1,
      "hour": 1, "hour_microsecond": 1, "hour_minute": 1, "hours": 1, "hour_second": 1, "identified": 1, "identity": 1, "identitycol": 1, "identity_insert": 1, "if": 1,
      "ignore": 1, "ilike": 1, "immediate": 1, "immutable": 1, "implementation": 1, "implicit": 1, "in": 1, "include": 1, "including": 1, "inclusive": 1,
      "increment": 1, "index": 1, "indexes": 1, "indicator": 1, "indices": 1, "infile": 1, "infinite": 1, "infix": 1, "inherit": 1, "inherits": 1,
      "initial": 1, "initialize": 1, "initially": 1, "inner": 1, "inout": 1, "input": 1, "insensitive": 1, "insert": 1, "insert_id": 1, "instance": 1,
      "instantiable": 1, "instead": 1, "int": 1, "int1": 1, "int2": 1, "int3": 1, "int4": 1, "int8": 1, "integer": 1, "interface": 1,
      "intersect": 1, "intersection": 1, "interval": 1, "into": 1, "invalidate": 1, "invoker": 1, "is": 1, "isam": 1, "isnull": 1, "isobid": 1,
      "isolation": 1, "iterate": 1, "jar": 1, "java": 1, "join": 1, "k": 1, "keep": 1, "key": 1, "key_member": 1, "keys": 1,
      "key_type": 1, "kill": 1, "label": 1, "lancompiler": 1, "language": 1, "large": 1, "last": 1, "lastInsertId": 1, "lateral": 1, "lc_ctype": 1,
      "leading": 1, "least": 1, "leave": 1, "left": 1, "length": 1, "less": 1, "level": 1, "library": 1, "like": 1, "like2": 1,
      "like4": 1, "likec": 1, "like_regex": 1, "limit": 1, "limited": 1, "lineno": 1, "lines": 1, "listen": 1, "ln": 1, "load": 1,
      "local": 1, "locale": 1, "localtime": 1, "localtimestamp": 1, "location": 1, "locator": 1, "locators": 1, "lock": 1, "lockmax": 1, "locksize": 1,
      "login": 1, "logs": 1, "long": 1, "longblob": 1, "longtext": 1, "loop": 1, "lower": 1, "low_priority": 1, "m": 1, "maintained": 1,
      "map": 1, "match": 1, "matched": 1, "materialized": 1, "max": 1, "maxextents": 1, "maxlen": 1, "max_rows": 1, "maxvalue": 1, "mediumblob": 1,
      "mediumint": 1, "mediumtext": 1, "member": 1, "merge": 1, "message_length": 1, "message_octet_length": 1, "message_text": 1, "method": 1,
      "microsecond": 1, "microseconds": 1, "middleint": 1, "min": 1, "min_rows": 1, "minus": 1, "minute": 1, "minute_microsecond": 1, "minutes": 1,
      "minute_second": 1, "minvalue": 1, "mlslabel": 1, "mod": 1, "mode": 1, "modifies": 1, "modify": 1, "module": 1, "month": 1, "monthname": 1, "months": 1,
      "more": 1, "move": 1, "multiset": 1, "mumps": 1, "myisam": 1, "name": 1, "names": 1, "nan": 1, "national": 1, "native": 1, "natural": 1, "nchar": 1,
      "nclob": 1, "nesting": 1, "new": 1, "next": 1, "nextval": 1, "no": 1, "noaudit": 1, "nocheck": 1, "nocompress": 1, "nocopy": 1, "nocreatedb": 1,
      "nocreaterole": 1, "nocreateuser": 1, "noinherit": 1, "nologin": 1, "nonclustered": 1, "none": 1, "normalize": 1, "normalized": 1, "nosuperuser": 1,
      "not": 1, "nothing": 1, "notify": 1, "notnull": 1, "nowait": 1, "no_write_to_binlog": 1, "null": 1, "nullable": 1, "nullif": 1, "nulls": 1,
      "number": 1, "number_base": 1, "numeric": 1, "numparts": 1, "obid": 1, "object": 1, "occurrences_regex": 1, "ocicoll": 1, "ocidate": 1, "ocidatetime": 1,
      "ociduration": 1, "ociinterval": 1, "ociloblocator": 1, "ocinumber": 1, "ociraw": 1, "ociref": 1, "ocirefcursor": 1, "ocirowid": 1, "ocistring": 1, "ocitype": 1,
      "octet_length": 1, "octets": 1, "of": 1, "off": 1, "offline": 1, "offset": 1, "offsets": 1, "oids": 1, "old": 1, "on": 1,
      "online": 1, "only": 1, "opaque": 1, "open": 1, "opendatasource": 1, "openquery": 1, "openrowset": 1, "openxml": 1, "operation": 1, "operator": 1,
      "optimization": 1, "optimize": 1, "option": 1, "optionally": 1, "options": 1, "or": 1, "oracle": 1, "oradata": 1, "order": 1, "ordering": 1,
      "ordinality": 1, "organization": 1, "orlany": 1, "orlvary": 1, "others": 1, "out": 1, "outer": 1, "outfile": 1, "output": 1, "over": 1,
      "overlaps": 1, "overlay": 1, "overriding": 1, "owner": 1, "package": 1, "pack_keys": 1, "pad": 1, "padded": 1, "parallel_enable": 1, "parameter": 1,
      "parameter_mode": 1, "parameter_name": 1, "parameter_ordinal_position": 1, "parameters": 1, "parameter_specific_catalog": 1,
      "parameter_specific_name": 1, "parameter_specific_schema": 1, "part": 1, "partial": 1, "partition": 1, "partitioned": 1, "partitioning": 1,
      "pascal": 1, "password": 1, "path": 1, "pctfree": 1, "percent": 1, "percentile_cont": 1, "percentile_disc": 1, "percent_rank": 1,
      "period": 1, "piecesize": 1, "pipe": 1, "pipelined": 1, "pivot": 1, "placing": 1, "plan": 1, "pli": 1, "position": 1, "position_regex": 1,
      "postfix": 1, "power": 1, "pragma": 1, "preceding": 1, "precision": 1, "prefix": 1, "preorder": 1, "prepare": 1, "prepared": 1, "preserve": 1,
      "prevval": 1, "primary": 1, "print": 1, "prior": 1, "priqty": 1, "protected": 1, "privileges": 1, "proc": 1, "procedural": 1, "procedure": 1,
      "process": 1, "processlist": 1, "program": 1, "psid": 1, "public": 1, "purge": 1, "query": 1, "queryno": 1, "quote": 1, "raid0": 1,
      "raise": 1, "raiserror": 1, "range": 1, "rank": 1, "raw": 1, "read": 1, "reads": 1, "readtext": 1, "real": 1, "recheck": 1,
      "reconfigure": 1, "record": 1, "recursive": 1, "ref": 1, "reference": 1, "references": 1, "referencing": 1, "refresh": 1, "regexp": 1, "regr_avgx": 1,
      "regr_avgy": 1, "regr_count": 1, "regr_intercept": 1, "regr_r2": 1, "regr_slope": 1, "regr_sxx": 1, "regr_sxy": 1, "regr_syy": 1, "reindex": 1, "relative": 1,
      "release": 1, "reload": 1, "rem": 1, "remainder": 1, "rename": 1, "repeat": 1, "repeatable": 1, "replace": 1, "replication": 1, "require": 1, "reset": 1,
      "resignal": 1, "resource": 1, "restart": 1, "restore": 1, "restrict": 1, "result": 1, "result_set_locator": 1, "return": 1, "returned_cardinality": 1,
      "returned_length": 1, "returned_octet_length": 1, "returned_sqlstate": 1, "returning": 1, "returns": 1, "reverse": 1, "revert": 1, "revoke": 1, "right": 1,
      "rlike": 1, "role": 1, "rollback": 1, "rollup": 1, "round_ceiling": 1, "round_down": 1, "round_floor": 1, "round_half_down": 1, "round_half_even": 1,
      "round_half_up": 1, "round_up": 1, "routine": 1, "routine_catalog": 1, "routine_name": 1, "routine_schema": 1, "row": 1, "rowcount": 1, "row_count": 1,
      "rowguidcol": 1, "rowid": 1, "rownum": 1, "row_number": 1, "rows": 1, "rowset": 1, "rule": 1, "run": 1, "sample": 1, "save": 1, "savepoint": 1, "sb1": 1, "sb2": 1,
      "sb4": 1, "scale": 1, "schema": 1, "schema_name": 1, "schemas": 1, "scope": 1, "scope_catalog": 1, "scope_name": 1, "scope_schema": 1, "scratchpad": 1,
      "scroll": 1, "search": 1, "second": 1, "second_microsecond": 1, "seconds": 1, "secqty": 1, "section": 1, "security": 1, "securityaudit": 1, "segment": 1,
      "select": 1, "self": 1, "semantickeyphrasetable": 1, "semanticsimilaritydetailstable": 1, "semanticsimilaritytable": 1,
      "sensitive": 1, "separate": 1, "separator": 1, "sequence": 1, "serializable": 1,
      "server_name": 1, "session": 1, "session_user": 1, "set": 1, "setof": 1, "sets": 1, "setuser": 1, "share": 1, "short": 1, "show": 1,
      "shutdown": 1, "signal": 1, "similar": 1, "simple": 1, "size": 1, "size_t": 1, "smallint": 1, "some": 1, "soname": 1, "source": 1, "space": 1, "sparse": 1,
      "spatial": 1, "specific": 1, "specific_name": 1, "specifictype": 1, "sql": 1, "sql_big_result": 1, "sql_big_selects": 1, "sql_big_tables": 1,
      "sqlca": 1, "sql_calc_found_rows": 1, "sqlcode": 1, "sqldata": 1, "sqlerror": 1, "sqlexception": 1, "sql_log_off": 1, "sql_log_update": 1,
      "sql_low_priority_updates": 1, "sqlname": 1, "sql_select_limit": 1, "sql_small_result": 1, "sqlstate": 1, "sqlwarning": 1, "sql_warnings": 1, "sqrt": 1,
      "ssl": 1, "stable": 1, "standard": 1, "start": 1,
      "starting": 1, "state": 1, "statement": 1, "static": 1, "statistics": 1, "status": 1, "stay": 1, "stddev": 1, "stddev_pop": 1, "stddev_samp": 1,
      "stdin": 1, "stdout": 1, "stogroup": 1, "storage": 1, "stored": 1, "stores": 1, "straight_join": 1, "strict": 1, "string": 1, "struct": 1, "structure": 1,
      "style": 1, "subclass_origin": 1, "sublist": 1, "submultiset": 1, "subpartition": 1, "substitutable": 1, "substring": 1, "substring_regex": 1, "subtype": 1,
      "successful": 1, "sum": 1, "summary": 1, "superuser": 1, "symmetric": 1, "synonym": 1, "sysdate": 1, "sysdate1sysfun": 1, "sysibm": 1, "sysid": 1,
      "sysproc": 1, "system": 1, "system_user": 1, "systimestamp": 1, "tabauth": 1, "tableName": 1, "table_name": 1, "tables": 1, "tablesample": 1, "tablespace": 1,
      "tdo": 1, "temp": 1, "template": 1, "temporary": 1, "terminate": 1, "terminated": 1, "text": 1, "textsize": 1, "than": 1, "the": 1,
      "then": 1, "ties": 1, "time": 1, "timestamp": 1, "timezone_abbr": 1, "timezone_hour": 1, "timezone_minute": 1, "timezone_region": 1, "tinyblob": 1, "tinyint": 1,
      "tinytext": 1, "to": 1, "toast": 1, "top": 1, "top_level_count": 1, "trailing": 1, "tran": 1, "transac": 1, "transaction": 1, "transaction_active": 1,
      "transactional": 1, "transactions_committed": 1, "transactions_rolled_back": 1, "transform": 1, "transforms": 1,
      "translate": 1, "translate_regex": 1, "translation": 1, "treat": 1, "trigger": 1,
      "trigger_catalog": 1, "trigger_name": 1, "trigger_schema": 1, "trim": 1, "true": 1,
      "truncate": 1, "trusted": 1, "try_convert": 1, "tsequal": 1, "type": 1, "ub1": 1, "ub2": 1, "ub4": 1, "uescape": 1, "uid": 1, "unbounded": 1,
      "uncommitted": 1, "under": 1, "undo": 1, "unencrypted": 1, "union": 1, "unique": 1, "unknown": 1, "unlisten": 1, "unlock": 1, "unnamed": 1,
      "unnest": 1, "unpivot": 1, "unsigned": 1, "until": 1, "untrusted": 1, "update": 1, "updatetext": 1, "upper": 1, "usage": 1, "use": 1, "user": 1,
      "user_defined_type_catalog": 1, "user_defined_type_code": 1, "user_defined_type_name": 1, "user_defined_type_schema": 1, "using": 1, "utc_date": 1,
      "utc_time": 1, "utc_timestamp": 1, "vacuum": 1, "valid": 1, "validate": 1, "validator": 1, "validproc": 1,
      "valist": 1, "value": 1, "values": 1, "varbinary": 1, "varchar": 1, "varchar2": 1, "varcharacter": 1, "variable": 1, "variables": 1, "variance": 1,
      "variant": 1, "var_pop": 1, "varray": 1, "var_samp": 1, "varying": 1, "vcat": 1, "verbose": 1, "view": 1, "views": 1, "void": 1,
      "volatile": 1, "volumes": 1, "waitfor": 1, "when": 1, "whenever": 1, "where": 1, "while": 1, "width_bucket": 1, "window": 1, "with": 1,
      "within": 1, "without": 1, "wlm": 1, "work": 1, "wrapped": 1, "write": 1, "writetext": 1, "x509": 1, "xmlagg": 1, "xmlattributes": 1, "xmlbinary": 1,
      "xmlcast": 1, "xmlcomment": 1, "xmlconcat": 1, "xmldocument": 1, "xmlelement": 1, "xmlexists": 1, "xmlforest": 1, "xmliterate": 1, "xmlnamespaces": 1,
      "xmlparse": 1, "xmlpi": 1, "xmlquery": 1, "xmlserialize": 1, "xmltable": 1, "xmltext": 1, "xmlvalidate": 1, "xor": 1, "year": 1, "year_month": 1,
      "years": 1, "zerofill": 1, "zone": 1, "zoneadd": 1
    };
  }
}
