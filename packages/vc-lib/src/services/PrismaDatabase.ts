
import { Config } from './Config';
import { DataOptions, DBTableDef } from '../classes/DBInterfaces';
import { PrismaClient } from '@prisma/client';
import * as lodash from 'lodash';
import { BaseDatabase } from './BaseDatabase';
import { IDatabase } from './IDatabase';

  // {"name":"id","kind":"scalar","isList":false,"isRequired":true,"isUnique":false,"isId":true,"isReadOnly":false,"hasDefaultValue":true,"type":"Int","default":{"name":"autoincrement","args":[]},"isGenerated":false,"isUpdatedAt":false}
  // {"name":"status","kind":"scalar","isList":false,"isRequired":true,"isUnique":false,"isId":false,"isReadOnly":false,"hasDefaultValue":true,"type":"String","default":"draft","isGenerated":false,"isUpdatedAt":false}
  // {"name":"sort","kind":"scalar","isList":false,"isRequired":false,"isUnique":false,"isId":false,"isReadOnly":false,"hasDefaultValue":false,"type":"Int","isGenerated":false,"isUpdatedAt":false}
  // {"name":"user_created","kind":"scalar","isList":false,"isRequired":false,"isUnique":false,"isId":false,"isReadOnly":true,"hasDefaultValue":false,"type":"String","isGenerated":false,"isUpdatedAt":false}
  // {"name":"date_created","kind":"scalar","isList":false,"isRequired":false,"isUnique":false,"isId":false,"isReadOnly":false,"hasDefaultValue":false,"type":"DateTime","isGenerated":false,"isUpdatedAt":false}
  // {"name":"user_updated","kind":"scalar","isList":false,"isRequired":false,"isUnique":false,"isId":false,"isReadOnly":true,"hasDefaultValue":false,"type":"String","isGenerated":false,"isUpdatedAt":false}
  // {"name":"date_updated","kind":"scalar","isList":false,"isRequired":false,"isUnique":false,"isId":false,"isReadOnly":false,"hasDefaultValue":false,"type":"DateTime","isGenerated":false,"isUpdatedAt":false}
  // {"name":"pageShortName","kind":"scalar","isList":false,"isRequired":false,"isUnique":false,"isId":false,"isReadOnly":false,"hasDefaultValue":false,"type":"String","isGenerated":false,"isUpdatedAt":false}
  // {"name":"pageMetaTitle","kind":"scalar","isList":false,"isRequired":false,"isUnique":false,"isId":false,"isReadOnly":false,"hasDefaultValue":false,"type":"String","isGenerated":false,"isUpdatedAt":false}
  // {"name":"pageMetaDescription","kind":"scalar","isList":false,"isRequired":false,"isUnique":false,"isId":false,"isReadOnly":false,"hasDefaultValue":false,"type":"String","isGenerated":false,"isUpdatedAt":false}
  // {"name":"pageMetaImage","kind":"scalar","isList":false,"isRequired":false,"isUnique":false,"isId":false,"isReadOnly":true,"hasDefaultValue":false,"type":"String","isGenerated":false,"isUpdatedAt":false}
  // {"name":"htmlTitle","kind":"scalar","isList":false,"isRequired":false,"isUnique":false,"isId":false,"isReadOnly":false,"hasDefaultValue":false,"type":"String","isGenerated":false,"isUpdatedAt":false}
  // {"name":"websiteId","kind":"scalar","isList":false,"isRequired":false,"isUnique":false,"isId":false,"isReadOnly":true,"hasDefaultValue":false,"type":"Int","isGenerated":false,"isUpdatedAt":false}
  // {"name":"pagePath","kind":"scalar","isList":false,"isRequired":false,"isUnique":false,"isId":false,"isReadOnly":false,"hasDefaultValue":false,"type":"String","isGenerated":false,"isUpdatedAt":false}
  // {"name":"pageHostPath","kind":"scalar","isList":false,"isRequired":false,"isUnique":false,"isId":false,"isReadOnly":false,"hasDefaultValue":false,"type":"String","isGenerated":false,"isUpdatedAt":false}
  // {"name":"isPrimaryNav","kind":"scalar","isList":false,"isRequired":true,"isUnique":false,"isId":false,"isReadOnly":false,"hasDefaultValue":true,"type":"Boolean","default":false,"isGenerated":false,"isUpdatedAt":false}
  // {"name":"directus_files","kind":"object","isList":false,"isRequired":false,"isUnique":false,"isId":false,"isReadOnly":false,"hasDefaultValue":false,"type":"directus_files","relationName":"directus_filesTows_page","relationFromFields":["pageMetaImage"],"relationToFields":["id"],"isGenerated":false,"isUpdatedAt":false}
  // {"name":"directus_users_directus_usersTows_page_user_created","kind":"object","isList":false,"isRequired":false,"isUnique":false,"isId":false,"isReadOnly":false,"hasDefaultValue":false,"type":"directus_users","relationName":"directus_usersTows_page_user_created","relationFromFields":["user_created"],"relationToFields":["id"],"relationOnDelete":"Restrict","isGenerated":false,"isUpdatedAt":false}
  // {"name":"directus_users_directus_usersTows_page_user_updated","kind":"object","isList":false,"isRequired":false,"isUnique":false,"isId":false,"isReadOnly":false,"hasDefaultValue":false,"type":"directus_users","relationName":"directus_usersTows_page_user_updated","relationFromFields":["user_updated"],"relationToFields":["id"],"relationOnDelete":"Restrict","isGenerated":false,"isUpdatedAt":false}
  // {"name":"ws_website","kind":"object","isList":false,"isRequired":false,"isUnique":false,"isId":false,"isReadOnly":false,"hasDefaultValue":false,"type":"ws_website","relationName":"ws_pageTows_website","relationFromFields":["websiteId"],"relationToFields":["id"],"isGenerated":false,"isUpdatedAt":false}
  // {"name":"ws_section","kind":"object","isList":true,"isRequired":true,"isUnique":false,"isId":false,"isReadOnly":false,"hasDefaultValue":false,"type":"ws_section","relationName":"ws_pageTows_section","relationFromFields":[],"relationToFields":[],"isGenerated":false,"isUpdatedAt":false}

export interface PrismaColumnDef {
  name:                       string;   // "ws_website", "ws_section"
  kind?:                      string;   // "object", "object", "scalar"
  isList?:                    boolean;   // false, true
  type?:                      string;    // "Int", "String", "DateTime", "Boolean", "ws_website", "ws_section"
  isRequired?:                boolean;   // false, true
  isUnique?:                  boolean;   // false, false
  isId?:                      boolean;   // false, false
  isReadOnly?:                boolean;   // false, false
  hasDefaultValue?:           boolean;   // false, false
  default?:                   any;
  relationName?:              string;   // "ws_pageTows_website", "ws_pageTows_section"
  relationFromFields?:        string[];  // ["websiteId"], []
  relationToFields?:          string[];  // ["id"], []
  isGenerated?:               boolean;   // false, false
  isUpdatedAt?:               boolean;   // false, false
}

export interface PrismaRelationshipDef {
  relationshipName?:          string;
  fromTableName?:             string;
  fromColumn?:                string;
  toTableName?:               string;
  toColumn?:                  string;
  isMultiple?:                boolean;
  defaultSortKey?:            string;
  prismaRelationTag?:         string;  // @relation("prismaRelationTag"
  indexName?:                 string;  // map: "indexName"  indexName?:                 string;  // map: "indexName"
}

export interface PrismaRelationshipDefs {
  [relationshipName: string]: PrismaRelationshipDef;
}

export interface PrismaTableDef {
  name:                       string;
  dbName?:                    string;
  fields?:                    PrismaColumnDef[];
  field?:                     any;
  primaryKey?:                string[];
  uniqueFields?:              string[];   // [],
  uniqueIndexes?:             string[];   // [],
  isGenerated?:               boolean;    // false
  relationship?:              PrismaRelationshipDefs;
}

export interface PrismaTableDefs {
  [tableName: string]: PrismaTableDef;
}

export class PrismaDatabase extends BaseDatabase implements IDatabase {
  config: Config;
  prisma: PrismaClient;
  tableNames: string[];
  tableDef: any = {};
  nativeTableDef: any = {};

  columnOp = {
    eq: "equals",    // <Int>
    ne: "not",       // Int | NestedIntFilter
    in: "in",
    notin: "notIn",
    lt: "lt",        // Int
    le: "lte",       // Int
    gt: "gt",        // Int
    ge: "gte",       // Int
    startsWith: "startsWith",
    endsWith: "endsWith",
    contains: "contains",
    search: "search",
  };

  constructor () {
    super();
    this.prisma = new PrismaClient();
    let nativeTableDefs: PrismaTableDef[] = this.prisma["_baseDmmf"].datamodel.models;
    // console.log("constructor nativeTableDefs", nativeTableDefs);
    let natTableDefs: PrismaTableDefs = {};
    let tableNames: string[] = [];
    for (let nativeTableDef of nativeTableDefs) {
      let natTableDef: PrismaTableDef = lodash.clone(nativeTableDef);
      let tableName: string = natTableDef.name;
      tableNames.push(tableName);
      natTableDef.field = {};
      natTableDef.relationship = {};
      if (natTableDef.fields) {
        for (let field of natTableDef.fields) {
          if (field.kind === "scalar") {
            natTableDef.field[field.name] = field;
          }
          else if (field.kind === "object") {
            if (field.relationFromFields && field.relationFromFields.length === 1 && field.relationToFields && field.relationToFields.length === 1) {
              let relname = field.name;
              let rel: PrismaRelationshipDef = {
                relationshipName: relname,
                fromTableName: tableName,
                fromColumn: field.relationFromFields[0],
                toTableName: field.type,
                toColumn: field.relationToFields[0],
                isMultiple: field.isList,
              };
              natTableDef.relationship[relname] = rel;
              // console.log("relation [%s]: %s.%s => %s.%s (%s) %s", field.name, tableName, field.relationFromFields.join(","), field.type, field.relationToFields.join(","), field.isList ? "multi" : "single", field.relationName);
              // console.log("relation cooked %j", rel);
              // console.log("relation raw", field);
            }
            else if (field.isList) {
              let relname = field.name;
              let rel: PrismaRelationshipDef = {
                relationshipName: relname,
                fromTableName: tableName,
                // fromColumn: field.relationFromFields[0],
                toTableName: field.type,
                // toColumn: field.relationToFields[0],
                isMultiple: field.isList,
              };
              natTableDef.relationship[relname] = rel;
              // console.log("relation [%s]: %s => %s (%s) %s", field.name, tableName, field.type, field.isList ? "multi" : "single", field.relationName);
              // console.log("relation cooked %j", rel);
              // console.log("relation raw", field);
            }
          }
        }
        natTableDefs[tableName] = natTableDef;
      }
    }
    for (let tableName in natTableDefs) {
      let natTableDef = natTableDefs[tableName];
      let relationshipDefs = natTableDef.relationship;
      for (let relname in relationshipDefs) {
        let relationshipDef = relationshipDefs[relname];
        if (relationshipDef && relationshipDef.isMultiple) {
          let toTableName = relationshipDef.toTableName || "";
          let toTableDef = natTableDefs[toTableName];
          if (toTableDef && toTableDef.relationship) {
            for (let toTableRelname in toTableDef.relationship) {
              let toTableRelDef = toTableDef.relationship[toTableRelname];
              if (toTableRelDef.toTableName === tableName) {
                relationshipDef.fromColumn = toTableRelDef.toColumn;
                relationshipDef.toColumn = toTableRelDef.fromColumn;
                if (toTableDef.field.sort) {
                  relationshipDef.defaultSortKey = "sort";
                }
                // console.log("relation %s %j", tableName, relationshipDef);
              }
            }
          }
        }
      }
    }
    this.tableNames = tableNames;
    this.nativeTableDef = natTableDefs;
    // console.log("constructor", this.nativeTableDef);
  }

  init (config: Config) {
    this.config = config;
  }

  async getObjects(tableName: string, params: any, columns: string[], options: any = {}) {
    let verbose = options.verbose;
    if (verbose >= 7) console.log("PrismaDatabase.getObjects(%s)", tableName, params, columns, options);
    let tab = this.prisma[tableName];
    let nativeTableDef: PrismaTableDef = await this.getNativeTableDef(tableName);
    // console.log("nativeTableDef", nativeTableDef);
    if (!tab || !nativeTableDef) throw new Error(`Table [${tableName}] not defined`);
    let matches;

    let args: any = {};
    if (!columns) columns = [];
    // console.log("nativeTableDef", nativeTableDef);
    // this.printRelations(nativeTableDef);
    let select: any;
    if (columns.length === 0) {
      if (nativeTableDef.fields) {
        select = {};
        for (let field of nativeTableDef.fields) {
          if (field.kind === "scalar") {
            columns.push(field.name);
            select[field.name] = true;
          }
        }
      }
    }
    else {
      // let tableColumns: string[] = [];
      select = {};
      for (let column of columns) {
        if (column.indexOf(".") === -1) {
          // tableColumns.push(column);
          if (!select[column]) select[column] = true;
        }
        else {
          let colParts = column.split(/\./);
          let subSelect = select;
          let lenM1 = colParts.length - 1;
          let relationshipDefs = nativeTableDef.relationship;
          for (let i = 0; i <= lenM1; i++) {
            let part = colParts[i];
            if (i < lenM1) {
              if (!subSelect[part] || typeof(subSelect[part]) !== "object") {
                subSelect[part] = { select: {} };
                if (i === 0 && relationshipDefs && relationshipDefs[part]) {
                  let relationshipDef = relationshipDefs[part];
                  if (relationshipDef.isMultiple && relationshipDef.defaultSortKey) {
                    let key = relationshipDef.defaultSortKey;
                    let sort = {};
                    sort[key] = "asc";
                    subSelect[part].orderBy = [sort];
                  }
                }
              }
              subSelect = subSelect[part].select;
            }
            else {
              subSelect[part] = true;
            }
          }
        }
      }
    }
    if (select) args.select = select;

    let where: any = this.makeWhere(tableName, nativeTableDef, params);
    if (where) args.where = where;

    if (options.distinct) {
      if (columns && columns.length) {
        args.distinct = columns;
      }
      else {
        console.log("WARNING: getObjects(%s): can't use distinct without specifying columns", tableName);
      }
    }

    if (options.offset) {
      args.skip = (typeof(options.offset) === "string") ? parseInt(options.offset, 10) : options.offset;
    }
    if (options.limit) {
      args.take = (typeof(options.limit) === "string") ? parseInt(options.limit, 10) : options.limit;
    }
    if (options.orderBy) {
      let orderBy: any[] = [];
      let orderByColumns = (typeof(options.orderBy) === "string") ? options.orderBy.split(/,/) : options.orderBy;
      for (let column of orderByColumns) {
        let ord = {};
        if (matches = column.match(/^(.*)\.(asc|desc)$/)) {
          ord[matches[1]] = matches[2];
        }
        else {
          ord[column] = "asc";
        }
        orderBy.push(ord);
      }
      args.orderBy = orderBy;
    }

    let objects: any[];
    if (!lodash.isEmpty(args)) {
      if (verbose >= 7) console.log("PrismaDatabase.getObjects() args", args);
      objects = await tab.findMany(args);
    }
    else {
      if (verbose >= 7) console.log("PrismaDatabase.getObjects() no args");
      objects = await tab.findMany();
    }
    return(objects);
  }

  printRelations(nativeTableDef) {
    console.log("PrismaDatabase.printRelations()");
    let sourceTable = nativeTableDef.name;
    if (nativeTableDef.fields) {
      for (let field of nativeTableDef.fields) {
        if (field.kind === "object") {
          if (field.relationFromFields && field.relationFromFields.length > 0 && field.relationToFields && field.relationToFields.length > 0) {
            console.log("relation [%s]: %s.%s => %s.%s (%s) %s", field.name, sourceTable, field.relationFromFields.join(","), field.type, field.relationToFields.join(","), field.isList ? "multi" : "single", field.relationName);
          }
          // else {
          //   console.log("relation field", field);
          // }
        }
      }
    }
  }

  // THESE OPERATIONS ARE DEFINED IN DBInterfaces.ts
  // eq?: string|number|boolean|null;
  // ne?: string|number|boolean|null;
  // lt?: string|number;
  // le?: string|number;
  // gt?: string|number;
  // ge?: string|number;
  // in?: string[]|number[];
  // notIn?: string[]|number[];
  // startsWith?: string;

  private makeWhere (tableName: string, nativeTableDef: PrismaTableDef, params: any) {
    let where: any = {};
    let whereUsed = false;
    if (typeof(params) === "number") { where = { id: params } }
    else if (typeof(params) === "string") { where = { id: params } }
    else if (typeof(params) === "object") {
      where = {};
      for (let param in params) {
        if (typeof(params[param]) === "object") {
          for (let op in params[param]) {
            if (this.columnOp[op]) {
              let value = params[param][op];
              let nativeColumnDef = nativeTableDef.field[param];
              if (nativeColumnDef && nativeColumnDef.kind === "scalar" && typeof(value) === "string") {
                if (op === "in" || op === "notin") {
                  if (typeof(value) === "string") value = value.split(/,/);
                  if (nativeColumnDef.type === "Int" || nativeColumnDef.type === "BigInt") {
                    for (let i = 0; i < value.length; i++) {
                      if (typeof(value[i]) === "string") value[i] = parseInt(value[i], 10);
                    }
                  }
                  else if (nativeColumnDef.type === "Float" || nativeColumnDef.type === "Decimal") {
                    for (let i = 0; i < value.length; i++) {
                      if (typeof(value[i]) === "string") value[i] = parseFloat(value[i]);
                    }
                  }
                }
                else {
                  if (nativeColumnDef.type === "Int" || nativeColumnDef.type === "BigInt") value = parseInt(value, 10);
                  else if (nativeColumnDef.type === "Float" || nativeColumnDef.type === "Decimal") value = parseFloat(value);
                }
              }
              else {
                console.log("WARNING: skipped param [%s] because the column was not in the native table def", param);
              }
              if (!where[param]) where[param] = {};
              if (typeof(where[param]) === "object") {
                where[param][this.columnOp[op]] = value;
                whereUsed = true;
              }
            }
            else {
              console.log("WARNING: op [%s] not implemented", op);
            }
          }
        }
        else {
          // console.log("XXX here 0");
          let value = params[param];
          // console.log(nativeTableDef);
          let nativeColumnDef = nativeTableDef.field[param];
          if (nativeColumnDef && nativeColumnDef.kind === "scalar") {
            if (typeof(value) === "string") {
              if (nativeColumnDef.type === "Int" || nativeColumnDef.type === "BigInt") value = parseInt(value, 10);
              else if (nativeColumnDef.type === "Float" || nativeColumnDef.type === "Decimal") value = parseFloat(value);
            }
            where[param] = params[param];
            whereUsed = true;
          }
          else {
            console.log("WARNING: skipped param [%s] because the column was not in the native table def", param);
          }
        }
      }
    }
    // console.log("XXX PrismaDatabase.makeWhere() where", where);
    return(whereUsed ? where : null);
  }

  async getTableNames (pattern?: string) {
    // console.log("PrismaDatabase.getTableNames(%s)", pattern);
    let tableNames: string[] = [];
    let regexp;
    if (pattern) {
      regexp = new RegExp(pattern, "i");
    }
    for (let tableName of this.tableNames) {
      if (!regexp || tableName.match(regexp)) {
        tableNames.push(tableName);
      }
    }
    return(tableNames);
  }

  getNativeTableDef (tableName: string): PrismaTableDef {
    // console.log("PrismaDatabase.getNativeTableDef(%s)", tableName);
    // let tab = this.prisma[tableName];
    let nativeTableDef: PrismaTableDef = this.nativeTableDef[tableName];
    // console.log("getNativeTableDef(%s)", tableName, nativeTableDef);
    return(nativeTableDef);
  }

  getTableDef (tableName: string): DBTableDef {
    // console.log("PrismaDatabase.getTableDef(%s)", tableName);
    let tableDef: DBTableDef = this.tableDef[tableName];
    if (!tableDef) {
      let nativeTableDef: PrismaTableDef = this.nativeTableDef[tableName];
      if (nativeTableDef) tableDef = this.makeTableDef(nativeTableDef);
      this.tableDef[tableName] = tableDef;
    }
    // console.log("getTableDef(%s)", tableName, tableDef);
    return(tableDef);
  }

  private makeTableDef(nativeTableDef: PrismaTableDef): DBTableDef {
    let tableName = nativeTableDef.name;
    let aliasUsed = {};
    let tableDef: DBTableDef = {
      tableName: tableName,
      tableLabel: this.makeLabel(tableName),
      tableAlias: this.makeAlias(tableName, {}),
      column: {}
    };
    if (nativeTableDef.fields) {
      if (!tableDef.column) tableDef.column = {};
      for (let nativeColumnDef of nativeTableDef.fields) {
        if (nativeColumnDef.kind === "scalar") {
          let columnName = nativeColumnDef.name;
          let nativeType = nativeColumnDef.type;

          let type = "string";
          if (nativeType === 'Int') type = "integer";
          else if (nativeType === 'BigInt') type = "integer";
          else if (nativeType === 'Float') type = "float";
          else if (nativeType === 'Decimal') type = "float";
          else if (nativeType === 'String') type = "string";
          else if (nativeType === 'Boolean') type = "boolean";
          else if (nativeType === 'DateTime') type = "datetime";
          else if (nativeType === 'Date') type = "date";
          else if (nativeType === 'Json') type = "json";
          else if (nativeType === 'Bytes') type = "blob";

          let columnDef = {
            columnName: nativeColumnDef.name,
            alias: this.makeAlias(columnName, aliasUsed),
            type: type,
          };
          tableDef.column[columnName] = columnDef;
        }
      }
      for (let columnName in tableDef.column) {
        let columnDef = tableDef.column[columnName];
        columnDef.label = this.makeLabel(columnName, tableName, tableDef);
        // columnDef.alias = this.makeAlias(columnName, aliasUsed);
      }
    }
    return(tableDef);
  }

  async connect() {
    await this.prisma.$connect()
  }

  disconnect() {
    this.prisma.$disconnect();
  }

  printNativeTableDef (tableDef: PrismaTableDef) {
    console.log("{");
    console.log(`  name: %j,`, tableDef.name);
    console.log(`  dbName: %j,`, tableDef.dbName);
    console.log(`  fields: [`);
    if (tableDef.fields) {
      for (let field of tableDef.fields) {
        this.printNativeColumnDef(field);
      }
    }
    console.log(`  ]`);
    console.log(`  primaryKey: %j,`, tableDef.primaryKey);
    console.log(`  uniqueFields: %j,`, tableDef.uniqueFields);
    console.log(`  uniqueIndexes: %j,`, tableDef.uniqueIndexes);
    console.log(`  isGenerated: %j`, tableDef.isGenerated);
    console.log("}");
  }

  getPathname(options) {

  }

  // name:                       string;   // "ws_website", "ws_section"
  // kind?:                      string;   // "object", "object", "scalar"
  // isList?:                    boolean;   // false, true
  // type?:                      string;    // "Int", "String", "DateTime", "Boolean", "ws_website", "ws_section"
  // isRequired?:                boolean;   // false, true
  // isUnique?:                  boolean;   // false, false
  // isId?:                      boolean;   // false, false
  // isReadOnly?:                boolean;   // false, false
  // hasDefaultValue?:           boolean;   // false, false
  // relationName?:              string;   // "ws_pageTows_website", "ws_pageTows_section"
  // relationFromFields?:        string[];  // ["websiteId"], []
  // relationToFields?:          string[];  // ["id"], []
  // isGenerated?:               boolean;   // false, false
  // isUpdatedAt?:               boolean;   // false, false
  private printNativeColumnDef (fieldDef: PrismaColumnDef) {
    // console.log(`    // %j`, fieldDef);
    let name = (fieldDef.relationFromFields) ? (fieldDef.relationFromFields.length > 0 ? "TO-ONE-RELATIONSHIP" : "TO-MANY-RELATIONSHIP") : fieldDef.name;
    let str = "    " + this.format(name, 28) + "  ";
    let type = (fieldDef.kind === "scalar") ? fieldDef.type : (fieldDef.isList ? (fieldDef.type + "[]") : fieldDef.type);
    str += this.format(type, 28) + "  ";
    if (fieldDef.isId) str += "  ID";
    if (fieldDef.isRequired) str += "  REQD";
    if (fieldDef.isUnique) str += "  UNIQ";
    if (fieldDef.isReadOnly) str += "  RDONLY";
    if (fieldDef.hasDefaultValue) str += "  DEFAULT=" + (typeof(fieldDef.default) === "object" ? "AUTO_INCR" : fieldDef.default);
    if (name === "TO-ONE-RELATIONSHIP") {
      let from = (fieldDef.relationFromFields ? fieldDef.relationFromFields.join("|") : "UNK");
      let to = fieldDef.type + "." + (fieldDef.relationToFields ? fieldDef.relationToFields.join("|") : "UNK");
      str += `  [${from} => ${to}]`;
    }
    else if (name === "TO-MANY-RELATIONSHIP") {
      let from = "id";
      let to = fieldDef.type + ".UNK";
      str += `  [${from} => ${to}]`;
    }
    console.log(str);
  }
}

