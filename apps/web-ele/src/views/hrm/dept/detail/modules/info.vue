<script lang="ts" setup>
import type { SystemDeptApi } from '#/api/system/dept';

import { computed, ref } from 'vue';

import { ElCollapse, ElCollapseItem } from 'element-plus';

import { useDescription } from '#/components/description';

import { useInfoSchema } from '../data';

const props = withDefaults(
  defineProps<{
    dept: SystemDeptApi.Dept;
    leaderUserName?: string;
    parentDeptName?: string;
  }>(),
  {
    leaderUserName: undefined,
    parentDeptName: undefined,
  },
);

const infoData = computed(() => ({
  ...props.dept,
  parentDeptName: props.parentDeptName || '-',
  leaderUserName: props.leaderUserName || '-',
}));

const activeNames = ref(['basicInfo']);

const [Descriptions] = useDescription({
  border: false,
  column: 3,
  schema: useInfoSchema(),
});
</script>

<template>
  <ElCollapse v-model="activeNames">
    <ElCollapseItem name="basicInfo">
      <template #title>
        <span class="text-base font-bold">基本信息</span>
      </template>
      <Descriptions :data="infoData" />
    </ElCollapseItem>
  </ElCollapse>
</template>
