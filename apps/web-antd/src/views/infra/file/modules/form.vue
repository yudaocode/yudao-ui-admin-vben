<script lang="ts" setup>
import type { FileType } from 'ant-design-vue/es/upload/interface';

import { useVbenModal } from '@vben/common-ui';
import { message } from 'ant-design-vue';
import { Upload, Button } from 'ant-design-vue';

import { $t } from '#/locales';
import { useVbenForm } from '#/adapter/form';
import { uploadFile } from '#/api/infra/file';

import { useFormSchema } from '../data';

const emit = defineEmits(['success']);

const [Form, formApi] = useVbenForm({
  layout: 'horizontal',
  schema: useFormSchema(),
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
      await uploadFile(data);
      // 关闭并提示
      await modalApi.close();
      emit('success');
      message.success({
        content: $t('ui.actionMessage.operationSuccess'),
        key: 'action_process_msg',
      });
    } finally {
      modalApi.lock(false);
    }
  }
});

/** 上传前 */
function beforeUpload(file: FileType) {
  formApi.setFieldValue('file', file);
  return false;
}
</script>

<template>
  <Modal title="上传图片">
    <Form class="mx-4">
      <template #file>
        <div class="w-full">
          <Upload :max-count="1" accept=".jpg,.png,.gif,.webp" :beforeUpload="beforeUpload">
            <Button type="primary"> 选择图片 </Button>
          </Upload>
        </div>
      </template>
    </Form>
  </Modal>
</template>
