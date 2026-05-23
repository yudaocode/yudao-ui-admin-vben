<script lang="ts" setup>
import type { MesMdVendorApi } from '#/api/mes/md/vendor';

import { useVbenModal } from '@vben/common-ui';
import { downloadFileFromBlobPart } from '@vben/utils';

import { ElButton, ElMessage, ElUpload } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import { importVendor, importVendorTemplate } from '#/api/mes/md/vendor';
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
      const result = await importVendor(data.file, data.updateSupport);
      const importData = result as MesMdVendorApi.VendorImportRespVO;
      let text = `上传成功数量：${importData.createCodes?.length || 0};`;
      for (const code of importData.createCodes || []) {
        text += `< ${code} >`;
      }
      text += `更新成功数量：${importData.updateCodes?.length || 0};`;
      for (const code of importData.updateCodes || []) {
        text += `< ${code} >`;
      }
      text += `更新失败数量：${Object.keys(importData.failureCodes || {}).length};`;
      for (const code in importData.failureCodes || {}) {
        text += `< ${code}: ${importData.failureCodes?.[code]} >`;
      }
      ElMessage.info(text);
      // 关闭并提示
      await modalApi.close();
      emit('success');
      ElMessage.success($t('ui.actionMessage.operationSuccess'));
    } finally {
      modalApi.unlock();
    }
  },
});

/** 文件改变时 */
function handleChange(file: any) {
  if (file.raw) {
    formApi.setFieldValue('file', file.raw);
  }
}

/** 下载模板 */
async function handleDownload() {
  const data = await importVendorTemplate();
  downloadFileFromBlobPart({ fileName: '供应商导入模板.xls', source: data });
}
</script>

<template>
  <Modal :title="$t('ui.actionTitle.import', ['供应商'])" class="w-1/3">
    <Form class="mx-4">
      <template #file>
        <div class="w-full">
          <ElUpload
            :auto-upload="false"
            :limit="1"
            :on-change="handleChange"
            accept=".xls,.xlsx"
          >
            <ElButton type="primary">选择 Excel 文件</ElButton>
          </ElUpload>
        </div>
      </template>
    </Form>
    <template #prepend-footer>
      <div class="flex flex-auto items-center">
        <ElButton @click="handleDownload">下载导入模板</ElButton>
      </div>
    </template>
  </Modal>
</template>
