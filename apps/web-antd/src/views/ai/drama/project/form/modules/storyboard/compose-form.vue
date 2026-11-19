<script lang="ts" setup>
import type { AiDramaProjectApi } from '#/api/ai/drama/project';

import { nextTick, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import ComposePanel from './compose-panel.vue';

/** AI 短剧：合成成片弹窗；合成设置与分镜工作台的成片条共用 */
defineOptions({ name: 'AiDramaComposeForm' });

defineProps<{ detail: AiDramaProjectApi.ProjectDetail }>();
const emit = defineEmits<{ success: [] }>();

const panelRef = ref<InstanceType<typeof ComposePanel>>();

const [Modal, modalApi] = useVbenModal({
  footer: false,
});

/** 打开：storyboardIds 为指定的镜头顺序，为空时按镜头顺序 */
async function open(storyboardIds?: number[]) {
  modalApi.open();
  // 弹窗内容渲染后再重置合成设置
  for (let i = 0; i < 10 && !panelRef.value; i++) {
    await nextTick();
  }
  panelRef.value?.reset(storyboardIds);
}
defineExpose({ open });

/** 已提交合成：关闭弹窗 */
async function handleSuccess() {
  await modalApi.close();
  emit('success');
}
</script>

<template>
  <Modal title="合成成片" class="w-[720px]">
    <ComposePanel
      ref="panelRef"
      :detail="detail"
      @success="handleSuccess"
      @refresh="emit('success')"
    />
  </Modal>
</template>
