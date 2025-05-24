<script lang="ts" setup>
import type { Ref } from 'vue';

import { computed, inject, nextTick } from 'vue';

import { BpmModelType } from '#/utils';

// TODO BPM 流程模型设计器 BpmModelEditor 待整合
import SimpleModelDesign from './simple-model-design.vue';

// 创建本地数据副本
const modelData = defineModel<any>();

const processData = inject('processData') as Ref;

/** 表单校验 */
const validate = async () => {
  // 获取最新的流程数据
  if (!processData.value) {
    throw new Error('请设计流程');
  }
  return true;
};
/** 处理设计器保存成功 */
const handleDesignSuccess = async (data?: any) => {
  if (data) {
    // 创建新的对象以触发响应式更新
    const newModelData = {
      ...modelData.value,
      bpmnXml: modelData.value.type === BpmModelType.BPMN ? data : null,
      simpleModel: modelData.value.type === BpmModelType.BPMN ? null : data,
    };
    // 使用emit更新父组件的数据
    await nextTick();
    // 更新表单的模型数据部分
    modelData.value = newModelData;
  }
};

/** 是否显示设计器 */
const showDesigner = computed(() => {
  return Boolean(modelData.value?.key && modelData.value?.name);
});
defineExpose({
  validate,
});
</script>
<template>
  <div class="h-full">
    <!-- BPMN设计器 -->
    <template v-if="modelData.type === BpmModelType.BPMN">
      <!-- TODO BPMN 流程设计器 -->
    </template>
    <!-- Simple设计器 -->
    <template v-else>
      <SimpleModelDesign
        v-if="showDesigner"
        :model-id="modelData.id"
        :model-key="modelData.key"
        :model-name="modelData.name"
        :start-user-ids="modelData.startUserIds"
        :start-dept-ids="modelData.startDeptIds"
        @success="handleDesignSuccess"
      />
    </template>
  </div>
</template>
