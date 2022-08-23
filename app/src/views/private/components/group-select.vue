<template>
  <div>
    <label class="label">Current Group</label>
    <v-select
      label="groupLabel"
      :reduce="(group: any) => group.groupId"
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

declare interface GroupData {
  groupId?: number;
  groupDisplayName?: string;
  groupname?: string;
  groupLabel?: string;
}

export default defineComponent({
  components: { vSelect },
  data() {
    return {
      groupId: this.groupId,
      groups: [] as GroupData[],
    };
  },
  setup() {},
  watch: {
    groupId(newGroupId) {
      this.changeGroup(newGroupId);
    },
  },
  methods: {
    async changeGroup(groupId: number) {
      const userStore = useUserStore();
      const currentGroupId = (userStore.currentUser as User)?.currentGroupId;

      if (groupId && groupId !== currentGroupId) {
        await api.patch(`/users/me`, {
          currentGroupId: groupId,
        });

        userStore.hydrate();
        window.location.reload();
      }
    },
  },

  mounted() {
    const userStore = useUserStore();
    const currentGroupId = (userStore.currentUser as User)?.currentGroupId;

    api.get("/items/group").then((res) => {
      for (let group of res.data.data) {
        this.groups.push({
          groupId: group.id,
          groupLabel: group.groupDisplayName + " (" + group.groupname + ")",
        });
      }

      let groupId: any = currentGroupId;
      this.groupId = groupId;
    });
  },
});
</script>

<style lang="scss" scoped>
.label {
  padding: 5px 10px;
  color: #6a42fa;
}
</style>
