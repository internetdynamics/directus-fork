
// import * as lodash from 'lodash';
import * as fs from 'fs';
let fsPromises = fs.promises;
import * as fastCsv from 'fast-csv';
import moment from 'moment';
import * as path from 'path';
import * as unzip from 'unzipper';
import { IDatabase } from '../services/IDatabase';
import { DataOptions, DBTableDef } from '../classes/DBInterfaces';

export class DatabaseFileManager {
  lastFileTimestamp: number = 0;  // for creating unique temp file names
  lastFileIndex: number = 1;      // for disambiguating temp files

  constructor () {
    let tempdir = this.getTempDir();
    fs.mkdir(tempdir, (err) => {
      if (err && err.code !== "EEXIST") {
        console.log("DatabaseFileManager() ERROR creating tempdir [%s] (%s)", tempdir, err.code, err.message);
      }
    });
  }

  makeExportPathname(tableName: string, options: any) {
    let pathname = options.pathname;
    if (!pathname) {
      let dirname = options.dirname;
      
      let filedate = options.filedate || moment().format("YYYYMMDD");
      let fileext = options.fileext || "csv";
      let filename = `${tableName}-${filedate}.${fileext}`;
      pathname = (dirname ? dirname+"/" : "") + filename;
    }
    return(pathname);
  }

  public async exportFile(
    db: IDatabase,
    table: string,
    params: object,
    columns: string[],
    filepath: string,
    options: DataOptions = {}
  ): Promise<number> {
    let objects = await db.getObjects(table, params, columns, options);
    // console.log("DatabaseFileManager.exportFile(%s) lines: %d", filepath, objects.length);
    let fileext = path.extname(filepath).substring(1);
    // console.log("DatabaseFileManager.exportFile() fileext=[%s]", fileext);
    if (fileext === "json") {
      // let json = JSON.stringify(objects, null, 2);
      // let json = JSON.stringify(objects, (key, value) =>
      //   typeof value === 'bigint'
      //       ? value.toString()
      //       : value // return everything else unchanged
      // , 2);
      let json = JSON.stringify(objects, (key, v) => typeof v === 'bigint' ? `${v}-bigint` : v, 2)
      .replace(/"(-?\d+)-bigint"/g, (key, a) => a);
      await fsPromises.writeFile(filepath, json, 'utf8');
    }
    else {
      await this.writeCSV(filepath, objects, columns, options);
    }
    return(objects.length);
  }

  public async readColumns(
    filepath: string,
    options: object = {}
  ): Promise<string[]> {
    let columns: string[] = [];
    let promise = new Promise<any>((resolve, reject) => {
      let fileStream = fs.createReadStream(filepath);
      // console.log("DatabaseFileManager.readColumns() fileStream", fileStream);
      let csvParsedStream = fastCsv.parse(options);
      let onData = (row: string[]) => {
        // console.log('got row', row);
        columns = row;
        csvParsedStream.emit('donereading'); //custom event for convenience
      };
      csvParsedStream.on('data', onData);
      csvParsedStream.on('donereading', () => {
        fileStream.close();
        csvParsedStream.removeListener('data', onData);
        // console.log('got columns', columns);
        resolve(columns);
      });
      fileStream.pipe(csvParsedStream);
    });
    await promise;
    return(columns);
  }

  public async importFile(
    db: IDatabase,
    table: string,
    filepath: string,
    columns?: string[],      // if columns not provided, they come from the header row of the CSV
    updateKeys?: string[],
    options: object = {},
    processRow?: (row: any) => Promise<void>,
    processRowObj?: any
  ): Promise<object> {
    console.log("DatabaseFileManager.importFile(%s)", table, options);
    let fileext = path.extname(filepath);
    let results: any = { nrows: 0 };
    if (fileext === "json") {
      let json = await fsPromises.readFile(filepath, "utf8");
      let objects = JSON.parse(json);
      options["updateKeys"] = updateKeys;
      results = db.insertObjects(table, objects, columns, options);
    }
    else {
      results = this.importCSVFile(db, table, filepath, columns, updateKeys, options, processRow, processRowObj);
    }
    return(results);
  }
  
  public async importCSVFile(
    db: IDatabase,
    table: string,
    filepath: string,
    columns?: string[],      // if columns not provided, they come from the header row of the CSV
    updateKeys?: string[],
    options: object = {},
    processRow?: (row: any) => Promise<void>,
    processRowObj?: any
  ): Promise<object> {
      console.log("DatabaseFileManager.importFile(%s)", table, options);
      let nrowsInserted = 0;
      let nrowsDuplicated = 0;
      let result: object = {};
      let error: any;
      let batch = options['batch'] || 500;
      let showSql = options['show_sql'] || 0;
      // console.log("DatabaseFileManager.importFile(%s) batch=%s showSql=%j", table, batch, showSql);
  
      let promise = new Promise<any>((resolve, reject) => {
  
      let processingInserts = false;
      let eof = false;
      let rows: object[] = [];
      let rowsets: object[][] = [];
      let nrowsBuffered = 0;
      let headerSkipped = false;

      let insertOptions: DataOptions = {};
      if (showSql) insertOptions.showSql = showSql;
      if (updateKeys) { insertOptions.updateKeys = updateKeys };

      // DEBUG
      // insertOptions.showSql = true;

      let fileStream = fs.createReadStream(filepath);
      let csvParsedStream = fastCsv.parse(options);

      let processInserts = async () => {
        try {
          if ((rowsets.length > 0 || rows.length > 0 || eof) && !processingInserts && !error) {
            // console.log("XXX processInserts()");
            processingInserts = true;
            fileStream.pause();
            while (rowsets.length > 0 && rowsets[0]) {
              let saveRows = rowsets[0];
              rowsets.shift();
              result = await db.insertObjects(table, saveRows, columns, insertOptions);
              nrowsInserted += (result["nrows"] || 0);
              nrowsDuplicated += (result["dups"] || 0);
              result["nrows"] = nrowsInserted;
              result["dups"] = nrowsDuplicated;
              result["filerows"] = nrowsBuffered;
              console.log("  %s rows loaded  (%s dups)  [%s rows buffered]", nrowsInserted, nrowsDuplicated, nrowsBuffered);
            }
            if (eof) {
              if (rows.length > 0) {
                result = await db.insertObjects(table, rows, columns, insertOptions);
                nrowsInserted += (result["nrows"] || 0);
                nrowsDuplicated += (result["dups"] || 0);
                result["nrows"] = nrowsInserted;
                result["dups"] = nrowsDuplicated;
                result["filerows"] = nrowsBuffered;
                console.log("  %s rows loaded  (%s dups)  [%s rows buffered] eof", nrowsInserted, nrowsDuplicated, nrowsBuffered);
              }
              csvParsedStream.emit('donereading'); //custom event for convenience
            }
            else {
              processingInserts = false;
              fileStream.resume();
            }
          }
        }
        catch (err) {
          console.log("DatabaseFileManager.importFile() processInserts: error", err.code, err.message);
          error = err;
          csvParsedStream.emit('donereading'); //custom event for convenience
        }
      };

      let onData = (row: any[]) => {
        // console.log("DatabaseFileManager.importFile() onDate row=%j", row);
        if (!headerSkipped) {
          if (!columns) columns = row;
          headerSkipped = true;
        }
        else {
          rows.push(row);
          nrowsBuffered++;
          result['filerows'] = nrowsBuffered;
          // console.log("XXX onData rowsets.length[%s] rows.length[%s] buffered[%s] processingInserts[%j]", rowsets.length, rows.length, nrowsBuffered, processingInserts);
          if (rows.length >= batch) {
            rowsets.push(rows);
            // console.log("XXX push a new rowset [%s] onto stack of [%s] rowsets", rows.length, rowsets.length);
            rows = [];
          }
          processInserts();
        }
      };

      csvParsedStream.on('data', onData);
      csvParsedStream.on("end", async () => {
        // console.log("XXX end rowsets.length[%s] rows.length[%s] processingInserts[%j]", rowsets.length, rows.length, processingInserts);
        eof = true;
        processInserts();
      });
      csvParsedStream.on("error", (err) => {
        // console.log("XXX error rowsets.length[%s] rows.length[%s] processingInserts[%j]", rowsets.length, rows.length, processingInserts);
        error = err;
        csvParsedStream.emit('donereading'); //custom event for convenience
      });
      csvParsedStream.on('donereading', () => {
        // console.log("XXX donereading rowsets.length[%s] rows.length[%s] processingInserts[%j]", rowsets.length, rows.length, processingInserts);
        fileStream.close();
        csvParsedStream.removeListener('data', onData);
        resolve(result);
      });

      fileStream.pipe(csvParsedStream);
    });

    await promise;
    if (error) {
      // console.log("DatabaseFileManager.importFile(%s) promise completed. error", table, error);
      throw error;
    }
    // console.log("DatabaseFileManager.importFile(%s) promise completed successfully", table);

    return(result);
  }

  public async readCSV(
    filepath: string
  ): Promise<object[]> {
    let promise = new Promise<object[]>((resolve, reject) => {
      // let objects = [];
      // fastCsv
      // .fromPath(filepath, { headers: true })
      // .on("data", (row) => {
      //   // console.log("csv read row: ", row);
      //   objects.push(row)
      // })
      // .on("end", () => {
      //     // console.log("csv read done");
      //     resolve(objects);
      // });
      resolve([]);  // TODO: Fix the .fromPath() options above
    });
    return(promise);
  }

  // public async unzipSingleFile (zipPathname: string, archivedBasename: string, outputFilePathname: string) {
  //   // console.log("DatabaseFileManager.unzipSingleFile()", zipPathname, archivedBasename, outputFilePathname);
  //   // let outputFileBasename = path.basename(outputFilePathname);
  //   // let outputFileDirname = path.dirname(outputFilePathname);
  //   let promise = new Promise<void>((resolve, reject) => {
  //     fs.createReadStream(zipPathname)
  //     .pipe(unzip.Parse())
  //     .on('error', (error) => { console.error(error); })
  //     .on('entry', (entry: any) => {
  //       // console.log("XXX entry: ", entry.path);
  //       var fileName = entry.path;
  //       // var type = entry.type; // 'Directory' or 'File'
  //       // var size = entry.size;
  //       if (fileName === archivedBasename) {
  //         entry.pipe(fs.createWriteStream(outputFilePathname));
  //       } else {
  //         entry.autodrain();
  //       }
  //     })
  //     .on('close', () => {
  //       // console.log("close:");
  //       resolve();
  //     });
  //   });
  //   return(promise);
  // }

  public getTempDir () {
    return(process.cwd() + "/tmp");
  }

  public getTempFile (ext: string): string {
    let timestamp = Date.now();
    if (timestamp > this.lastFileTimestamp) {
      this.lastFileTimestamp = timestamp;
      this.lastFileIndex = 1;
    }
    else {
      this.lastFileIndex++;
    }
    let filename = this.getTimestampStr(timestamp);
    if (this.lastFileIndex > 1) filename += "-"+this.lastFileIndex;
    if (ext) filename += "."+ext;
    return(filename);
  }

  public getTimestampStr (timestamp: number) {
    let m = moment.utc(timestamp);
    let str = m.format("YYYYMMDD-HHmmss");
    return(str);
  }

  public substituteTags (str: string) {
    if (str.match(/%/)) {
      let timestamp = Date.now();
      let m = moment.utc(timestamp);
      let d = m.format("YYYYMMDD");
      let t = m.format("HHmmss");
      str = str.replace(/%t/, t).replace(/%d/, d);
    }
    return(str);
  }

  public async cleanupTempFiles (pathname: string) {
    let promise = new Promise<void>((resolve, reject) => {
      fs.unlink(pathname, () => {
        resolve();
      });
    });
    return(promise);
  }

  public async writeCSV(
    filepath: string,
    objects: object[],
    columns: string[] = [],
    options: any = {}
  ): Promise<void> {
    let promise = new Promise<void>((resolve, reject) => {
      let headers = options.headers;
      if (headers === undefined) headers = true;
      if (Array.isArray(headers)) {
        if (columns.length === 0) {
          if (objects && objects.length > 0) {
            for (let column in objects[0]) {
              columns.push(column);
            }
          }
        }
        let headerLookup = {};
        for (let i = 0; i < columns.length && i < headers.length; i++) {
          headerLookup[columns[i]] = headers[i];
        }
        fastCsv
        .writeToPath(filepath, objects, {
          headers: headers,
          transform: (row: any) => {
            let newrow: any = {};
            for (let i = 0; i < columns.length && i < headers.length; i++) {
              newrow[headers[i]] = row[columns[i]];
            }
            return(newrow);
          }
        })
        .on("finish", function(){
          // console.log("csv write done!");
          resolve();
        });
      }
      else {
        fastCsv
        .writeToPath(filepath, objects, { headers: headers })
        .on("finish", function(){
          // console.log("csv write done!");
          resolve();
        });
      }
    });
    return(promise);
  }
}

  // public async readColumns(
  //   filepath: string,
  //   options: object = {}
  // ): Promise<string[]> {
      // console.log("DatabaseFileManager.readColumns() filepath options", filepath, options);
    // let fileStream = fs.createReadStream(filepath);
    // console.log("DatabaseFileManager.readColumns() fileStream", fileStream);
    // let csvParsedStream = fastCsv(options);
    // console.log("DatabaseFileManager.readColumns() csvParsedStream", csvParsedStream);

    // let promise = new Promise<any>((resolve, reject) => {
    //   fastCsv
    //   .fromPath(filepath, options)
    //   .on("data", (row) => {
    //     console.log("csv read row: %j", row);
    //     // objects.push(row)
    //   })
    //   .on("end", () => {
    //       console.log("csv read done");
    //       resolve();
    //   })
    //   .on('donereading', () => {
    //     fileStream.close();
    //     csvParsedStream.removeListener('data', onData);
    //     console.log('got columns', columns);
    //   });
    // });
    // await promise;

    // fastCsv
    // .fromPath(filepath)
    // .on("data", function(data){
    //     console.log(data);
    // })
    // .on("end", function(){
    //     console.log("done");
    // });
  // }

  // public async importCSVFile(
  //   db: IDatabase,
  //   table: string,
  //   filepath: string,
  //   columns?: string[],      // if columns not provided, they come from the header row of the CSV
  //   updateKeys?: string[],
  //   options: object = {}
  // ): Promise<number> {
  //   // options["objectMode"] = true;
  //   // let objects = await this.readCSV(filepath);
  //   // console.log("DatabaseFileManager.importFile(%s)", table, options);
  //   let nrows = 0;
  //   let error: any;

  //   let promise = new Promise<any>((resolve, reject) => {

  //     let processingInserts = false;
  //     let eof = false;
  //     let rows = [];
  //     let rowsets = [];
  //     let nrowsBuffered = 0;
  //     let headerSkipped = false;

  //     let insertOptions: DataOptions = {};
  //     if (updateKeys) { insertOptions.updateKeys = updateKeys };

  //     let fileStream = fs.createReadStream(filepath);

  //     let processInserts = async () => {
  //       try {
  //         if ((rowsets.length > 0 || rows.length > 0) && !processingInserts && !error) {
  //           processingInserts = true;
  //           fileStream.pause();
  //           while (rowsets.length > 0) {
  //             let saveRows = rowsets.shift();
  //             await db.insertObjects(table, saveRows, columns, insertOptions);
  //             nrows += saveRows.length;
  //             console.log("  %s rows loaded  [%s rows buffered]", nrows, nrowsBuffered);
  //           }
  //           if (eof && rows.length > 0) {
  //             await db.insertObjects(table, rows, columns, insertOptions);
  //             nrows += rows.length;
  //             console.log("  %s rows loaded  [%s rows buffered]", nrows, nrowsBuffered);
  //             resolve();
  //           }
  //           processingInserts = false;
  //           fileStream.resume();
  //         }
  //       }
  //       catch (err) {
  //         console.log("DatabaseFileManager.importFile() processInserts: error", err.code);
  //         error = err;
  //         csvParsedStream.emit('donereading'); //custom event for convenience
  //       }
  //     };

  //     let onData = async (row: string[]) => {
  //       if (!headerSkipped) {
  //         if (!columns) columns = row;
  //         headerSkipped = true;
  //       }
  //       else {
  //         rows.push(row);
  //         nrowsBuffered++;
  //         if (rows.length >= 500) {
  //           rowsets.push(rows);
  //           rows = [];
  //         }
  //         await processInserts();
  //       }
  //     };

  //     var csvParsedStream = fastCsv(options);
  //     csvParsedStream.on('data', onData);
  //     csvParsedStream.on("end", async () => {
  //       // console.log("XXX end rowsets.length[%s] rows.length[%s] processingInserts[%j]", rowsets.length, rows.length, processingInserts);
  //       eof = true;
  //       await processInserts();
  //     });
  //     csvParsedStream.on("error", (err) => {
  //       // console.log("XXX end rowsets.length[%s] rows.length[%s] processingInserts[%j]", rowsets.length, rows.length, processingInserts);
  //       error = err;
  //       csvParsedStream.emit('donereading'); //custom event for convenience
  //     });
  //     csvParsedStream.on('donereading', () => {
  //       fileStream.close();
  //       csvParsedStream.removeListener('data', onData);
  //       resolve();
  //     });
  //     fileStream.pipe(csvParsedStream);

  //     // fastCsv
  //     // .fromStream(fileStream, options)
  //     // .on("data", onData)
  //     // .on("end", async () => {
  //     //   // console.log("XXX end rowsets.length[%s] rows.length[%s] processingInserts[%j]", rowsets.length, rows.length, processingInserts);
  //     //   eof = true;
  //     //   await processInserts();
  //     // });
  //   });

  //   await promise;
  //   if (error) { throw error; }

  //   return(nrows);
  // }

// fastCsv.parse = function csv() {
//   return parser.apply(void 0, arguments);
// }
// fastCsv.fromString = function fromString(string, options) {
//   var rs = new stream.Readable();
//   rs.push(string);
//   rs.push(null);
//   return rs.pipe(new ParserStream(options));
// }
// fastCsv.fromPath = function fromPath(location, options) {
//   return fs.createReadStream(location).pipe(new ParserStream(options));
// }
// fastCsv.fromStream = function fromStream(stream, options) {
//   return stream.pipe(new ParserStream(options));
// }
// fastCsv.format = function createWriteStream(options) {
//   return new CsvTransformStream(options);
// }
// fastCsv.write = function write(arr, options, ws) {
//   var csvStream = createWriteStream(options), i = -1, l = arr.length;
//   extended.asyncEach(arr, function (item, cb) {
//       csvStream.write(item, null, cb);
//   }, function (err) {
//       if (err) {
//           csvStream.emit("error", err);
//       } else {
//           csvStream.end();
//       }
//   });
//   return csvStream;
// }
// fastCsv.writeToStream = function writeToStream(ws, arr, options) {
//   return write(arr, options).pipe(ws);
// }
// fastCsv.writeToString = function writeToString(arr, options, cb) {
//   if (extended.isFunction(options)) {
//       cb = options;
//       options = {};
//   }
//   var ws = new stream.Writable(), written = [];
//   ws._write = function (data, enc, cb) {
//       written.push(data + "");
//       cb();
//   };
//   ws
//       .on("error", cb)
//       .on("finish", function () {
//           cb(null, written.join(""));
//       });
//   write(arr, options).pipe(ws);
// }
// fastCsv.writeToBuffer = function writeToBuffer(arr, options, cb) {
//   if (extended.isFunction(options)) {
//       cb = options;
//       options = {};
//   }
//   var ws = new stream.Writable(), buffers = [], l = 0;
//   ws._write = function (data, enc, cb) {
//       buffers.push(data);
//       l++;
//       cb();
//   };
//   ws
//       .on("error", cb)
//       .on("finish", function () {
//           cb(null, Buffer.concat(buffers));
//       });
//   write(arr, options).pipe(ws);
// }
// fastCsv.writeToPath = function writeToPath(path, arr, options) {
//   var stream = fs.createWriteStream(path, {encoding: "utf8"});
//   return write(arr, options).pipe(stream);
// }
// fastCsv.createWriteStream = function createWriteStream(options) {
//   return new CsvTransformStream(options);
// }
// fastCsv.createReadStream = function createWriteStream(options) {
//   return new CsvTransformStream(options);
// }
