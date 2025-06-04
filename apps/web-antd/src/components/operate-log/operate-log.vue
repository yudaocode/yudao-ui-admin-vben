<script setup lang="ts">
import type { OperateLogProps } from './typing';

import { Timeline } from 'ant-design-vue';

import { DICT_TYPE, getDictLabel, getDictObj } from '#/utils';

defineOptions({ name: 'OperateLogV2' });

withDefaults(defineProps<OperateLogProps>(), {
  logList: () => [],
});

function getUserTypeColor(userType: number) {
  const dict = getDictObj(DICT_TYPE.USER_TYPE, userType);
  switch (dict?.colorType) {
    case 'danger': {
      return '#F56C6C';
    }
    case 'info': {
      return '#909399';
    }
    case 'success': {
      return '#67C23A';
    }
    case 'warning': {
      return '#E6A23C';
    }
  }
  return '#409EFF';
}
</script>
<template>
  <div>
    <Timeline>
      <Timeline.Item
        v-for="log in logList"
        :key="log.id"
        :color="getUserTypeColor(log.userType)"
      >
        <p>{{ log.createTime }}</p>
        <p>{{ getDictLabel(DICT_TYPE.USER_TYPE, log.userType)[0] }}</p>
      </Timeline.Item>
    </Timeline>
  </div>
</template>
