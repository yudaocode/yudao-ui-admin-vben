<script lang="ts" setup>
import type { IotDeviceApi } from '#/api/iot/device/device';

import { alert, useVbenModal } from '@vben/common-ui';
import { downloadFileFromBlobPart } from '@vben/utils';

import { ElButton, ElMessage, ElUpload } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import { importDevice, importDeviceTemplate } from '#/api/iot/device/device';
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
      const result = await importDevice(data.file, data.updateSupport);
      // 处理导入结果提示
      const importData = result as IotDeviceApi.DeviceImportRespVO;
      if (importData) {
        let text = `上传成功数量：${importData.createDeviceNames?.length || 0};`;
        if (importData.createDeviceNames?.length) {
          for (const deviceName of importData.createDeviceNames) {
            text += `< ${deviceName} >`;
          }
        }
        text += `更新成功数量：${importData.updateDeviceNames?.length || 0};`;
        if (importData.updateDeviceNames?.length) {
          for (const deviceName of importData.updateDeviceNames) {
            text += `< ${deviceName} >`;
          }
        }
        text += `更新失败数量：${Object.keys(importData.failureDeviceNames || {}).length};`;
        if (importData.failureDeviceNames) {
          for (const deviceName in importData.failureDeviceNames) {
            text += `< ${deviceName}: ${importData.failureDeviceNames[deviceName]} >`;
          }
        }
        await alert(text, '导入结果');
      }
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

/** 下载模版 */
async function handleDownload() {
  const data = await importDeviceTemplate();
  downloadFileFromBlobPart({ fileName: '设备导入模板.xls', source: data });
}
</script>

<template>
  <Modal :title="$t('ui.actionTitle.import', ['设备'])" class="w-1/3">
    <Form class="mx-4">
      <template #file>
        <div class="w-full">
          <ElUpload
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
