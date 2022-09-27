// import { nextDay } from 'date-fns';
import express from 'express';
import { Query } from '@directus/shared/types';
// import { uniqueId } from 'lodash';
// import { ForbiddenException, RouteNotFoundException } from '../exceptions';
// import collectionExists from '../middleware/collection-exists';
import { respond } from '../middleware/respond';
// import { validateBatch } from '../middleware/validate-batch';
// import { Knex } from 'knex';
import getDatabase from '../database';
// import { ItemsService, MetaService } from '../services';
// import { PrimaryKey } from '../types';
import asyncHandler from '../utils/async-handler';
import { getUserAuth } from '../utils/get-user-auth';
// import logger from '../../../logger';

const router = express.Router();

const readMyGroups = asyncHandler(async (req, res, next) => {
	// console.log("XXX [controllers] groups req", req);
	let accountability = req.accountability;
	// let schema = req.schema;
	// let collection = "group";
	let userId = accountability?.user;
	let role = accountability?.role;
	let isAdmin = accountability?.admin;
	// console.log("XXX [controllers/groups] readMyGroups : user, role, admin", userId, role, isAdmin);

	let user = userId ? await getUserAuth(userId) : {};
	// console.log("XXX user", user);

	const database = getDatabase();
	let groups: any[];
	if (userId && user) {
		let uid = userId;
		if (isAdmin || user.sysRoleId === 1) {
			groups = await database
			.select(
				'group.id', 'group.groupname', 'group.groupDisplayName',
				'group_memb.groupRoleId', 'group_memb.groupMembStatusId', 'group_memb.lastAccessedDate',
			)
			.from('group')
			.leftJoin(database.raw('group_memb on group_memb.gid = group.id and group_memb.uid = ?', uid))
			.orderBy("group_memb.lastAccessedDate", "desc", "group.id");
		}
		else {
			groups = await database
			.select(
				'group.id', 'group.groupname', 'group.groupDisplayName',
				'group_memb.groupRoleId', 'group_memb.groupMembStatusId', 'group_memb.lastAccessedDate',
			)
			.from('group')
			.leftJoin(database.raw('group_memb on group_memb.gid = group.id and group_memb.uid = ?', uid))
			.where({ 'group.isPublic': true })
			.orWhere({ 'group_memb.uid': userId })
			.orderBy("group_memb.lastAccessedDate", "desc", "group.id");
		}
	}
	else {
		groups = await database
		.select('group.id', 'group.groupname', 'group.groupDisplayName')
		.from('group')
		.where({ 'group.isPublic': true })
		.orderBy("group.id");
	}
	for (let group of groups) {
		group.groupLabel = group.groupDisplayName + " (" + group.groupname + ")";
	}
	// console.log("XXX [controllers/groups] readMyGroups : groups", groups);

	res.locals.payload = {
		data: groups,
		// debug: { user: userId, role: role, admin: isAdmin }
	};

	return next();
});

// router.search('/:collection', collectionExists, validateBatch('read'), readMyGroups, respond);
router.get('/', readMyGroups, respond);
// router.get('/myGroups', readMyGroups, respond);
// router.get('/myGroups/:key', readMyGroups, respond);
// router.get('/:collection', collectionExists, readMyGroups, respond);

// router.get(
// 	'/:collection/:pk',
// 	collectionExists,
// 	asyncHandler(async (req, res, next) => {
// 		if (req.params.collection.startsWith('directus_')) throw new ForbiddenException();

// 		const service = new ItemsService(req.collection, {
// 			accountability: req.accountability,
// 			schema: req.schema,
// 		});

// 		const result = await service.readOne(req.params.pk, req.sanitizedQuery);

// 		res.locals.payload = {
// 			data: result || null,
// 		};

// 		return next();
// 	}),
// 	respond
// );

router.post(
	'/switchGroup/:gid',
	// collectionExists,
	asyncHandler(async (req, res, next) => {
		console.log("[controllers] groups/switchGroup/%s", req.params.gid);
		let accountability = req.accountability;
		let userId = accountability?.user;
		let role = accountability?.role;
		let isAdmin = accountability?.admin;
		let gid = req.params.gid;
		if (userId) {
			let now = new Date();
			const database = getDatabase();

			let groupMemb: any = await database
			.select("directus_users.sysRoleId", "group_memb.gid", "group_memb.groupRoleId", "group_memb.groupMembStatusId")
			.from("directus_users")
			.leftJoin("group_memb","group_memb.uid","directus_users.id")
			.where({
				'directus_users.id': userId,
				'group_memb.uid': userId,
				'group_memb.gid': gid
			})
			.first();
			console.log("XXX groupMemb", groupMemb);

			let sysRoleId;
			if (groupMemb && groupMemb.sysRoleId) {
				sysRoleId = groupMemb.sysRoleId;
				delete groupMemb.sysRoleId;
			}

			if (groupMemb && !groupMemb.gid && (isAdmin || sysRoleId === 1)) {
				groupMemb = {
					'user_created': userId,
					'date_created': now,
					'user_updated': userId,
					'date_updated': now,
					'uid': userId,
					'gid': gid,
					'groupRoleId': 1,
					'groupMembStatusId': 1,
					'lastAccessedDate': now,
				};
				let groupMembInsertResult = await database('group_memb')
				.insert(groupMemb, ["id"]);
				console.log("XXX insert group_memb groupMembInsertResult", groupMembInsertResult);
			}
			else if (groupMemb && groupMemb.gid && groupMemb.groupMembStatusId === 1) {
				let groupMembUpdateResult = await database('group_memb')
				.where({
					'uid': userId,
					'gid': gid,
				})
				.update({
					'lastAccessedDate': now,
				});
				console.log("XXX update group_memb result", groupMembUpdateResult);
			}

			if (groupMemb && groupMemb.groupMembStatusId === 1) {
				let result = await database('directus_users')
				.where('id', '=', userId)
				.update({
					currentGroupId: gid,
					currentGroupMembStatusId: groupMemb.groupMembStatusId,
					currentGroupRoleId: groupMemb.groupRoleId,
				});
				console.log("XXX update directus_user result", result);
			}
		}
		return next();
	}),
	readMyGroups,
	respond
);

// router.patch(
// 	'/:collection',
// 	collectionExists,
// 	validateBatch('update'),
// 	asyncHandler(async (req, res, next) => {
// 		if (req.params.collection.startsWith('directus_')) throw new ForbiddenException();

// 		const service = new ItemsService(req.collection, {
// 			accountability: req.accountability,
// 			schema: req.schema,
// 		});

// 		if (req.singleton === true) {
// 			await service.upsertSingleton(req.body);
// 			const item = await service.readSingleton(req.sanitizedQuery);

// 			res.locals.payload = { data: item || null };
// 			return next();
// 		}

// 		let keys: PrimaryKey[] = [];

// 		if (Array.isArray(req.body)) {
// 			keys = await service.updateBatch(req.body);
// 		} else if (req.body.keys) {
// 			keys = await service.updateMany(req.body.keys, req.body.data);
// 		} else {
// 			keys = await service.updateByQuery(req.body.query, req.body.data);
// 		}

// 		try {
// 			const result = await service.readMany(keys, req.sanitizedQuery);
// 			res.locals.payload = { data: result };
// 		} catch (error: any) {
// 			if (error instanceof ForbiddenException) {
// 				return next();
// 			}

// 			throw error;
// 		}

// 		return next();
// 	}),
// 	respond
// );

// router.patch(
// 	'/:collection/:pk',
// 	collectionExists,
// 	asyncHandler(async (req, res, next) => {
// 		if (req.params.collection.startsWith('directus_')) throw new ForbiddenException();

// 		if (req.singleton) {
// 			throw new RouteNotFoundException(req.path);
// 		}

// 		const service = new ItemsService(req.collection, {
// 			accountability: req.accountability,
// 			schema: req.schema,
// 		});

// 		const updatedPrimaryKey = await service.updateOne(req.params.pk, req.body);

// 		try {
// 			const result = await service.readOne(updatedPrimaryKey, req.sanitizedQuery);
// 			res.locals.payload = { data: result || null };
// 		} catch (error: any) {
// 			if (error instanceof ForbiddenException) {
// 				return next();
// 			}

// 			throw error;
// 		}

// 		return next();
// 	}),
// 	respond
// );

// router.delete(
// 	'/:collection',
// 	collectionExists,
// 	validateBatch('delete'),
// 	asyncHandler(async (req, res, next) => {
// 		if (req.params.collection.startsWith('directus_')) throw new ForbiddenException();

// 		const service = new ItemsService(req.collection, {
// 			accountability: req.accountability,
// 			schema: req.schema,
// 		});

// 		if (Array.isArray(req.body)) {
// 			await service.deleteMany(req.body);
// 		} else if (req.body.keys) {
// 			await service.deleteMany(req.body.keys);
// 		} else {
// 			await service.deleteByQuery(req.body.query);
// 		}

// 		return next();
// 	}),
// 	respond
// );

// router.delete(
// 	'/:collection/:pk',
// 	collectionExists,
// 	asyncHandler(async (req, res, next) => {
// 		if (req.params.collection.startsWith('directus_')) throw new ForbiddenException();

// 		const service = new ItemsService(req.collection, {
// 			accountability: req.accountability,
// 			schema: req.schema,
// 		});

// 		await service.deleteOne(req.params.pk);
// 		return next();
// 	}),
// 	respond
// );

export default router;
