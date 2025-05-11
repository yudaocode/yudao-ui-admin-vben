<script lang="ts" setup>
import type { UploadFileInfo } from 'naive-ui';

import { useVbenModal } from '@vben/common-ui';
import { downloadFileFromBlobPart } from '@vben/utils';

import { NButton, NUpload } from 'naive-ui';

import { useVbenForm } from '#/adapter/form';
import { message } from '#/adapter/naive';
import { importUser, importUserTemplate } from '#/api/system/user';
import { $t } from '#/locales';

import { useImportFormSchema } from '../data';

const emit = defineEmits(['success']);

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    formItemClass: 'col-span-2',
    labelWidth: 80,
  },
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
      message.success($t('ui.actionMessage.operationSuccess'));
    } finally {
      modalApi.unlock();
    }
  },
});

/** 上传前 */
function beforeUpload(file: UploadFileInfo) {
  formApi.setFieldValue('file', file);
  return false;
}

/** 下载模版 */
async function onDownload() {
  const data = await importUserTemplate();
  downloadFileFromBlobPart({ fileName: '用户导入模板.xls', source: data });
}
</script>

<template>
  <Modal title="导入用户">
    <Form class="mx-4">
      <template #file>
        <div class="w-full">
          <NUpload
            :max-count="1"
            accept=".xls,.xlsx"
            :before-upload="beforeUpload"
          >
            <NButton type="primary"> 选择 Excel 文件 </NButton>
          </NUpload>
        </div>
      </template>
    </Form>
    <template #prepend-footer>
      <div class="flex flex-auto items-center">
        <NButton @click="onDownload"> 下载导入模板 </NButton>
      </div>
    </template>
  </Modal>
</template>
