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
import * as lodash from 'lodash';

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
  s3: {
    description: "Files are on S3 rather than the file system",
  },
  schemaName: {
    description: "Schema name for tables",
  },
  show_sql: {
    description: "Show the SQL statements",
    type: "integer",
  },
  verbose: {
    description: "Print diagnostic statements",
    type: "integer"
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
  clobber: 1,
  update: 0,
  regen: 1,
  s3: 0,
  schemaName: "vc_server",
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

if (appOptions.args.length > 0 && appOptions.args[0].match(/^import/)) {
  appOptions.clobber = 1;
}
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

    "directus_users": {
      updateKeys: [ "email" ],
      columns: [ "id", "first_name", "last_name", "email" ],
    },       // email                         (AK)
    "directus_shares": { updateKeys: [ "name", "collection", "item", "role" ] },      // name, collection, item, role  (not enforced)

    "directus_roles": { updateKeys: [ "id" ] },       // id (but check for name dups)  (PK)
    "directus_permissions": {
      updateKeys: [ "role", "collection", "action" ],
      columns: [ "role","collection","action","permissions","validation","fields" ],
    }, // role, collection, actions, presets, fields   (not enforced)

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

    "group_role": { updateKeys: [ "id" ] },
    "group_type": { updateKeys: [ "id" ] },
    // "relationship_type": { updateKeys: [ "id" ] },
    "group": { updateKeys: [ "id" ] },
    "group_memb": { updateKeys: [ "id" ] },
    // "group_relationship": { updateKeys: [ "id" ] },
    // "user_relationship": { updateKeys: [ "id" ] },

    "ws_website": { updateKeys: [ "id" ] },
    "ws_link": { updateKeys: [ "id" ] },
    "ws_page": { updateKeys: [ "id" ] },
    "ws_section": { updateKeys: [ "id" ] },
    "ws_section_item": { updateKeys: [ "id" ] },

    "donation": { updateKeys: [ "id" ], perms: {
      groupId: [ 10, 3, 3, 1, 1 ],
    } },
    "project": { updateKeys: [ "id" ], perms: {
      groupId: [ 3, 8, 4, 3, 3 ],
    } },
    "acctg_account": { updateKeys: [ "id" ] },
    "fin_account": { updateKeys: [ "id" ] },
    "fin_transaction": { updateKeys: [ "id" ] },

    "course": { updateKeys: [ "id" ], perms: {
      groupId: [ 4, 7, 4, 3, 7 ],
      // contains: ["lessons"],
    } },
    "lesson": { updateKeys: [ "id" ], perms: {
      groupId: [ 4, 7, 4, 4, 7 ],
      // contains: ["lessonSections"],
    } },
    "lesson_section": { updateKeys: [ "id" ], perms: {
      groupId: [ 4, 7, 4, 4, 1 ],
      // contains: ["lessonQuestions"],
    } },
    "lesson_question": { updateKeys: [ "id" ], perms: {
      groupId: [ 4, 7, 4, 4, 1 ],
      // contains: ["lessonAnswerOptions"],
    } },
    "lesson_answer_option": { updateKeys: [ "id" ], perms: {
      groupId: [ 4, 7, 4, 4, 1 ],
    } },
    "scheduled_course": { updateKeys: [ "id" ] },
    "scheduled_lesson": { updateKeys: [ "id" ] },
    "course_enrollment": { updateKeys: [ "id" ] },
    "lesson_enrollment": { updateKeys: [ "id" ] },
    "lesson_answer": { updateKeys: [ "id" ] },
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
    else if (op === "perms")              { await this.perms(db, appOptions); }
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

    await fsPromises.copyFile(currentSchemaPathname, exportSchemaPathname);
    if (appOptions.clobber) {
      console.log("Copying Database Schema to %s", defaultSchemaPathname);
      await fsPromises.copyFile(currentSchemaPathname, defaultSchemaPathname);
      if (appOptions.regen) {
        console.log("Regenerating Prisma Client [pnpx prisma generate]...");
        console.log("> (Note: use the --regen=0 option to skip this step)");
        await this.exec("pnpx prisma generate");
      }
      else {
        console.log("Skipped regenerating Prisma Client. (Use --regen=1 to regen Prisma Client)");
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
    let tableNames: string[];
    if (options.table && typeof(options.table) === "string") {
      tableNames = options.table.split(/,/);
    }
    else {
      tableNames = Object.keys(this.migrationTables);
    }
    for (let tableName of tableNames) {
      let pathname = fmgr.makeExportPathname(tableName, options);
      try {
        let rows = await db.getObjects(tableName);
        let data = JSON.stringify(
          rows,
          (key, value) => { return(typeof value === 'bigint' ? value.toString() : value); },
          2
        );
        // console.log("data", data);
        fs.writeFileSync(pathname, data);
        console.log("Exported %s rows to %s", rows.length, pathname);
      }
      catch (err) {
        console.log("ERROR Exporting %s: %s", pathname, err.msg);
      }
    }
  }

  async export_files (db: IDatabase, options: any) {
    console.log("export_files");
    if (options.s3) {
      console.log("Exporting files from S3 not yet implemented");
    }
    else {
      let uploadDir = options.uploadDir;
      let exportFilesDir = options.dirname + "/files";
      if (!fs.existsSync(exportFilesDir)) {
        fs.mkdirSync(exportFilesDir);
      }
      let exportFiles = fs.readdirSync(exportFilesDir);
      for (let file of exportFiles) {
        fs.unlinkSync(exportFilesDir + "/" + file);
      }

      let allfiles = fs.readdirSync(uploadDir);
      // console.log("allfiles", allfiles);
      let files = [];
      for (let file of allfiles) {
        if (!file.match(/__/)) {
          files.push(file);
        }
      }
      let fileRows: any[] = await db.getObjects("directus_files");
      let fileRowByFilename = db.makeObjectOfObjectsByKey(fileRows, "filename_disk");
      // console.log("files", files);
      let numFilesFoundInRows = 0;
      let fileExistsByFilename: any = {};
      for (let file of files) {
        if (fileRowByFilename[file]) {
          numFilesFoundInRows++;
        }
        else {
          console.log("Notice: File [%s] on disk not found in database", file);
        }
        fileExistsByFilename[file] = 1;
      }
      console.log("numFiles %s on disk. found in db %s.", files.length, numFilesFoundInRows);
      let numFilesFoundOnDisk = 0;
      for (let row of fileRows) {
        let file = row.filename_disk;
        if (fileExistsByFilename[file]) {
          numFilesFoundOnDisk++;
          fs.linkSync(uploadDir + "/" + file, exportFilesDir + "/" + file);
        }
        else {
          console.log("WARNING: File [%s] in database not found on disk", file);
        }
      }
      console.log("numFileRows %s in db. found on disk %s.", fileRows.length, numFilesFoundOnDisk);
    }
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

    let tableNames: string[];
    if (options.table && typeof(options.table) === "string") {
      tableNames = options.table.split(/,/);
    }
    else {
      tableNames = Object.keys(this.migrationTables);
    }

    for (let tableName of tableNames) {
      console.log("import_data table [%s]", tableName);
      let pathname = fmgr.makeExportPathname(tableName, options);
      let json = await fsPromises.readFile(pathname,"utf8");
      let objects = JSON.parse(json);
      let migrationTableDef = this.migrationTables[tableName];
      if (!migrationTableDef) {
        console.log("ERROR: Table [%s] not defined in program for migration", tableName);
      }
      else if (!objects || objects.length === 0) {
        // console.log("WARNING: Table [%s] has no data to store", tableName);
      }
      else {
        let columns = migrationTableDef.columns || Object.keys(objects[0]);

        let errors = [];
        let warnings = [];
        let notices = [];
        options['errors'] = errors;
        options['warnings'] = warnings;
        options['notices'] = notices;

        options.updateKeys = this.migrationTables[tableName].updateKeys;
        // console.log("XXX storeObjects() options %j", options);
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

  async perms (db: IDatabase, options: any) {
    console.log("perms");
    let directusSchema = new DirectusSchema();
    await directusSchema.init(options);
    let tables: string[];
    if (!options.table) {
      // tables = Object.keys(directusSchema.nativeTableDef);
      tables = await directusSchema.getTableNames();
    }
    else {
      tables = options.table.split(/,/);
    }

    let directusPermissions: any[] = [];
    let specialField = {
      "id": true,
      "status": true,
      "sort": true,
      "user_created": true,
      "date_created": true,
      "user_updated": true,
      "date_updated": true,
      "groupId": true,
      "userId": true,
    };
    let userRole = await db.getValue("directus_roles", { name: "User" }, "id");

    for (let table of tables) {
      let migrationDef = this.migrationTables[table];
      if (migrationDef && migrationDef.perms) {
        console.log("perms:", table);
        let perms = migrationDef.perms;
        let g = perms.groupId;
        // let auto = perms.auto;
        let tabdef = db.getNativeTableDef(table);
        let dtabdef = directusSchema.getNativeTableDef(table);

        let createFields: any = [];
        let createPresets: any = {};
        let createValidation: any = [];
        let readPermissions: any = [];
        let updatePermissions: any = [];
        let updateFields: any = [];
        let deletePermissions: any = [];
        let sharePermissions: any = [];

        for (let field in dtabdef.column) {
          let fielddef = tabdef.field[field];
          let dfielddef = dtabdef.column[field];
          if (fielddef && fielddef.kind === "scalar") {
            if (specialField[field]) {
              if (field === "groupId") {
                createPresets.groupId = "$CURRENT_USER.currentGroupId";
                createValidation.push({"groupId":{"_eq":"$CURRENT_USER.currentGroupId"+g[0]}});
                readPermissions.push({"groupId":{"_eq":"$CURRENT_USER.currentGroupId"+g[1]}});
                updatePermissions.push({"groupId":{"_eq":"$CURRENT_USER.currentGroupId"+g[2]}});
                deletePermissions.push({"groupId":{"_eq":"$CURRENT_USER.currentGroupId"+g[3]}});
                sharePermissions.push({"groupId":{"_eq":"$CURRENT_USER.currentGroupId"+g[4]}});
              }
              else if (field === "userId" || field.match(/UserId$/)) {
                createPresets[field] = "$CURRENT_USER";
                let readPerm = {};
                readPerm[field] = {"_eq":"$CURRENT_USER"};
                readPermissions.push(readPerm);
              }
              else if (field === "status") {
                createPresets.status = "published";
                createFields.push(field);
                updateFields.push(field);
              }
            }
            else {
              // if (table === "lesson") console.log("field [%s] %j", field, dfielddef);
              // if (dfielddef.special === "m2o") {
              //   // don't allow
              // }
              createFields.push(field);
              updateFields.push(field);
              if (field === "isPublic") {
                createPresets.isPublic = false;
                readPermissions.push({"isPublic":{"_eq":true}});
              }
            }
          }
          else if (!fielddef && dfielddef && dfielddef.special === "o2m") {
            // console.log("field [%s] %j", field, dfielddef);
            createFields.push(field);
            updateFields.push(field);
          }
          else {
            // console.log("field [%s] %j", field, fielddef);
          }
        }

        createFields = (createFields && createFields.length > 0) ? createFields.join(",") : "*";
        createValidation = (lodash.isEmpty(createValidation)) ? null : JSON.stringify({"_and":createValidation});
        if (lodash.isEmpty(createPresets)) createPresets = null;
        else createPresets = JSON.stringify(createPresets);
        if (!readPermissions || readPermissions.length === 0) readPermissions = "{}";
        else if (readPermissions.length === 1) readPermissions = JSON.stringify({"_and":readPermissions});
        else readPermissions = JSON.stringify({"_and":[{"_or":readPermissions}]});
        updateFields = createFields;
        updatePermissions = JSON.stringify({"_and":updatePermissions});
        deletePermissions = JSON.stringify({"_and":deletePermissions});
        sharePermissions = JSON.stringify({"_and":sharePermissions});

        // console.log("tabdef", tabdef);
        // console.log("dtabdef", dtabdef);
        directusPermissions.push({
          collection: table,
          role: userRole,
          action: "create",
          permissions: null,
          validation: createValidation,
          presets: createPresets,
          fields: createFields,
        });
        directusPermissions.push({
          collection: table,
          role: userRole,
          action: "read",
          permissions: readPermissions,
          validation: null,
          presets: null,
          fields: "*",
        });
        directusPermissions.push({
          collection: table,
          role: userRole,
          action: "update",
          permissions: updatePermissions,
          validation: null,
          presets: null,
          fields: updateFields,
        });
        directusPermissions.push({
          collection: table,
          role: userRole,
          action: "delete",
          permissions: deletePermissions,
          validation: null,
          presets: null,
          fields: null,
        });
        directusPermissions.push({
          collection: table,
          role: userRole,
          action: "share",
          permissions: sharePermissions,
          validation: null,
          presets: null,
          fields: null,
        });
      }
    }

    let errors = [];
    let warnings = [];
    let notices = [];
    options['errors'] = errors;
    options['warnings'] = warnings;
    options['notices'] = notices;

    options.updateKeys = [ "role", "collection", "action" ];
    let columns = [ "role", "collection", "action", "permissions", "validation", "presets", "fields" ];
    // console.log("XXX storeObjects()", options);
    await db.storeObjects("directus_permissions", columns, directusPermissions, {}, options);
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

