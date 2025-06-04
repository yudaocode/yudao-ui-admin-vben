<script setup lang="ts">
import { ref } from 'vue';

import ContentWrap from '#/components/content-wrap/content-wrap.vue';
import { SimpleProcessDesigner } from '#/components/simple-process-design';

defineOptions({ name: 'SimpleModelDesign' });

defineProps<{
  modelFormId?: number;
  modelFormType?: number;
  modelName?: string;
  startDeptIds?: number[];
  startUserIds?: number[];
}>();

const emit = defineEmits(['success']);
const designerRef = ref();

/** 保存成功回调 */
const handleSuccess = (data?: any) => {
  if (data) {
    emit('success', data);
  }
};
/** 设计器配置校验 */
const validateConfig = async () => {
  return await designerRef.value.validate();
};
defineExpose({ validateConfig });
</script>
<template>
  <ContentWrap :body-style="{ padding: '20px 16px' }">
    <SimpleProcessDesigner
      :model-form-id="modelFormId"
      :model-name="modelName"
      :model-form-type="modelFormType"
      @success="handleSuccess"
      :start-user-ids="startUserIds"
      :start-dept-ids="startDeptIds"
      ref="designerRef"
    />
  </ContentWrap>
</template>
<style lang="scss" scoped></style>
