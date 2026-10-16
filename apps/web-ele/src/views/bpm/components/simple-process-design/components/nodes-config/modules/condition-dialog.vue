<script setup lang="ts">
import type { ConditionGroup, FormTriggerSetting } from '../../../consts';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { cloneDeep } from '@vben/utils';

import { ElMessage } from 'element-plus';

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

const conditionRef = ref(); // 条件表单 Ref

const [Modal, modalApi] = useVbenModal<FormTriggerSetting>({
  title: '条件配置',
  destroyOnClose: true,
  draggable: true,
  onOpenChange(isOpen) {
    if (isOpen) {
      // 获取传递的数据
      const conditionObj = modalApi.getData();
      conditionData.value = {
        conditionType: conditionObj?.conditionType ?? ConditionType.RULE,
        conditionExpression: conditionObj?.conditionExpression,
        conditionGroups: cloneDeep(
          conditionObj?.conditionGroups ?? DEFAULT_CONDITION_GROUP_VALUE,
        ),
      };
    }
  },
  async onConfirm() {
    // 校验表单
    if (!conditionRef.value) return;
    const valid = await conditionRef.value.validate().catch(() => false);
    if (!valid) {
      ElMessage.warning('请完善条件规则');
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

/**
 * 打开条件配置弹窗，不暴露 modalApi 给父组件
 */
function openModal(conditionObj: FormTriggerSetting) {
  modalApi.setData(conditionObj).open();
}

// 暴露方法给父组件
defineExpose({ openModal });
</script>
<template>
  <Modal class="w-1/2">
    <Condition ref="conditionRef" v-model="conditionData" />
  </Modal>
</template>
