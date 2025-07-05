<script setup lang="ts">
import type { ConditionGroup } from '../../../consts';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { cloneDeep } from '@vben/utils';

import { message } from 'ant-design-vue';

import { ConditionType, DEFAULT_CONDITION_GROUP_VALUE } from '../../../consts';
import Condition from './condition.vue';

defineOptions({ name: 'ConditionDialog' });

const emit = defineEmits<{
  updateCondition: [condition: object];
}>();

const conditionData = ref<{
  conditionExpression?: string;
  conditionGroups?: ConditionGroup;
  conditionType: ConditionType;
}>({
  conditionType: ConditionType.RULE,
  conditionGroups: cloneDeep(DEFAULT_CONDITION_GROUP_VALUE),
});

// 条件组件的引用
const conditionRef = ref();

const [Modal, modalApi] = useVbenModal({
  title: '条件配置',
  destroyOnClose: true,
  draggable: true,
  onOpenChange(isOpen) {
    if (isOpen) {
      // 获取传递的数据
      const conditionObj = modalApi.getData();
      if (conditionObj) {
        conditionData.value.conditionType = conditionObj.conditionType;
        conditionData.value.conditionExpression =
          conditionObj.conditionExpression;
        conditionData.value.conditionGroups = conditionObj.conditionGroups;
      }
    }
  },
  async onConfirm() {
    // 校验表单
    if (!conditionRef.value) return;
    const valid = await conditionRef.value.validate().catch(() => false);
    if (!valid) {
      message.warning('请完善条件规则');
      return;
    }
    // 设置完的条件传递给父组件
    emit('updateCondition', conditionData.value);
    modalApi.close();
  },
  onCancel() {
    modalApi.close();
  },
});

// TODO xingyu 暴露 modalApi 给父组件是否合适? trigger-node-config.vue 会有多个 conditionDialog 实例
// TODO @jason：回复 from xingyu：不用暴露啊，用 useVbenModal 就可以了
defineExpose({ modalApi });
</script>
<template>
  <Modal class="w-1/2">
    <Condition ref="conditionRef" v-model="conditionData" />
  </Modal>
</template>
