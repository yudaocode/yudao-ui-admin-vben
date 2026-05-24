<script lang="ts" setup>
import type { FileType } from 'ant-design-vue/es/upload/interface';

import type { MesDvMachineryApi } from '#/api/mes/dv/machinery';

import { useVbenModal } from '@vben/common-ui';
import { downloadFileFromBlobPart } from '@vben/utils';

import { Button, message, Upload } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { importMachinery, importMachineryTemplate } from '#/api/mes/dv/machinery';
import { $t } from '#/locales';

import { useImportFormSchema } from '../data';

const emit = defineEmits(['success']);

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
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
      const result = await importMachinery(data.file, data.updateSupport);
      const importData = result as MesDvMachineryApi.MachineryImportRespVO;
      let text = `上传成功数量：${importData.createCodes?.length || 0}；`;
      text += `更新成功数量：${importData.updateCodes?.length || 0}；`;
      text += `更新失败数量：${Object.keys(importData.failureCodes || {}).length}；`;
      message.info(text);
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
  formApi.setFieldValue('file', file);
  return false;
}

/** 下载模版 */
async function handleDownload() {
  const data = await importMachineryTemplate();
  downloadFileFromBlobPart({ fileName: '设备导入模板.xls', source: data });
}
</script>

<template>
  <Modal :title="$t('ui.actionTitle.import', ['设备'])" class="w-1/3">
    <Form class="mx-4">
      <template #file>
        <div class="w-full">
          <Upload :before-upload="beforeUpload" :max-count="1" accept=".xls,.xlsx">
            <Button type="primary">选择 Excel 文件</Button>
          </Upload>
        </div>
      </template>
    </Form>
    <template #prepend-footer>
      <div class="flex flex-auto items-center">
        <Button @click="handleDownload">下载导入模板</Button>
      </div>
    </template>
  </Modal>
</template>
