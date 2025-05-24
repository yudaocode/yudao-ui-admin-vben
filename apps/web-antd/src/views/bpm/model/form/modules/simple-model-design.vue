<script setup lang="ts">
import { ref } from 'vue';

import ContentWrap from '#/components/content-wrap/content-wrap.vue';
import { SimpleProcessDesigner } from '#/components/simple-process-design';

defineOptions({ name: 'SimpleModelDesign' });

defineProps<{
  modelId?: string;
  modelKey?: string;
  modelName?: string;
  startDeptIds?: number[];
  startUserIds?: number[];
}>();

const emit = defineEmits(['success']);
const designerRef = ref();

// 修改成功回调
const handleSuccess = (data?: any) => {
  if (data) {
    emit('success', data);
  }
};
</script>
<template>
  <ContentWrap :body-style="{ padding: '20px 16px' }">
    <SimpleProcessDesigner
      :model-id="modelId"
      :model-key="modelKey"
      :model-name="modelName"
      @success="handleSuccess"
      :start-user-ids="startUserIds"
      :start-dept-ids="startDeptIds"
      ref="designerRef"
    />
  </ContentWrap>
</template>
<style lang="scss" scoped></style>
