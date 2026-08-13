<script lang="ts" setup>
import type { UploadFile } from 'antdv-next';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { downloadFileFromBlobPart } from '@vben/utils';

import { Button, message, Result, Upload } from 'antdv-next';

import {
  getInitialBalanceImportTemplate,
  importInitialBalance,
} from '#/api/fms/config/initial-balance';

defineOptions({ name: 'FmsInitialBalanceImportForm' });

const emit = defineEmits(['success']);

const formLoading = ref(false); // 导入的加载中
const templateLoading = ref(false); // 模板下载的加载中
const accountSetId = ref(0); // 账套编号
const file = ref<File>(); // 待导入的文件
const fileList = ref<UploadFile[]>([]); // 上传组件的文件列表
const result = ref<number>(); // 导入数量

const [Modal, modalApi] = useVbenModal({
  showCancelButton: false,
  showConfirmButton: false,
  onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      return;
    }
    const data = modalApi.getData<{ accountSetId: number }>();
    accountSetId.value = data.accountSetId;
    resetImport();
  },
});

/** 上传前：拦截文件，等待手动提交导入 */
function beforeUpload(uploadFile: File) {
  if (file.value) {
    message.warning('每次只能上传一个文件');
    return Upload.LIST_IGNORE;
  }
  file.value = uploadFile;
  return false;
}

/** 移除文件 */
function handleRemove() {
  file.value = undefined;
}

/** 下载导入模板 */
async function downloadTemplate() {
  if (!accountSetId.value) {
    return;
  }
  templateLoading.value = true;
  try {
    const data = await getInitialBalanceImportTemplate(accountSetId.value);
    downloadFileFromBlobPart({
      fileName: '财务初始余额导入模板.xlsx',
      source: data,
    });
  } finally {
    templateLoading.value = false;
  }
}

/** 提交导入 */
async function submitImport() {
  if (!file.value || !accountSetId.value) {
    message.warning('请选择需要导入的文件');
    return;
  }
  formLoading.value = true;
  try {
    result.value = await importInitialBalance(accountSetId.value, file.value);
    emit('success');
  } finally {
    formLoading.value = false;
  }
}

/** 重置导入 */
function resetImport() {
  file.value = undefined;
  fileList.value = [];
  result.value = undefined;
}
</script>

<template>
  <Modal title="导入初始余额" class="w-[680px]">
    <div v-if="result === undefined" class="px-4">
      <div class="mb-7">
        <div class="mb-3 text-[15px] font-semibold">
          一、请下载当前账套的初始余额模板
        </div>
        <Button
          :loading="templateLoading"
          type="link"
          @click="downloadTemplate"
        >
          <span class="icon-[ant-design--download-outlined]"></span>
          下载《财务初始余额导入模板》
        </Button>
        <div class="mt-1 text-[13px] text-gray-500">
          模板已带出末级科目；辅助核算项目按“类别:名称/类别:名称”填写
        </div>
      </div>
      <div>
        <div class="mb-3 text-[15px] font-semibold">二、填写完成后上传模板</div>
        <Upload.Dragger
          v-model:file-list="fileList"
          :before-upload="beforeUpload"
          accept=".xlsx,.xls"
          @remove="handleRemove"
        >
          <p class="ant-upload-drag-icon">
            <span class="icon-[ant-design--inbox-outlined] text-2xl"></span>
          </p>
          <p class="ant-upload-text">将文件拖到此处，或点击选择文件</p>
          <p class="ant-upload-hint">仅支持 xls、xlsx 格式</p>
        </Upload.Dragger>
      </div>
    </div>

    <Result
      v-else
      status="success"
      title="初始余额导入成功"
      :sub-title="`已更新 ${result} 个末级科目`"
    />

    <template #footer>
      <template v-if="result === undefined">
        <Button @click="modalApi.close()">取 消</Button>
        <Button
          :disabled="!file"
          :loading="formLoading"
          type="primary"
          @click="submitImport"
        >
          开始导入
        </Button>
      </template>
      <template v-else>
        <Button @click="resetImport">继续导入</Button>
        <Button type="primary" @click="modalApi.close()">完 成</Button>
      </template>
    </template>
  </Modal>
</template>
