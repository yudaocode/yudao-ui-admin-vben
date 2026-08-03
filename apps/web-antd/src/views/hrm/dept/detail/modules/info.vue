<script lang="ts" setup>
import type { SystemDeptApi } from '#/api/system/dept';

import { computed } from 'vue';

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

const [Descriptions] = useDescription({
  title: '基本信息',
  bordered: false,
  column: 3,
  schema: useInfoSchema(),
});
</script>

<template>
  <Descriptions :data="infoData" />
</template>
