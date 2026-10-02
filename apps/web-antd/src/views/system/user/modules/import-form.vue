<script lang="ts" setup>
import type { FileType } from 'ant-design-vue/es/upload/interface';

import { alert, useVbenModal } from '@vben/common-ui';
import { downloadFileFromBlobPart } from '@vben/utils';

import { Button, Upload } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { importUser, importUserTemplate } from '#/api/system/user';

import { useImportFormSchema } from '../data';

const emit = defineEmits(['success']);

const [Form, formApi] = useVbenForm({
  commonConfig: {
    formItemClass: 'col-span-2',
    labelWidth: 120,
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
      const result = await importUser(data.file, data.updateSupport);
      const text = [
        `新增成功数量：${result.createUsernames.length}；${result.createUsernames.join('、')}`,
        `更新成功数量：${result.updateUsernames.length}；${result.updateUsernames.join('、')}`,
        `导入失败数量：${Object.keys(result.failureUsernames).length}；${Object.entries(
          result.failureUsernames,
        )
          .map(([username, reason]) => `${username}：${reason}`)
          .join('；')}`,
      ].join('\n');
      // 关闭并提示
      await modalApi.close();
      emit('success');
      await alert(text, '导入结果');
    } finally {
      modalApi.unlock();
    }
  },
});

/** 上传前 */
function beforeUpload(file: FileType) {
  formApi.setFieldValue('file', file);
  return false;
}

/** 移除文件 */
function handleRemove() {
  formApi.setFieldValue('file', undefined);
}

/** 下载模版 */
async function handleDownload() {
  const data = await importUserTemplate();
  downloadFileFromBlobPart({ fileName: '用户导入模板.xls', source: data });
}
</script>

<template>
  <Modal title="导入用户" class="w-1/3">
    <Form class="mx-4">
      <template #file>
        <div class="w-full">
          <Upload
            :max-count="1"
            accept=".xls,.xlsx"
            :before-upload="beforeUpload"
            @remove="handleRemove"
          >
            <Button type="primary"> 选择 Excel 文件 </Button>
          </Upload>
        </div>
      </template>
    </Form>
    <template #prepend-footer>
      <div class="flex flex-auto items-center">
        <Button @click="handleDownload"> 下载导入模板 </Button>
      </div>
    </template>
  </Modal>
</template>
