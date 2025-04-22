<script lang="ts" setup>
import type { FileType } from 'ant-design-vue/es/upload/interface';

import { useVbenModal } from '@vben/common-ui';

import { Button, message, Upload } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { importUser, importUserTemplate } from '#/api/system/user';
import { $t } from '#/locales';
import { downloadByData } from '#/utils/download';

import { useImportFormSchema } from '../data';

const emit = defineEmits(['success']);

const [Form, formApi] = useVbenForm({
  layout: 'horizontal',
  schema: useImportFormSchema(),
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
      await importUser(data.file, data.updateSupport);
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
  },
});

/** 上传前 */
function beforeUpload(file: FileType) {
  formApi.setFieldValue('file', file);
  return false;
}

/** 下载模版 */
async function onDownload() {
  const data = await importUserTemplate();
  downloadByData(data, '用户导入模板.xlsx');
}
</script>

<template>
  <Modal title="导入用户">
    <Form class="mx-4">
      <template #file>
        <div class="w-full">
          <Upload
            :max-count="1"
            accept=".xls,.xlsx"
            :before-upload="beforeUpload"
          >
            <Button type="primary"> 选择 Excel 文件 </Button>
          </Upload>
        </div>
      </template>
    </Form>
    <template #prepend-footer>
      <div class="flex flex-auto items-center">
        <Button @click="onDownload"> 下载导入模板 </Button>
      </div>
    </template>
  </Modal>
</template>
