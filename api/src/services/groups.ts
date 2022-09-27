import { Accountability, Query, SchemaOverview } from '@directus/shared/types';
// import { parseJSON, toArray } from '@directus/shared/utils';
// import { queue } from 'async';
// import csv from 'csv-parser';
// import destroyStream from 'destroy';
// import { appendFile, createReadStream } from 'fs-extra';
// import { parse as toXML } from 'js2xmlparser';
// import { Parser as CSVParser, transforms as CSVTransforms } from 'json2csv';
import { Knex } from 'knex';
// import { set, transform } from 'lodash';
// import StreamArray from 'stream-json/streamers/StreamArray';
// import stripBomStream from 'strip-bom-stream';
// import { file as createTmpFile } from 'tmp-promise';
import getDatabase from '../database';
// import env from '../env';
// import {
// 	ForbiddenException,
// 	InvalidPayloadException,
// 	ServiceUnavailableException,
// 	UnsupportedMediaTypeException,
// } from '../exceptions';
// import logger from '../logger';
import { AbstractServiceOptions, File } from '../types';
// import { getDateFormatted } from '../utils/get-date-formatted';
// import { FilesService } from './files';
// import { ItemsService } from './items';
// import { NotificationsService } from './notifications';

export class GroupsService {
	knex: Knex;
	accountability: Accountability | null;
	schema: SchemaOverview;

	constructor(options: AbstractServiceOptions) {
		this.knex = options.knex || getDatabase();
		this.accountability = options.accountability || null;
		this.schema = options.schema;
	}
}
