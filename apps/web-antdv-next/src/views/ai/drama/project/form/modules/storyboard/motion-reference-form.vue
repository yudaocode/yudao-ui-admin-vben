<script lang="ts" setup>
import type { Rule } from 'antdv-next';

import { reactive, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Form, FormItem, Input, message } from 'antdv-next';

import { createDramaMotionReference } from '#/api/ai/drama/asset';
import { FileUpload } from '#/components/upload';

/** AI 短剧：添加动作参考视频；可在镜头的动作参考视频中选用 */
defineOptions({ name: 'AiDramaMotionReferenceForm' });

const props = defineProps<{ projectId: number }>();
const emit = defineEmits<{ success: [] }>();

const formRef = ref();
const uploadKey = ref(0); // 上传组件的重建标记：每次打开清空已选文件
const formData = reactive({ name: '', fileUrl: '' });
const formRules: Record<string, Rule[]> = {
  name: [{ required: true, message: '名称不能为空', trigger: 'blur' }],
  fileUrl: [{ required: true, message: '请上传视频', trigger: 'change' }],
};

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    await formRef.value.validate();
    modalApi.lock();
    try {
      await createDramaMotionReference({
        projectId: props.projectId,
        ...formData,
      });
      message.success('已添加');
      await modalApi.close();
      emit('success');
    } finally {
      modalApi.unlock();
    }
  },
});

/** 打开弹窗 */
function open() {
  formData.name = '';
  formData.fileUrl = '';
  uploadKey.value++;
  modalApi.open();
}
defineExpose({ open });
</script>

<template>
  <Modal title="添加动作参考" class="w-[560px]">
    <Form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      :label-col="{ flex: '90px' }"
      :wrapper-col="{ flex: 'auto' }"
    >
      <FormItem label="名称" name="name">
        <Input
          v-model:value="formData.name"
          placeholder="例如：转身挥手"
          :maxlength="120"
        />
      </FormItem>
      <FormItem label="视频文件" name="fileUrl">
        <FileUpload
          :key="uploadKey"
          v-model:value="formData.fileUrl"
          :accept="['mp4', 'mov']"
          :max-size="100"
          directory="ai/drama"
        />
      </FormItem>
    </Form>
    <div class="text-muted-foreground text-xs leading-[18px]">
      2 ~ 30 秒、24 ~ 60fps 的 H.264 / H.265 视频，宽高比 0.4 ~ 2.5，且不低于 480p
    </div>
  </Modal>
</template>
