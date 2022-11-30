import getDatabase from '../database';

export async function getUserAuth(userId: string, groupId?: number): Promise<any> {
	const database = getDatabase();
	let user;
	if (groupId) {
		user = await database
		.select(
			'directus_users.id', 'directus_users.role', 'directus_users.sysRoleId', 'directus_users.status',
			'directus_users.currentGroupId', 'directus_users.email',
			'directus_roles.admin_access', 'directus_roles.app_access', 'directus_roles.name',
			'group.groupname', 'group.isPublic', 'group.parentGroupId', 'group.user_created',
			'group_memb.gid', 'group_memb.groupRoleId',
		)
		.from('directus_users')
		.leftJoin('directus_roles', 'directus_users.role', 'directus_roles.id')
		.leftJoin(database.raw('`group` on group.id = ?', groupId))
		.leftJoin(database.raw('group_memb on group_memb.uid = directus_users.id and group_memb.gid = ?', groupId))
		.where({ 'directus_users.id': userId })
		.first();
	}
	else {
		user = await database
		.select(
			'directus_users.id', 'directus_users.role', 'directus_users.sysRoleId', 'directus_users.status',
			'directus_users.currentGroupId', 'directus_users.email',
			'directus_roles.admin_access', 'directus_roles.app_access', 'directus_roles.name',
			'group.groupname', 'group.isPublic', 'group.user_created',
			'group_memb.gid', 'group_memb.groupRoleId',
		)
		.from('directus_users')
		.leftJoin('directus_roles', 'directus_users.role', 'directus_roles.id')
		.leftJoin('group', 'directus_users.currentGroupId', 'group.id')
		.leftJoin('group_memb', function () {
			this
			.on('directus_users.id', 'group_memb.uid')
			.andOn('directus_users.currentGroupId', 'group_memb.gid')
		})
		.where({ 'directus_users.id': userId })
		.first();
	}

	return(user);
}
