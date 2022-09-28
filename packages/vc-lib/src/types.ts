
export type Scalar                   = string|number|boolean;
export type ObjectLookup<T>          = { value?: T };
export type ObjectArrayLookup<T>     = { value?: T[] };
export type ObjectOfNumber           = { value?: number };
export type ObjectOfAny              = { value?: any };
export type ObjectOfScalar           = { value?: Scalar };

// export type ObservableObjects        = Observable<object[]>;
// export type ObservableObject         = Observable<object|null>;
// export type DeferredObjects          = Promise<object[]>;
// export type DeferredObject           = Promise<object|null>;
// export type DeferredStringArray      = Promise<string[]>;

export interface DomainTableDef {
  schemaName?: string;
  disabled?:   boolean;
}

export interface DomainTableDefs {
  [tableName: string]: DomainTableDef;
}

export interface DomainConfig {
  primaryDomain?: string;
  domainKey?: string;   // this is the key into config.domain that this DomainConfig comes from (may be wildcard, e.g. *.dbfoundry.com)
  domainBase?: string;  // this differs only from domainKey in that wildcard domains become base domains (e.g. "dbfoundry.com", not "*.dbfoundry.com")
  schemaName?: string;
  appModules?: any;
  apiModules?: any;
  domainTableDefs?: DomainTableDefs;
  domainRootDir?: string;
  nodemailerMessageDefaults?: string;
  groupSystemType?: string;      // null/NONE: no groups. BASIC: groups but no personal groups. PERS: groups and personal groups.
  appBaseUrl?: string;
  logoSquareUrl?: string;
  logoSquarePathname?: string;
  appName?: string;
  copyright?: string;
}

export interface DomainConfigs {
  [domainName: string]: DomainConfig;
}
