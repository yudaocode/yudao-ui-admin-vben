<script lang="ts" setup>
import type { SystemDeptApi } from '#/api/system/dept';

import { computed } from 'vue';

import { DICT_TYPE } from '@vben/constants';

import { Card } from 'antdv-next';

import { useDescription } from '#/components/description';
import { DictTag } from '#/components/dict-tag';

import { useHeaderSchema } from '../data';

const props = withDefaults(
  defineProps<{
    dept: SystemDeptApi.Dept;
    leaderUserName?: string;
    loading?: boolean;
    parentDeptName?: string;
    statistics: {
      activeCount: number;
      fullTimeCount: number;
      nonFullTimeCount: number;
    };
  }>(),
  {
    leaderUserName: undefined,
    loading: false,
    parentDeptName: undefined,
  },
);

const headerData = computed(() => ({
  parentDeptName: props.parentDeptName || '-',
  leaderUserName: props.leaderUserName || '-',
  activeCount: props.statistics.activeCount,
  fullTimeCount: props.statistics.fullTimeCount,
  nonFullTimeCount: props.statistics.nonFullTimeCount,
}));

const [Descriptions] = useDescription({
  bordered: false,
  column: 5,
  layout: 'vertical',
  schema: useHeaderSchema(),
});
</script>

<template>
  <div>
    <div class="flex items-start justify-between gap-4">
      <div class="min-w-0">
        <div class="flex flex-wrap items-center gap-2.5">
          <span class="break-all text-xl font-bold">{{
            dept.name || '-'
          }}</span>
          <DictTag :type="DICT_TYPE.COMMON_STATUS" :value="dept.status" />
        </div>
        <div class="text-muted-foreground mt-1.5 text-sm">
          部门编号：{{ dept.id || '-' }}
        </div>
      </div>
      <div>
        <slot></slot>
      </div>
    </div>
    <Card class="mt-2.5" :loading="loading">
      <Descriptions :data="headerData" />
    </Card>
  </div>
</template>
