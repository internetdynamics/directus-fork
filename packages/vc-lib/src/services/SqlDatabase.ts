
import * as lodash from 'lodash';

import { Config } from './Config';
import { BaseDatabase } from './BaseDatabase';
import { DBModelData, DataOptions, DBTableDef, DBColumnDefs, DBColumnDef, DBRelationshipDef, DBMergeQueryDef, DBQueryFlags, DataParamOps }
from '../classes/DBInterfaces';
// import { TestUtils } from '../classes/TestUtils';
// let testUtils = new TestUtils();

export interface DBColumnDdlOptions extends Object {
  primaryKeyDefinedInColumn?: boolean;
}

export class SqlDatabase extends BaseDatabase {

  protected schemaName: string = "";

  init (config: Config) {
    this.config = config;
    this.initBaseDatabase();
    this.initSqlDatabase();
    // this.debug = true;
  }

  protected initTableDef (tableDef: DBTableDef) {
    console.log("SqlDatabase.initTableDef(%s)", tableDef.tableName);
    if (tableDef.column) {
      for (let column in tableDef.column) {
        let columnDef: DBColumnDef = tableDef.column[column];
        if (columnDef.type === "id" && column === "id") {
          // isAggregateKey?: boolean;
          // columnModifier?: string;
          // aggDbexpr?: string;
          // nativeColumnType?: string;
          // orderIdx?: number;
          // defaultValue?: any;
          // notNullInd?: string;        // [Y,N]
          // maxLength?: number;
          // primaryKeyInd?: string;     // [Y,N]
          // physicalInd?: string;       // [Y,N]
          // autoIncrementInd?: string;  // [Y,N]
          columnDef.autoIncrementInd = "Y";
          columnDef.notNullInd = "Y";
          columnDef.primaryKeyInd = "Y";
          if (!tableDef.primaryKey || tableDef.primaryKey.length === 0) {
            tableDef.primaryKey = [ "id" ];
          }
          console.log("SqlDatabase.initTableDef(%s) primaryKey", tableDef.tableName, tableDef.primaryKey);
        }
      }
    }
  }

  public setSchemaName (schemaName: string) {
    this.schemaName = schemaName;
  }

  public getTableDef(tableName: string): DBTableDef {
    // let testToken = testUtils.methodEntry("SqlDatabase", "getTableDef", arguments);
    // console.log("SqlDatabase.getTableDef(%s)", tableName, this.tableDefs);
    // if (!this.tableDefs[tableName]) { throw new Error("SqlDatabase.getTableDef(): "+tableName+" tableName not defined"); }
    if (!this.tableDefs[tableName]) {
      // console.log("ERROR: SqlDatabase.getTableDef(): "+tableName+" tableName not defined");
      return(null);
    }
    else {
      let tableDef = this.tableDefs[tableName];
      if (!tableDef.extended) {
        this.extendTableDef(tableDef, tableName);
        // testUtils.methodExit(testToken, tableDef);
      }
      return(tableDef);
    }
  }

  protected extendTableDef2 (tableDef: DBTableDef, tableName: string) {
    // console.log("SqlDatabase.extendTableDef2(%s)", tableName);
    let columnDefs: DBColumnDefs = tableDef.column;
    let matches: string[];
    for (let column in columnDefs) {
      let columnDef = columnDefs[column];
      if (!columnDef.name) {
        columnDef.name = column;
      }
      if (!columnDef.dbexpr && columnDef.nativeColumn) {
        columnDef.dbexpr = tableDef.tableAlias + "." + columnDef.nativeColumn;
      }
      this.extendColumnDef(tableDef, columnDef);
    }
    if (! columnDefs.count) {
      columnDefs.count = {
        name: "count",
        type: "integer",
        label: "Count",
        dbexpr: "1",
        aggDbexpr: "count(*)"
      }
    }
    if (tableDef.relationship) {
      for (let relName in tableDef.relationship) {
        let rel: DBRelationshipDef = tableDef.relationship[relName];
        if (!rel.tableName) { rel.tableName = relName; };
        if (!rel.relationshipAlias && rel.tableName !== relName) { rel.relationshipAlias = relName; };
        let relTableDef = this.getTableDef(rel.tableName);
        if (relTableDef) {
          // console.log("SqlDatabase.extendTableDef2(%s) relationship", tableName, relName);
          let relColumnDefs = relTableDef.column;
          if (! rel.fullTableName) {
            rel.fullTableName = (relTableDef.schemaName || this.schemaName) + "." + (relTableDef.nativeTableName || relTableDef.tableName);
          }
          if (! rel.relationshipAlias) {
            rel.relationshipAlias = relTableDef.tableAlias;
          }
          if (! rel.joinOnClause) {
            let nativeIdColumn = columnDefs.id.nativeColumn || "id";
            if (rel.reltype === "toOne") {
              let nativeColumn = tableDef.column[rel.joinFromColumn].nativeColumn || rel.joinFromColumn;
              rel.joinOnClause = rel.relationshipAlias + "." + nativeIdColumn + " = "+ tableDef.tableAlias + "." + nativeColumn;
            }
            else if (rel.reltype === "toMany") {
              rel.joinOnClause = rel.relationshipAlias + "." + rel.joinToColumn + " = " + tableDef.tableAlias + "." + nativeIdColumn;
            }
          }
          if (rel.columns) {
            for (let column of rel.columns) {
              let newColumn = rel.columnPrefix ? (rel.columnPrefix + this.ucfirst(column)) : column;
              if (!columnDefs[newColumn] && relColumnDefs[column]) {
                let columnDef: DBColumnDef = lodash.clone(relColumnDefs[column]);
                delete columnDef.nativeColumn;
                delete columnDef.nativeColumnType;
                delete columnDef.physicalInd;
                columnDef.name = newColumn;
                columnDef.relationshipName = relName;
                // console.log("columnDefs[%s:%s] BEFORE extend", column, newColumn, columnDef);
                this.extendColumnDef(tableDef, columnDef, relTableDef);
                columnDefs[newColumn] = columnDef;
                // console.log("columnDefs[%s:%s] AFTER extend", column, newColumn, columnDef);
              }
            }
          }
        }
      }
    }
    if (tableDef.mergeQuery) {
      for (let mergeQueryName in tableDef.mergeQuery) {
        let mergeQueryDef: DBMergeQueryDef = tableDef.mergeQuery[mergeQueryName];
        if (!mergeQueryDef.joinColumns) {
          mergeQueryDef.joinColumns = {};
        }
        if (!mergeQueryDef.tableName) { mergeQueryDef.tableName = mergeQueryName; };
        let joinedTableDef = this.getTableDef(mergeQueryDef.tableName);
        if (joinedTableDef) {
          // console.log("SqlDatabase.extendTableDef2(%s) mergeQuery", tableName, mergeQueryName);
          let remoteColumnDefs = joinedTableDef.column || {};
          let columns = mergeQueryDef.columns;
          if (columns) {
            for (let column in columns) {
              let remoteColumn = columns[column];
              if (!columnDefs[column] && remoteColumn && remoteColumnDefs[remoteColumn]) {
                let remoteColumnDef = remoteColumnDefs[remoteColumn];
                columnDefs[column] = {
                  name: column,
                  type: remoteColumnDef.type,
                  label: remoteColumnDef.label,
                  mergeQueryName: mergeQueryName
                };
              }
            }
          }
        }
      }
    }
    // if (tableName === "TAFPurchaseTransaction") {
    //   console.log("XXX SqlDatabase.extendTableDef2", tableDef);
    // }
  }

  private extendColumnDef(tableDef: DBTableDef, columnDef: DBColumnDef = {}, relTableDef?: DBTableDef) {
    let matches: string[];
    let column: string = columnDef.name;
    let columnDefs: DBColumnDefs = tableDef.column;
    let relationship = tableDef.relationship || {};
    // console.log("XXX extendColumnDef(%s.%s) dbexpr", tableDef.tableName, columnDef.name, columnDef.dbexpr);
    // if (column === "householdIncomeSortOrder") {
    //   console.log("XXX extendColumnDef(%s.%s) columnDef", tableDef.tableName, column, columnDef);
    // }
    if (columnDef.nativeColumn) {
      columnDef.physicalInd = "Y";
    }
    if (columnDef.isAggregateKey === undefined) {
      let type = columnDef.type;
      if (type === "integer" && column.match(/[Ii]d$/)) {
        columnDef.isAggregateKey = true;
      }
      else if (type === "number" || type === "integer" || type === "float") {
        columnDef.isAggregateKey = false;
      }
      else {
        columnDef.isAggregateKey = true;
      }
      if (type === "date" || type === "datetime") {
        let columnStem: string, dateSuffix: string, labelStem: string;
        let monthColumn: string, quarterColumn: string, yearColumn: string;
        let monthLabel: string, quarterLabel: string, yearLabel: string;
        if (column === "date") {
          columnStem = "";
          dateSuffix = "date";
          labelStem = "";
          monthColumn = "month"; quarterColumn = "quarter"; yearColumn = "year";
          monthLabel = "Month"; quarterLabel = "Quarter"; yearLabel = "Year";
        }
        else if (matches = column.match(/^(.*)(Dt|Date|Dttm|Datetime)$/)) {
          columnStem = matches[1];
          dateSuffix = matches[2];
          labelStem = columnDef.label.replace(" "+dateSuffix,"");
          monthColumn = columnStem+"Month"; quarterColumn = columnStem+"Quarter"; yearColumn = columnStem+"Year";
          monthLabel = labelStem+" Month"; quarterLabel = labelStem+" Quarter"; yearLabel = labelStem+" Year";
        }
        if (dateSuffix) {
          if (!columnDefs[monthColumn]) {
            columnDefs[monthColumn] = {
              type: "string",
              label: monthLabel,
              dbexpr: "date_format("+columnDef.dbexpr+",'%Y-%m')",
              isAggregateKey: true
            };
          }
          if (!columnDefs[quarterColumn]) {
            columnDefs[quarterColumn] = {
              type: "string",
              label: quarterLabel,
              dbexpr: "concat(year("+columnDef.dbexpr+"),'-Q',quarter("+columnDef.dbexpr+"))",
              isAggregateKey: true
            };
          }
          if (!columnDefs[yearColumn]) {
            columnDefs[yearColumn] = {
              type: "string",
              label: yearLabel,
              dbexpr: "date_format("+columnDef.dbexpr+",'%Y')",
              isAggregateKey: true
            };
          }
        }
      }
    }
    if (columnDef.relationshipName) {
      let relName = columnDef.relationshipName;
      let relTableName = "";
      let relTableAlias = "";
      let relTableAliasPrefix = "";
      if (relationship[relName]) {
        relTableName = relationship[relName].tableName || "";
      }
      if (relName !== relTableName) {
        relTableAlias = relName;
        relTableAliasPrefix = relTableAlias + ".";
      }

      if (!columnDef.dbexpr) {
        // console.log("XXXA1 extendColumnDef(%s.%s) tableDef columnDef", tableDef.tableName, columnDef.name); //, tableDef, columnDef);
        if (columnDef.nativeColumn) {
          columnDef.dbexpr = relTableAliasPrefix + columnDef.nativeColumn;
          // console.log("XXXA extendColumnDef(%s.%s) tableDef columnDef", tableDef.tableName, columnDef.name); //, tableDef, columnDef);
        }
      }
      else {
        // if (columnDef.name === "householdIncomeSortOrder") {
        //   console.log("XXX %s.%s closer...", tableDef.tableName, columnDef.name);
        //   if (relTableDef) {
        //     console.log("XXX tableDef.tableName [%s] relTableDef.tableName [%s]", tableDef.tableName, relTableDef.tableName);
        //     console.log("XXX tableDef.tableAlias [%s] relTableDef.tableAlias [%s]", tableDef.tableAlias, relTableDef.tableAlias);
        //     console.log("XXX relTableAliasPrefix", relTableAliasPrefix);
        //   }
        // }
        if (columnDef.nativeColumn && !columnDef.dbexpr && relTableAliasPrefix) {
          columnDef.dbexpr = relTableAliasPrefix + columnDef.nativeColumn;
          // console.log("XXXB extendColumnDef(%s.%s) tableDef columnDef", tableDef.tableName, columnDef.name, columnDef.dbexpr); //, tableDef, columnDef);
        }
        if (relTableAlias && relTableDef && relTableDef.tableAlias && relTableAlias !== relTableDef.tableAlias) {
          let relNativeTableAliasPattern = "\\b" + relTableDef.tableAlias + "\\.";
          let relNativeTableAliasRegex = new RegExp(relNativeTableAliasPattern);
          // console.log("XXXC relNativeTableAliasPattern", relNativeTableAliasPattern);
          // console.log("XXXC relNativeTableAliasRegex", relNativeTableAliasRegex);
          // console.log("XXXC extendColumnDef(%s.%s) tableDef columnDef", tableDef.tableName, columnDef.name, columnDef.dbexpr); //, tableDef, columnDef);
          // console.log("XXXC columnDef.dbexpr.replace(relNativeTableAliasRegex, relTableAliasPrefix);", columnDef.dbexpr, relNativeTableAliasPattern, relTableAliasPrefix);
          columnDef.dbexpr = columnDef.dbexpr.replace(relNativeTableAliasRegex, relTableAliasPrefix);
          // console.log("XXXC extendColumnDef(%s.%s) tableDef columnDef AFTER", tableDef.tableName, columnDef.name, columnDef.dbexpr); //, tableDef, columnDef);
        }
      }
    }
    if (!columnDef.isAggregateKey && !columnDef.aggDbexpr && columnDef.dbexpr) {
      columnDef.aggDbexpr = "sum(" + columnDef.dbexpr + ")";
    }
    // console.log("SqlDatabase.extendColumnDef(%s)", tableDef.tableName, columnDef);
    // if (column === "householdIncomeSortOrder") {
    //   console.log("XXX2 extendColumnDef(%s.%s) columnDef", tableDef.tableName, column, columnDef);
    // }
    // console.log("XXX2 extendColumnDef(%s.%s) dbexpr", tableDef.tableName, columnDef.name, columnDef.dbexpr);
  }

  public async executeSql(sql: string, options?: DataOptions) : Promise<object> {
    if (sql) throw new Error("SqlDatabase.executeSql() must be implemented in a subclass");
    return({});
  }

  // when executing a single insert statement, return "insertId"
  public async executeInsertSql(sql: string) : Promise<number> {
    if (sql) throw new Error("SqlDatabase.executeInsertSql() must be implemented in a subclass");
    return(0);
  }

  // when executing an arbitrary DML (data manipulation language, aka insert, update, or delete), return "affectedRows"
  public async executeDml(sql: string, options: DataOptions = {}) : Promise<number> {
    if (sql) throw new Error("SqlDatabase.executeDml() must be implemented in a subclass");
    return(0);
  }

  public async insert(
    tableName: string,
    model: DBModelData,
    columns?: string[],
    options: DataOptions = {}
  ) : Promise<any> {
    // console.log("SqlDatabase.insert(%s)", tableName, model, columns, options);
    let sql = this.makeInsertSql(tableName, model, columns, options);
    // console.log("SqlDatabase.insert(%s) sql", sql);
    let id = await this.executeInsertSql(sql);
    // console.log("SqlDatabase.insert(%s) id", tableName, id);
    model.id = id;
    if (options.sql) options.sql.push(sql);
    return(id);
  }

  public async insertObjects(
    tableName: string,
    models: DBModelData[],
    columns?: string[],
    options: DataOptions = {}
  ) : Promise<object> {
    let offset: number = options.offset || 0;
    let maxOffset: number = options.limit ? (offset + options.limit) : models.length;
    // console.log("SqlDatabase.insertObjects()", tableName, models.length, columns, options, offset, maxOffset);
    let nrows = 0;
    for (let r = offset; r < maxOffset; r++) {
      await this.insert(tableName, models[r], columns, options);
      nrows++;
    }
    return({ nrows: nrows });
  }

  public async updateObjects(
    tableName: string,
    models: DBModelData[],
    columns?: string[],
    options: DataOptions = {}
  ) : Promise<object> {
    return(this.insertObjects(tableName, models, columns, options));
  }

  /**
   * Usage:
   *  id: string = "irsV8CoTchfbHdhK5SkjH6xkuM62";
   *  params: object = { stateCode: "GA" };
   *  values: object = {
   *    displayName: "Joe Cool",
   *    birthDate: "1960-01-01"
   *  };
   *  let nrows = await this.dataService.update("AppUser", id, values);
   *  let nrows = await this.dataService.update("AppUser", params, values);
   */
  public async update(
    tableName: string,
    params?: object|string|number,
    values?: object,
    columns?: string[],
    options: DataOptions = {}
  ) : Promise<number> {

    let sql = this.makeUpdateSql(tableName, params, values, columns, options);
    // if (!sql) console.log("SqlDatabase.update(%s)", tableName, params, values, columns);
    // console.log("SqlDatabase.update() => sql", sql);
    if (options.sql) options.sql.push(sql);
    let nrows = await this.executeDml(sql, options);
    return(nrows);
  }

  /**
   * Usage:
   *  id: string = "irsV8CoTchfbHdhK5SkjH6xkuM62";
   *  params: object = { stateCode: "GA" };
   *  values: object = {
   *    displayName: "Joe Cool",
   *    birthDate: "1960-01-01"
   *  };
   *  let nrows = await this.dataService.update("AppUser", id, values);
   *  let nrows = await this.dataService.update("AppUser", params, values);
   */
  public async delete(
    tableName: string,
    params?: object|string|number,
    options: DataOptions = {}
  ) : Promise<number> {
    // console.log("SqlDatabase.delete(%s)", tableName, params, options);
    let sql = this.makeDeleteSql(tableName, params, options);
    if (options.sql) options.sql.push(sql);
    let nrows = await this.executeDml(sql, options);
    return(nrows);
  }

  public makeSelectSql (
    tableName: string,
    params?: object|string|number,
    columns?: string[],
    options: DataOptions = {},
    flags: DBQueryFlags = {},
    bindValues?: string[]
  ) : string {
    // console.log("SqlDatabase.makeSelectSql(%s, %j, %j, %j, %j, %j", tableName, params, columns, options, flags, bindValues);
    // let testToken = testUtils.methodEntry("SqlDatabase", "makeSelectSql", arguments);
    if (this.debug) console.log("ENTER: SqlDatabase.makeSelectSql(): ",arguments);
    //  if (tableName !== undefined) throw new Error("SqlDatabase.makeSelectSql(): tableName must be supplied\n");
    //  if (params !== undefined) throw new Error("SqlDatabase.makeSelectSql(): params must be supplied\n");

    flags.needsMoreFiltering = false;
    flags.needsMoreSorting = false;
    flags.needsMoreWindowing = false;

    let bind = bindValues;

    let tableDef: DBTableDef;
    let schemaName : string;
    let nativeTableName: string;
    let sqlTable : string;
    let matches = tableName.match(/^([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)$/);
    if (matches) {
      schemaName  = matches[1];
      tableName   = matches[2];
      tableDef    = this.getTableDef(tableName);
    }
    else {
      tableDef    = this.getTableDef(tableName);
      if (options.schemaName !== undefined) schemaName = options.schemaName
      else if (options.domainTableDefs && options.domainTableDefs[tableName]) schemaName = options.domainTableDefs[tableName].schemaName;
      else if (tableDef && tableDef.schemaName !== undefined) schemaName = tableDef.schemaName;
      else if (this.schemaName) schemaName = this.schemaName;
    }
    nativeTableName = (tableDef && tableDef.nativeTableName) ? tableDef.nativeTableName : tableName;
    sqlTable = schemaName ? schemaName+".`"+nativeTableName+"`" : nativeTableName;
    // console.log("XXX SqlDatabase.makeSelectSql() schemaName.nativeTableName=%s.%s", schemaName, nativeTableName);

    if (! columns || columns.length === 0) {
      if (tableDef) {
        if (tableDef.defaultColumns) {
          columns = tableDef.defaultColumns;
        }
        else if (tableDef.physColumns) {
          columns = tableDef.physColumns;
        }
        else {
          columns = [ "*" ];
        }
      }
      else {
        columns = [ "*" ];
      }
    }

    let extended  = (!tableDef || (options && options.extended === false)) ? false : true;
    let aggregate =  (options && options.aggregate && tableDef) ? true : false;
    // console.log("XXX make_select_sql(tableName=[tableName], params, columns=[" + columns.join(",") + "], aggregate=aggregate");
    if (! params) params = {};

    let whereClause: string, sql: string;
    if (!extended) {
      if (!columns || columns.length === 0) {

      }
      whereClause = '';
      whereClause = this.makeWhereClause(tableName, params, false, flags, bindValues);
      sql = "select" + (options.distinct ? " distinct" : "") + "\n   " +
            this.makeSimpleColumnList(tableName, columns, tableDef, { newline: true }) +
            "\nfrom " + sqlTable + " " + tableDef.tableAlias +
            whereClause +
            this.makeOrderByClause(tableName, options) +
            this.makeLimitClause(tableName, options);
    }
    else {
      // let tableDef   = this.getTableDef(tableName, schemaName, options);   // get a reference
      let tableAlias = tableDef.tableAlias;

      let columnDefs = tableDef.column;

      let selectColumnExprs   = [];
      let selectDbexprs       = [];
      let groupColumnExprs    = [];
      let selectColumnsMissed = [];
      let relUsed             = {};

      let c: number, column: string, modifier: string, parentColumn: string, columnDef: DBColumnDef, matches: string[];
      let relationshipName: string, schemaName: string;
      for (c = 0; c < columns.length; c++) {
        column = columns[c];
        // console.log("SqlDatabase.makeSelectSql() First Pass: column=[%s]", column);

        modifier = null;
        parentColumn = null;
        if (matches = column.match(/^(.*)__([0-9]*[a-z]+)$/)) {
          parentColumn = matches[1];
          modifier     = matches[2];
        }

        columnDef = columnDefs[column];
        if (columnDef) {                   // it is a known column
          //if (modifier) columnDef.columnModifier = modifier;
          // console.log(`column=[${column}] found columnDef`);
          this.makeSelectColumn(tableDef, c, column, columnDef, selectColumnExprs, selectDbexprs, groupColumnExprs, aggregate);
          // console.log("XXX makeSelectColumn()", column, selectColumnExprs, selectDbexprs, groupColumnExprs);
          if (columnDef.relationshipName) {
            relationshipName  = columnDef.relationshipName;
            schemaName        = tableDef.schemaName;
            relUsed[relationshipName] = schemaName || "Y";
          }
        }
        else if (matches = column.match(/^(.*) +as +([A-Za-z_][A-Za-z0-9_]*) *$/)) {   // it looks like an expression with an alias
          selectColumnExprs[c]    = column;
          selectDbexprs[c]        = matches[1];
          // console.log("column=[column] column was a dbexpr with 'as columnName' portion\n");
          column                  = matches[2];
        }
        else if (column.match(/^[A-Za-z_][A-Za-z0-9_]*$/)) {  // it looks like a regular column... (we'd better check the columns of all related tables)
          selectColumnExprs[c]  = "NULL as `"+column+"`";     // don't jump to this conclusion yet. we need to check the "extra column defs" (from relationships)
          selectDbexprs[c]      = 'NULL';                     // don't jump to this conclusion yet. we need to check the "extra column defs" (from relationships)
          // selectColumnExprs[c]    = null;
          // selectDbexprs[c]        = null;
          selectColumnsMissed.push(column);
          console.log(`ERROR: column [${column}] was a column on table [${tableName}] without any columnDef\n`);
        }
        else {
          console.log(`ERROR: SqlDatabase.makeSelectSql() column [${column}] not defined on table [${tableName}]`);                                                       // it must be an expression
          throw new Error(`SqlDatabase.makeSelectSql() column [${column}] not defined on table [${tableName}]`);                                                       // it must be an expression
          // selectColumnExprs[c] = "column as cc";
          // selectDbexprs[c]      = column;
          // console.log("column=[column] column was a dbexpr\n");
          // column                  = "cc";
        }
      }

      let havingClause = [''];
      whereClause = this.makeWhereClause(tableName, params, true, flags, bindValues, havingClause, aggregate, tableDef, relUsed);
      let orderByClause = this.makeOrderByClause(tableName, options, tableDef, relUsed);

      //#########################################################################################
      // join clause for other tables
      //#########################################################################################
      let joins = [];
      if (!lodash.isEmpty(relUsed)) {
        let relationships = tableDef.relationship;
        for (let relName in relationships) {
          let relationship = relationships[relName];
          // let relationshipAlias = relationship.relationshipAlias;
          if (relUsed[relName] && relationship.dependencies) {
            let dependencies = relationship.dependencies;
            for (let depRelName of dependencies) {
              if (depRelName !== tableAlias && relationships[depRelName] && !relUsed[depRelName]) {
                relUsed[depRelName] = "Y";
              }
            }
          }
        }
        for (let relName in relationships) {
          let relationship = relationships[relName];
          // let relationshipAlias = relationship.relationshipAlias;
          if (relUsed[relName]) {
            // select gm.id, gm.uid, gm.gid, g.groupname
            // from insight360.group_memb gm
            // left join insight360.group g on g.id = gm.uid

            let relTableName = relationship.tableName;
            let relTableDef = this.tableDefs[relTableName];
            let relSchemaName: string;
            if (relUsed[relName] !== "Y") relSchemaName = relUsed[relName];
            else if (options.domainTableDefs && options.domainTableDefs[relTableName]) relSchemaName = options.domainTableDefs[relTableName].schemaName;
            else if (relTableDef && relTableDef.schemaName !== undefined) relSchemaName = relTableDef.schemaName;
            else if (options.schemaName !== undefined) relSchemaName = options.schemaName
            else if (this.schemaName) relSchemaName = this.schemaName;
            let relFullTableName = relSchemaName ? relSchemaName + ".`" + relTableDef.nativeTableName + "`" : "`" + relTableDef.nativeTableName + "`";

            let joinClause = (relationship.joinOuter ? relationship.joinOuter+" join " : "inner join ") +   // join
                             relFullTableName + ' ' +                          // relSchemaName.relTableName
                             relationship.relationshipAlias;
            // console.log("SqlDatabase.makeSelectSql() tableName=%s rel=%s sch=%s clause=%s", tableName, relName, relUsed[relName], joinClause);
            if (relationship.joinOnClause) {
              joinClause += " on " + relationship.joinOnClause;
            }
            joins.push(joinClause);
          }
        }
      }
      let joinClause = (joins.length > 0) ? ("\n     " + joins.join("\n     ")) : '';

      if (aggregate) {
        let groupByClause = (groupColumnExprs.length > 0) ? ("\ngroup by\n   " + groupColumnExprs.join(",\n   ")) : '';
        // havingClause = '';

        sql = "select\n   " +
              selectColumnExprs.join(",\n   ") +
              "\nfrom "+sqlTable+" "+tableAlias +
              joinClause +
              whereClause +
              groupByClause +
              havingClause[0] +
              orderByClause +
              this.makeLimitClause(tableName, options);
      }
      else {
        sql = "select" + (options.distinct ? " distinct" : "") + "\n   " +
              selectColumnExprs.join(",\n   ") +
              "\nfrom "+sqlTable+" "+tableAlias +
              joinClause +
              whereClause +
              orderByClause +
              this.makeLimitClause(tableName, options);
      }
    }

    if (options.showSql) console.log("SQL:", sql);
    if (this.debug) console.log("EXIT:  SqlDatabase.makeSelectSql()",sql);
    // testUtils.methodExit(testToken, sql);
    return(sql);
  }

  public makeSimpleColumnList(
    tableName: string,
    columns: string[],
    tableDef: DBTableDef,
    options: object = {}
  ) : string {
    console.log("XXX makeSimpleColumnList()", tableName, tableDef);
    let columnDefs = tableDef.column;
    let selectColumns = [];
    let column: string, nativeColumn: string;
    let columnDef: DBColumnDef;
    let tableAlias = (tableDef.tableAlias ? (tableDef.tableAlias + ".") : "");
    for (column of columns) {
      columnDef = columnDefs[column];
      if (!columnDef) {
        throw new Error(`Column [${column}] undefined on tableName [${tableName}]`);
      }
      else if (columnDef.physicalInd !== "N") {
        nativeColumn = columnDef.nativeColumn;
        if (nativeColumn && nativeColumn !== column) {
          selectColumns.push(tableAlias + columnDef.nativeColumn + " as " + column)
        }
        else {
          selectColumns.push(tableAlias + column);
        }
      }
    }
    let sql: string;
    if (options["newline"]) {
      sql = selectColumns.join(",\n   ");
    }
    else {
      sql = selectColumns.join(", ");
    }
    // console.log("SqlDatabase.makeSimpleColumnList() =>", sql);
    return(sql);
  }

  public makeSelectColumn (
    tableDef: DBTableDef,
    c: number,
    column: string,
    columnDef: DBColumnDef = {},
    selectColumnExprs: string[],
    selectDbExprs: string[],
    groupColumnExprs: string[],
    aggregate: boolean
  ) : void {
    if (this.debug) console.log("ENTER: SqlDatabase.makeSelectColumn(): ",arguments);
    //  if (tableDef !== undefined) throw new Error("SqlDatabase.makeSelectColumn(): tableDef must be supplied\n");
    //  if (c !== undefined) throw new Error("SqlDatabase.makeSelectColumn(): c must be supplied\n");
    //  if (column !== undefined) throw new Error("SqlDatabase.makeSelectColumn(): column must be supplied\n");
    //  if (columnDef !== undefined) throw new Error("SqlDatabase.makeSelectColumn(): columnDef must be supplied\n");
    //  if (selectColumnExprs !== undefined) throw new Error("SqlDatabase.makeSelectColumn(): selectColumnExprs must be supplied\n");
    //  if (selectDbexprs !== undefined) throw new Error("SqlDatabase.makeSelectColumn(): selectDbexprs must be supplied\n");
    //  if (groupColumnExprs !== undefined) throw new Error("SqlDatabase.makeSelectColumn(): groupColumnExprs must be supplied\n");
    if (aggregate === undefined) aggregate = true;

    let relUsed = {};
    let relationshipName = columnDef.relationshipName;
    let isKey = columnDef.isAggregateKey;

    let columnModifier = columnDef.columnModifier;
    let columnType     = columnDef.type;
    let dbexpr: string = columnDef.dbexpr || columnDef.nativeColumn || "null";

    if (columnModifier) {
        // if (columnDef.parent) {
        //     physColumn = columnDef.parent;
        //     //console.log("_make_select_column(): column=[column] columnModifier=[columnModifier] physColumn=[physColumn]\n");
        //     dbexpr = this.columnModified(column, columnModifier, "relationshipAlias.physColumn", tableDef.column[physColumn], tableDef, aggregate);
        // }
        // else {
            dbexpr = this.columnModified(column, columnModifier, dbexpr, columnDef, tableDef, aggregate);
        // }
        // console.log("XXX dbexpr=[dbexpr] : columnModifier=[columnModifier]");
    }
    else if (aggregate && isKey && columnType === 'datetime') {
        dbexpr = this.columnModified(column, 'hour', dbexpr, columnDef, tableDef, aggregate);
        // console.log("XXX dbexpr=[dbexpr] : aggregate=[aggregate] columnType=[columnType]");
    }
    else if (aggregate && columnDef.aggDbexpr) {
        dbexpr = columnDef.aggDbexpr;
        // console.log("XXX dbexpr=[dbexpr] : aggregate=[aggregate] aggDbexpr");
    }
    else if (aggregate && !isKey) {
        dbexpr = "sum("+dbexpr+")";
        // console.log("XXX dbexpr=[dbexpr] : aggregate=[aggregate] not key");
    }
    // console.log("XXX dbexpr=[dbexpr] : otherwise");
    // console.log("XXX dbexpr=[dbexpr] : aggregate=[aggregate] isKey=[isKey]");

    if (columnDef.type === 'date') {
        dbexpr = this.dateStdformat(dbexpr);
        // console.log("XXX dbexpr=[dbexpr] : columnType=[date]");
    }
    else if (columnDef.type === 'datetime') {
        dbexpr = this.datetimeStdformat(dbexpr);
        // console.log("XXX dbexpr=[dbexpr] : columnType=[datetime]");
    }

    // if (tableDef.tableName === 'TAFPurchaseTransaction') {
    //   console.log("XXX SqlDatabase.makeSelectColumn() c=%s column=%s dbexpr=%s", c, column, dbexpr);
    // }

    if (aggregate && isKey) groupColumnExprs.push(dbexpr);
    selectColumnExprs[c]  = dbexpr+" as `"+column+"`";
    selectDbExprs[c]      = dbexpr;
    // console.log("XXX dbexpr", dbexpr, selectColumnExprs[c]);
    if (this.debug) console.log("EXIT:  SqlDatabase.makeSelectColumn()");
  }

  public makeWhereClause (
    tableName: string,              // IN
    params?: object|string|number,  // IN
    multiTable: boolean = false,    // IN
    flags?: DBQueryFlags,           // OUT
    bindValues?: string[],          // IN
    havingClause?: string[],        // OUT
    aggregate: boolean = false,     // IN
    tableDef?: DBTableDef,          // IN
    relUsed: object = {}            // IN/OUT
  ) : string {

    if (this.debug) console.log("ENTER: SqlDatabase.makeWhereClause(): ",arguments);
    if (tableName === undefined) throw new Error("SqlDatabase.makeWhereClause(): tableName must be supplied\n");
    if (params === undefined) throw new Error("SqlDatabase.makeWhereClause(): params must be supplied\n");

    if (!tableDef) tableDef = this.getTableDef(tableName) || {};
    let primaryKeyColumn = this.getPrimaryKeyColumn(tableName, tableDef);
    let columnDefs: DBColumnDefs = tableDef.column || {};

    let bind         = bindValues;
    let whereClause  = '';
    if (!havingClause) havingClause = [];
    havingClause[0]  = '';
    let whereExprs: string[] = [];
    let havingExprs: string[] = [];
    let paramOps: DataParamOps;
    let paramValue: any;

    if (typeof(params) !== 'object') {
      if (!primaryKeyColumn) throw new Error("A primaryKeyColumn must be defined if you want to make a where clause with a scalar params");
      paramValue = params;
      params = {};
      params[primaryKeyColumn] = paramValue;
    }

    // This is MAGIC. If a column exists for owner_group_id, only users authenticated into a group_id can access those rows.
    // A user in the "system" group (2) is immune from this restriction.
    // if (tableDef && tableDef.column['owner_group_id']) {
    //     let current_group_id = this.locator.getAuthenticatedGroupId();
    //     if (current_group_id != APP_SYSTEM_GROUP_ID) params['owner_group_id-eq'] = current_group_id;
    // }

    let param: any, bindableValue, column, sqlValue, colExprBegin, colExprEnd;
    let op: string, sqlOp: string, matches: string[];
    let columnExpr: string, relationshipName: string;
    let opValid = {
      eq: true, ne: true, gt: true, ge: true, lt: true, le: true,
      in: true, notIn: true,
      startsWith: true, matches: true, contains: true, regexp: true
    };
    let paramList = [];
    let searchSpec: any = params["_search"];

    // an id-based query (params is scalar) needs no more filtering, sorting, or windowing (because it returns at most one row)
    // if there is an options.orderBy of more than one column or there is at least one param, we need more sorting
    // if there is more than one param or the params are of a certain sort, we need more filtering
    // if we need more sorting and any windowing is requested, then we need more windowing
    // if we have an offset, we need more windowing
    for (param in params) {
      paramValue    = params[param];
      if (paramValue === undefined) {
        throw new Error("Error: paramValue is undefined for param " + param);
      }
      else if (param === "_search") {
        // do nothing (we already pulled out the searchSpec above)
      }
      else if (Array.isArray(paramValue)) {
        //                   column, op, sqlValue, opImplied, resolved
        paramList.push([ param, "in", paramValue ]);
      }
      else if (paramValue === null) {
        //                   column, op, sqlValue, opImplied, resolved
        paramList.push([ param, "eq", null ]);
      }
      else if (typeof(paramValue) === "object") {
        paramOps = paramValue;
        for (op in paramOps) {
          if (opValid[op]) {
            //                   column, op, sqlValue, opImplied, resolved
            paramList.push([ param, op, paramOps[op] ]);
          }
          else if (op === "dwim") {
            this.pushDwimParam(paramList, param, paramOps[op]);
          }
        }
      }
      else {   // paramValue is a scalar (not null, undefined, object, or Array)
        //                   column, op, sqlValue, opImplied, resolved
        paramList.push([ param, "eq", paramValue ]);
      }
    }

    for (let paramSet of paramList) {
      column     = paramSet[0];
      op         = paramSet[1];
      paramValue = paramSet[2];
      sqlValue   = null;

      colExprBegin = '';
      colExprEnd   = '';

      //##########################################################################################
      // Now that we know the column this parameter represents, we find out other info
      //##########################################################################################
      let columnType = null;
      let columnDef: DBColumnDef;
      if (columnDefs[column]) {
        columnDef = columnDefs[column];
        columnType = columnDef.type;
      }
      else {
        columnDef = {};
        columnType = "string";
      }

      if (op === "eq" || op === "in") {
        if (paramValue === null || paramValue === undefined) {
          sqlOp = "is";
          sqlValue = "null";
        }
        else if (Array.isArray(paramValue)) {
          if (paramValue.length === 0) {
            sqlOp = "=";
            sqlValue = "null";
          }
          else if (paramValue.length === 1) {
            sqlOp = "=";
            sqlValue = this.quote(paramValue[0], columnDef);
          }
          else {
            sqlOp = "in";
            sqlValue = this.quote(paramValue, columnDef);
          }
        }
        else {
          sqlOp = "=";
          sqlValue = this.quote(paramValue, columnDef);
        }
      }
      else if (op === "ne" || op === "notIn") {
        if (paramValue === null || paramValue === undefined) {
          sqlOp = "is not";
          sqlValue = "null";
        }
        else if (Array.isArray(paramValue)) {
          if (paramValue.length === 0) {
            sqlOp = "=";
            sqlValue = "null";
          }
          else if (paramValue.length === 1) {
            sqlOp = "!=";
            sqlValue = this.quote(paramValue[0], columnDef);
          }
          else {
            sqlOp = "not in";
            sqlValue = this.quote(paramValue, columnDef);
          }
        }
        else {
          sqlOp = "!=";
          sqlValue = this.quote(paramValue, columnDef);
        }
      }
      else if (op === "gt") { sqlOp = ">";  sqlValue = this.quote(paramValue, columnDef); }
      else if (op === "ge") { sqlOp = ">="; sqlValue = this.quote(paramValue, columnDef); }
      else if (op === "lt") { sqlOp = "<";  sqlValue = this.quote(paramValue, columnDef); }
      else if (op === "le") { sqlOp = "<="; sqlValue = this.quote(paramValue, columnDef); }
      else if (op === 'contains') {
        if (typeof(paramValue) === "string") {
          sqlOp    = 'like';
          sqlValue = "*"+paramValue+"*";
          sqlValue = sqlValue.replace(/\*/g, '%');
          sqlValue = sqlValue.replace(/\?/g, '_');
          // if (this.case_sensitive && sqlValue.match(/[A-Za-z]/)) {
          //     sqlValue = sqlValue.toLowerCase();
          //     colExprBegin = this.func_strtolower + '(';
          //     colExprEnd   = ')';
          // }
          sqlValue = this.quote(sqlValue, columnDef);
        }
      }
      else if (op === 'matches') {
        if (typeof(paramValue) === "string") {
          sqlOp    = 'like';
          sqlValue = paramValue.replace(/\*/g, '%');
          sqlValue = sqlValue.replace(/\?/g, '_');
          // if (this.case_sensitive && sqlValue.match(/[A-Za-z]/)) {
          //     sqlValue = sqlValue.toLowerCase();
          //     colExprBegin = this.func_strtolower + '(';
          //     colExprEnd   = ')';
          // }
          sqlValue = this.quote(sqlValue, columnDef);
        }
      }
      else if (op === 'startsWith') {
        if (typeof(paramValue) === "string") {
          sqlOp    = 'like';
          sqlValue = paramValue + '%';
          sqlValue = this.quote(sqlValue, columnDef);
        }
      }
      else if (op === 'regexp') {
        sqlOp = "regexp";
        sqlValue = this.quote(paramValue, false);
      }
      else if (op === 'notRegexp') {
        sqlOp = "not regexp";
        sqlValue = this.quote(paramValue, false);
      }
      else if (op === 'between') {
        sqlOp = "between";
        sqlValue = paramValue;
      }
      else if (op === 'notBetween') {
        sqlOp = "not between";
        sqlValue = paramValue;
      }

      if (!columnDef) {
        columnExpr = column;
        // console.log("XXX expr[1]: columnExpr=["+columnExpr+"]\n");
      }
      else if (column.match(/^[A-Za-z_][A-Za-z0-9_]*$/)) {
        relationshipName = columnDef.relationshipName;
        if (relationshipName) {
          if (!relUsed[relationshipName]) {
            relUsed[relationshipName] = 'Y';   // columnDef.schemaName ?!?
          }
        }
        else relationshipName = tableDef.tableName;

        let nativeColumn = (columnDef && columnDef.nativeColumn) ? columnDef.nativeColumn : column;

        // if this is an aggregate query AND this column is NOT an aggregate key AND there is an aggregate expression, then use it!
        if (aggregate && !columnDef.isAggregateKey && columnDef.aggDbexpr) {
          columnExpr = columnDef.aggDbexpr;
        }
        else {
          if (multiTable && columnDef.dbexpr) {
            columnExpr = columnDef.dbexpr;
          }
          else {
            columnExpr = nativeColumn;
          }
        }
        // console.log("XXX expr[2]: columnExpr=["+columnExpr+"]\n");
      }
      else if (matches = column.match(/^(.*[^ ]) +as +[A-Za-z_][A-Za-z0-9_]* *$/)) {
        columnExpr = matches[1];
        // console.log("XXX expr[3]: columnExpr=["+columnExpr+"]\n");
      }
      else {
        columnExpr = column;   // this is some sort of expression, not a simple column
        // console.log("XXX expr[4]: columnExpr=["+columnExpr+"]\n");
      }

      if (this.debug) console.log("SqlDatabase.makeWhereClause() {colExprBegin}{columnExpr}{colExprEnd}{sqlOp}{sqlValue}", colExprBegin, columnExpr, colExprEnd, sqlOp, sqlValue);
      if (columnExpr) {
        // console.log(`XXX makeWhereClause(): column=${column} op=${op} columnExpr=${columnExpr} sqlValue=${sqlValue}\n`);
        if (bind && bindableValue) {
          bindValues.push(bindableValue);
          sqlValue = '?';
        }
        if (aggregate && !columnDef.isAggregateKey && columnDef.aggDbexpr) {
          havingExprs.push(colExprBegin+columnExpr+colExprEnd+" "+sqlOp+" "+sqlValue);
        }
        else {
          whereExprs.push(colExprBegin+columnExpr+colExprEnd+" "+sqlOp+" "+sqlValue);
        }
      }
    }

    if (searchSpec) {
      // console.log("XXX SqlDatabase.makeWhereClause()", tableName, searchSpec);
      if (typeof(searchSpec) === "string") {
        searchSpec = { terms: searchSpec };
      }
      if (searchSpec.terms && tableDef) {
        // console.log("XXX SqlDatabase.makeWhereClause() terms columns", searchSpec.terms, searchSpec.columns);
        let physColumns = [];
        let dbexprs = [];
        if (searchSpec.columns) {
          // figure out the columns
          for (let column of searchSpec.columns) {
            let columnDef: DBColumnDef = tableDef.column[column];
            if (columnDef && (!columnDef.type || columnDef.type === "string")) {
              if (columnDef.nativeColumn) physColumns.push(columnDef.nativeColumn);
              if (columnDef.dbexpr) dbexprs.push(columnDef.dbexpr);
            }
          }
          // console.log("XXX SqlDatabase.makeWhereClause() physColumns", physColumns);
          // console.log("XXX SqlDatabase.makeWhereClause() dbexprs", dbexprs);
        }
        else {
          // figure out the columns
          for (let column in tableDef.column) {
            let columnDef: DBColumnDef = tableDef.column[column];
            if (columnDef && (!columnDef.type || columnDef.type === "string")) {
              if (columnDef.nativeColumn) {
                physColumns.push(columnDef.nativeColumn);
                if (columnDef.dbexpr) dbexprs.push(columnDef.dbexpr);
              }
            }
          }
          // console.log("XXX SqlDatabase.makeWhereClause() (implied columns) physColumns", physColumns);
          // console.log("XXX SqlDatabase.makeWhereClause() (implied columns) dbexprs", dbexprs);
        }
        if (searchSpec.type && physColumns.length > 0) {
          let whereExpr = "match(" + physColumns.join(", ") + ") against (" + this.quoteString(searchSpec.terms);
          if (searchSpec.type === "boolean") {
            whereExpr += " in boolean mode)";
          }
          else if (searchSpec.type === "expansion") {
            whereExpr += " with query expansion)";
          }
          else {  // if (searchSpec.type === "natural")
            whereExpr += " in natural language mode)";
          }
          whereExprs.push(whereExpr);
          // console.log("XXX SqlDatabase.makeWhereClause() whereExpr", whereExpr);
        }
        else {
          let likeValue = this.quoteString("%" + searchSpec.terms + "%");
          let whereExpr = "(" + dbexprs.join(` like ${likeValue} or `) + ` like ${likeValue})`;
          whereExprs.push(whereExpr);
          // console.log("XXX SqlDatabase.makeWhereClause() whereExpr", whereExpr);
        }
      }
    }

    if (whereExprs.length == 0) {
      whereClause = "";
    }
    else {
      whereClause = "\nwhere " + whereExprs.join("\n  and ");
    }

    if (havingExprs.length == 0) {
      havingClause[0] = "";
    }
    else {
      havingClause[0] = "\nhaving " + havingExprs.join("\n   and ");
    }

    if (this.debug) console.log("EXIT:  SqlDatabase.makeWhereClause()",whereClause);
    // console.log("XXX: SqlDatabase.makeWhereClause()",whereClause);
    return(whereClause);
  }

  private pushDwimParam (paramList: any[], column: string, value: any) {
    let op = "eq";
    let implied = true;
    let matches: string[];
    if (typeof(value) === "string") {
      if (matches = value.match(/^(=~|~|=|!=|<>|>=|>|<=|<|!\/|\/|!)(.*)$/)) {
        let rhsOp = matches[1];
        value     = matches[2];
        implied   = false;
        if      (rhsOp === '=')  { op = 'eq'; }
        else if (rhsOp === '!')  { op = 'ne'; implied = true; }
        else if (rhsOp === '!=') { op = 'ne'; }
        else if (rhsOp === '<>') { op = 'ne'; }
        else if (rhsOp === '>=') { op = 'ge'; }
        else if (rhsOp === '>')  { op = 'gt'; }
        else if (rhsOp === '<=') { op = 'le'; }
        else if (rhsOp === '<')  { op = 'lt'; }
        else if (rhsOp === '~')  { op = 'contains'; }
        else if (rhsOp === '=~') { op = 'matches'; }
        else if (rhsOp === '!/') { op = 'notRegexp'; }
        else if (rhsOp === '/')  { op = 'regexp'; }
      }
      if (implied) {
        if (value === "NULL") {
          value = null;
        }
        else if (matches = value.match(/^ *(-?[0-9]+) *- *(-?[0-9]+) *$/)) {
          op = (op === "eq") ? "between" : "notBetween";
          value = matches[1] + " and " + matches[2];
        }
        else if (matches = value.match(/^ *([^ -]+) *- *([^ -]+) *$/)) {
          op = (op === "eq") ? "between" : "notBetween";
          value = "'" + matches[1] + "' and '" + matches[2] + "~~~~'";
        }
        else if (value.match(/^[^,]+,.*[^,]$/)) {
          op = (op === "eq") ? "in" : "notIn";
          value = value.split(/,/);
        }
      }
    }
    if (value !== "ALL") {
      paramList.push([column, op, value]);
    }
  }

  protected shouldQuoteColumnsAsNumber(tableName: string, columns: string[]) : object {
    let asNumber = {};
    let tableDef: DBTableDef = this.getTableDef(tableName);
    if (tableDef && tableDef.column) {
      for (let column of columns) {
        if (tableDef.column[column]) {
          let type = tableDef.column[column].type;
          // console.log("SqlDatabase.shouldQuoteColumnsAsNumber() column type", column, type);
          if (type === "number" || type === "float" || type === "integer" || type === "id") {
            asNumber[column] = true;
          }
        }
      }
    }
    return(asNumber);
  }

  // make a value safe to put into a SQL statement
  public quote (value: any, asNumber?: boolean|DBColumnDef): string {
    //  if (value !== undefined) throw new Error("SqlDatabase.quote(): value must be supplied\n");
    let type: string, matches: string[];
    let columnDef: DBColumnDef;
    if (asNumber && typeof(asNumber) !== "boolean") {
      columnDef = asNumber;
      type = columnDef.type;
      asNumber = (type === "number" || type === "float" || type === "integer" || type === "id");
    }
    if (typeof(value) === "string") {
      if (asNumber) {
        if (value === "") {
          value = "null";
        }
        else if (matches = value.match(/^ *(-?\d+)(\.\d+)? *$/)) {
          value = matches[2] ? matches[1] + matches[2] : matches[1];
        }
        else {
          value = "" + parseFloat(value);
        }
      }
      else {
        if (value === "" && type && (type === "date" || type === "datetime" || type === "timestamp")) {
          value = "null";
        }
        else if (value[value.length-1] === "Z" && type && (type === "date" || type === "datetime" || type === "timestamp")) {
          value = "'" + value.substr(0, value.length-1) + "'";
        }
        else if (value.match(/['\\]/)) {
          value = value.replace(/\\/g, '\\\\');
          value = "'" + value.replace(/'/g, '\\\'') + "'";
        }
        else {
          value = "'" + value + "'";
        }
        if (value.indexOf("\n") > -1) value = value.replace(/\n/g,'\\n');
      }
    }
    else if (typeof(value) === "number") {
      value = ""+value;  // turn to a string
    }
    else if (value === null || value === undefined) {
      value = "null";
    }
    else if (type === "json") {
      value = JSON.stringify(value);
      value = "'" + value.replace(/'/g, '\\\'').replace(/\\n/g, '\\\\n') + "'";
    }
    else if (Array.isArray(value)) {
      if (value.length === 0) {
        value = "(null)";
      }
      else {
        let arr = [];
        for (let elem of value) {
          arr.push(this.quote(elem, asNumber));
        }
        value = "(" + arr.join(", ") + ")";
      }
    }
    else if (typeof(value) === "object") {
      if (value.constructor.name === "Date") {
        // value = "'" + value.toISOString() + "'";
        value = "'" + this.formatDateTime(value) + "'";
      }
      else {
        value = "'" + JSON.stringify(value) + "'";
      }
    }
    return(value);
  }

  private quoteString (str: string) {
    if (str.match(/['\\\n]/)) {
      str = str
      .replace(/\\/g, '\\\\')
      .replace(/\n/g,'\\n')
      .replace(/'/g,'\\\'');
    }
    str = "'" + str + "'";
    return(str);
  }

  protected formatDateTime (d: Date) {
    let yr  = ""+d.getUTCFullYear();
    let mon = ""+(d.getUTCMonth()+1);
    let day = ""+d.getUTCDate();
    let hr  = ""+d.getUTCHours();
    let min = ""+d.getUTCMinutes();
    let sec = ""+d.getUTCSeconds();
    if (mon.length === 1) mon = "0"+mon;
    if (day.length === 1) day = "0"+day;
    if (hr.length === 1) hr = "0"+hr;
    if (min.length === 1) min = "0"+min;
    if (sec.length === 1) sec = "0"+sec;
    let date = yr+"-"+mon+"-"+day+" "+hr+":"+min+":"+sec;
    return(date);
  }

  public makeOrderByClause (
    tableName: string,
    options: DataOptions = {},
    tableDef?: DBTableDef,
    relUsed?: object
  ) : string {
    if (this.debug) console.log("ENTER: SqlDatabase.makeOrderByClause(): ",arguments);
    let orderByClause = '';
    let columns: any, orderByDbexpr: string[], matches: string[], i: number, len: number, column: string, direction: string;
    if (options.orderBy) {
      columns = options.orderBy;
      if (typeof(columns) === "string") columns = columns.split(/,/);
      orderByDbexpr = [];
      i = 0;
      len = columns.length;
      for (i = 0; i < len; i++) {
        column = columns[i];
        matches = column.match(/^([_a-zA-Z][_a-zA-Z0-9]*)[\.-](asc|desc)$/i);
        if (matches) {
          column = matches[1];
          direction = " "+matches[2];
        }
        else {
          direction = '';
        }

        if (!tableDef) {
          orderByDbexpr.push(column + direction);
        }
        else if (tableDef.column && tableDef.column[column]) {
          let columnDef = tableDef.column[column];
          if (options.aggregate && columnDef.aggDbexpr) {
            orderByDbexpr.push(columnDef.aggDbexpr + direction);
          }
          else if ((!options.aggregate || columnDef.isAggregateKey) && columnDef.dbexpr) {
            orderByDbexpr.push(columnDef.dbexpr + direction);
          }
          else {
            orderByDbexpr.push(column + direction);
          }
          if (columnDef.relationshipName && ! relUsed[columnDef.relationshipName]) {
            relUsed[columnDef.relationshipName] = "Y";
          }
        }
        else if (matches = column.match(/^(.*[^ ]) +as +([A-Za-z_][A-Za-z0-9_]*) *$/)) {
          orderByDbexpr.push(matches[1]);
        }
        else if (column.match(/^[A-Za-z_][A-Za-z0-9_]*$/)) {
          // do nothing. It is a column we don't understand. We selected NULL for it.
        }
        else {
          orderByDbexpr.push(column + direction);   // this is some sort of expression, not a simple column
        }
      }
      if (orderByDbexpr.length > 0) {
        orderByClause = "\norder by\n   " + orderByDbexpr.join(",\n   ");
      }
    }
    if (this.debug) console.log("EXIT:  SqlDatabase.makeOrderByClause()",orderByClause);
    return(orderByClause);
  }

  public makeInsertSql (
    tableName: string,
    model: object,
    columns?: string[],
    options: DataOptions = {}
  ): string {
    // console.log("XXX makeInsertSql(%s, %j, %j, %j)", tableName, model, columns, options);
    // let testToken = testUtils.methodEntry("SqlDatabase", "makeInsertSql", arguments);
    let tableDef: DBTableDef;
    let schemaName : string;
    let nativeTableName: string;
    let sqlTable : string;
    let matches = tableName.match(/^([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)$/);
    if (matches) {
      schemaName  = matches[1];
      tableName   = matches[2];
      tableDef    = this.getTableDef(tableName);
    }
    else {
      tableDef    = this.getTableDef(tableName);
      if (options.schemaName !== undefined) schemaName = options.schemaName
      else if (options.domainTableDefs && options.domainTableDefs[tableName]) schemaName = options.domainTableDefs[tableName].schemaName;
      else if (tableDef && tableDef.schemaName !== undefined) schemaName = tableDef.schemaName;
      else if (this.schemaName) schemaName = this.schemaName;
    }
    // console.log("XXXX tableDef", tableDef);
    nativeTableName = (tableDef && tableDef.nativeTableName) ? tableDef.nativeTableName : tableName;
    sqlTable = schemaName ? schemaName+".`"+nativeTableName+"`" : nativeTableName;

    if (!columns) {
      columns = Object.keys(model);
    }
    else if (columns.length === 0) {
      let cols = Object.keys(model);
      columns.push(...cols);
    }
    // console.log("XXXX columns", columns);
    let nativeColumns: string[];
    let asNumber = this.shouldQuoteColumnsAsNumber(tableName, columns);
    let values = "";
    let columnDef: DBColumnDef;
    let nativeColumn: string;
    if (!tableDef) {
      nativeColumns = columns;
      asNumber = {};
      for (let column of columns) {
        if (values) values += ",\n   ";
        values += this.quote(model[column], asNumber[column]);
      }
    }
    else {
      nativeColumns = [];
      asNumber = this.shouldQuoteColumnsAsNumber(tableName, columns);
      for (let column of columns) {
        columnDef = tableDef.column[column];
        if (columnDef && columnDef.nativeColumn) {  // } && columnDef.physicalInd !== "N") {
          nativeColumn = columnDef.nativeColumn || column;
          nativeColumns.push(nativeColumn);
          if (values) values += ",\n   ";
          values += this.quote(model[column], columnDef);
        }
      }
    }

    let sql = "insert into "+sqlTable+"\n  ("+nativeColumns.join(",\n   ")+")\nvalues\n  ("+values+")";

    if (options.update || options.updateKeys) {
      let updateColumns: string[];
      if (options.update) { updateColumns = options.update; }
      else {
        updateColumns = [];
        let updateKeys = { id: true };
        for (let column of options.updateKeys) {
          updateKeys[column] = true;
        }
        for (let column of columns) {
          if (!updateKeys[column]) updateColumns.push(column);
        }
      }
      if (!Array.isArray(updateColumns) || updateColumns.length === 0) {
        updateColumns = this.getDefaultOnDuplicateUpdateColumns(tableName, columns);
      }
      if (updateColumns && updateColumns.length > 0) {
        sql += "\non duplicate key update";
        for (let i = 0; i < updateColumns.length; i++) {
          let column = updateColumns[i];
          let columnDef = tableDef.column[column];
          let nativeColumn = (columnDef && columnDef.nativeColumn) ? columnDef.nativeColumn : column;
          if (i > 0) sql += ",";
          sql += "\n   "+nativeColumn+" = values("+nativeColumn+")";
        }
      }
    }
    if (options.showSql) console.log("SQL:", sql);
    // console.log("SqlDatabase.insert(%s, %j, %j) =>", tableName, model, columns, sql);
    // testUtils.methodExit(testToken, sql);
    return(sql);
  }

  public makeUpdateSql (
    tableName: string,
    params?: object|string|number,
    values?: object,
    columns?: string[],
    options: DataOptions = {}
  ): string {
    // let testToken = testUtils.methodEntry("SqlDatabase", "makeUpdateSql", arguments);
    // console.log("XXX SqlDatabase.makeUpdateSql(%s)", tableName, params, values, columns, options);
    let tableDef: DBTableDef;
    let schemaName : string;
    let nativeTableName: string;
    let sqlTable : string;
    let matches = tableName.match(/^([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)$/);
    if (matches) {
      schemaName  = matches[1];
      tableName   = matches[2];
      tableDef    = this.getTableDef(tableName);
    }
    else {
      tableDef    = this.getTableDef(tableName);
      if (options.schemaName !== undefined) schemaName = options.schemaName
      else if (options.domainTableDefs && options.domainTableDefs[tableName]) schemaName = options.domainTableDefs[tableName].schemaName;
      else if (tableDef && tableDef.schemaName !== undefined) schemaName = tableDef.schemaName;
      else if (this.schemaName) schemaName = this.schemaName;
    }
    nativeTableName = (tableDef && tableDef.nativeTableName) ? tableDef.nativeTableName : tableName;
    // let tableAlias = (tableDef && tableDef.tableAlias) ? tableDef.tableAlias : "";
    sqlTable = schemaName ? schemaName+".`"+nativeTableName+"`" : nativeTableName;
    let asNumber: object;
    // console.log("SqlDatabase.makeUpdateSql(%s) sqlTable", tableName, sqlTable);

    let columnDefs: DBColumnDefs = tableDef ? tableDef.column : null;
    let columnDef: DBColumnDef;
    let nativeColumn: string;
    let valuesClause: string = "";
    let column: string;

    if (Array.isArray(values)) {
      // console.log("SqlDatabase.makeUpdateSql(%s) values is array", tableName, values);
      if (Array.isArray(columns)) {
        // console.log("SqlDatabase.makeUpdateSql(%s) columns is array", tableName, columns);
        asNumber = tableDef ? this.shouldQuoteColumnsAsNumber(tableName, columns) : {};
        if (columns.length > 0 && columns.length === values.length) {
          for (let i = 0; i < columns.length; i++) {
            column = columns[i];
            // console.log("SqlDatabase.makeUpdateSql(%s) (values as array) column", tableName, column);
            if (columnDefs && columnDefs[column]) {
              columnDef = columnDefs[column];
              if (columnDef.physicalInd !== "N") {
                nativeColumn = columnDef.nativeColumn || column;
                if (valuesClause) valuesClause += ",\n   ";
                valuesClause += nativeColumn + " = " + (options.useExpr ? values[i] : this.quote(values[i], columnDef));
              }
            }
            else {
              columnDef = null;
              if (valuesClause) valuesClause += ",\n   ";
              valuesClause += column + " = " + (options.useExpr ? values[i] : this.quote(values[i], asNumber[column]));
            }
            // console.log("SqlDatabase.makeUpdateSql(%s) (valuesClause)", tableName, valuesClause);
          }
        }
      }
    }
    else if (values && typeof(values) === "object") {
      // console.log("SqlDatabase.makeUpdateSql(%s) values is object", tableName, values);
      if (!Array.isArray(columns) || columns.length === 0) columns = Object.keys(values);
      asNumber = tableDef ? this.shouldQuoteColumnsAsNumber(tableName, columns) : {};
      // console.log("XXX makeUpdateSql() columns", columns);
      if (columns.length > 0) {
        for (let i = 0; i < columns.length; i++) {
          column = columns[i];
          // console.log("SqlDatabase.makeUpdateSql(%s) (values as object) column", tableName, column);
          if (columnDefs && columnDefs[column]) {
            columnDef = columnDefs[column];
            if (columnDef.physicalInd !== "N") {
              nativeColumn = columnDef.nativeColumn || column;
              if (valuesClause) valuesClause += ",\n   ";
              valuesClause += nativeColumn + " = " + (options.useExpr ? values[column] : this.quote(values[column], columnDef));
            }
          }
          else {
            columnDef = null;
            if (valuesClause) valuesClause += ",\n   ";
            valuesClause += column + " = " + (options.useExpr ? values[column] : this.quote(values[column], asNumber[column]));
          }
          // console.log("SqlDatabase.makeUpdateSql(%s) (valuesClause)", tableName, valuesClause);
        }
      }
    }
    // console.log("SqlDatabase.makeUpdateSql(%s) valuesClause", tableName, valuesClause);
    let sql: string;
    if (valuesClause) {
      let whereClause = this.makeWhereClause(tableName, params, false);
      sql = "update "+sqlTable+" set\n   "+valuesClause+whereClause;
      // console.log("SqlDatabase.makeUpdateSql(%s) [valuesClause] sql", tableName, valuesClause, sql);
    }
    // console.log("SqlDatabase.makeUpdateSql(%s) sql", tableName, sql);

    if (options.showSql) console.log("SQL:", sql);
    // testUtils.methodExit(testToken, sql);
    return(sql);
  }

  public makeDeleteSql (
    tableName: string,
    params?: object|string|number,
    options: DataOptions = {}
  ): string {
    // let testToken = testUtils.methodEntry("SqlDatabase", "makeDeleteSql", arguments);
    // console.log("SqlDatabase.makeDeleteSql(%s)", tableName, params, options);
    let tableDef: DBTableDef;
    let schemaName : string;
    let nativeTableName: string;
    let sqlTable : string;
    let matches = tableName.match(/^([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)$/);
    if (matches) {
      schemaName  = matches[1];
      tableName   = matches[2];
      tableDef    = this.getTableDef(tableName);
    }
    else {
      tableDef    = this.getTableDef(tableName);
      if (options.schemaName !== undefined) schemaName = options.schemaName
      else if (options.domainTableDefs && options.domainTableDefs[tableName]) schemaName = options.domainTableDefs[tableName].schemaName;
      else if (tableDef && tableDef.schemaName !== undefined) schemaName = tableDef.schemaName;
      else if (this.schemaName) schemaName = this.schemaName;
    }
    nativeTableName = (tableDef && tableDef.nativeTableName) ? tableDef.nativeTableName : tableName;
    sqlTable = schemaName ? schemaName+".`"+nativeTableName+"`" : nativeTableName;

    let whereClause = this.makeWhereClause(tableName, params, false);
    let sql = "delete from "+sqlTable+whereClause;

    if (options.showSql) console.log("SQL:", sql);
    // testUtils.methodExit(testToken, sql);
    return(sql);
  }

  public makeLimitClause (
    tableName: string,
    options: DataOptions = {}
  ) : string {
      if (this.debug) console.log("ENTER: SqlDatabase.makeLimitClause(): ",arguments);
      //  if (tableName !== undefined) throw new Error("SqlDatabase.makeLimitClause(): tableName must be supplied\n");
      //  if (options !== undefined) throw new Error("SqlDatabase.makeLimitClause(): options must be supplied\n");
      let limitClause = '';
      if (this.debug) console.log("EXIT:  SqlDatabase.makeLimitClause()",limitClause);
      return(limitClause);
  }

  /**
   * make_create_table_ddl(tableDef, ddls) - tbd
   * @param string  tableName         [IN] - the name of the tableName
   * @param string  tableLabel        [IN] - (optional) the label (text string) used to describe this tableName in the user interface (default is the tableName, converted to a label)
   * @param string  columns            [IN] - either a (csv) list of columnNames or an array of columnNames
   * @param string  physColumns       [IN] - (optional) either a (csv) list of columnNames or an array of columnNames
   *                                          (if physColumns exists, it overrides the columns value, which is instead interpreted to be a list of logical columns)
   * @param object  column             [IN] - (optional) an associated array of associative arrays with metadata about the columns
   *                                          e.g. {'person_id':{'columnName':'person_id','column_label':'Person ID','column_type':'integer','maxLength':'10','notNullInd':'Y',
                                                         'primaryKey_ind':'Y','auto_increment_ind':'Y','defaultValue':null,'display_format':null,'display_justify':null}}
  * @param array   primaryKey        [IN] - (optional) an array of columnNames which make up the primary key (if single column 'id' or ending in '_id', then it is an autoincrement column)
  * @param string  autoIncrementColumn [IN] - (optional) a columnName which is an autoincrement column
  * @param array   uniqueIndexes     [IN] - (optional) an array of arrays of columnNames which make up alternate keys (uniqueness constraints with indexes)
  * @param array   indexes            [IN] - (optional) an array of arrays of columnNames which make up non-unique indexes
  */
  public makeCreateTableDdl (tableDef: DBTableDef, ddls: string[], options: any = {}) {
    if (!(tableDef !== undefined)) throw new Error("SqlDatabase.makeCreateTableDdl(): tableDef must be supplied\n");
    if (!(ddls !== undefined)) throw new Error("SqlDatabase.makeCreateTableDdl(): ddls must be supplied\n");
    if (this.debug) console.log("ENTER: SqlDatabase.makeCreateTableDdl(): ",arguments);

    // console.log("SqlDatabase.makeCreateTableDdl() ... makeCanonicalTableDef()");
    this.makeCanonicalTableDef(tableDef);
    // console.log("SqlDatabase.makeCreateTableDdl() ... tableDef", tableDef);
    let columns         = tableDef.physColumns || tableDef.defaultColumns;
    let columnDefs          = tableDef.column;
    let columnDdlOptions: DBColumnDdlOptions = {};
    let tableName = tableDef.tableName;

    let schemaName: string;
    if (options.schemaName !== undefined) schemaName = options.schemaName
    else if (options.domainTableDefs && options.domainTableDefs[tableName]) schemaName = options.domainTableDefs[tableName].schemaName;
    else if (tableDef && tableDef.schemaName !== undefined) schemaName = tableDef.schemaName;
    else if (this.schemaName) schemaName = this.schemaName;

    let nativeTableName = tableDef.nativeTableName || tableDef.tableName;
    let sqlTable = schemaName ? `${schemaName}.${nativeTableName}` : nativeTableName;
    let ddl = "create table "+sqlTable+" (";
    // console.log("SqlDatabase.makeCreateTableDdl() ... begin ddl", ddl);
    for (let i = 0; i < columns.length; i++) {
      let columnName = columns[i];
      // console.log("SqlDatabase.makeCreateTableDdl() ... %d columnName", i, columnName);
      let columnDef = columnDefs[columnName];
      if (columnDef.physicalInd === "N") {
        // do nothing
      }
      else {
        let nativeColumnName = columnDef.nativeColumn || columnName;
        if (i > 0) ddl += ',';
        let columnDdl  = this.makeTableColumnDdlFragment(nativeColumnName, columnDef, columnDdlOptions);
        ddl += "\n    " + columnDdl;
        // console.log("SqlDatabase.makeCreateTableDdl() ... %d ddl", i, columnDdl);
      }
    }

    let primaryKeyDefinedInColumn = columnDdlOptions.primaryKeyDefinedInColumn;

    if (tableDef.primaryKey && tableDef.primaryKey.length >= 1 && !primaryKeyDefinedInColumn) {
        ddl += ",\n    primary key (" + this.makeNativeColumnList(tableDef, tableDef.primaryKey) + ")";
    }

    let uniqueIndexCount = 0;
    if (tableDef.uniqueIndexes) {
      let len = tableDef.uniqueIndexes.length;
      for (let i = 0; i < len; i++) {
        let index = tableDef.uniqueIndexes[i];
        uniqueIndexCount = i+1;
        if (index.columns && index.columns.length >= 1) {
          ddl += ",\n    unique index " + nativeTableName + "_ak"+uniqueIndexCount+" (" + this.makeNativeColumnList(tableDef, index.columns) + ")";
        }
      }
    }
    let indexCount = 0;
    if (tableDef.indexes) {
      let len = tableDef.indexes.length;
      for (let i = 0; i < len; i++) {
        let index = tableDef.indexes[i];
        indexCount = i+1;
        if (index.columns && index.columns.length >= 1) {
          ddl += ",\n    index " + nativeTableName + "_ie"+indexCount+" (" + this.makeNativeColumnList(tableDef, index.columns) + ")";
        }
      }
    }

    ddl += "\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci";
    ddls.push(ddl);

    if (this.debug) console.log("EXIT:  SqlDatabase.makeCreateTableDdl()");
  }

  public makeDropTableDdl (tableDef: DBTableDef, ddls: string[], options: any = {}) {
    if (!(tableDef !== undefined)) throw new Error("SqlDatabase.makeDropTableDdl(): tableDef must be supplied\n");
    if (!(ddls !== undefined)) throw new Error("SqlDatabase.makeDropTableDdl(): ddls must be supplied\n");
    if (this.debug) console.log("ENTER: SqlDatabase.makeDropTableDdl(): ",arguments);

    // console.log("SqlDatabase.makeDropTableDdl() ... makeCanonicalTableDef()");
    this.makeCanonicalTableDef(tableDef);
    // let columnDdlOptions: DBColumnDdlOptions = {};

    let tableName = tableDef.tableName;
    let schemaName: string;
    if (options.schemaName !== undefined) schemaName = options.schemaName
    else if (options.domainTableDefs && options.domainTableDefs[tableName]) schemaName = options.domainTableDefs[tableName].schemaName;
    else if (tableDef && tableDef.schemaName !== undefined) schemaName = tableDef.schemaName;
    else if (this.schemaName) schemaName = this.schemaName;

    let nativeTableName = tableDef.nativeTableName || tableDef.tableName;
    let sqlTable = schemaName ? `${schemaName}.${nativeTableName}` : nativeTableName;
    let ddl = "drop table if exists "+sqlTable;
    ddls.push(ddl);

    if (this.debug) console.log("EXIT:  SqlDatabase.makeDropTableDdl()");
  }

  makeNativeColumnList(tableDef: DBTableDef, columns: string[]) {
    if (!tableDef || !tableDef.column) {
      return(columns.join(", "));
    }
    else {
      let nativeColumns = [];
      for (let column of columns) {
        let columnDef = tableDef.column[column];
        if (columnDef) {
          nativeColumns.push(columnDef.nativeColumn || column);
        }
        else {
          nativeColumns.push(column);
        }
      }
      return(nativeColumns.join(", "));
    }
  }

  /**
  * make_alterTableDdl(tableDef, tableDefFromDb, ddls) - tbd
  * @param string  tableName         [IN] - the name of the tableName
  * @param string  tableLabel        [IN] - (optional) the label (text string) used to describe this tableName in the user interface (default is the tableName, converted to a label)
  * @param string  columns            [IN] - either a (csv) list of columnNames or an array of columnNames
  * @param string  physColumns       [IN] - (optional) either a (csv) list of columnNames or an array of columnNames
  *                                          (if physColumns exists, it overrides the columns value, which is instead interpreted to be a list of logical columns)
  * @param object  column             [IN] - (optional) an associated array of associative arrays with metadata about the columns
  *                                          e.g. {'person_id':{'columnName':'person_id','column_label':'Person ID','column_type':'integer','maxLength':'10','notNullInd':'Y',
                                                  'primaryKey_ind':'Y','auto_increment_ind':'Y','defaultValue':null,'display_format':null,'display_justify':null}}
  * @param array   primaryKey        [IN] - (optional) an array of columnNames which make up the primary key (if single column 'id' or ending in '_id', then it is an autoincrement column)
  * @param string  autoIncrementColumn [IN] - (optional) a columnName which is an autoincrement column
  * @param array   uniqueIndexes     [IN] - (optional) an array of arrays of columnNames which make up alternate keys (uniqueness constraints with indexes)
  * @param array   indexes            [IN] - (optional) an array of arrays of columnNames which make up non-unique indexes
  */
  public makeAlterTableDdl (tableDef: DBTableDef, tableDefFromDb: DBTableDef, ddls: string[], options: DataOptions = {}) {
    if (!(tableDef !== undefined)) throw new Error("SqlDatabase.makeAlterTableDdl(): tableDef must be supplied\n");
    if (!(tableDefFromDb !== undefined)) throw new Error("SqlDatabase.makeAlterTableDdl(): tableDefFromDb must be supplied\n");
    if (!(ddls !== undefined)) throw new Error("SqlDatabase.makeAlterTableDdl(): ddls must be supplied\n");
    if (this.debug) console.log("ENTER: SqlDatabase.makeAlterTableDdl(): ",arguments);

    this.makeCanonicalTableDef(tableDef);

    let tableName            = tableDef.tableName;
    let physColumns          = tableDef.physColumns;
    let columnDefs           = tableDef.column;
    let primaryKeyColumn     = (tableDef.primaryKey && tableDef.primaryKey.length == 1) ? tableDef.primaryKey[0] : null;
    let currentPrimaryKeyColumn = (tableDefFromDb.primaryKey && tableDefFromDb.primaryKey.length == 1) ? tableDefFromDb.primaryKey[0] : null;
    // let autoIncrementColumn  = tableDef.autoIncrementColumn;
    let primaryKeyDefinedInColumn = 0;

    let currentPhysColumns   = tableDefFromDb.physColumns;
    let currentColumnDefs    = tableDefFromDb.column;

    let nativeTableName = tableDef.nativeTableName;
    let schemaName: string;
    if (options.schemaName !== undefined) schemaName = options.schemaName
    else if (options.domainTableDefs && options.domainTableDefs[tableName]) schemaName = options.domainTableDefs[tableName].schemaName;
    else if (tableDef && tableDef.schemaName !== undefined) schemaName = tableDef.schemaName;
    else if (this.schemaName) schemaName = this.schemaName;

    let sqlTable = schemaName ? `${schemaName}.${nativeTableName}` : nativeTableName;
    let alterTableDdl       = `alter tableName ${sqlTable}`;

    let currentPrimaryKey           = tableDefFromDb.primaryKey           ? tableDefFromDb.primaryKey.join(', ') : '';
    let primaryKey                   = tableDef.primaryKey                   ? tableDef.primaryKey.join(', ')         : '';
    // let currentAutoIncrementColumn = tableDefFromDb.autoIncrementColumn ? tableDefFromDb.autoIncrementColumn  : '';

    let numChanges = 0;

    // if primary key modified or dropped, drop primary key
    let primaryKeyDropped = 0;
    if (primaryKey !== currentPrimaryKey || (!primaryKey && currentPrimaryKey)) {
        // if (!currentAutoIncrementColumn) {
        //     if (numChanges > 0) alterTableDdl += ',';
        //     alterTableDdl += "\n    drop primary key";
        //     primaryKeyDropped = 1;
        //     numChanges++;
        // }
    }

    if (numChanges > 0) {
        ddls.push(alterTableDdl);
    }

    if (this.debug) console.log("EXIT:  SqlDatabase.makeAlterTableDdl()");
  }

  public makeTableColumnDdlFragment (
    columnName: string,
    columnDef: DBColumnDef,
    columnDdlOptions?: DBColumnDdlOptions
  ) {
    let columnType = columnDef.type;
    let nativeType = this.getColumnNativeType(columnDef);
    let nullClause = columnDef.notNullInd === 'Y' ? '  not null' : (nativeType !== "json" ? '  null' : '');
    let columnDdl = "   " + columnName + "   " + nativeType + nullClause;
    // if (this.debug) console.log("XXX: SqlDatabase.makeTableColumnDdlFragment() defaultValue", columnDef.defaultValue);
    if (columnDef.defaultValue !== undefined) {
      let defaultValue = columnDef.defaultValue;
      // console.log("XXX makeTableColumnDdlFragment(%s) type=%s defaultValue=%s typeof=%s", columnName, columnType, defaultValue, typeof(defaultValue));
      if (typeof(defaultValue) === "string") {
        if (columnType === 'datetime' || columnType === 'timestamp') {
          if (columnName === 'modify_dttm' || columnName === 'modifyDttm' || defaultValue === 'CURRENT_TIMESTAMP_ON_UPDATE') {
              columnDdl += ' DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP';
          }
          else if (columnName === 'create_dttm' || columnName === 'createDttm' || defaultValue === 'CURRENT_TIMESTAMP') {
              columnDdl += ' DEFAULT CURRENT_TIMESTAMP';
          }
          else if (defaultValue.match(/^[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9] [0-9][0-9]:[0-9][0-9]:[0-9][0-9]$/)) {
              columnDdl += " DEFAULT '"+defaultValue+"'";
          }
        }
        else if (columnType === 'integer' && defaultValue.match(/^-?[0-9]+$/)) {
            columnDdl += " DEFAULT "+defaultValue;
        }
        else if ((columnType === 'float' || columnType === 'number') && defaultValue.match(/^-?[0-9]+\.?[0-9]*$/)) {
            columnDdl += " DEFAULT "+defaultValue;
        }
        else if (columnType === 'string' && defaultValue.match(/^[^\'"]*$/)) {
            columnDdl += " DEFAULT '"+defaultValue+"'";
        }
      }
      else if (typeof(defaultValue) === "number") {
        if (columnType === 'integer') {
            columnDdl += " DEFAULT "+Math.round(defaultValue);
        }
        else if (columnType === 'float' || columnType === 'number') {
            columnDdl += " DEFAULT "+defaultValue;
        }
        else if (columnType === 'string') {
            columnDdl += " DEFAULT '"+defaultValue+"'";
        }
      }
    }
    // if (this.debug) console.log("XXX: SqlDatabase.makeTableColumnDdlFragment() autoIncrementInd", columnDef.autoIncrementInd);
    // defaultValue = columnDef.defaultValue ? columnDef.defaultValue : null;
    if (columnDef.autoIncrementInd === "Y") {
        columnDdl += " auto_increment";
    }
    // if (this.debug) console.log("XXX: SqlDatabase.makeTableColumnDdlFragment() primaryKeyInd", columnDef.primaryKeyInd);
    if (columnDef.primaryKeyInd === "Y") {
        columnDdl += " primary key";
        if (columnDdlOptions) columnDdlOptions.primaryKeyDefinedInColumn = true;
    }

    // if (this.debug) console.log("EXIT:  SqlDatabase.makeTableColumnDdlFragment()",columnDdl);
    return(columnDdl);
  }

  protected getDefaultOnDuplicateUpdateColumns (tableName: string, columns: string[]): string[] {
    let updateColumns = [];
    let noUpdateColumns = {};
    let tableDef = this.getTableDef(tableName);
    if (tableDef) {
      if (Array.isArray(tableDef.primaryKey)) {
        for (let column of tableDef.primaryKey) {
          noUpdateColumns[column] = true;
        }
      }
      if (tableDef.uniqueIndexes) {
        for (let index of tableDef.uniqueIndexes) {
          for (let column of index.columns) {
            noUpdateColumns[column] = true;
          }
        }
      }
    }
    else {
      noUpdateColumns = { id: true, modifyDttm: true, createDttm: true };
    }
    for (let column of columns) {
      if (!noUpdateColumns[column]) {
        updateColumns.push(column);
      }
    }
    return(updateColumns);
  }

  public getColumnNativeType (columnDef: DBColumnDef) {
    if (!(columnDef !== undefined)) throw new Error("SqlDatabase.getColumnNativeType(): columnDef must be supplied\n");
    // if (this.debug) console.log("ENTER: SqlDatabase.getColumnNativeType(): ",arguments);

    if (columnDef.nativeColumnType) return(columnDef.nativeColumnType);

    let columnType = columnDef.type || "";
    let matches, maxLength, numberOfDecimals;
    if (matches = columnType.match('/^([a-zA-Z]+)\(([0-9]+),?([0-9]*)\)/')) {
      columnType = matches[1];
      if (matches[2]) maxLength  = parseInt(matches[2], 10);
      if (matches[3]) numberOfDecimals = parseInt(matches[3], 10);
      columnDef.maxLength = maxLength;
      columnDef.numberOfDecimals = numberOfDecimals;
    }
    else if (columnDef.maxLength) {
      maxLength = columnDef.maxLength;
    }
    let nativeColumnType;
    if (
      columnType === 'date' ||
      columnType === 'datetime' ||
      columnType === 'timestamp' ||
      columnType === 'time'
    ) {
        nativeColumnType = columnType;
    }
    else if (columnType === "id") {
      nativeColumnType = 'bigint';
    }
    else if (columnType.match(/int|signed/)) {
      nativeColumnType = 'integer';
    }
    else if (columnType.match(/float|number/)) {
      nativeColumnType = 'float';
    }
    else if (columnType === "boolean") {
      // nativeColumnType = 'tinyint';
      nativeColumnType = 'bit(1)';
    }
    else if (columnType.match(/text/)) {
      nativeColumnType = 'text';
    }
    else if (columnType.match(/blob/)) {
      nativeColumnType = 'blob';
    }
    else if (columnType.match(/string/)) {
      if (!maxLength) maxLength = 255;
      nativeColumnType = "varchar("+maxLength+")";
    }
    else {
      if (!maxLength) maxLength = 254;
      nativeColumnType = "varchar("+maxLength+")";
    }
    // if (this.debug) console.log("EXIT:  SqlDatabase.getColumnNativeType()",nativeColumnType);
    return nativeColumnType;
  }

  // //#####################################################################################
  // // Note: the following functions are correct for MySQL. They should be overridden.
  // //#####################################################################################

  public makeNativeExpression (dbexpr: string) {
    if (dbexpr.indexOf('{') !== -1) {
      dbexpr = dbexpr.replace(/\{([a-z][a-zA-Z0-9]*)\}\(/g, (fullMatchStr: string, val1: string) => {
        return((this.nativeFunctionSynonym[val1] || val1) + "(");
      });
      dbexpr = dbexpr.replace(/\{([a-z][a-zA-Z0-9]*)\(([^()]*)\)\}/g, (fullMatchStr: string, val1: string, val2: string) => {
        let params = val2.split(/ *, */);
        if      (val1 === "dateToISO")                 { return(this.dateToISO(val2)); }
        else if (val1 === "datetimeToISO")             { return(this.datetimeToISO(val2)); }
        else if (val1 === "secondsAgo")                { return(this.secondsAgo(val2)); }
        else if (val1 === "if" && params.length === 4) { return(this.functionIf(params[1], params[2], params[3])); }
        else                                           { return(val1+"("+val2+")"); }
      });
    }
    return(dbexpr);
  }

  public dateToISO (date) {
    return(`date_format(${date},'%Y-%m-%d')`);
  }

  public datetimeToISO (date) {
    return(`date_format(${date},'%Y-%m-%d %H:%i:%S')`);
  }

  // Mysql:   unix_timestamp(now()) - unix_timestamp(create_dttm)
  // Sqlite:  strftime('%s','now') - strftime('%s',create_dttm)
  public secondsAgo (date) {
    return(`(unix_timestamp(now()) - unix_timestamp(${date}))`);
  }

  public functionIf (p1, p2, p3) {
    return(`(case when ${p1} then ${p2} else ${p3} end)`);
  }

  public dateToYear (date) {
      //  if (date !== undefined) throw new Error("SqlDatabase.dateToYear(): date must be supplied\n");
      return(`date_format(${date},'%Y-01-01')`);
  }

  public dateToMonth (date) {
      //  if (date !== undefined) throw new Error("SqlDatabase.dateToMonth(): date must be supplied\n");
      return(`date_format(${date},'%Y-%m-01')`);
  }

  public dateInterval (date, interval_days, offset_days) {
      //  if (date !== undefined) throw new Error("SqlDatabase.dateInterval(): date must be supplied\n");
      //  if (interval_days !== undefined) throw new Error("SqlDatabase.dateInterval(): interval_days must be supplied\n");
      //  if (offset_days !== undefined) throw new Error("SqlDatabase.dateInterval(): offset_days must be supplied\n");
      return(`date_format(${date},'%Y-%m-01')`);
      // if     (modifier === 'year')  { dbexpr = this.dateToYear(dbexpr);  }
      // else if (modifier === 'month') { dbexpr = this.dateToMonth(dbexpr); }
  }

  public dateModified (date, modifier) {
      //  if (date !== undefined) throw new Error("SqlDatabase.dateModified(): date must be supplied\n");
      //  if (modifier !== undefined) throw new Error("SqlDatabase.dateModified(): modifier must be supplied\n");
      return(`date_format(${date},'%Y-%m-01')`);
  }

  public datetimeToYear (datetime) {
      //  if (datetime !== undefined) throw new Error("SqlDatabase.datetimeToYear(): datetime must be supplied\n");
      return(`date_format(${datetime},'%Y-01-01 00:00:00')`);
  }

  public datetimeToMonth (datetime) {
      //  if (datetime !== undefined) throw new Error("SqlDatabase.datetimeToMonth(): datetime must be supplied\n");
      return(`date_format(${datetime},'%Y-%m-01 00:00:00')`);
  }

  public datetimeToDay (datetime) {
      //  if (datetime !== undefined) throw new Error("SqlDatabase.datetimeToDay(): datetime must be supplied\n");
      return(`date_format(${datetime},'%Y-%m-%d 00:00:00')`);
  }

  public datetimeToHour (datetime) {
      //  if (datetime !== undefined) throw new Error("SqlDatabase.datetimeToHour(): datetime must be supplied\n");
      return(`date_format(${datetime},'%Y-%m-%d %H:00:00')`);
  }

  public datetimeToMinute (datetime) {
      //  if (datetime !== undefined) throw new Error("SqlDatabase.datetimeToMinute(): datetime must be supplied\n");
      return(`date_format(${datetime},'%Y-%m-%d %H:%i:00')`);
  }

  public datetimeInterval (datetime: string, interval_sec: number, offset_sec: number = 0) {
      //  if (datetime !== undefined) throw new Error("SqlDatabase.datetimeInterval(): datetime must be supplied\n");
      //  if (interval_sec !== undefined) throw new Error("SqlDatabase.datetimeInterval(): interval_sec must be supplied\n");
      let dbexpr = `from_unixtime(unix_timestamp(${datetime})-mod(unix_timestamp(${datetime}),${interval_sec}),'%Y-%m-%d %H:%i:%S')`;
      return(dbexpr);
  }

  public datetimeModified (datetime, modifier) {
      if (this.debug) console.log("ENTER: SqlDatabase.datetimeModified(): ",arguments);
      //  if (datetime !== undefined) throw new Error("SqlDatabase.datetimeModified(): datetime must be supplied\n");
      //  if (modifier !== undefined) throw new Error("SqlDatabase.datetimeModified(): modifier must be supplied\n");
      let dbexpr, matches;
      if     (modifier === 'year')   { dbexpr = this.datetimeToYear(datetime);   }
      else if (modifier === 'month')  { dbexpr = this.datetimeToMonth(datetime);  }
      else if (modifier === 'day')    { dbexpr = this.datetimeToDay(datetime);    }
      else if (modifier === 'hour')   { dbexpr = this.datetimeToHour(datetime);   }
      else if (modifier === 'minute') { dbexpr = this.datetimeToMinute(datetime); }
      else {
          matches = modifier.match(/^([0-9]+)(year|month|day|hour|minute)$/);
          if (matches) {
              let interval_num  = matches[1];
              let interval_unit = matches[2];
              let interval_sec  = 0;
              if      (interval_unit === 'year')   { interval_sec = interval_num * 365*24*3600; }
              else if (interval_unit === 'month')  { interval_sec = interval_num * 30*24*3600; }
              else if (interval_unit === 'day')    { interval_sec = interval_num * 24*3600; }
              else if (interval_unit === 'hour')   { interval_sec = interval_num * 3600; }
              else if (interval_unit === 'minute') { interval_sec = interval_num * 60; }
              else                                 { dbexpr = datetime; }
              if (interval_sec) {
                  dbexpr = this.datetimeInterval(datetime, interval_sec);
              }
          }
          else {
              dbexpr = datetime;
          }
      }
      if (this.debug) console.log("EXIT:  SqlDatabase.datetimeModified()",dbexpr);
      return(dbexpr);
  }

  public columnModified (column, columnModifier, rawDbexpr, columnDef, tableDef, aggregate) {
    if (this.debug) console.log("ENTER: SqlDatabase.columnModified(): ",arguments);
    let dbexpr: string;
    if (columnModifier.match(/^(sum|min|max|avg|stddev|count)$/)) {
      dbexpr = `${columnModifier}(${rawDbexpr})`;
    }
    else if (columnModifier === 'countd') {
      dbexpr = `distinct ${rawDbexpr}`;
    }
    else if (columnDef.type === 'datetime') {
      dbexpr = this.datetimeModified(rawDbexpr, columnModifier);
    }
    else if (columnDef.type === 'date') {
      dbexpr = this.dateModified(rawDbexpr, columnModifier);
    }
    else {
      dbexpr = rawDbexpr;
    }
    if (this.debug) console.log("EXIT:  SqlDatabase.columnModified()",dbexpr);
    return(dbexpr);
  }

  public dateStdformat (dbexpr: string) {
    return(dbexpr);
  }

  public datetimeStdformat (dbexpr: string) {
    return(dbexpr);
  }

  public datetimeLiteral (year, month, day, hours, min, sec) {
    if (hours === undefined) hours = '00';
    if (min === undefined) min = '00';
    if (sec === undefined) sec = '00';
    if (sec === '') sec = '00';
    return("'year-month-day hours:min:sec'");
  }

  public relativeDateLiteral (days, base_date) {
    //  if (days !== undefined) throw new Error("SqlDatabase.relativeDateLiteral(): days must be supplied\n");
    if (base_date == null) return("date_add(curdate(),INTERVAL "+days+" DAY)");
    else                    return("date_add('base_date',INTERVAL "+days+" DAY)");
  }

  public relativeDatetimeLiteral (days, hours, min, sec, base_datetime) {
    //  if (days !== undefined) throw new Error("SqlDatabase.relativeDatetimeLiteral(): days must be supplied\n");
    if (hours === undefined) hours = '00';
    if (min === undefined) min = '00';
    if (sec === undefined) sec = '00';
    // if (days == intval(days)) {
    //     if (base_date == null) return("date_add(now(),INTERVAL 'days hours:min:sec' DAY_SECOND)");
    //     else                    return("date_add('base_datetime',INTERVAL 'days hours:min:sec' DAY_SECOND)");
    // }
    // else {
    //     if (base_date == null) return("date_add(now(),INTERVAL days DAY)");
    //     else                    return("date_add('base_date',INTERVAL days DAY)");
    // }
  }

  protected initSqlDatabase () {
  }

  public getPrimaryKeyColumn (tableName: string, tableDef?: DBTableDef) {
    if (this.debug) console.log("ENTER: SqlDatabase.getPrimaryKeyColumn(): ",arguments);
    if (!tableDef) tableDef = this.getTableDef(tableName);
    let primaryKeyColumn: string;
    if (tableDef.primaryKey) {
      if (tableDef.primaryKey.length == 1) {
        primaryKeyColumn = tableDef.primaryKey[0];
      }
    }
    if (this.debug) console.log("EXIT:  SqlDatabase.getPrimaryKeyColumn()",primaryKeyColumn);
    return(primaryKeyColumn);
  }

  public makeCanonicalTableDef (tableDef: DBTableDef) {
    // console.log("SqlDatabase.makeCanonicalTableDef()", tableDef);
    if (this.debug) console.log("ENTER: SqlDatabase.makeCanonicalTableDef(): ",arguments);
    if (!(tableDef !== undefined)) throw new Error("tableDef !== undefined");

    let tableName = tableDef.tableName;
    if (!tableName) throw new Error("Cannot make create tableName ddl without a tableName name");

    if (!tableDef.tableLabel) {
      tableDef.tableLabel = this.makeLabel(tableName);
    }

    if (!tableDef.column) {
      tableDef.column = {};
    }
    let columnDefs: DBColumnDefs  = tableDef.column;

    let columns     = tableDef.defaultColumns || tableDef.physColumns || [];

    if (columns.length === 0) {
      if (tableDef.column) {
        for (let column in tableDef.column) {
          if (columnDefs[column] && columnDefs[column].nativeColumn) {
            columns.push(column);
          }
        }
        tableDef.defaultColumns = columns;
      }
    }

    if (columns.length === 0) {
      throw new Error("Either 'column', 'defaultColumns' or 'physColumns' must be supplied in order to have a complete canonical tableName definition");
    }

    let columnDef: DBColumnDef;
    let matches, columnType;
    for (let i = 0; i < columns.length; i++) {
      let columnName = columns[i];
      columnDef = columnDefs[columnName];
      // console.log("XXX tableName.columnDef");
      let primaryKeyInd    = null;
      let autoIncrementInd = null;
      let maxLength        = null;
      let notNullInd       = 'N';
      if (matches = columnName.match(/^([a-z0-9_]+):([a-z]+):?([0-9]*)$/)) {
        columnName = matches[1];
        columnType = matches[2];
        maxLength  = matches[3];
      }
      else {
        columnType = null;
        maxLength  = null;
      }
      // columns.push(columnName);
      // let newColumnDef = 0;
      if (!columnDefs[columnName]) {
        columnDefs[columnName] = {};
        // newColumnDef = 1;
      }
      if (!columnDefs[columnName]['nativeColumn'] && !columnDefs[columnName]['physicalInd']) {
        columnDefs[columnName]['physicalInd'] = "N";
      }
      if (!columnDefs[columnName]['columnName'])  columnDefs[columnName]['columnName']  = columnName;
      if (!columnDefs[columnName]['columnType']) {
        if (!columnType) {
          if (columnName === 'id' || columnName.match(/_id$/)) {
            columnType = 'integer';
            if (i == 0) {
              notNullInd = 'Y';
              primaryKeyInd = 'Y';
              autoIncrementInd = 'Y';
            }
          }
          else if (columnName.match(/_(dt|date)$/)) {
            columnType = 'date';
          }
          else if (columnName.match(/_dttm$/)) {
            columnType = 'datetime';
          }
          else {
            columnType = 'string';
            maxLength  = 80;
          }
        }
        columnDefs[columnName]['columnType']  = columnType;
        if (maxLength && !columnDefs[columnName]['maxLength']) columnDefs[columnName]['maxLength'] = maxLength;
      }
      if (!columnDefs[columnName]['notNullInd'])       { columnDefs[columnName]['notNullInd']  = notNullInd; }
      if (!columnDefs[columnName]['numberOfDecimals']) { columnDefs[columnName]['numberOfDecimals'] = null; }
      // console.log("SqlDatabase.makeCanonicalTableDef() i columnName", i, columnName);
    }
    tableDef.defaultColumns = columns;

    //debug_print(json_encode(tableDef,JSON_PRETTY_PRINT));
    if (this.debug) console.log("EXIT:  SqlDatabase.makeCanonicalTableDef()",tableDef);
  }

  public nativeTypeToAppType (
    nativeColumnType: string,
    maxLength?: number,
    numberOfDecimals?: number,
    columnName?: string
  ) {
    if (this.debug) console.log("ENTER: SqlDatabase.nativeTypeToAppType(): ",arguments);

    nativeColumnType = nativeColumnType.toLowerCase();
    let matches: string[];
    let columnType: string;
    if (matches = nativeColumnType.match(/^([a-zA-Z]+)\(([0-9]+),?([0-9]*)\)/)) {
      nativeColumnType = matches[1];
      if (matches[2]) maxLength  = parseInt(matches[2], 10);
      if (matches[3]) numberOfDecimals = parseInt(matches[3], 10);
    }

    let datetimePatterns = [ "_dttm$", "Dttm$" ];
    if (nativeColumnType === 'date' ||
      nativeColumnType === 'datetime' ||
      nativeColumnType === 'time') {
      columnType = nativeColumnType;
      // Some databases (Oracle) don't distinguish between dates and datetimes.
      // If a columnName is supplied, it provides the hint we are looking for to determine if it is a datetime.
      if (columnType === 'date' && columnName) {
        // context_options = this.locator.options();
        // datetimePatterns = context_options.datetimePatterns ?  context_options.datetimePatterns : '_dttm$';
        // datetimePatterns = datetimePatterns.split(',');
        let len = datetimePatterns.length;
        for (let i = 0; i < len; i++) {
          let datetimePattern = datetimePatterns[i];
          let re = new RegExp(datetimePattern);
          if (columnName.match(re)) {
            columnType = 'datetime';
            break;
          }
        }
      }
    }
    else if (nativeColumnType === 'timestamp') {
      columnType = 'datetime';
    }
    else if (nativeColumnType.match(/(int|signed)/)) {
      columnType = 'integer';
    }
    else if (nativeColumnType.match(/(number|decimal)/) && numberOfDecimals && numberOfDecimals <= 0) {
      columnType = 'integer';
    }
    else if (nativeColumnType.match(/(number|decimal|float|real|double)/)) {
      columnType = 'float';
    }
    else if (nativeColumnType.match(/(text|clob)/)) {
      columnType = 'text';
    }
    else if (nativeColumnType.match(/(blob|bin)/)) {
      columnType = 'blob';
    }
    else if (nativeColumnType.match(/string/)) {
      columnType = 'string';
    }
    else if (nativeColumnType.match(/(char|enum|set)/)) {
      columnType = (maxLength == null || maxLength < 256) ? 'string' : 'text';
    }
    else if (nativeColumnType.match(/(long|short)/)) {
      columnType = 'integer';
    }
    else {
      columnType = 'blob';
    }
    if (this.debug) console.log("EXIT:  SqlDatabase.nativeTypeToAppType()",columnType);
    return columnType;
  }

  // ======================================================================
  // Database Maintenance
  // ======================================================================
  public async checkDatabaseStructure () {
    for (let tableName in this.tableDefs) {
      let tableDef = this.tableDefs[tableName];
      let objects = await this.getObjects(tableName, null, null, { limit: 1 });
      // console.log("Table %s: ", tableName, objects);
    }
  }
  public async fixDatabaseStructure () {

  }
}
