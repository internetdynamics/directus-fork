
import { DataOptions, StoreOptions, DBTableDef } from '../classes/DBInterfaces';
import { ObjectArrayLookup, ObjectLookup, Scalar } from '../types';

export interface IDatabase {

  getObjects(
    tableName: string,
    params?: object|string|number,
    columns?: string[],
    options?: DataOptions)
    : Promise<object[]>;

  getObject(
    tableName: string,
    params?: object|string|number,
    columns?: string[],
    options?: DataOptions)
    : Promise<object|null>;

  getValue(
    tableName: string,
    params?: object|string|number,
    column?: string,
    options?: DataOptions)
    : Promise<string|number|boolean|null>;

  getValueArray(
    tableName: string,
    params?: object|string|number,
    column?: string,
    options?: DataOptions)
    : Promise<any[]>;
  
  executeSql(sql: string, options?: DataOptions) : Promise<object>;
  executeInsertSql(sql: string) : Promise<number>;
  executeDml(sql: string, options?: DataOptions) : Promise<number>;

  // setCurrentUserAndGroup(user: UserData, group: GroupData);
  getTableDef(tableName: string): DBTableDef;
  getNativeTableDef(tableName: string): any;
  printTableDef(tableDef: DBTableDef);
  printNativeTableDef(nativeTableDef: any);
  getTableNames() : Promise<string[]>;

  getObjectOfValuesByKey(
    tableName: string,
    params: object,
    columns: string[],
    keyColumn: string,
    valueColumn: string,
    options?: DataOptions
  ): Promise<ObjectLookup<Scalar>>;

  getObjectOfObjectsByKey(
    tableName: string,
    params: object,
    columns: string[],
    keyColumn: string,
    options?: DataOptions)
    : Promise<ObjectLookup<object>>;

  getObjectOfObjectsByKeys(
    tableName: string,
    params: object,
    columns: string[],
    keyColumns: string[],
    options?: DataOptions)
    : Promise<any>;

  getObjectOfObjectArraysByKey(
    tableName: string,
    params: object,
    columns: string[],
    keyColumn: string,
    options?: DataOptions)
    : Promise<ObjectArrayLookup<object>>;

  getObjectOfObjectArraysByKeys(
    tableName: string,
    params: object,
    columns: string[],
    keyColumns: string[],
    options?: DataOptions)
    : Promise<any>;
  
  makeObjectOfValuesByKey(objects: object[], keyColumn: string, valueColumn: string, options?: DataOptions): ObjectLookup<any>;
  makeObjectOfObjectsByKey(objects: object[], keyColumn: string, options?: DataOptions): ObjectLookup<object>;
  makeObjectOfObjectsByKeys(objects: object[], keyColumns: string[], options?: DataOptions): any;
  makeObjectOfObjectArraysByKey(objects: object[], keyColumn: string, options?: DataOptions): ObjectArrayLookup<object>;
  makeObjectOfObjectArraysByKeys(objects: object[], keyColumns: string[], options?: DataOptions): any;
  makeObjectOfCounts(objects: object[], keyColumn: string|string[], options?: DataOptions): object;
  makeKeyValue(columns: string[], obj: object, delim?: string, caseSensitive?: boolean) : string;

  getColumn(
    tableName: string,
    params?: object|string|number,
    column?: string,
    options?: DataOptions
  ) : Promise<any[]>;

  joinObjects(
    rows: object[],
    joinColumns: string|object,
    tableName: string,
    params?: object,
    columns?: string[],
    options?: DataOptions)
    : Promise<object[]>;

  // async getDeferredColumns(
  //   tableName: string,
  //   observableModels?: ObservableObjects,
  //   columns?: string[])
  //   : Promise<string[]>;

  insert(
    tableName: string,
    model: object,
    columns?: string[],
    options?: DataOptions)
    : Promise<number>;

  insertObjects(
    tableName: string,
    models: object[],
    columns?: string[],
    options?: DataOptions)
    : Promise<object>;

  update(
    tableName: string,
    params?: object|string|number,
    values?: object,
    columns?: string[],
    options?: DataOptions)
    : Promise<number>;

  delete(
    tableName: string,
    params?: object|string|number,
    options?: object)
    : Promise<number>;

  storeObjects(
    tableName: string,
    columns: string[],
    rows: any[][],
    globalVals: any,
    options: StoreOptions)
    : Promise<void>;

  // manageObjects(
  //   tableName: string,
  //   params?: object|string|number,
  //   columns?: string[],
  //   options?: DataOptions,
  //   postProcess?: string|((objects: object[]) => void)
  // ): ObjectSetDef;

  // onUserChange(user: UserData, group: GroupData);
  // onGroupChange(user: UserData, group: GroupData);

  convertToRelated(sourceObject: object, sourceModelName: string, relatedModelName: string) : object;
  syncObjects(tableName: string, objects: object[], keyColumns: string[], params: object): Promise<void>;
  syncObjectsById(tableName: string, objects: object[], keyColumns: string[], params: object): Promise<void>;

  createId(randStr?: string, datetimeStr?: string, order?: number): number;
  extractIdTimestamp(id: string): number;

  isDuplicateError(code: string, message: string): boolean;

  makeNativeExpression (dbexpr: string): string;
}
