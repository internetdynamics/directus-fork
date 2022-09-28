
import { DomainConfigs, DomainConfig, DomainTableDef, DomainTableDefs } from '../types';

declare function require(name:string);
let os = require("os");
let process = require("process");
let lodash = require("lodash");

let globalConfig = require("../config/config").config;
// console.log("XXX Config globalConfig", globalConfig);

let platform: string, ostype: string, hostname: string, homedir: string;
if (os.platform) {
  platform = os.platform();
  ostype = os.type();
  hostname = os.hostname();
  homedir = os.homedir();
}
else {
  platform = "Browser";
  ostype = "browser";
  hostname = "browser";
  homedir = "browser";
}
let nodeEnv = (process.env && process.env.NODE_ENV ? process.env.NODE_ENV.toLowerCase() : null);
console.log("Config: class init platform=[%s] ostype=[%s] hostname=[%s] homedir=[%s] nodeEnv=[%s]", platform, ostype, hostname, homedir, nodeEnv);

function overlayConfig (tag: string) {
  if (globalConfig.overlay && globalConfig.overlay[tag]) {
    let overlayFile = globalConfig.overlay[tag];
    let overlayConfig = require("../config/"+overlayFile).config;
    globalConfig = lodash.merge(globalConfig, overlayConfig);
  }
  // console.log("Config overlayConfig(%s)", tag, globalConfig);
}

if (platform) overlayConfig(platform);
if (ostype)   overlayConfig(ostype);
if (hostname) overlayConfig(hostname);
if (homedir)  overlayConfig(homedir);
if (nodeEnv)  overlayConfig(nodeEnv);

if (globalConfig.apiBaseUrlByDocumentLocation && window && window.location) {
  // console.log("XXX Config window.location", window.location);
  let location = window.location.href;
  let matches;
  if (location && (matches = location.match(/^(https?:\/\/)([^\/:]+)(:?[0-9]*)(.+)/))) {
    if (matches[2] === "localhost") {
      globalConfig.apiBaseUrl = matches[1] + matches[2];
    }
    else {
      globalConfig.apiBaseUrl = matches[1] + matches[2] + matches[3];
    }
  }
  else {
    globalConfig.apiBaseUrl = location;
  }
  // console.log("XXX Config apiBaseUrl (by doc location)", globalConfig.apiBaseUrl);
}

export interface AppModuleConfig {
  tables?: string[];
}
export interface AppModuleConfigs {
  [appModuleName: string]: AppModuleConfig;
}

// The full list is here.
// https://www.npmjs.com/package/mysql#connection-flags
export interface MysqlConnectionConfig {
  connectionLimit?: number;   // 2
  host?: string;              // "localhost"
  user?: string;              // "dbuser"
  password?: string;          // "29fh29lkjss"
  database?: string;          // "mysqldatabase_test"
}

export interface MysqlConfig {
  supportBigNumbers?: boolean;    // true
  timezone?: string;              // "Z"
  dateStrings?: string[];         // [ "DATE" ];
  connectionLimit?: number;
  database?: string;
  connection?: MysqlConnectionConfig;
  charset?: string;           // "utf8mb4_unicode_ci"
}

export interface SqliteConfig {
  dbname?: string;
  dbfilename?: string;
  verbose?: boolean;
}

export class Config {
  public SYSTEM_USER_ID: number = 1;
  public GUEST_USER_ID: number = 2;
  public SYSTEM_GROUP_ID: number = 1;
  public PUBLIC_GROUP_ID: number = 2;
  public eotDate: Date;
  public eotTimestamp: number;
  public sysadmin: any = {};     // a dictionary of email addresses that have sysadmin rights
  public apiBaseUrl: string;
  public apiBaseUrlByDocumentLocation: boolean;
  public https: boolean;
  public logtype: string;
  public mysql: MysqlConfig;
  public sqlite: SqliteConfig;
  // appModule: {
  //   base:           { tables: [ "Session", ], },
  //   login:          { tables: [ "User", ], },
  //   group:          { tables: [ "Group", "GroupMemb", ], },
  // },
  public appModule: AppModuleConfigs;
  // domain: {
  //   "idmx.co":                   { schemaName: "id_idmx", appModules: { base: {}, login: {}, group: {}, std: {}, geo: { schemaName: "id_geo" }, }, },
  //   "*.idmx.co":                 { schemaName: "id_idmx", appModules: { base: {}, login: {}, group: {}, std: {}, geo: { schemaName: "id_geo" }, }, },
  // },
  public domain: DomainConfigs;
  public rootDir: string;
  public httpLogging: boolean;
  public visitorLogging: boolean;
  public port: number;
  public cmd: any;       // command arguments

  constructor() {
    for (let key in globalConfig) {
      this[key] = globalConfig[key];
    }
    if (!this.appModule) this.appModule = {};
    if (!this.domain) this.domain = {};
    if (!this.rootDir) this.rootDir = "../root";
    this.eotDate = new Date("2099-01-01T00:00:00Z");
    this.eotTimestamp = this.eotDate.getTime();
    this.initializeConfig();
  }

  //domain: {
  //  "default": {
  //    schemaName: "main",
  //    appModules: { base: { schemaName: "main" }, },
  //  },
  //  "otega.io": {
  //    schemaName: "main",
  //    appModules: { base: { schemaName: "main" }, login: {}, group: {}, std: {}, geo: { schemaName: "main" }, sonar: {}, },
  //    nodemailerMessageDefaults: { from: 'spadkins@gmail.com', },
  //    groupSystemType: "PERS"
  //  },
  //  "*.otega.io": { primaryDomain: "otega.io" },
  //  "localhost": { primaryDomain: "otega.io" },
  //  "onthecurb.io": {
  //    schemaName: "main",
  //    appModules: { base: { schemaName: "main" }, login: {}, group: {}, std: {}, geo: { schemaName: "main" }, sonar: {}, },
  //    nodemailerMessageDefaults: { from: 'spadkins@gmail.com', },
  //    groupSystemType: "PERS"
  //  },
  //  "*.onthecurb.io": { primaryDomain: "onthecurb.io" },
  //}

  private initializeConfig () {
    let config = this;
    // console.log("Config.initializeConfig() config.domain (initial)", config.domain);
    // create domainTableDefs in each domain (also link up the each domain with its primaryDomain)
    for (let domain in config.domain) {                                              // for each domain defined in config-*.ts
      // console.log("Config.initializeConfig() domain=%s", domain);
      let domainConfig: DomainConfig = config.domain[domain];                        // get the config
      if (domainConfig && typeof(domainConfig) === "object") {                       // if it exists (and is an object)
        if (domainConfig.domainKey) continue;
        // console.log("Checking: primaryDomain=[%s] domain=[%s] configure=%j", domainConfig.primaryDomain, domain, (!domainConfig.primaryDomain || domainConfig.primaryDomain === domain));
        if (!domainConfig.primaryDomain || domainConfig.primaryDomain === domain) {  // if there is no "primaryDomain" or it matches the domain itself
          let domainSchemaName = domainConfig.schemaName;
          // console.log("Config.initializeConfig() domain=%s. domainSchemaName=%s", domain, domainSchemaName);
          if (!domainConfig.domainTableDefs) domainConfig.domainTableDefs = {};      // every domainConfig needs a domainConfig.domainTableDefs
          if (domainConfig.appModules) {                                             // if there are appModules defined for this domain
            for (let appModuleName in domainConfig.appModules) {                     // go through each appModule defined for this domain
              let schemaName = domainConfig.appModules[appModuleName].schemaName || domainSchemaName;
              // console.log("Config.initializeConfig() domain=%s. domainSchemaName=%s. appModuleName=%s", domain, domainSchemaName, appModuleName);
              if (config.appModule[appModuleName] && config.appModule[appModuleName].tables) {
                for (let tableName of config.appModule[appModuleName].tables) {      // go through each table in the appModule
                  // console.log("Config.initializeConfig() domain=%s. domainSchemaName=%s. tableName=%s", domain, domainSchemaName, tableName);
                  domainConfig.domainTableDefs[tableName] = { schemaName: schemaName }; // and set up its schemaName
                }
              }
            }
          }
          if (!domainConfig.domainRootDir) {
            domainConfig.domainRootDir = config.rootDir + "/" + domain.replace("*.","");
          }
          domainConfig.domainKey = domain;
          domainConfig.domainBase = domain.replace("*.","");                         // domainBase will be the same as domainKey for all in our example
        } // end of primary domain config
      }
    }
    // console.log("Config: this.domain", this.domain);
    for (let domain in config.domain) {                                              // now go back through all of the domains
      // console.log("Config.initializeConfig() domain=%s", domain);
      let domainConfig: DomainConfig = config.domain[domain];
      if (domainConfig && typeof(domainConfig) === "object") {
        if (domainConfig.domainKey) continue;
        if (domainConfig.primaryDomain && domainConfig.primaryDomain !== domain) {
          // Do nothing but link them together
          config.domain[domain] = config.domain[domainConfig.primaryDomain];
        }
      }
    }
    if (config.httpLogging === undefined) config.httpLogging = true;
    if (config.visitorLogging === undefined) config.visitorLogging = true;
    // console.log("Config: this.domain", this.domain);
  }

  getRequestTableDef (hostname: string, tableName: string): DomainTableDef {
    let domainTableDefs: DomainTableDefs = this.getRequestTableDefs(hostname);
    return(domainTableDefs[tableName]);
  }

  getRequestTableDefs (hostname: string): DomainTableDefs {
    let domainTableDefs: DomainTableDefs = {};
    let domainConfig = this.getDomainConfig(hostname);
    if (domainConfig) {
      domainTableDefs = domainConfig.domainTableDefs;
    }
    return(domainTableDefs);
  }

  getDomainConfig (hostname: string): DomainConfig {
    // console.log("Config.getDomainConfig() hostname", hostname);
    let domainConfig: DomainConfig = this.domain[hostname];
    if (!domainConfig) {
      // console.log("Config.getDomainConfig() hostname %s not found. checking wildcard.", hostname);
      let hostnameParts = hostname.split('.');
      hostnameParts[0] = "*";
      let wildcardDomain = hostnameParts.join('.');
      domainConfig = this.domain[wildcardDomain];
      // console.log("Config.getDomainConfig() hostname %s not found. checking wildcard.", hostname, wildcardDomain);
      if (!domainConfig) {
        // console.log("Config.getDomainConfig() wildcard %s not found. using default.", wildcardDomain);
        domainConfig = this.domain["default"] || {};
      }
    }
    return(domainConfig);
  }

  getModuleSchemaNames (appModuleName: string) {
    // console.log("Config.getModuleSchemaNames()", appModuleName);
    let config = this;
    let appModuleDefs = config.appModule || {};
    let schemaSeen = {};
    let schemaNames = [];
    if (config.domain) {
      for (let domain in config.domain) {
        // console.log("Config.getModuleSchemaNames() %s. domain=%s", appModuleName, domain);
        let domainConfig = config.domain[domain];
        // console.log(`domain: ${domain}`);
        if (domainConfig && typeof(domainConfig) === "object") {
          let domainSchemaName = domainConfig.schemaName;
          // console.log("Config.getModuleSchemaNames() %s. domain=%s. domainSchemaName=%s", appModuleName, domain, domainSchemaName);
          if (domainConfig.appModules[appModuleName]) {
            let schemaName = domainConfig.appModules[appModuleName].schemaName || domainSchemaName;
            if (!schemaSeen[schemaName]) {
              schemaSeen[schemaName] = 1;
              schemaNames.push(schemaName);
              // console.log("Config.getModuleSchemaNames() %s. domain=%s. domainSchemaName=%s ADDED", appModuleName, domain, domainSchemaName);
            }
          }
        }
      }
    }
    return(schemaNames);
  }
}
