<script lang="ts" setup>
import type { UploadFile, UploadUserFile } from 'element-plus';

import type { FmsVoucherApi } from '#/api/fms/voucher';

import { computed, ref } from 'vue';

import { IconifyIcon } from '@vben/icons';
import { downloadFileFromBlobPart, downloadFileFromUrl } from '@vben/utils';

import {
  ElButton,
  ElDialog,
  ElMessage,
  ElResult,
  ElStep,
  ElSteps,
  ElUpload,
} from 'element-plus';

import {
  getVoucherImportTemplate,
  importVoucher,
} from '#/api/fms/voucher';

defineOptions({ name: 'FmsVoucherImportForm' });

const emit = defineEmits<{ success: [] }>();

const dialogVisible = ref(false); // 弹窗的是否展示
const step = ref(0); // 导入步骤
const accountSetId = ref(0); // 账套编号
const templateLoading = ref(false); // 导入模板的下载中
const file = ref<File>(); // 待导入的文件
const fileList = ref<UploadUserFile[]>([]); // 上传组件的文件列表
const result = ref<FmsVoucherApi.ImportResp>(); // 凭证导入结果

/** 凭证导入结果摘要 */
const importResultSummary = computed(() => {
  const importResult = result.value;
  return `共 ${importResult?.totalVoucherCount || 0} 张凭证、${importResult?.totalRowCount || 0} 条分录，成功 ${importResult?.successVoucherCount || 0} 张、${importResult?.successRowCount || 0} 条，失败 ${importResult?.failureVoucherCount || 0} 张、${importResult?.failureRowCount || 0} 条`;
});

/** 打开凭证导入弹窗 */
function open(id: number) {
  accountSetId.value = id;
  dialogVisible.value = true;
  resetImport();
}
defineExpose({ open });

/** 文件改变时：拦截文件，等待手动提交导入 */
function handleChange(uploadFile: UploadFile) {
  file.value = uploadFile.raw;
}

/** 移除文件 */
function handleRemove() {
  file.value = undefined;
}

/** 下载凭证导入模板 */
async function downloadTemplate() {
  templateLoading.value = true;
  try {
    const data = await getVoucherImportTemplate(accountSetId.value);
    downloadFileFromBlobPart({ fileName: '凭证导入模板.xlsx', source: data });
  } finally {
    templateLoading.value = false;
  }
}

/** 提交凭证导入 */
async function submitImport() {
  if (!file.value) {
    ElMessage.warning('请选择需要导入的文件');
    return;
  }
  if (file.value.size > 2 * 1024 * 1024) {
    ElMessage.error('导入文件不能超过 2MB');
    return;
  }
  step.value = 1;
  try {
    const importResult = await importVoucher(accountSetId.value, file.value);
    result.value = importResult;
    step.value = 2;
    if (importResult.successVoucherCount > 0) {
      // 发送导入成功的事件
      emit('success');
    }
  } catch {
    step.value = 0;
  }
}

/** 下载导入错误文件 */
function downloadErrorFile() {
  if (!result.value?.errorFileUrl) return;
  downloadFileFromUrl({
    fileName: '凭证导入错误数据.xlsx',
    source: result.value.errorFileUrl,
  });
}

/** 重置凭证导入 */
function resetImport() {
  step.value = 0;
  file.value = undefined;
  fileList.value = [];
  result.value = undefined;
}

/** 处理上传文件数量超限 */
function handleExceed() {
  ElMessage.warning('每次只能上传一个文件');
}
</script>

<template>
  <ElDialog
    v-model="dialogVisible"
    title="导入凭证"
    width="750px"
    destroy-on-close
  >
    <ElSteps :active="step" align-center finish-status="success" class="mb-7">
      <ElStep title="上传文件" />
      <ElStep title="导入数据" />
      <ElStep title="导入完成" />
    </ElSteps>

    <div v-if="step === 0" class="min-h-[340px] px-9 [&>div+div]:mt-7">
      <div>
        <div class="text-foreground mb-3.5 text-[15px] font-600">
          一、请按照数据模板的格式准备要导入的数据
        </div>
        <div class="pl-5">
          <ElButton
            :loading="templateLoading"
            link
            type="primary"
            @click="downloadTemplate"
          >
            <span class="icon-[ep--download]"></span> 下载《凭证导入模板》
          </ElButton>
          <div class="text-muted-foreground mt-2 text-[13px]">
            导入文件请勿超过 2MB
          </div>
        </div>
      </div>
      <div>
        <div class="text-foreground mb-3.5 text-[15px] font-600">
          二、请选择需要导入的文件
        </div>
        <ElUpload
          v-model:file-list="fileList"
          :auto-upload="false"
          :limit="1"
          :on-change="handleChange"
          :on-exceed="handleExceed"
          :on-remove="handleRemove"
          accept=".xlsx,.xls"
          action="none"
          drag
        >
          <IconifyIcon
            class="text-primary text-5xl"
            icon="ep:upload-filled"
          />
          <div class="el-upload__text">将文件拖到此处，或<em>点击选择文件</em></div>
          <template #tip>
            <div class="el-upload__tip">仅支持 xls、xlsx 格式</div>
          </template>
        </ElUpload>
      </div>
    </div>

    <div
      v-else-if="step === 1"
      class="flex min-h-[330px] flex-col items-center justify-center text-center"
    >
      <IconifyIcon class="is-loading text-primary text-6xl" icon="ep:loading" />
      <div class="text-foreground mt-6 text-lg font-600">
        凭证正在导入，请稍候
      </div>
      <div class="text-muted-foreground mt-2 text-[13px]">
        系统会按同一日期、凭证字和凭证号合并分录
      </div>
    </div>

    <div
      v-else
      class="flex min-h-[330px] flex-col items-center justify-center text-center"
    >
      <ElResult
        :icon="result?.failureVoucherCount ? 'warning' : 'success'"
        :title="
          result?.failureVoucherCount ? '凭证导入完成，部分数据未导入' : '凭证导入成功'
        "
        :sub-title="importResultSummary"
      >
        <template #extra>
          <ElButton
            v-if="result?.errorFileUrl"
            plain
            type="primary"
            @click="downloadErrorFile"
          >
            <span class="icon-[ep--download]"></span> 下载错误数据
          </ElButton>
        </template>
      </ElResult>
    </div>

    <template #footer>
      <template v-if="step === 0">
        <ElButton @click="dialogVisible = false">取 消</ElButton>
        <ElButton
          :disabled="!fileList.length"
          type="primary"
          @click="submitImport"
        >
          开始导入
        </ElButton>
      </template>
      <template v-else-if="step === 2">
        <ElButton @click="resetImport">继续导入</ElButton>
        <ElButton type="primary" @click="dialogVisible = false">完 成</ElButton>
      </template>
    </template>
  </ElDialog>
</template>
