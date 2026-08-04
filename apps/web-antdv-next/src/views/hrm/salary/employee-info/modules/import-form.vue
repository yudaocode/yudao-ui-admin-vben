<script lang="ts" setup>
import type { UploadFile } from 'antdv-next';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { downloadFileFromBlobPart } from '@vben/utils';

import { Button, message, Modal, Upload } from 'antdv-next';

import {
  getChangeSalaryImportTemplate,
  getFixSalaryImportTemplate,
  importSalaryEmployeeInfo,
} from '#/api/hrm/salary/employee-info';

defineOptions({ name: 'HrmSalaryEmployeeInfoImportForm' });

const emit = defineEmits(['success']);

const importType = ref<'change' | 'fix'>('fix');
const formLoading = ref(false);
const file = ref<File>();
const fileList = ref<UploadFile[]>([]);

const dialogTitle = computed(
  () => `薪资档案${importType.value === 'fix' ? '定薪' : '调薪'}导入`,
);

function buildImportResultText(data: {
  failureJobNumbers: Record<string, string>;
  successJobNumbers: string[];
}) {
  const successJobNumbers = data.successJobNumbers || [];
  const failureEntries = Object.entries(data.failureJobNumbers || {});
  let text = `导入成功数量：${successJobNumbers.length}；`;
  for (const jobNumber of successJobNumbers.slice(0, 10)) {
    text += `< ${jobNumber} >`;
  }
  if (successJobNumbers.length > 10) {
    text += `其余 ${successJobNumbers.length - 10} 条已省略。`;
  }
  text += `导入失败数量：${failureEntries.length}；`;
  for (const [jobNumber, reason] of failureEntries.slice(0, 10)) {
    text += `< ${jobNumber}: ${reason} >`;
  }
  if (failureEntries.length > 10) {
    text += `其余 ${failureEntries.length - 10} 条已省略。`;
  }
  return text;
}

const [ModalComp, modalApi] = useVbenModal({
  async onConfirm() {
    if (!file.value) {
      message.error('请上传文件');
      return;
    }
    modalApi.lock();
    formLoading.value = true;
    try {
      const data = await importSalaryEmployeeInfo(file.value, importType.value);
      Modal.info({
        content: buildImportResultText(data),
        title: '导入结果',
      });
      await modalApi.close();
      emit('success');
    } finally {
      formLoading.value = false;
      modalApi.unlock();
    }
  },
  onOpenChange(isOpen) {
    if (!isOpen) {
      file.value = undefined;
      fileList.value = [];
    }
  },
});

function beforeUpload(uploadFile: File) {
  const fileExtension = uploadFile.name
    .slice(uploadFile.name.lastIndexOf('.') + 1)
    .toLowerCase();
  if (!['xls', 'xlsx'].includes(fileExtension)) {
    message.error('仅允许导入 xls、xlsx 格式文件');
    return Upload.LIST_IGNORE;
  }
  file.value = uploadFile;
  return false;
}

async function handleDownloadTemplate() {
  const data =
    importType.value === 'fix'
      ? await getFixSalaryImportTemplate()
      : await getChangeSalaryImportTemplate();
  downloadFileFromBlobPart({
    fileName:
      importType.value === 'fix'
        ? '薪资档案定薪导入模板.xls'
        : '薪资档案调薪导入模板.xls',
    source: data,
  });
}

function open(type: 'change' | 'fix') {
  importType.value = type;
  file.value = undefined;
  fileList.value = [];
  modalApi.setState({ title: dialogTitle.value });
  modalApi.open();
}

defineExpose({ open });
</script>

<template>
  <ModalComp :title="dialogTitle" class="w-[420px]">
    <div class="mx-4">
      <Upload.Dragger
        v-model:file-list="fileList"
        :before-upload="beforeUpload"
        :disabled="formLoading"
        :max-count="1"
        accept=".xlsx,.xls"
        @remove="file = undefined"
      >
        <p class="ant-upload-drag-icon flex justify-center">
          <IconifyIcon class="text-3xl" icon="lucide:cloud-upload" />
        </p>
        <p class="ant-upload-text">将文件拖到此处，或点击上传</p>
        <p class="ant-upload-hint">仅允许导入 xls、xlsx 格式文件</p>
      </Upload.Dragger>
    </div>
    <template #prepend-footer>
      <div class="flex flex-auto items-center">
        <Button @click="handleDownloadTemplate">下载模板</Button>
      </div>
    </template>
  </ModalComp>
</template>
