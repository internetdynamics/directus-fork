
import { DBTableDef, DBColumnDef, DBTableDefs } from './DBInterfaces';
// import * as lodash from 'lodash';
// import * as fs from 'fs';
import { PrismaDatabase } from '../services/PrismaDatabase';
import { IDatabase } from '../services/IDatabase';

export interface DirectusColumnDef {
  id?:                        number;   // int(10) UN AI PK 
  collection?:                string;   // varchar(64) 
  field?:                     string;   // varchar(64) 
  special?:                   string;   // varchar(64) 
  interface?:                 string;   // varchar(64) 
  options?:                   string;   // longtext 
  display?:                   string;   // varchar(64) 
  display_options?:           string;   // longtext 
  readonly?:                  boolean;  // tinyint(1) 
  hidden?:                    boolean;  // tinyint(1) 
  sort?:                      number;   // int(10) UN 
  width?:                     string;   // varchar(30) 
  translations?:              string;   // longtext 
  note?:                      string;   // text 
  conditions?:                string;   // longtext 
  required?:                  boolean;  // tinyint(1) 
  group?:                     string;   // varchar(64) 
  validation?:                string;   // longtext 
  validation_message?:        string;   // text

  rel?:                       DirectusRelationshipDef;
}

export interface DirectusColumnDefs {
  [columnName: string]: DirectusColumnDef;
}

export interface DirectusRelationshipDef {
  id?:                        string;  // int(10) UN AI PK 
  many_collection?:           string;  // varchar(64) 
  many_field?:                string;  // varchar(64) 
  one_collection?:            string;  // varchar(64) 
  one_field?:                 string;  // varchar(64) 
  one_collection_field?:      string;  // varchar(64) 
  one_allowed_collections?:   string;  // text 
  junction_field?:            string;  // varchar(64) 
  sort_field?:                string;  // varchar(64) 
  one_deselect_action?:       string;  // varchar(255)

  // relationshipName?:          string;
  // fromTableName?:             string;
  // fromColumn?:                string;
  // toTableName?:               string;
  // toColumn?:                  string;
  // isMultiple?:                boolean;
  // defaultSortKey?:            string;
  // onUpdate?:                  string;
  // onDelete?:                  string;
  // indexName?:                 string;  // map: "indexName"
}

export interface DirectusRelationshipDefs {
  [relationshipName: string]: DirectusRelationshipDef;
}

export interface DirectusPerm {
  id?:          number;    // 67,
  role?:        string;    // "fa8e4478-88ea-44da-b9e7-a8cc9da184bb",
  collection?:  string;    // "ws_website",
  action?:      string;    // "read",
  permissions?: string;    // any? "{}", "{\"_and\":[{\"groupId\":{\"_eq\":\"$CURRENT_USER.currentGroupId\"}}]}", "{\"_or\": [{\"role\": {\"_eq\": \"$CURRENT_ROLE\"}}, {\"role\": {\"_null\": true}}]}"
  validation?:  string;    // any? null, "{}",
  presets?:     string;    // any? null, "{\"groupId\":\"$CURRENT_USER.currentGroupId\"}"
  fields?:      string;    // any? "*", "favicon,footerLandscapeLogo"
}
export interface DirectusActionPerms {
  [action: string]: DirectusPerm;
}

export interface DirectusRolePerms {
  [role: string]: DirectusActionPerms;
}

export interface DirectusTableDef {
  collection?:                string;   // varchar(64) PK 
  icon?:                      string;   // varchar(30) 
  note?:                      string;   // text 
  display_template?:          string;   // varchar(255) 
  hidden?:                    boolean;  // tinyint(1) 
  singleton?:                 boolean;  // tinyint(1) 
  translations?:              string;   // longtext 
  archive_field?:             string;   // varchar(64) 
  archive_app_filter?:        boolean;  // tinyint(1) 
  archive_value?:             string;   // varchar(255) 
  unarchive_value?:           string;   // varchar(255) 
  sort_field?:                string;   // varchar(64) 
  accountability?:            string;   // varchar(255) 
  color?:                     string;   // varchar(255) 
  item_duplication_fields?:   string;   // longtext 
  sort?:                      number;   // int(11) 
  group?:                     string;   // varchar(64) 
  collapse?:                  string;   // varchar(255)

  columns?:                   string[];
  column?:                    DirectusColumnDefs;
  primaryKey?:                string[];
  uniqueFields?:              string[];   // [],
  uniqueIndexes?:             string[];   // [],
  toManyRels?:                DirectusRelationshipDef[];
  toOneRels?:                 DirectusRelationshipDef[];
  relationship?:              DirectusRelationshipDefs;
  perms?:                     DirectusRolePerms;
}

export interface DirectusTableDefs {
  [tableName: string]: DirectusTableDef;
}

export class DirectusSchema {
  db: IDatabase;
  nativeTableDef: any = {};
  tableDef: any = {};
  tableNames: string[];
  roleByName: any;
  roleById: any;
  permsByTable: any;
  reservedWord: any;

  constructor (db?: IDatabase) {
    if (db) {
      this.db = db;
    }
    else {
      this.db = new PrismaDatabase();
    }
    this.initReservedWords();
  }

  async init (options: any = {}) {
    this.nativeTableDef = await this.readDirectusSchema(options);
    this.tableNames = this.getNativeTableNames();
    this.tableDef = {};
    this.convertDirectusTableDefsToTableDefs(this.nativeTableDef, this.tableDef);
    let roles = await this.db.getObjects("directus_roles", {});
    this.roleById = this.db.makeObjectOfObjectsByKey(roles, "id");
    this.roleByName = this.db.makeObjectOfObjectsByKey(roles, "name");
    this.permsByTable = await this.db.getObjectOfObjectsByKeys("directus_permissions", {}, null, ["collection","role","action"], {orderBy: ["collection","role","action"]});
    for (let tableName in this.permsByTable) {
      if (this.nativeTableDef[tableName]) {
        this.nativeTableDef[tableName].perms = this.permsByTable[tableName];
      }
    }
    // console.log("permsByTable", this.permsByTable);
    // console.log("constructor", this.nativeTableDef);
  }

  printRelations(nativeTableDef) {
    console.log("DirectusDatabase.printRelations()");
    let sourceTable = nativeTableDef.name;
    if (nativeTableDef.columns) {
      for (let column of nativeTableDef.columns) {
        if (column.kind === "object") {
          if (column.relationFromFields && column.relationFromFields.length > 0 && column.relationToFields && column.relationToFields.length > 0) {
            console.log("relation [%s]: %s.%s => %s.%s (%s) %s", column.name, sourceTable, column.relationFromFields.join(","), column.type, column.relationToFields.join(","), column.isList ? "multi" : "single", column.relationName);
          }
          // else {
          //   console.log("relation column", column);
          // }
        }
      }
    }
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

  getNativeTableDef (tableName: string): DirectusTableDef {
    // console.log("DirectusDatabase.getNativeTableDef(%s)", tableName);
    // let tab = this.nativeTableDef[tableName];
    let nativeTableDef: DirectusTableDef = this.nativeTableDef[tableName];
    // console.log("getNativeTableDef(%s)", tableName, nativeTableDef);
    return(nativeTableDef);
  }

  getTableDef (tableName: string): DBTableDef {
    // console.log("DirectusDatabase.getTableDef(%s)", tableName);
    let tableDef: DBTableDef = this.tableDef[tableName];
    if (!tableDef) {
      let nativeTableDef: DirectusTableDef = this.nativeTableDef[tableName];
      if (nativeTableDef) tableDef = this.makeTableDef(nativeTableDef);
      this.tableDef[tableName] = tableDef;
    }
    // console.log("getTableDef(%s)", tableName, tableDef);
    return(tableDef);
  }

  private makeTableDef(nativeTableDef: DirectusTableDef): DBTableDef {
    let tableName = nativeTableDef.collection;
    let aliasUsed = {};
    let tableDef: DBTableDef = {
      tableName: tableName,
      tableLabel: this.makeLabel(tableName),
      tableAlias: this.makeAlias(tableName, {}),
      column: {}
    };
    // if (nativeTableDef.columns) {
    //   if (!tableDef.column) tableDef.column = {};
    //   for (let nativeColumnDef of nativeTableDef.columns) {
    //     if (nativeColumnDef.kind === "scalar") {
    //       let columnName = nativeColumnDef.name;
    //       let nativeType = nativeColumnDef.type;

    //       let type = "string";
    //       if (nativeType === 'Int') type = "integer";
    //       else if (nativeType === 'BigInt') type = "integer";
    //       else if (nativeType === 'Float') type = "float";
    //       else if (nativeType === 'Decimal') type = "float";
    //       else if (nativeType === 'String') type = "string";
    //       else if (nativeType === 'Boolean') type = "boolean";
    //       else if (nativeType === 'DateTime') type = "datetime";
    //       else if (nativeType === 'Date') type = "date";
    //       else if (nativeType === 'Json') type = "json";
    //       else if (nativeType === 'Bytes') type = "blob";

    //       let columnDef = {
    //         columnName: nativeColumnDef.name,
    //         alias: this.makeAlias(columnName, aliasUsed),
    //         type: type,
    //       };
    //       tableDef.column[columnName] = columnDef;
    //     }
    //   }
    //   for (let columnName in tableDef.column) {
    //     let columnDef = tableDef.column[columnName];
    //     columnDef.label = this.makeLabel(columnName, tableName, tableDef);
    //     // columnDef.alias = this.makeAlias(columnName, aliasUsed);
    //   }
    // }
    return(tableDef);
  }

  printNativeTableDef (tabdef: DirectusTableDef) {
    console.log("{");
    console.log(`  collection: %j,`, tabdef.collection);
    console.log(`  columns: [`);
    if (tabdef.columns) {
      for (let column of tabdef.columns) {
        this.printNativeColumnDef(tabdef.column[column]);
      }
    }
    console.log(`  ]`);
    console.log(`  primaryKey: %j,`, tabdef.primaryKey);
    console.log(`  uniqueFields: %j,`, tabdef.uniqueFields);
    console.log(`  uniqueIndexes: %j,`, tabdef.uniqueIndexes);
    console.log("}");
  }

  private printNativeColumnDef (columnDef: DirectusColumnDef) {
    console.log(`    // %j`, columnDef);
    // let name = (columnDef.relationFromFields) ? (columnDef.relationFromFields.length > 0 ? "TO-ONE-RELATIONSHIP" : "TO-MANY-RELATIONSHIP") : columnDef.name;
    // let str = "    " + this.format(name, 28) + "  ";
    // let type = (columnDef.kind === "scalar") ? columnDef.type : (columnDef.isList ? (columnDef.type + "[]") : columnDef.type);
    // str += this.format(type, 28) + "  ";
    // if (columnDef.isId) str += "  ID";
    // if (columnDef.isRequired) str += "  REQD";
    // if (columnDef.isUnique) str += "  UNIQ";
    // if (columnDef.isReadOnly) str += "  RDONLY";
    // if (columnDef.hasDefaultValue) str += "  DEFAULT=" + (typeof(columnDef.default) === "object" ? "AUTO_INCR" : columnDef.default);
    // if (name === "TO-ONE-RELATIONSHIP") {
    //   let from = (columnDef.relationFromFields ? columnDef.relationFromFields.join("|") : "UNK");
    //   let to = columnDef.type + "." + (columnDef.relationToFields ? columnDef.relationToFields.join("|") : "UNK");
    //   str += `  [${from} => ${to}]`;
    // }
    // else if (name === "TO-MANY-RELATIONSHIP") {
    //   let from = "id";
    //   let to = columnDef.type + ".UNK";
    //   str += `  [${from} => ${to}]`;
    // }
    // console.log(str);
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

  // export interface DirectusTableDef {
  //   name:                       string;
  //   dbName?:                    string;
  //   columns?:                    DirectusColumnDef[];
  //   column?:                     any;
  //   primaryKey?:                string[];
  //   uniqueFields?:              string[];   // [],
  //   uniqueIndexes?:             string[];   // [],
  //   isGenerated?:               boolean;    // false
  //   relationship?:              DirectusRelationshipDefs;
  // }
  
  // export interface DirectusColumnDef {
  //   name:                       string;   // "ws_website", "ws_section"
  //   kind?:                      string;   // "object", "object", "scalar"
  //   isList?:                    boolean;   // false, true
  //   type?:                      string;    // "Int", "String", "DateTime", "Boolean", "ws_website", "ws_section"
  //   isRequired?:                boolean;   // false, true
  //   isUnique?:                  boolean;   // false, false
  //   isId?:                      boolean;   // false, false
  //   isReadOnly?:                boolean;   // false, false
  //   hasDefaultValue?:           boolean;   // false, false
  //   default?:                   any;
  //   relationName?:              string;   // "ws_pageTows_website", "ws_pageTows_section"
  //   relationFromFields?:        string[];  // ["websiteId"], []
  //   relationToFields?:          string[];  // ["id"], []
  //   isGenerated?:               boolean;   // false, false
  //   isUpdatedAt?:               boolean;   // false, false
  // }

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

  async readDirectusSchema(options: any) {
    // let natTableDefs: DirectusTableDef[] = [];
    let nativeTableDefs: DirectusTableDefs = await this.db.getObjectOfObjectsByKey("directus_collections", {}, null, "collection");
    // console.log("XXX tables: %j", Object.keys(nativeTableDefs));
    let colDefsByTable: any = await this.db.getObjectOfObjectArraysByKey("directus_fields", {}, null, "collection");
    let reldefs: any = await this.db.getObjects("directus_relations", {});
    let relDefsToManyTable: any = this.db.makeObjectOfObjectArraysByKey(reldefs, "one_collection");
    let relDefsToOneTable: any = this.db.makeObjectOfObjectArraysByKey(reldefs, "many_collection");

    for (let collection in colDefsByTable) {
      let coldefs = colDefsByTable[collection];
      if (coldefs && coldefs.length > 0) {
        // console.log("XXX %s: num columns %s", collection, coldefs.length);
        let columnDefs: DirectusColumnDefs = this.db.makeObjectOfObjectsByKey(coldefs, "field");
        if (nativeTableDefs[collection]) {
          nativeTableDefs[collection].columns = Object.keys(columnDefs);
          nativeTableDefs[collection].column = columnDefs;
        }
        else {
          // console.log("WARNING: collection [%s] has columns but no tableDef", collection);
          nativeTableDefs[collection] = {
            collection: collection,
            columns: Object.keys(columnDefs),
            column: columnDefs,
          };
        }
      }
      else {
        console.log("WARNING: collection [%s] has no columns", collection);
      }
    }
    for (let table in nativeTableDefs) {
      let natTableDef = nativeTableDefs[table];
      if (natTableDef) {
        if (relDefsToManyTable[table]) {
          let rels = relDefsToManyTable[table];
          natTableDef.toManyRels = rels;
          for (let rel of rels) {
            
          }
        }
        if (relDefsToOneTable[table]) {
          let rels = relDefsToOneTable[table];
          natTableDef.toOneRels = rels;
        }
      }
    }
    // console.log("XXX relDefsByTable", relDefsByTable.group_memb);
    // let natTableDef: DirectusTableDef;
    // let models: string[] = [];
    // let model: string;
    // let matches: string[];

    // // for each file fragment, parse the nativeTableDef
    // for (let f = 1; f < numFrags; f++) {
    //   let modelFrag = modelFrags[f];
    //   // console.log("modelFrag [%s]", modelFrag);
    //   if (matches = modelFrag.match(/^([a-zA-Z_][a-zA-Z0-9_]*) \{/)) {
    //     model = matches[1];
    //     models.push(model);
    //     modelFrag = modelFrag.replace(/^([a-zA-Z_][a-zA-Z0-9_]*) \{\n  /,"").replace(/\n\}[\n ]*$/,"");
    //     let columnFrags = modelFrag.split(/\n+ */); 
    //     let columns: DirectusColumnDef[] = [];
    //     let column: DirectusColumnDef;
    //     let columnDefs: DirectusColumnDefs = {};
    //     let primaryKey: string[] = [];
    //     let uniqueFields: string[] = [];
    //     let uniqueIndexes: string[] = [];
    //     let relationship: DirectusRelationshipDef;
    //     let relationshipDefs: DirectusRelationshipDefs = {};
    //     for (let columnFrag of columnFrags) {
    //       if (matches = columnFrag.match(/^([a-zA-Z_][a-zA-Z0-9_]*) +(String|Int|BigInt|Float|Decimal|Json|DateTime|Date|Boolean|Bytes|Unsupported)(\??) *(.*)/)) {
    //         column = {
    //           name: matches[1],
    //           kind: "scalar",
    //           isList: false,
    //           type: matches[2],
    //           isRequired: (matches[3] === "?" ? false : true),
    //           // isUnique: false,
    //           // isId: false,
    //           // isReadOnly: false,
    //           // hasDefaultValue: false,
    //           // isGenerated: false,
    //           // isUpdatedAt: false
    //         };
    //         let rest = matches[4];
    //         if (rest) {
    //           // TODO
    //           // @db.LongText
    //           if (matches = rest.match(/@db.([A-Za-z\(0-9\)]+)/)) {
    //             column.nativeType = matches[1].toLowerCase();
    //           }
    //         }
    //         columns.push(column);
    //       }
    //       else if (matches = columnFrag.match(/^([a-zA-Z_][a-zA-Z0-9_]*) +([a-zA-Z_][a-zA-Z0-9_]*)(\??)([\[\]]*) *(.*)/)) {
    //         column = {
    //           name: matches[1],
    //           kind: "object",
    //           isList: (matches[4] === "[]" ? true : false),
    //           type: matches[2],
    //           isRequired: (matches[3] === "?" ? false : true),
    //           // isUnique: false,
    //           // isId: false,
    //           // isReadOnly: false,
    //           // hasDefaultValue: false,
    //           // isGenerated: false,
    //           // isUpdatedAt: false
    //         };
    //         relationship = {
    //           relationshipName: column.name,
    //           fromTableName: model,
    //           toTableName: column.type,
    //           isMultiple: column.isList,
    //         };
    //         let rest = matches[5];
    //         if (rest) {
    //           // TODO
    //           // {"name":"directus_files","isList":false,"type":"directus_files","relationName":"directus_filesTows_page","relationFromFields":["pageMetaImage"],"relationToFields":["id"],"isGenerated":false,"isUpdatedAt":false}
    //           // {"name":"directus_users_directus_usersTows_page_user_created","kind":"object","isList":false,"type":"directus_users","relationName":"directus_usersTows_page_user_created","relationFromFields":["user_created"],"relationToFields":["id"],"relationOnDelete":"Restrict","isGenerated":false,"isUpdatedAt":false}
    //           // {"name":"directus_users_directus_usersTows_page_user_updated","kind":"object","isList":false,"type":"directus_users","relationName":"directus_usersTows_page_user_updated","relationFromFields":["user_updated"],"relationToFields":["id"],"relationOnDelete":"Restrict","isGenerated":false,"isUpdatedAt":false}
    //           // {"name":"ws_website","kind":"object","isList":false,"type":"ws_website","relationName":"ws_pageTows_website","relationFromFields":["websiteId"],"relationToFields":["id"],"isGenerated":false,"isUpdatedAt":false}
    //           // {"name":"ws_section","kind":"object","isList":true,"isRequired":true,"isUnique":false,"isId":false,"isReadOnly":false,"hasDefaultValue":false,"type":"ws_section","relationName":"ws_pageTows_section","relationFromFields":[],"relationToFields":[],"isGenerated":false,"isUpdatedAt":false}
    //           if (matches = rest.match(/@relation\("([a-zA-Z_][a-zA-Z0-9_]*)"/)) {
    //             relationship.relationshipName = matches[1];
    //           }
    //           // columns: [faviconId], references: [id], onUpdate: Restrict, map: "ws_website_favicon_foreign"
    //           if (matches = rest.match(/@relation.*columns: \[([a-zA-Z0-9_]+)\], references: \[([a-zA-Z0-9_]+)\]/)) {
    //             relationship.fromColumn = matches[1];
    //             relationship.toColumn = matches[2];
    //             column.relationFromFields = [ matches[1] ];
    //             column.relationToFields = [ matches[2] ];
    //           }
    //           if (matches = rest.match(/@relation.*onUpdate: ([A-Za-z]+)/)) {
    //             relationship.onUpdate = matches[1];
    //           }
    //           if (matches = rest.match(/@relation.*onDelete: ([A-Za-z]+)/)) {
    //             relationship.onDelete = matches[1];
    //           }
    //           if (matches = rest.match(/@relation.*map: "([A-Za-z0-9_]+)"/)) {
    //             relationship.indexName = matches[1];
    //           }
    //         }
    //         columns.push(column);
    //         column[column.name] = column;
    //         relationshipDefs[column.name] = relationship;
    //       }
    //     }
    //     natTableDef = {
    //       name: model,
    //       columns: columns,
    //       column: columnDefs,
    //       primaryKey: primaryKey,
    //       uniqueFields: uniqueFields,
    //       uniqueIndexes: uniqueIndexes,
    //       relationship: relationshipDefs,
    //     };
    //     // console.log("natTableDef", natTableDef);
    //     nativeTableDefs[model] = natTableDef;
    //   }
    //   else {
    //     console.log("File [%s] formatted badly at fragment [%s]", pathname, modelFrag);
    //     process.exit(1);
    //   }
    // }

    // // for each nativeTableDef, create a column[] lookup and relationship[] lookup
    // for (let tableName in nativeTableDefs) {
    //   let natTableDef: DirectusTableDef = nativeTableDefs[tableName];
    //   // tableNames.push(tableName);
    //   natTableDef.column = {};
    //   natTableDef.relationship = {};
    //   if (natTableDef.columns) {
    //     for (let column of natTableDef.columns) {
    //       if (column.kind === "scalar") {
    //         natTableDef.column[column.name] = column;
    //       }
    //       else if (column.kind === "object") {
    //         if (column.relationFromFields && column.relationFromFields.length === 1 && column.relationToFields && column.relationToFields.length === 1) {
    //           let relname = column.name;
    //           let rel: DirectusRelationshipDef = {
    //             relationshipName: relname,
    //             fromTableName: tableName,
    //             fromColumn: column.relationFromFields[0],
    //             toTableName: column.type,
    //             toColumn: column.relationToFields[0],
    //             isMultiple: column.isList,
    //           };
    //           natTableDef.relationship[relname] = rel;
    //           // console.log("relation [%s]: %s.%s => %s.%s (%s) %s", column.name, tableName, column.relationFromFields.join(","), column.type, column.relationToFields.join(","), column.isList ? "multi" : "single", column.relationName);
    //           // console.log("relation cooked %j", rel);
    //           // console.log("relation raw", column);
    //         }
    //         else if (column.isList) {
    //           let relname = column.name;
    //           let rel: DirectusRelationshipDef = {
    //             relationshipName: relname,
    //             fromTableName: tableName,
    //             // fromColumn: column.relationFromFields[0],
    //             toTableName: column.type,
    //             // toColumn: column.relationToFields[0],
    //             isMultiple: column.isList,
    //           };
    //           natTableDef.relationship[relname] = rel;
    //           // console.log("relation [%s]: %s => %s (%s) %s", column.name, tableName, column.type, column.isList ? "multi" : "single", column.relationName);
    //           // console.log("relation cooked %j", rel);
    //           // console.log("relation raw", column);
    //         }
    //       }
    //     }
    //   }
    // }

    // // for each nativeTableDef, for each isMultiple relationship, fill in the columns from the backward relationship
    // for (let tableName in nativeTableDefs) {
    //   let natTableDef = nativeTableDefs[tableName];
    //   let relationshipDefs = natTableDef.relationship;
    //   for (let relname in relationshipDefs) {
    //     let relationshipDef = relationshipDefs[relname];
    //     if (relationshipDef && relationshipDef.isMultiple) {
    //       let toTableName = relationshipDef.toTableName || "";
    //       let toTableDef = nativeTableDefs[toTableName];
    //       if (toTableDef && toTableDef.relationship) {
    //         for (let toTableRelname in toTableDef.relationship) {
    //           let toTableRelDef = toTableDef.relationship[toTableRelname];
    //           if (toTableRelDef.toTableName === tableName) {
    //             relationshipDef.fromColumn = toTableRelDef.toColumn;
    //             relationshipDef.toColumn = toTableRelDef.fromColumn;
    //             if (toTableDef.column.sort) {
    //               relationshipDef.defaultSortKey = "sort";
    //             }
    //             // console.log("relation %s %j", tableName, relationshipDef);
    //           }
    //         }
    //       }
    //     }
    //   }
    //   console.log("%s nativeTableDef.relationship", natTableDef.name, natTableDef.relationship);
    // }
    // console.log("%s : models [%s] %j", pathname, models.length, models);
    return(nativeTableDefs);
  }

  getNativeTableNames (nativeTableDefs?: DirectusTableDefs) {
    let tableNames: string[];
    if (this.tableNames && this.tableNames.length > 0) {
      tableNames = this.tableNames;
    }
    else {
      if (!nativeTableDefs) nativeTableDefs = this.nativeTableDef;
      tableNames = Object.keys(nativeTableDefs);
    }
    return(tableNames);
  }

  convertDirectusTableDefsToTableDefs (natTableDefs: DirectusTableDefs, tableDefs: DBTableDefs) {
    // console.log("constructor nativeTableDefs", nativeTableDefs);
  }

  protected initReservedWords () {
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

