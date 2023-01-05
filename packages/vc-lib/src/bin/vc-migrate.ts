// import { Config } from '../services/Config';
import { ArgvOptionParser } from '../classes/ArgvOptionParser';
import { PrismaDatabase } from '../services/PrismaDatabase';
import { DatabaseFileManager } from '../services/DatabaseFileManager';
import { IDatabase } from '../services/IDatabase';
import * as fs from 'fs';
const fsPromises = fs.promises;
import { exec } from 'child_process';
import { PrismaSchemaFile, PrismaTableDef, PrismaColumnDef } from '../classes/PrismaSchemaFile';
import { DirectusColumnDef, DirectusSchema, DirectusTableDef } from '../classes/DirectusSchema';
import printf from 'printf';
// import * as lodash from 'lodash';

let db: IDatabase = new PrismaDatabase() as IDatabase;

let appOptionDefs = {
  table: {
    description: "Restrict the operation to a single table (or a comma-separated list)"
  },
  uploadDir: {
    description: "Path to the files"
  },
  pathname: {
    description: "Path name for export/import"
  },
  dirname: {
    description: "Directory name (if pathname not given) for export/import"
  },
  filedate: {
    description: "File date (or file tag) (if pathname not given) for export/import"
  },
  fileext: {
    description: "File extension (if pathname not given) for export/import"
  },
  clobber: {
    description: "Clobber existing dir for export (default is false to create a sequence)"
  },
  regen: {
    description: "Regenerate Prisma models when export_schema (default=1)",
    type: "integer",
  },
  show_sql: {
    description: "Show the SQL statements"
  },
  verbose: {
    description: "Print diagnostic statements"
  }
};

let appOptions = {
  // op: "export_schema",
  table: "",
  // columns: "",
  // orderBy: "",
  // distinct: "",
  // offset: "",
  // limit: "",
  pathname: "",
  uploadDir: "../../api/uploads",
  dirname: "data",
  filedate: "dev",     // "prod" for production
  fileext: "json",
  clobber: 0,
  update: 0,
  regen: 1,
  show_sql: 0,
  verbose: 1,
  args: [],
};

function printUsage () {
  console.log();
  console.log("Usage: node dist/bin/vc-migrate.js [--options] <cmd> [<args>]");
  console.log();
  console.log("       node dist/bin/vc-migrate.js [--options] export             (export schema, data, files)");
  console.log("       node dist/bin/vc-migrate.js [--options] export_data_full   (export data, files)");
  console.log("       node dist/bin/vc-migrate.js [--options] export_schema      (export schema)");
  console.log("       node dist/bin/vc-migrate.js [--options] export_data        (export data)");
  console.log("       node dist/bin/vc-migrate.js [--options] export_files       (export files)");
  console.log("       node dist/bin/vc-migrate.js [--options] import             (import directus, schema, data, files)");
  console.log("       node dist/bin/vc-migrate.js [--options] import_schema_full (import directus, schema)");
  console.log("       node dist/bin/vc-migrate.js [--options] import_data_full   (import data, files)");
  console.log("       node dist/bin/vc-migrate.js [--options] import_directus    (import directus)");
  console.log("       node dist/bin/vc-migrate.js [--options] import_schema      (import schema)");
  console.log("       node dist/bin/vc-migrate.js [--options] import_data        (import data)");
  console.log("       node dist/bin/vc-migrate.js [--options] import_files       (import files)");
  console.log();
  console.log("       node dist/bin/vc-migrate.js [--options] magic              (print out Directus magic about specified tables)");
  console.log();
  for (let option in appOptionDefs) {
    let optionDef = appOptionDefs[option];
    console.log("  --%s=<%s>                 ", option, option, optionDef.description);
  }
}

new ArgvOptionParser(appOptions, appOptionDefs);

if (appOptions.filedate && appOptions.dirname) {
  if (!appOptions.clobber) {
    let dirs = fs.readdirSync(appOptions.dirname);
    let tagBase = appOptions.filedate;
    let collisionFound = false;
    let maxSeq = 0;
    let matches: string[];
    for (let dir of dirs) {
      if (dir === tagBase) collisionFound = true;
      else if (matches = dir.match(/^(.*)\.([0-9]+)$/)) {
        if (matches[1] === tagBase) {
          let seq = parseInt(matches[2], 10);
          if (seq > maxSeq) maxSeq = seq;
        }
      }
    }
    if (!collisionFound) {
      appOptions.dirname = appOptions.dirname + "/" + appOptions.filedate;  // automatically append the tag. "prod" for production.
    }
    else {
      appOptions.dirname = appOptions.dirname + "/" + appOptions.filedate + "." + (maxSeq+1);
    }
  }
  else {
    appOptions.dirname = appOptions.dirname + "/" + appOptions.filedate;  // automatically append the tag. "prod" for production.
  }
}
if (appOptions.dirname) {
  try { fs.mkdirSync(appOptions.dirname); }
  catch (err) {}
}

let fmgr = new DatabaseFileManager();

class Main {

  migrationTables = {
    "directus_settings": { updateKeys: [ "id" ] },    // id                            (PK) (Singleton, optional)
    "directus_webhooks": { updateKeys: [ "name", "method", "url" ] },    // name, method, url             (not enforced)

    "directus_collections": { updateKeys: [ "collection" ] }, // collection                    (PK)
    "directus_fields": { updateKeys: [ "collection", "field" ] },      // collection, field             (not enforced)
    "directus_relations": { updateKeys: [ "many_collection", "many_field" ] },   // many_collection, many_field   (not enforced)

    "directus_users": { updateKeys: [ "email" ] },       // email                         (AK)
    "directus_shares": { updateKeys: [ "name", "collection", "item", "role" ] },      // name, collection, item, role  (not enforced)

    "directus_roles": { updateKeys: [ "id" ] },       // id (but check for name dups)  (PK)
    "directus_permissions": { updateKeys: [ "role", "collection", "actions", "presets", "fields" ] }, // role, collection, actions, presets, fields   (not enforced)

    "directus_folders": { updateKeys: [ "name", "parent" ] },     // name, parent                  (not enforced)
    "directus_files": { updateKeys: [ "id" ] },       // id (but check for folder/filename_disk dups) (PK)

    "directus_panels": { updateKeys: [ "id" ] },
    "directus_presets": { updateKeys: [ "id" ] },
    "directus_dashboards": { updateKeys: [ "id" ] },
    "directus_flows": { updateKeys: [ "id" ] },
    // "directus_migrations": { updateKeys: [ "id" ] },// run the npx directus db
    // "directus_notifications": { updateKeys: [ "id" ] },

    // "directus_activity": { updateKeys: [ "id" ] },  // logins, create, update, delete
    // "directus_revisions": { updateKeys: [ "id" ] }, // a log of all of the changes to items in any collection
    // "directus_operations": { updateKeys: [ "id" ] },// ???
    // "directus_sessions": { updateKeys: [ "id" ] },  // durations a user had a session open

    "group": { updateKeys: [ "id" ] },
    "group_memb": { updateKeys: [ "id" ] },
    // "donation": { updateKeys: [ "id" ] },
    // "project": { updateKeys: [ "id" ] },

    "ws_website": { updateKeys: [ "id" ] },
    "ws_link": { updateKeys: [ "id" ] },
    "ws_page": { updateKeys: [ "id" ] },
    "ws_section": { updateKeys: [ "id" ] },
    "ws_section_item": { updateKeys: [ "id" ] },
  };

  async run () {
    // if (config.mysql) {
    //   // let mdb = new MysqlDatabase();
    //   // mdb.init(config);
    //   // // Main.db = db;
    //   // mdb.registerTableDefs(tableDefs);
    //   // mdb.setSchemaName("id_sonar");
    //   // db = mdb;
    // }
    // console.log("appOptions", appOptions);
    let args = appOptions.args;
    if (!args || args.length === 0) {
      printUsage();
      process.exit(0);
    }
    let op = args.shift();
    // let table = appOptions.table;
    // let matches: any;
    // let columns: string[] = (appOptions.columns ? appOptions.columns.split(/,/) : undefined) as string[];
    let options: any = {};
    if (appOptions.pathname) options.pathname = appOptions.pathname;
    else {
      if (appOptions.dirname) options.dirname = appOptions.dirname;
      if (appOptions.filedate) options.filedate = appOptions.filedate;
      if (appOptions.fileext) options.fileext = appOptions.fileext;
    }

    if (op === "export")                  { await this.export(db, appOptions); }
    else if (op === "export_data_full")   { await this.export_data_full(db, appOptions); }
    else if (op === "export_schema")      { await this.export_schema(db, appOptions); }
    else if (op === "export_data")        { await this.export_data(db, appOptions); }
    else if (op === "export_files")       { await this.export_files(db, appOptions); }

    else if (op === "import")             { await this.import(db, appOptions); }
    else if (op === "import_schema_full") { await this.import_schema_full(db, appOptions); }
    else if (op === "import_data_full")   { await this.import_data_full(db, appOptions); }
    // Directus DDL (alter table) (npx directus database migrate:latest)
    // npm install
    // npm install directus (not always the latest)
    // npx directus database migrate:latest
    else if (op === "import_directus")    { await this.import_directus(db, appOptions); }
    // Application DDL (alter table) (npx prisma db pull/push)
    // directus_settings.project_url
    //   url = url.replace('http://localhost','http://3.93.241.53')
    //   import directus_settings set project_url = replace(project_url,'http://localhost','http://3.93.241.53');
    else if (op === "import_schema")      { await this.import_schema(db, appOptions); }
    // exported JSON data, merged back in to Directus/Application tables
    else if (op === "import_data")        { await this.import_data(db, appOptions); }
    // files copied to /api/uploads directory (while imports made to directus_files)
    else if (op === "import_files")       { await this.import_files(db, appOptions); }
    else if (op === "magic") { await this.magic(db, appOptions); }
    else if (op === "printf") {  // files copied to /api/uploads directory (while updates made to directus_files)
      await this.testPrintf(db, appOptions);
    }
    else {
      console.log("ERROR: Unknown op [%s]", op);
      printUsage();
    }
  }

  // DIRECTUS STRUCTURES: npx directus migrate   # COMPARE directus_migrations
  // DATABASE STRUCTURES: npx prisma db pull     # EXCLUDE DIRECTUS TABLES !!!
  // DIRECTUS DATA:       exportFile(directus_*)
  // DIRECTUS FILES:      cp -r ../api/uploads ../directus/prod-files
  async export (db: IDatabase, options: any) {
    console.log("export");
    await this.export_schema(db, options);  // additionaldatabase updates from schema.prisma
    await this.export_data(db, options);
    await this.export_files(db, options);
  }

  async export_data_full (db: IDatabase, options: any) {
    console.log("export_data_full");
    await this.export_data(db, options);
    await this.export_files(db, options);
  }

  async export_schema (db: IDatabase, options: any) {
    console.log("Exporting Database Schema (export_schema)");

    let defaultSchemaPathname = "./prisma/schema.prisma";
    let currentSchemaPathname = "./prisma/schema.prisma-current";
    let exportSchemaPathname = options.dirname + "/schema.prisma";
    console.log(`running  [pnpx prisma db pull --schema=${currentSchemaPathname}]...`);
    await fsPromises.copyFile(defaultSchemaPathname, currentSchemaPathname);
    await this.exec(`pnpx prisma db pull --schema=${currentSchemaPathname}`);

    let currentSchemaFile = new PrismaSchemaFile(currentSchemaPathname);
    let defaultSchemaFile = new PrismaSchemaFile(defaultSchemaPathname);
    currentSchemaFile.printDiffs(defaultSchemaFile);

    if (appOptions.clobber || !fs.existsSync(exportSchemaPathname)) {
      console.log("Copying Database Schema to %s", exportSchemaPathname);
      await fsPromises.copyFile(currentSchemaPathname, exportSchemaPathname);
      if (appOptions.regen && exportSchemaPathname === defaultSchemaPathname) {
        console.log("Regenerating Prisma Client [pnpx prisma generate]...");
        console.log("> (Note: use the --regen=0 option to skip this step)");
        await this.exec("pnpx prisma generate");
      }
      else {
        console.log("Skipped regenerating Prisma Client.");
      }
    }
    // else {
    //   console.log("> (Note: Nothing in %s updated. Use the --clobber option to do so.)", exportSchemaPathname);
    // }
  }

  // async export_schema (db: IDatabase, options: any) {
  //   console.log("export_schema");
  //   let schema = fs.readFileSync("prisma/schema.prisma", "utf8");
  //   fs.writeFileSync("prisma/schema.prisma-current",schema,"utf8");
  //   let result = await this.exec("pnpx prisma db pull --schema=prisma/schema.prisma-current");
  //   let latestSchemaFile = new PrismaSchemaFile("prisma/schema.prisma");
  //   let currentSchemaFile = new PrismaSchemaFile("prisma/schema.prisma-current");
  // }

  async export_data (db: IDatabase, options: any) {
    console.log("export_data");
    let globalVals: any = {};
    for (let tableName of ["directus_collections"]) {
      let pathname = fmgr.makeExportPathname(tableName, options);
      let json = await fsPromises.readFile(pathname,"utf8");
      let objects = JSON.parse(json);
      if (objects && objects.length) {
        let columns = Object.keys(objects[0]);

        let errors = [];
        let warnings = [];
        let notices = [];
        options['errors'] = errors;
        options['warnings'] = warnings;
        options['notices'] = notices;

        options.updateKeys = this.migrationTables[tableName].updateKeys;
        await db.storeObjects(tableName, columns, objects, globalVals, options);
        delete options.updateKeys;

        for (let msg of notices) {
          console.log("Notice: ", msg);
        }
        for (let msg of warnings) {
          console.log("Warning:", msg);
        }
        for (let msg of errors) {
          console.log("Error:  ", msg);
        }
      }
    }
  }

  async export_files (db: IDatabase, options: any) {
    console.log("export_files");
  }

  async import (db: IDatabase, options: any) {
    console.log("import");
    await this.import_directus(db, options);  // database updates from Directus code base
    await this.import_schema(db, options);  // additionaldatabase updates from schema.prisma
    await this.import_data(db, options);
    await this.import_files(db, options);
  }

  async import_schema_full (db: IDatabase, options: any) {
    console.log("import_schema_full");
    await this.import_directus(db, options);  // database updates from Directus code base
    await this.import_schema(db, options);  // additionaldatabase updates from schema.prisma
  }

  async import_data_full (db: IDatabase, options: any) {
    console.log("import_data_full");
    await this.import_data(db, options);
    await this.import_files(db, options);
  }

  async import_directus (db: IDatabase, options: any) {
    console.log("import_directus");
  }

  async import_schema (db: IDatabase, options: any) {
    console.log("import_schema");
    let schema = fs.readFileSync("prisma/schema.prisma", "utf8");
    fs.writeFileSync("prisma/schema.prisma-current",schema,"utf8");
    let result = await this.exec("pnpx prisma db pull --schema=prisma/schema.prisma-current");
    let latestSchemaFile = new PrismaSchemaFile("prisma/schema.prisma");
    let currentSchemaFile = new PrismaSchemaFile("prisma/schema.prisma-current");
  }

  async import_data (db: IDatabase, options: any) {
    console.log("import_data");
    let globalVals: any = {};
    for (let tableName of ["directus_collections"]) {
      let pathname = fmgr.makeExportPathname(tableName, options);
      let json = await fsPromises.readFile(pathname,"utf8");
      let objects = JSON.parse(json);
      if (objects && objects.length) {
        let columns = Object.keys(objects[0]);

        let errors = [];
        let warnings = [];
        let notices = [];
        options['errors'] = errors;
        options['warnings'] = warnings;
        options['notices'] = notices;

        options.updateKeys = this.migrationTables[tableName].updateKeys;
        await db.storeObjects(tableName, columns, objects, globalVals, options);
        delete options.updateKeys;

        for (let msg of notices) {
          console.log("Notice: ", msg);
        }
        for (let msg of warnings) {
          console.log("Warning:", msg);
        }
        for (let msg of errors) {
          console.log("Error:  ", msg);
        }
      }
    }
  }

  async import_files (db: IDatabase, options: any) {
    console.log("import_files");
  }

  async magic (db: IDatabase, options: any) {
    let directusSchema = new DirectusSchema();
    let prismaSchemaFile = new PrismaSchemaFile();
    await directusSchema.init(options);
    let tables: string[];
    // console.log("XXX Prisma Relationships DURING [%s]", "group_memb", directusSchema.nativeTableDef["group_memb"].relationship);
    if (!options.table) {
      tables = Object.keys(directusSchema.nativeTableDef);
    }
    else {
      tables = options.table.split(/,/);
    }
    for (let table of tables) {
      // console.log("Directus Magic:", table);
      this.writeTableMagic(process.stdout, directusSchema.nativeTableDef[table], prismaSchemaFile.nativeTableDef[table], directusSchema);
      // this.printTableMagic(directusSchema.nativeTableDef[table], prismaSchemaFile.nativeTableDef[table]);
    }
    // directusSchema.printNativeTableDef(directusSchema.nativeTableDef.group_memb);
    // options.fileext = "json";
    // for (let tableName in this.migrationTables) {
    //   let pathname = fmgr.makeExportPathname(tableName, options);
    //   console.log("Exporting table [%s] to [%s]", tableName, pathname);
    //   await fmgr.exportFile(db, tableName, {}, [], pathname);
    // }
  }

  // printTableMagic (tabdef: DirectusTableDef, prismaTabDef: PrismaTableDef) {
  //   console.log("============================================");
  //   console.log("D-COLLECTION: %s", tabdef.collection);
  //   let columnSkipped = {
  //     "user_created": true,
  //     "date_created": true,
  //     "user_updated": true,
  //     "date_updated": true,
  //     "status": true,
  //     "sort": true,
  //   };
  //   let specialSkipped = {
  //     "cast-json": true,
  //   };
  //   let interfaceSkipped = {
  //     "input": true,
  //     "input-rich-text-md": true,
  //     "input-code": true,
  //   };
  //   if (tabdef.columns) {
  //     for (let column of tabdef.columns) {
  //       if (!columnSkipped[column]) {
  //         let coldef = tabdef.column[column];
  //         // "special":null,"interface":"input","options":null,"display":null,"display_options":null
  //         if ((coldef.special && !specialSkipped[coldef.special]) ||
  //             (coldef.interface && !interfaceSkipped[coldef.interface]) ||
  //             coldef.options || coldef.display || coldef.display_options) {
  //           this.printColumnMagic(coldef);
  //         }
  //       }
  //     }
  //   }
  //   if (tabdef.toOneRels) {
  //     for (let rel of tabdef.toOneRels) {
  //       if (!columnSkipped[rel.many_field]) {
  //         let relname = rel.one_field ? `(${rel.one_collection}.${rel.one_field})` : "";
  //         // console.log("D-REL: To One:  %s.%s => %s.%s%s", rel.many_collection, rel.many_field, rel.one_collection, "id", relname);

  //         console.log("%s %s %s => %s",
  //           "D-REL: To One: ",
  //           this.format(`${rel.many_collection}.${rel.many_field}`,30),
  //           this.format(relname, 30),
  //           `${rel.one_collection}.id`);

  //         if (rel.one_collection_field || rel.one_allowed_collections || rel.junction_field) {
  //           console.log("D-REL: To One:  %j", rel);
  //         }
  //       }
  //     }
  //   }
  //   if (tabdef.toManyRels) {
  //     for (let rel of tabdef.toManyRels) {
  //       if (!columnSkipped[rel.many_field]) {
  //         let relname = rel.one_field ? `(${rel.one_collection}.${rel.one_field})` : "";
  //         // let sort = rel.sort_field ? `sort(${rel.sort_field})` : "";
  //         // console.log("D-REL: To Many: %s.%s%s => %s.%s : deselect=%s%s", rel.one_collection, "id", relname, rel.many_collection, rel.many_field, rel.one_deselect_action, sort);

  //         console.log("%s %s %s => %s %s %s",
  //           "D-REL: To Many:",
  //           this.format(`${rel.one_collection}.id`,30),
  //           this.format(relname, 30),
  //           this.format(`${rel.many_collection}.${rel.many_field}`,30),
  //           rel.one_deselect_action ? `onDeselect(${rel.one_deselect_action})` : "",
  //           rel.sort_field ? `sort(${rel.sort_field})` : "");

  //         if (rel.one_collection_field || rel.one_allowed_collections || rel.junction_field) {
  //           console.log("D-REL: To Many: %j", rel);
  //         }
  //       }
  //     }
  //   }
  //   if (prismaTabDef && prismaTabDef.relationship) {
  //     let relationshipDefs = prismaTabDef.relationship;
  //     // if (prismaTabDef.name === "group_memb") console.log("XXX Prisma Relationships AFTER  [%s]", prismaTabDef.name, relationshipDefs);
  //     for (let relname in relationshipDefs) {
  //       let reldef = relationshipDefs[relname];
  //       if ((!reldef.isMultiple || !columnSkipped[reldef.toColumn]) &&
  //           (reldef.isMultiple || !columnSkipped[reldef.fromColumn])) {
  //         console.log("%s %s %s => %s %s %s",
  //           reldef.isMultiple ? "P-REL: To Many:" : "P-REL: To One: ",
  //           // protected format(str: any, width: number, prec?: number, right?: boolean) {
  //           this.format(`${reldef.fromTableName}.${reldef.fromColumn}`,30),
  //           this.format(`(${reldef.fromTableName}.${relname})`,30),
  //           this.format(`${reldef.toTableName}.${reldef.toColumn}`,30),
  //           this.format(reldef.indexName ? `index(${reldef.indexName})` : "",40),
  //           reldef.prismaRelationTag ? `tag(${reldef.prismaRelationTag})` : "");
  //       }
  //     }
  //   }
  //   console.log();
  // }

  // private printColumnMagic (columnDef: DirectusColumnDef) {
  //   let vals = {};
  //   let skipColumn = {
  //     id: true,
  //     collection: true,
  //     field: true,
  //     readonly: true,
  //     hidden: true,
  //     sort: true,
  //     width: true,
  //     translations: true,
  //     note: true,
  //     required: true,
  //     group: true,
  //     validation: true,
  //     validation_message: true,
  //   };
  //   // for (let attrib of ["special", "interface", "options", "display", "display_options"]) {
  //   //   if (columnDef[attrib]) vals[attrib] = columnDef[attrib];
  //   // }
  //   for (let attrib in columnDef) {
  //     if (columnDef[attrib] && !skipColumn[attrib]) vals[attrib] = columnDef[attrib];
  //   }
  //   console.log("D-FIELD:", columnDef.field, vals);
  //   // console.log(columnDef);
  //   // console.log(`    %s %j`, columnDef.field, columnDef);
  // }

  async writeTableMagic (fh: any, tabdef: DirectusTableDef, prismaTabDef: PrismaTableDef, directus?: DirectusSchema) {
    // console.log("XXX writeTableMagic() table(%s) typeof(fh) %s dir(%s) pris(%s)", tabdef.collection, typeof(fh), tabdef ? "found" : tabdef, prismaTabDef ? "found" : prismaTabDef);
    let shouldClose = false;
    // if (typeof(fh) === "string") {
    //   if (fh === "STDOUT") fh = process.stdout;
    //   else {
    //     let pathname = fh;
    //     fh = fs.createWriteStream(pathname);
    //     // console.log("XXX writeTableMagic() fh=[%s] (opened from %s)", fh.constructor.name, pathname);
    //     shouldClose = true;
    //   }
    // }
    // else {
    //   // console.log("XXX writeTableMagic() fh=[%s]", fh.constructor.name);
    // }
    // printf("============================================\n");
    printf(fh, "D-COLLECTION: %s\n", tabdef.collection);
    let columnSkipped = {
      "user_created": true,
      "date_created": true,
      "user_updated": true,
      "date_updated": true,
      "status": true,
      "sort": true,
    };
    let specialSkipped = {
      "cast-json": true,
    };
    let interfaceSkipped = {
      "input": true,
      "input-rich-text-md": true,
      "input-code": true,
    };
    if (tabdef.columns) {
      for (let column of tabdef.columns) {
        if (!columnSkipped[column]) {
          let coldef = tabdef.column[column];
          // "special":null,"interface":"input","options":null,"display":null,"display_options":null
          if ((coldef.special && !specialSkipped[coldef.special]) ||
              (coldef.interface && !interfaceSkipped[coldef.interface]) ||
              coldef.options || coldef.display || coldef.display_options) {
            this.writeColumnMagic(fh, coldef);
          }
        }
      }
    }
    if (tabdef.toOneRels) {
      printf(fh, "------\n");
      for (let rel of tabdef.toOneRels) {
        if (!columnSkipped[rel.many_field]) {
          let relname = rel.one_field ? `(${rel.one_collection}.${rel.one_field})` : "";
          // console.log("D-REL: To One:  %s.%s => %s.%s%s", rel.many_collection, rel.many_field, rel.one_collection, "id", relname);

          printf(fh, "%s %-30s %-30s => %s\n",
            "D-REL: To One: ",
            `${rel.many_collection}.${rel.many_field}`,
            relname,
            `${rel.one_collection}.id`);

          if (rel.one_collection_field || rel.one_allowed_collections || rel.junction_field) {
            console.log("D-REL: To One:  %j", rel);
          }
        }
      }
    }
    if (tabdef.toManyRels) {
      printf(fh, "------\n");
      for (let rel of tabdef.toManyRels) {
        if (!columnSkipped[rel.many_field]) {
          let relname = rel.one_field ? `(${rel.one_collection}.${rel.one_field})` : "";
          // let sort = rel.sort_field ? `sort(${rel.sort_field})` : "";
          // console.log("D-REL: To Many: %s.%s%s => %s.%s : deselect=%s%s", rel.one_collection, "id", relname, rel.many_collection, rel.many_field, rel.one_deselect_action, sort);

          printf(fh, "%s %-30s %-30s => %-30s %s %s\n",
            "D-REL: To Many:",
            `${rel.one_collection}.id`,
            relname,
            `${rel.many_collection}.${rel.many_field}`,
            rel.one_deselect_action ? `onDeselect(${rel.one_deselect_action})` : "",
            rel.sort_field ? `sort(${rel.sort_field})` : "");

          if (rel.one_collection_field || rel.one_allowed_collections || rel.junction_field) {
            printf(fh, "D-REL: To Many: %j\n", rel);
          }
        }
      }
    }
    if (prismaTabDef && prismaTabDef.relationship) {
      let relationshipDefs = prismaTabDef.relationship;
      // if (prismaTabDef.name === "group_memb") console.log("XXX Prisma Relationships AFTER  [%s]", prismaTabDef.name, relationshipDefs);
      printf(fh, "------\n");
      for (let relname in relationshipDefs) {
        let reldef = relationshipDefs[relname];
        if (!reldef.isMultiple && (!reldef.isMultiple || !columnSkipped[reldef.toColumn]) &&
            (reldef.isMultiple || !columnSkipped[reldef.fromColumn])) {
          printf(fh, "%s %-30s %-30s => %-30s %-40s %s\n",
            reldef.isMultiple ? "P-REL: To Many:" : "P-REL: To One: ",
            // protected format(str: any, width: number, prec?: number, right?: boolean) {
            `${reldef.fromTableName}.${reldef.fromColumn}`,
            `(${reldef.fromTableName}.${relname})`,
            `${reldef.toTableName}.${reldef.toColumn}`,
            reldef.indexName ? `index(${reldef.indexName})` : "",
            reldef.prismaRelationTag ? `tag(${reldef.prismaRelationTag})` : "");
        }
      }
      printf(fh, "------\n");
      for (let relname in relationshipDefs) {
        let reldef = relationshipDefs[relname];
        if (reldef.isMultiple && (!reldef.isMultiple || !columnSkipped[reldef.toColumn]) &&
            (reldef.isMultiple || !columnSkipped[reldef.fromColumn])) {
          printf(fh, "%s %-30s %-30s => %-30s %-40s %s\n",
            reldef.isMultiple ? "P-REL: To Many:" : "P-REL: To One: ",
            // protected format(str: any, width: number, prec?: number, right?: boolean) {
            `${reldef.fromTableName}.${reldef.fromColumn}`,
            `(${reldef.fromTableName}.${relname})`,
            `${reldef.toTableName}.${reldef.toColumn}`,
            reldef.indexName ? `index(${reldef.indexName})` : "",
            reldef.prismaRelationTag ? `tag(${reldef.prismaRelationTag})` : "");
        }
      }
    }

    if (tabdef.perms) {
      printf(fh, "------\n");
      printf(fh, "%-12s %-6s : %s\n", "role",
        "action", "permissions validation presets fields");
      for (let role in tabdef.perms) {
        let roleName = (directus && directus.roleById[role]) ? directus.roleById[role].name : "Public*";
        let actionPerms = tabdef.perms[role];
        if (actionPerms) {
          let actions = [ "create", "read", "update", "delete", "share" ];
          for (let action of actions) {
            let actionPerm = actionPerms[action];
            if (actionPerm) {
              let access: string;
              if (action === "create" && actionPerm.validation === "{}" && actionPerm.presets === null && 
                                         actionPerm.fields === "*") {
                access = "ALL";
              }
              else if (action === "read" && actionPerm.permissions === "{}" && actionPerm.fields === "*") {
                access = "ALL";
              }
              else if (action === "update" && actionPerm.permissions === "{}" && actionPerm.validation === "{}" && 
                                              actionPerm.presets === null && actionPerm.fields === "*") {
                access = "ALL";
              }
              else if (action === "delete" && actionPerm.permissions === "{}") {
                access = "ALL";
              }
              else if (action === "share" && actionPerm.permissions === "{}") {
                access = "ALL";
              }
              else {
                access =
                  (""  + actionPerm.permissions) +
                  (" " + actionPerm.validation) +
                  (" " + actionPerm.presets) +
                  (" " + actionPerm.fields);
              }
              printf(fh, "%-12s %-6s : %s\n", roleName, action, access);
            }
          }
        }
      }
    }

    printf(fh, "\n");
    if (shouldClose) fs.closeSync(fh);
  }

  private writeColumnMagic (fh: any, columnDef: DirectusColumnDef) {
    let vals = {};
    let skipColumn = {
      id: true,
      collection: true,
      field: true,
      readonly: true,
      hidden: true,
      sort: true,
      width: true,
      translations: true,
      note: true,
      required: true,
      group: true,
      validation: true,
      validation_message: true,
    };
    // for (let attrib of ["special", "interface", "options", "display", "display_options"]) {
    //   if (columnDef[attrib]) vals[attrib] = columnDef[attrib];
    // }
    for (let attrib in columnDef) {
      if (columnDef[attrib] && !skipColumn[attrib]) vals[attrib] = columnDef[attrib];
    }
    printf(fh, "D-FIELD: %s\n%O\n", columnDef.field, vals);
    // console.log(columnDef);
    // console.log(`    %s %j`, columnDef.field, columnDef);
  }

  async exec (cmd: string) {
    let promise = new Promise((resolve, reject) => {
      exec(cmd, (error, stdout, stderr) => {
        console.log("complete [%s]:", cmd, error, stdout, stderr);
        if (error) {
          reject({ cmd: cmd, error: error, stdout: stdout, stderr: stderr });
        }
        else {
          resolve({ cmd: cmd, stdout: stdout, stderr: stderr });
        }
      })
    });
    return(promise);
  }

  protected async testPrintf (db: IDatabase, options: any) {
    console.log("testPrintf");
    let out = process.stdout;
    // printf(out, "Hello world. %s", "yeah!");
    printf(out, "Hello world.\n");
    // printf(out, "Hello\n >  world.\n");
    printf(out, "Hello [%s]. [%%s]\n", "world");
    // printf(out, "Hello\n > [%s]. [%%s]\n", "world");
    printf(out, "Hello [%-10s]. [%%-10s]\n", "world");
    printf(out, "Hello [%10s]. [%%10s]\n", "world");
    printf(out, "Hello [%-4.3s]. [%%-4.3s]\n", "world");
    printf(out, "Hello [%3.3s]. [%%3.3s]\n", "world");
    printf(out, "Hello [%2.3s]. [%%2.3s]\n", "world");
    printf(out, "Hello [%07s]. [%%07s]\n", "world");
  }
}

let main = new Main();
main.run().then(() => {});

