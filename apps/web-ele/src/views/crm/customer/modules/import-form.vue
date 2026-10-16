<script lang="ts" setup>
import type { UploadInstance, UploadRawFile } from 'element-plus';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { downloadFileFromBlobPart } from '@vben/utils';

import { ElButton, ElMessage, ElUpload, genFileId } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import { importCustomer, importCustomerTemplate } from '#/api/crm/customer';
import { $t } from '#/locales';

import { useImportFormSchema } from '../data';

const emit = defineEmits(['success']);

const uploadRef = ref<UploadInstance>();

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
      await importCustomer({
        ownerUserId: data.ownerUserId,
        file: data.file,
        updateSupport: data.updateSupport,
      });
      // 关闭并提示
      await modalApi.close();
      emit('success');
      ElMessage.success($t('ui.actionMessage.operationSuccess'));
    } finally {
      modalApi.unlock();
    }
  },
});

/** 删除已选文件 */
function handleRemove() {
  formApi.setFieldValue('file', undefined);
}

/** 替换已选文件 */
function handleExceed(files: File[]) {
  const file = files[0] as undefined | UploadRawFile;
  if (!file) return;
  uploadRef.value?.clearFiles();
  file.uid = genFileId();
  uploadRef.value?.handleStart(file);
}

/** 文件改变时 */
function handleChange(file: any) {
  if (file.raw) {
    formApi.setFieldValue('file', file.raw);
  }
}

/** 下载模版 */
async function handleDownload() {
  const data = await importCustomerTemplate();
  downloadFileFromBlobPart({ fileName: '客户导入模板.xls', source: data });
}
</script>

<template>
  <Modal title="客户导入" class="w-1/3">
    <Form class="mx-4">
      <template #file>
        <div class="w-full">
          <ElUpload
            ref="uploadRef"
            :on-remove="handleRemove"
            :on-exceed="handleExceed"
            :limit="1"
            accept=".xls,.xlsx"
            :on-change="handleChange"
            :auto-upload="false"
          >
            <ElButton type="primary"> 选择 Excel 文件 </ElButton>
          </ElUpload>
        </div>
      </template>
    </Form>
    <template #prepend-footer>
      <div class="flex flex-auto items-center">
        <ElButton @click="handleDownload"> 下载导入模板 </ElButton>
      </div>
    </template>
  </Modal>
</template>
