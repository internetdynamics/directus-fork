
import { Config } from './Config';
import { DBTableDef } from '../classes/DBInterfaces';
import * as lodash from 'lodash';
import { BaseDatabase } from './BaseDatabase';
import { IDatabase } from './IDatabase';
import { PrismaTableDef, PrismaColumnDef } from './PrismaDatabase';
import { PrismaClient } from '@prisma/client';
// const { Directus } = require('@directus/sdk');
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

export class DirectusDatabase extends BaseDatabase implements IDatabase {
  config: Config;
  // directus: any;
  apiBaseUrl: string;

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
    this.apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
    if (!this.apiBaseUrl) {
      console.log("Error: NEXT_PUBLIC_API_BASE_URL environment variable not set");
      process.exit(0);
    }
    // this.directus = new Directus(this.apiBaseUrl);

    this.prisma = new PrismaClient();
    let nativeTableDefs: PrismaTableDef[] = this.prisma["_baseDmmf"].datamodel.models;
    // console.log("constructor nativeTableDefs", nativeTableDefs);
    let _nativeTableDefs: any = {};
    let tableNames: string[] = [];
    for (let nativeTableDef of nativeTableDefs) {
      let _nativeTableDef = lodash.clone(nativeTableDef);
      let tableName: string = _nativeTableDef.name;
      tableNames.push(tableName);
      _nativeTableDef.field = {};
      // _nativeTableDef.relationship = {};
      if (_nativeTableDef.fields) {
        for (let field of _nativeTableDef.fields) {
          if (field.kind === "scalar" || !field.relationFromFields) {
            _nativeTableDef.field[field.name] = field;
          }
          else {
            // let rel = "???";
            // _nativeTableDef.relationship[rel] = field;
          }
        }
        _nativeTableDefs[tableName] = _nativeTableDef;
      }
    }
    this.tableNames = tableNames;
    this.nativeTableDef = _nativeTableDefs;
    // console.log("constructor", this.nativeTableDef);
  }

  init (config: Config) {
    this.config = config;
  }

  async getObjects(tableName: string, params: any, columns: string[], options: any = {}) {
    // console.log("ClientDatabase.getObjects(%s)", tableName, params, columns, options);
    let apiBaseUrl = this.apiBaseUrl;
    let url = apiBaseUrl + "/items/" + tableName;
    let query: any[] = [];
    if (columns) {
        if (typeof(columns) === "string") query.push("fields=" + columns);
        else if (Array.isArray(columns)) query.push("fields=" + columns.join(","));
    }

    if (params) {
        let type = typeof(params);
        if (type === "string" || type === "number") query.push(`filter[id][_eq]=${params}`);
        else if (type === "object") {
            let matches, col, op;
            for (let param in params) {
                if (matches = param.match(/^(.*)\.(eq|ne|lt|le|gt|ge)$/)) {
                    col = matches[1];
                    op = matches[2];
                }
                else {
                    col = param;
                    op = "eq";
                }
                // console.log("XXX params: col [%s]", col)
                if (col.indexOf(".") === -1) {
                    query.push(`filter[${col}][_${op}]=${params[param]}`);
                }
                else {
                    let parts = col.split(/\./);
                    if (parts.length === 2) {
                        query.push(`deep[${parts[0]}][_filter][${parts[1]}][_${op}]=${params[param]}`);
                    }
                    else {
                        console.log("ERROR: 3rd Layer Deep Params not yet supported [%s]", col);
                    }
                }
            }
        }
    }

    if (options.orderBy) {
        let orderBy = options.orderBy;
        let matches, c, dir;
        let orderCols: string[] = [];
        if (typeof(orderBy) === "string") {
            orderBy = orderBy.split(/,/);
        }
        if (Array.isArray(orderBy)) {
            for (let col of orderBy) {
                if (col.match(/^(.+)\.(asc|desc)$/i)) {
                    c = matches[1];
                    dir = matches[2].toLowerCase();
                    if (dir === "desc") orderCols.push("-" + c);
                    else orderCols.push(c);
                }
                else {
                    orderCols.push(col);
                }
            }
            if (orderCols.length > 0) {
                query.push(`sort=${orderCols.join(",")}`);
            }
        }
        if (options.limit) {
            query.push(`limit=${options.limit}`);
        }
        if (options.offset) {
            query.push(`offset=${options.offset}`);
        }
        if (options.page) {
            query.push(`page=${options.page}`);
        }
    }

    if (query.length > 0) {
        url += "?" + query.join("&");
    }
    // console.log("XXX url [%s]", url);

    const res = await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    // console.log("XXX res.url", res.url);
    // console.log("XXX res.status", res.status);
    // console.log("XXX res.statusText", res.statusText);

    // let resHeaders = res.headers;
    // console.log("XXX resHeaders.get('content-security-policy')", resHeaders.get('content-security-policy'));
    // console.log("XXX resHeaders.get('x-powered-by')", resHeaders.get('x-powered-by'));
    // console.log("XXX resHeaders.get('content-type')", resHeaders.get('content-type'));
    // console.log("XXX resHeaders.get('content-length')", resHeaders.get('content-length'));
    // console.log("XXX resHeaders.get('etag')", resHeaders.get('etag'));
    // console.log("XXX resHeaders.get('date')", resHeaders.get('date'));

    let jsonResponse: any = await res.json()
    if (jsonResponse.errors && jsonResponse.errors.length > 0) {
        console.error("ERRORS:", jsonResponse.errors);
        let err = jsonResponse.errors[0];
        let errstr = err.message;
        if (err.extensions && err.extensions.code) {
            errstr += ` (${err.extensions.code})`;
        }
        errstr += ` (GET) (${url})`;
        throw new Error(errstr);
    }

    let objects;
    if (!jsonResponse.data || typeof (jsonResponse.data) !== "object" || jsonResponse.data.constructor.name === "Blob") {
        objects = [];
    }
    else {
        objects = jsonResponse.data || [];
    }
    return (objects);
  }

  async getTableNames (pattern?: string) {
    console.log("DirectusDatabase.getTableNames(%s)", pattern);
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
    // console.log("DirectusDatabase.getNativeTableDef(%s)", tableName);
    // let tab = this.prisma[tableName];
    let nativeTableDef: PrismaTableDef = this.nativeTableDef[tableName];
    // console.log("getNativeTableDef(%s)", tableName, nativeTableDef);
    return(nativeTableDef);
  }

  getTableDef (tableName: string): DBTableDef {
    // console.log("DirectusDatabase.getTableDef(%s)", tableName);
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

