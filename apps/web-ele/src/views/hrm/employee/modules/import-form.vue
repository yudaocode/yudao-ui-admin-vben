<script lang="ts" setup>
import type { UploadFile } from 'element-plus';

import { useVbenModal } from '@vben/common-ui';
import { downloadFileFromBlobPart } from '@vben/utils';

import { ElButton, ElMessage, ElUpload } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import { importEmployee, importEmployeeTemplate } from '#/api/hrm/employee';

import { useImportFormSchema } from '../data';

defineOptions({ name: 'HrmEmployeeImportForm' });

const emit = defineEmits(['success']);

const [Form, formApi] = useVbenForm({
  commonConfig: {
    formItemClass: 'col-span-2',
    labelWidth: 100,
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
    try {
      const { duplicateStrategy, file } = await formApi.getValues();
      const result = await importEmployee(file, duplicateStrategy);
      const text = `新增 ${result.createJobNumbers.length} 人；更新 ${result.updateJobNumbers.length} 人；跳过 ${result.skipJobNumbers.length} 人；失败 ${Object.keys(result.failureJobNumbers).length} 人`;
      ElMessage.success(text);
      await modalApi.close();
      emit('success');
    } finally {
      modalApi.unlock();
    }
  },
});

function handleChange(file: UploadFile) {
  formApi.setFieldValue('file', file.raw);
}

function handleRemove() {
  formApi.setFieldValue('file', undefined);
}

function handleExceed() {
  ElMessage.warning('最多只能选择一个文件，请移除后重新选择');
}

async function handleDownload() {
  const data = await importEmployeeTemplate();
  downloadFileFromBlobPart({
    fileName: '员工档案导入模板.xlsx',
    source: data,
  });
}
</script>

<template>
  <Modal title="员工档案导入" class="w-1/3">
    <Form class="mx-4">
      <template #file>
        <ElUpload
          :auto-upload="false"
          :on-change="handleChange"
          :on-remove="handleRemove"
          :on-exceed="handleExceed"
          :limit="1"
          accept=".xls,.xlsx"
        >
          <ElButton type="primary">选择 Excel 文件</ElButton>
        </ElUpload>
      </template>
    </Form>
    <template #prepend-footer>
      <div class="flex flex-auto items-center">
        <ElButton @click="handleDownload">下载导入模板</ElButton>
      </div>
    </template>
  </Modal>
</template>
