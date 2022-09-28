import * as fs from 'fs';
import * as util from 'util';
// const fsPromises = fs.promises;
// import { FileHandle } from "fs/promises";

// fs.createWriteStream(path, {encoding: "utf8"})
// filehandle.createWriteStream({encoding: "utf8"})
export function sprintf (...args: any[]) {
    // console.log(...args);
    let fmt: string;
    let buf: string;
    if (args.length === 0) {
        buf = "";
    }
    else {
        fmt = "" + args[0];
        if (fmt && fmt.indexOf("%") === -1) {
            buf = fmt;
            fmt = "";
            // console.log("0. buf=[%s] fmt=[%s]", buf, fmt);
        }
        else {
            buf = "";
            let matches: string[];
            while (fmt) {
                if (matches = fmt.match(/^([^%]+)(.*)/)) {
                    buf += matches[1];
                    fmt = matches[2];
                    // console.log("1. buf=[%s] fmt=[%s]", buf, fmt);
                }
                else if (matches = fmt.match(/^%(-?)(0?)([0-9]*)\.?([0-9]*)([sdfO%])(.*)/)) {
                    let value;
                    let argIdx = 0;
                    let maxArgIdx = args.length - 1;
                    if (matches[5] === "%") {
                        buf += "%";
                        fmt = matches[6];
                    }
                    else {
                        fmt = matches[6];
                        if (argIdx < maxArgIdx) {
                            argIdx++;
                            value = args[argIdx];
                        }
                        else value = "";

                        if (matches[5] === "O") {
                            let depth = matches[3] ? parseInt(matches[3], 10) : 2;
                            buf += util.format(value, { depth: depth });
                        }
                        else {
                            buf += formatField(value, parseInt(matches[3], 10), matches[4] ? parseInt(matches[4], 10) : null, (matches[1] === "-") ? false : true);
                        }
                    }
                    console.log("2. buf=[%s] fmt=[%s]", buf, fmt);
                }
                else {
                    buf += fmt;
                    fmt = "";
                    console.log("3. buf=[%s] fmt=[%s]", buf, fmt);
                }
            }
        }
    }
    return(buf);
}

export function fprintf (stream: fs.WriteStream, ...args: any[]) {
    // console.log(arguments[0]);
    stream.write(sprintf(...args));
}

export function printf (...args: any[]) {
    // console.log(arguments[0]);
    process.stdout.write(sprintf(...args));
}

export function formatField(str: any, width: number, prec?: number, right?: boolean) {
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
