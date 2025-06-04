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

// TODO: jason  open 在 useVbenModal 中 onOpenChange 方法
function open(conditionObj: any | undefined) {
  if (conditionObj) {
    conditionData.value.conditionType = conditionObj.conditionType;
    conditionData.value.conditionExpression = conditionObj.conditionExpression;
    conditionData.value.conditionGroups = conditionObj.conditionGroups;
  }
  modalApi.open();
}
// TODO: jason  不需要暴露expose，直接使用modalApi.setData(formSetting).open()
defineExpose({ open });
</script>
<template>
  <Modal class="w-1/2">
    <Condition ref="conditionRef" v-model="conditionData" />
  </Modal>
</template>
