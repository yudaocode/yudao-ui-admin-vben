<script lang="ts" setup>
import type { FileType } from 'ant-design-vue/es/upload/interface';

import { useVbenModal } from '@vben/common-ui';
import { downloadFileFromBlobPart } from '@vben/utils';

import { Button, message, Upload } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { importDevice, importDeviceTemplate } from '#/api/iot/device/device';
import { $t } from '#/locales';

import { useImportFormSchema } from '../data';

defineOptions({ name: 'IoTDeviceImportForm' });

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
      const result = await importDevice(data.file, data.updateSupport);
      // 处理导入结果提示
      const importData = result.data || result;
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
        message.info(text);
      }
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
  const data = await importDeviceTemplate();
  downloadFileFromBlobPart({ fileName: '设备导入模板.xls', source: data });
}
</script>

<template>
  <Modal :title="$t('ui.actionTitle.import', ['设备'])" class="w-1/3">
    <Form class="mx-4">
      <template #file>
        <div class="w-full">
          <Upload
            :before-upload="beforeUpload"
            :max-count="1"
            accept=".xls,.xlsx"
          >
            <Button type="primary"> 选择 Excel 文件</Button>
          </Upload>
        </div>
      </template>
    </Form>
    <template #prepend-footer>
      <div class="flex flex-auto items-center">
        <Button @click="handleDownload"> 下载导入模板</Button>
      </div>
    </template>
  </Modal>
</template>
