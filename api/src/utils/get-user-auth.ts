import getDatabase from '../database';

export async function getUserAuth(userId: string): Promise<any> {
	const database = getDatabase();
	const user = await database
	.select(
		'directus_users.id', 'directus_users.role', 'directus_users.sysRoleId', 'directus_users.status',
		'directus_users.currentGroupId', 'directus_users.email',
		'directus_roles.admin_access', 'directus_roles.app_access', 'directus_roles.name',
		'group.groupname',
		'group_memb.groupRoleId', 'group_memb.groupMembStatusId',
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

	return(user);
}
