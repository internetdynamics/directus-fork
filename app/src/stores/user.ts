import api from '@/api';
import { useLatencyStore } from '@/stores/latency';
import { User } from '@directus/shared/types';
import { userName } from '@/utils/user-name';
import { defineStore } from 'pinia';

type ShareUser = {
	share: string;
	role: {
		id: string;
		admin_access: false;
		app_access: false;
	};
};

export const useUserStore = defineStore({
	id: 'userStore',
	state: () => ({
		currentUser: null as User | ShareUser | null,
		loading: false,
		error: null,
	}),
	getters: {
		fullName(): string | null {
			if (this.currentUser === null || 'share' in this.currentUser) return null;
			return userName(this.currentUser);
		},
		isAdmin(): boolean {
			return this.currentUser?.role.admin_access === true || false;
		},
	},
	actions: {
		async hydrate() {
			this.loading = true;

			try {
				const fields = [
					'id',
					'language',
					'first_name',
					'last_name',
					'email',
					'last_page',
					'theme',
					'tfa_secret',
					'avatar.id',
					'role.admin_access',
					'role.app_access',
					'role.id',
					'role.enforce_tfa',
					'currentGroupRoleId',
					'sysRoleId',
					'currentGroupId',
					'currentGroupId1',
					'currentGroupId2',
					'currentGroupId3',
					'currentGroupId4',
					'currentGroupId5',
					'currentGroupId6',
					'currentGroupId7',
					'currentGroupId8',
					'currentGroupId9',
					'currentGroupId10',
				];

				const { data } = await api.get(`/users/me`, { params: { fields } });
				// console.log("XXX stores/user", data);
				// let user = data.data;
				// if (user) {
				// 	if (typeof(user.currentGroupId) !== "string") user.currentGroupId = "" + user.currentGroupId;
				// 	if (typeof(user.currentGroupId1) !== "string") user.currentGroupId1 = "" + user.currentGroupId1;
				// 	if (typeof(user.currentGroupId2) !== "string") user.currentGroupId2 = "" + user.currentGroupId2;
				// 	if (typeof(user.currentGroupId3) !== "string") user.currentGroupId3 = "" + user.currentGroupId3;
				// 	if (typeof(user.currentGroupId4) !== "string") user.currentGroupId4 = "" + user.currentGroupId4;
				// 	if (typeof(user.currentGroupId5) !== "string") user.currentGroupId5 = "" + user.currentGroupId5;
				// 	if (typeof(user.currentGroupId6) !== "string") user.currentGroupId6 = "" + user.currentGroupId6;
				// 	if (typeof(user.currentGroupId7) !== "string") user.currentGroupId7 = "" + user.currentGroupId7;
				// 	if (typeof(user.currentGroupId8) !== "string") user.currentGroupId8 = "" + user.currentGroupId8;
				// 	if (typeof(user.currentGroupId9) !== "string") user.currentGroupId9 = "" + user.currentGroupId9;
				// 	if (typeof(user.currentGroupId10) !== "string") user.currentGroupId10 = "" + user.currentGroupId10;
				// }
				this.currentUser = data.data;
			} catch (error: any) {
				this.error = error;
			} finally {
				this.loading = false;
			}
		},
		async dehydrate() {
			this.$reset();
		},
		async trackPage(page: string) {
			const latencyStore = useLatencyStore();

			const start = performance.now();

			await api.patch(`/users/me/track/page`, {
				last_page: page,
			});

			const end = performance.now();

			latencyStore.save({
				timestamp: new Date(),
				latency: end - start,
			});

			if (this.currentUser && !('share' in this.currentUser)) {
				this.currentUser.last_page = page;
			}
		},
	},
});
