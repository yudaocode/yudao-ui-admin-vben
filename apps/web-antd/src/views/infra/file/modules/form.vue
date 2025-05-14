<script lang="ts" setup>
import type { FileType } from 'ant-design-vue/es/upload/interface';

import { useVbenModal } from '@vben/common-ui';

import { message, Upload } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { useUpload } from '#/components/upload/use-upload';
import { $t } from '#/locales';

import { useFormSchema } from '../data';

const emit = defineEmits(['success']);

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    formItemClass: 'col-span-2',
    labelWidth: 80,
    hideLabel: true,
  },
  layout: 'horizontal',
  schema: useFormSchema().map((item) => ({ ...item, label: '' })), // 去除label
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    modalApi.lock();
    // 提交表单
    const data = await formApi.getValues();
    try {
      await useUpload().httpRequest(data.file);
      // 关闭并提示
      await modalApi.close();
      emit('success');
      message.success($t('ui.actionMessage.operationSuccess'));
    } finally {
      modalApi.unlock();
    }
  },
});

/** 上传前 */
function beforeUpload(file: FileType) {
  // TODO @puhui999：研究下，看看怎么类似 antd 可以前端直传哈；通过配置切换；
  formApi.setFieldValue('file', file);
  return false;
}
</script>

<template>
  <Modal title="上传图片">
    <Form class="mx-4">
      <template #file>
        <div class="w-full">
          <!-- 上传区域 -->
          <!-- TODO @puhui999：1）上传图片，用不了；2）底部有点遮挡 -->
          <Upload.Dragger
            name="file"
            :max-count="1"
            accept=".jpg,.png,.gif,.webp"
            :before-upload="beforeUpload"
            list-type="picture-card"
          >
            <p class="ant-upload-drag-icon">
              <span class="icon-[ant-design--inbox-outlined] text-2xl"></span>
            </p>
            <p class="ant-upload-text">点击或拖拽文件到此区域上传</p>
            <p class="ant-upload-hint">
              支持 .jpg、.png、.gif、.webp 格式图片文件
            </p>
          </Upload.Dragger>
        </div>
      </template>
    </Form>
  </Modal>
</template>
