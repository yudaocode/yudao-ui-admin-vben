<script lang="ts" setup>
import type { UploadFile } from 'tdesign-vue-next';

import { useVbenModal } from '@vben/common-ui';

import { Upload } from 'tdesign-vue-next';

import { useVbenForm } from '#/adapter/form';
import { message } from '#/adapter/tdesign';
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
function beforeUpload(file: UploadFile) {
  formApi.setFieldValue('file', file.raw);
  return true;
}

/** 移除文件 */
function handleRemove() {
  formApi.setFieldValue('file', undefined);
}
</script>

<template>
  <Modal title="上传图片">
    <Form class="mx-4">
      <template #file>
        <div class="w-full">
          <!-- 上传区域 -->
          <Upload
            name="file"
            :max="1"
            accept=".jpg,.png,.gif,.webp"
            :auto-upload="false"
            :before-upload="beforeUpload"
            draggable
            @remove="handleRemove"
          >
            <template #dragContent>
              <p class="ant-upload-drag-icon">
                <span class="icon-[ant-design--inbox-outlined] text-2xl"></span>
              </p>
              <p class="ant-upload-text">点击或拖拽文件到此区域上传</p>
              <p class="ant-upload-hint">
                支持 .jpg、.png、.gif、.webp 格式图片文件
              </p>
            </template>
          </Upload>
        </div>
      </template>
    </Form>
  </Modal>
</template>
