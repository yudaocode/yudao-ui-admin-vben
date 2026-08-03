<script lang="ts" setup>
import type { SystemDeptApi } from '#/api/system/dept';

import { computed, ref } from 'vue';

import { Collapse, CollapsePanel } from 'antdv-next';

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

const activeKeys = ref(['basicInfo']);

const [Descriptions] = useDescription({
  bordered: false,
  column: 3,
  schema: useInfoSchema(),
});
</script>

<template>
  <Collapse v-model:active-key="activeKeys">
    <CollapsePanel key="basicInfo" header="基本信息">
      <Descriptions :data="infoData" />
    </CollapsePanel>
  </Collapse>
</template>
