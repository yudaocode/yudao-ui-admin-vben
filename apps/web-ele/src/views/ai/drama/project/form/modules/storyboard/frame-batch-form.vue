<script lang="ts" setup>
import { reactive } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  ElButton,
  ElForm,
  ElFormItem,
  ElInputNumber,
  ElMessage,
} from 'element-plus';

import { generateDramaStoryboardFrameBatch } from '#/api/ai/drama/storyboard';

/** AI 短剧：批量生成关键帧；当前剧本中镜头序号在范围内、还没有关键帧的镜头 */
defineOptions({ name: 'AiDramaFrameBatchForm' });

const props = defineProps<{ modelId?: number; projectId: number }>();
const emit = defineEmits<{ success: [] }>();

const formData = reactive({ startSceneNo: 1, endSceneNo: 10 });

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    modalApi.lock();
    try {
      const count = await generateDramaStoryboardFrameBatch({
        projectId: props.projectId,
        modelId: props.modelId!,
        ...formData,
      });
      ElMessage.success(
        count ? `已提交 ${count} 个镜头` : '没有需要生成关键帧的镜头',
      );
      await modalApi.close();
      emit('success');
    } finally {
      modalApi.unlock();
    }
  },
});

/** 设为开场 10 镜 */
function setOpening() {
  formData.startSceneNo = 1;
  formData.endSceneNo = 10;
}

/** 打开弹窗 */
function open() {
  setOpening();
  modalApi.open();
}
defineExpose({ open });
</script>

<template>
  <Modal title="批量生成关键帧" confirm-text="生成" class="w-[480px]">
    <ElForm label-width="100px">
      <ElFormItem label="镜头序号">
        <div class="flex items-center gap-2">
          <ElInputNumber
            v-model="formData.startSceneNo"
            :min="1"
            controls-position="right"
            class="!w-32"
          />
          <span>至</span>
          <ElInputNumber
            v-model="formData.endSceneNo"
            :min="formData.startSceneNo"
            controls-position="right"
            class="!w-32"
          />
        </div>
      </ElFormItem>
      <ElFormItem>
        <ElButton type="primary" link @click="setOpening">开场 10 镜</ElButton>
      </ElFormItem>
    </ElForm>
    <div class="text-muted-foreground text-xs leading-[18px]">
      一次最多 40 个镜头；已有关键帧、出图中、镜头视频生成中的跳过，需要重画时请在镜头上单独生成
    </div>
  </Modal>
</template>
