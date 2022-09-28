<template>
  <div>
    <label class="label">Current Group</label>
    <v-select
      label="groupLabel"
      :reduce="(group: any) => group.id"
      v-model="groupId"
      :options="groups"
      placeholder="Search..."
      class="vc__truncate"
    ></v-select>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import vSelect from "vue-select";
import "vue-select/dist/vue-select.css";
import api from "@/api";
import { User } from "@directus/shared/types";
import { useUserStore } from "@/stores/user";
// import * as lodash from 'lodash';

declare interface GroupData {
  id?: number;     // needed for the template
  // groupId?: number;
  groupDisplayName?: string;
  groupname?: string;
  groupLabel?: string;  // needed for the template
  currentGroupRoleId?: number;
  currentGroupMembStatusId?: number;
}

// declare interface GroupMembData {
//   groupRoleId?: number;
//   groupMembStatusId?: number;
//   gid?: GroupData;
// }

export default defineComponent({
  components: { vSelect },
  data() {
    return {
      groupId: this.groupId,
      // groupMembs: [] as GroupMembData[],
      groups: [] as GroupData[],
    };
  },
  setup() {},
  watch: {
    groupId(newGroupId) {
      this.switchGroup(newGroupId);
    },
  },
  methods: {
    async switchGroup(groupId: number) {
      const userStore = useUserStore();
      const user = userStore.currentUser as User;
      const currentGroupId: any = user?.currentGroupId;
      // console.log("[views/private/components] groupSelect.switchGroup() currentGroupId=[%s] =>> groupId=[%s]", currentGroupId, groupId, typeof(currentGroupId), typeof(groupId));

      if (typeof(groupId) === "number" && groupId !== currentGroupId) {
        api.post(`/groups/switchGroup/${groupId}`).then((res) => {
          this.groupId = groupId as any;
          this.groups = res.data.data;
          // console.log("[views/private/components] groupSelect.switchGroup() this.groups repopulated len=[%s]", this.groups.length);
          window.location.reload();
        });
      }
    },
  },

  mounted() {
    const userStore = useUserStore();
    let user = userStore.currentUser as User;
    const currentGroupId = user.currentGroupId;
    let groupId: any = currentGroupId;

    api.get("/groups").then((res) => {
      this.groupId = groupId;
      this.groups = res.data.data;
      // console.log("[views/private/components] groupSelect.mounted() this.groups populated groupId=[%s] len=[%s]", this.groupId, this.groups.length);
    });
  }
});
</script>

<style lang="scss" scoped>
.label {
  padding: 5px 10px;
  color: #6a42fa;
}
</style>
