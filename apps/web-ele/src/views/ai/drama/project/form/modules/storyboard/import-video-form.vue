<script lang="ts" setup>
import type { AiDramaStoryboardApi } from '#/api/ai/drama/storyboard';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { ElForm, ElFormItem, ElMessage } from 'element-plus';

import { importDramaStoryboardVideo } from '#/api/ai/drama/storyboard';
import { FileUpload } from '#/components/upload';

/** AI 短剧：导入外部视频为镜头视频 */
defineOptions({ name: 'AiDramaImportVideoForm' });

const emit = defineEmits<{ success: [] }>();

const storyboard = ref<AiDramaStoryboardApi.Storyboard>();
const fileUrl = ref(''); // 视频文件
const uploadKey = ref(0); // 上传组件的重建标记：每次打开清空已选文件

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    if (!fileUrl.value) {
      ElMessage.warning('请上传视频文件');
      return;
    }
    modalApi.lock();
    try {
      await importDramaStoryboardVideo(storyboard.value!.id, fileUrl.value);
      ElMessage.success('已导入');
      await modalApi.close();
      emit('success');
    } finally {
      modalApi.unlock();
    }
  },
});

/** 打开弹窗 */
function open(row: AiDramaStoryboardApi.Storyboard) {
  storyboard.value = row;
  fileUrl.value = '';
  uploadKey.value++;
  modalApi.open();
}
defineExpose({ open });
</script>

<template>
  <Modal
    :title="`导入视频 · #${storyboard?.sceneNo ?? ''}`"
    confirm-text="导入"
    class="w-[520px]"
  >
    <ElForm label-width="80px">
      <ElFormItem label="视频文件">
        <FileUpload
          :key="uploadKey"
          v-model:value="fileUrl"
          :accept="['mp4', 'mov']"
          :max-size="200"
          directory="ai/drama"
        />
      </ElFormItem>
    </ElForm>
    <div class="text-muted-foreground text-xs leading-[18px]">
      导入后直接作为已完成的镜头视频，并截取尾帧供下一镜承接；宽、高不超过 3840；原视频可在提交记录中恢复
    </div>
  </Modal>
</template>
