<script lang="ts" setup>
import type { UploadFile, UploadUserFile } from 'element-plus';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { downloadFileFromBlobPart } from '@vben/utils';

import { ElButton, ElMessage, ElResult, ElUpload } from 'element-plus';

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
const fileList = ref<UploadUserFile[]>([]); // 上传组件的文件列表
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

/** 文件改变时：拦截文件，等待手动提交导入 */
function handleChange(uploadFile: UploadFile) {
  file.value = uploadFile.raw;
}

/** 移除文件 */
function handleRemove() {
  file.value = undefined;
}

/** 文件数超出提示 */
function handleExceed() {
  ElMessage.warning('每次只能上传一个文件');
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
    ElMessage.warning('请选择需要导入的文件');
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
        <ElButton
          link
          :loading="templateLoading"
          type="primary"
          @click="downloadTemplate"
        >
          <IconifyIcon icon="ep:download" />
          下载《财务初始余额导入模板》
        </ElButton>
        <div class="mt-1 text-[13px] text-gray-500">
          模板已带出末级科目；辅助核算项目按“类别:名称/类别:名称”填写
        </div>
      </div>
      <div>
        <div class="mb-3 text-[15px] font-semibold">二、填写完成后上传模板</div>
        <ElUpload
          v-model:file-list="fileList"
          :auto-upload="false"
          :limit="1"
          :on-change="handleChange"
          :on-exceed="handleExceed"
          :on-remove="handleRemove"
          accept=".xlsx,.xls"
          drag
        >
          <IconifyIcon
            class="text-[56px] text-gray-400"
            icon="ep:upload-filled"
          />
          <div class="el-upload__text">将文件拖到此处，或<em>点击选择文件</em></div>
          <template #tip>
            <div class="el-upload__tip">仅支持 xls、xlsx 格式</div>
          </template>
        </ElUpload>
      </div>
    </div>

    <ElResult
      v-else
      icon="success"
      title="初始余额导入成功"
      :sub-title="`已更新 ${result} 个末级科目`"
    />

    <template #footer>
      <template v-if="result === undefined">
        <ElButton @click="modalApi.close()">取 消</ElButton>
        <ElButton
          :disabled="!file"
          :loading="formLoading"
          type="primary"
          @click="submitImport"
        >
          开始导入
        </ElButton>
      </template>
      <template v-else>
        <ElButton @click="resetImport">继续导入</ElButton>
        <ElButton type="primary" @click="modalApi.close()">完 成</ElButton>
      </template>
    </template>
  </Modal>
</template>
