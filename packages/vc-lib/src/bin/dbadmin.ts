
// import { Config } from '../services/Config';
import { ArgvOptionParser } from '../classes/ArgvOptionParser';
import { PrismaDatabase, PrismaTableDef, PrismaColumnDef } from '../services/PrismaDatabase';
import { DatabaseFileManager } from '../services/DatabaseFileManager';
import * as lodash from 'lodash';
import { IDatabase } from '../services/IDatabase';
import { DBColumnDef } from '../classes/DBInterfaces';

// let config = new Config();
let db: IDatabase = new PrismaDatabase() as IDatabase;

// # npx prisma init
// -------------------
// ✔ Your Prisma schema was created at prisma/schema.prisma
//   You can now open it in your favorite editor.
// -------------------
// Next steps:
// 1. Set the DATABASE_URL in the .env file to point to your existing database. If your database has no tables yet, read https://pris.ly/d/getting-started
// 2. Set the provider of the datasource block in schema.prisma to match your database: postgresql, mysql, sqlite, sqlserver, mongodb or cockroachdb.
// 3. Run prisma db pull to turn your database schema into a Prisma schema.
// 4. Run prisma generate to generate the Prisma Client. You can then start querying your database.
// -------------------
// More information in our documentation:
// https://pris.ly/d/getting-started

// Usage
//   $ prisma [command]
// Commands
//             init   Set up Prisma for your app
//         generate   Generate artifacts (e.g. Prisma Client)
//               db   Manage your database schema and lifecycle
//          migrate   Migrate your database
//           studio   Browse your data with Prisma Studio
//           format   Format your schema
// Flags
//      --preview-feature   Run Preview Prisma commands
// Examples

//   $ prisma init         # Set up a new Prisma project
//   $ prisma generate     # Generate artifacts (e.g. Prisma Client)
//   $ prisma studio       # Browse your data
//   $ prisma migrate dev  # Create migrations from your Prisma schema, apply them to the database, generate artifacts (e.g. Prisma Client)
//   $ prisma db pull      # Pull the schema from an existing database, updating the Prisma schema
//   $ prisma db push      # Push the Prisma schema state to the database

let appOptionDefs = {
  op: {
    description: "Operations [get, list_tables, export, import, get_table_def]"
  },
  table: {
    description: "Table name"
  },
  columns: {
    description: "Column names for get"
  },
  orderBy: {
    description: "orderBy for get"
  },
  distinct: {
    description: "Distinct for get"
  },
  offset: {
    description: "Offset for get"
  },
  limit: {
    description: "Limit for get"
  },
  pathname: {
    description: "Path name for export/import"
  },
  dirname: {
    description: "Directory name (if pathname not given) for export/import"
  },
  filedate: {
    description: "File date (if pathname not given) for export/import"
  },
  fileext: {
    description: "File extension (if pathname not given) for export/import"
  },
  show_sql: {
    description: "Show the SQL statements"
  },
  verbose: {
    description: "Print diagnostic statements"
  }
};

let appOptions = {
  op: "get",
  table: "",
  columns: "",
  orderBy: "",
  distinct: "",
  offset: "",
  limit: "",
  pathname: "",
  dirname: "",
  filedate: "",
  fileext: "",
  show_sql: 0,
  verbose: 1,
};

function printUsage () {
  console.log("Usage: node lib/bin/dbadmin.js [--options]");
  for (let option in appOptionDefs) {
    let optionDef = appOptionDefs[option];
    console.log("  --%s=<%s>                 ", option, option, optionDef.description);
  }
}

new ArgvOptionParser(appOptions, appOptionDefs);

class Main {
  async run () {
    // if (config.mysql) {
    //   // let mdb = new MysqlDatabase();
    //   // mdb.init(config);
    //   // // Main.db = db;
    //   // mdb.registerTableDefs(tableDefs);
    //   // mdb.setSchemaName("id_sonar");
    //   // db = mdb;
    // }
    let op = appOptions.op;
    let table = appOptions.table;
    let matches: any;
    let columns: string[] = (appOptions.columns ? appOptions.columns.split(/,/) : undefined) as string[];
    let options: any = {};
    if (appOptions.pathname) options.pathname = appOptions.pathname;
    else {
      if (appOptions.dirname) options.dirname = appOptions.dirname;
      if (appOptions.filedate) options.filedate = appOptions.filedate;
      if (appOptions.fileext) options.fileext = appOptions.fileext;
    }

    if (op === "list_tables") {
      let tableNames: string[] = [];
      let allTableNames = await db.getTableNames();
      if (table) {
        let regexp = new RegExp(table, "i");
        for (let tableName of allTableNames) {
          if (tableName.match(regexp)) {
            tableNames.push(tableName);
          }
        }
      }
      else {
        tableNames = allTableNames;
      }
      console.log(tableNames);
    }
    else if (op === "get_native_table_def") {
      let nativeTableDef = db.getNativeTableDef(table);
      db.printNativeTableDef(nativeTableDef);
    }
    else if (op === "get_table_def") {
      let tableDef = await db.getTableDef(table);
      db.printTableDef(tableDef);
    }
    else if (op === "get" || op === "export") {
      let opDefined = {

      };
      let tableDef = db.getTableDef(table);
      if (tableDef && tableDef.column) {
        let params = {};
        // console.log("XXX dbadmin appOptions", appOptions);
        for (let paramOp in appOptions) {
          let column = paramOp;
          let columnDef: DBColumnDef = tableDef.column[column];
          // console.log("dbadmin Main.run() paramOp=[%s] %j", paramOp, columnDef);
          if (columnDef) {
            // console.log("dbadmin Main.run() paramOp=[%s] COLUMN FOUND", paramOp);
            let value: any = appOptions[paramOp];
            // console.log("XXX column [%s] value [%s] (%s) def %j", column, value, typeof(value), columnDef);
            if (typeof(value) === "string") {
              if (columnDef.type === "integer") value = parseInt(value, 10);
              else if (columnDef.type === "float") value = parseFloat(value);
            }
            params[column] = value;
          }
          else if (matches = paramOp.match(/^(.*)\.(eq|ne|lt|le|gt|ge|in|notin|startsWith|endsWidth|contains|search|null|notnull)$/)) {
            let column = matches[1];
            let op = matches[2];
            let value: any = appOptions[paramOp];
            // console.log("XXX column [%s] op [%s] value [%s] (%s) def %j", column, op, value, typeof(value), columnDef);
            let columnDef: DBColumnDef = tableDef.column[column];
            // console.log("dbadmin Main.run() paramOp=[%s] column=[%s] op=[%s] %j", paramOp, column, op, columnDef);
            if (!columnDef) {
              console.log("ERROR: dbadmin Main.run() paramOp=[%s] column=[%s] COLUMN NOT FOUND", paramOp, column);
              process.exit(0);
            }
            else if (!db["columnOp"][op]) {
              console.log("ERROR: dbadmin Main.run() paramOp=[%s] op=[%s] OP NOT DEFINED", paramOp, op);
              process.exit(0);
            }
            else {
              if (!params[column]) params[column] = {};
              params[column][op] = value;
            }
          }
          else if (paramOp.indexOf(".") !== -1) {
            console.log("ERROR: dbadmin Main.run() paramOp=[%s] COLUMN NOT FOUND OR NOT A KNOWN OP", paramOp);
            process.exit(0);
          }
        }
        if (appOptions.distinct) options.distinct = true;
        if (appOptions.offset) options.offset = appOptions.offset;
        if (appOptions.limit) options.limit = appOptions.limit;
        if (appOptions.orderBy) options.orderBy = appOptions.orderBy.split(/,/);
        // console.log("dbadmin.ts params %j", params);
        // process.exit(0);
        if (appOptions.op === "export") {
          let fmgr = new DatabaseFileManager();
          // console.log("exportFile(%s)", table, params, columns, options);
          let pathname = fmgr.makeExportPathname(table, appOptions);
          let nrows = await fmgr.exportFile(db, table, params, columns, pathname, options);
          // let nrows = 0;
          console.log("Exported objects [%s] to [%s]", nrows, pathname);
        }
        else {
          // console.log("getObjects(%s)", table, params, columns, options);
          let objects = await db.getObjects(table, params, columns, options);
          console.log(objects);
        }
      }
      else {
        console.log("ERROR: Unknown table [%s]", table);
      }
    }
    else {
      console.log("ERROR: Unknown op [%s]", op);
      printUsage();
    }
  }

  async listTables (db:any) {
    console.log("dbadmin:listTables");
  }
}

let main = new Main();
main.run().then(() => {});

