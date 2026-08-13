<script lang="ts" setup>
import type { UploadFile, UploadUserFile } from 'element-plus';

import type { FmsSubjectApi } from '#/api/fms/config/subject';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { downloadFileFromBlobPart } from '@vben/utils';

import {
  ElButton,
  ElMessage,
  ElResult,
  ElTable,
  ElTableColumn,
  ElUpload,
} from 'element-plus';

import {
  getSubjectImportTemplate,
  importSubject,
} from '#/api/fms/config/subject';

defineOptions({ name: 'FmsSubjectImportForm' });

const emit = defineEmits(['success']); // 定义 success 事件，用于导入成功后的回调

const formLoading = ref(false); // 表单的加载中
const templateLoading = ref(false); // 导入模板的下载中
const accountSetId = ref(0); // 当前账套编号
const file = ref<File>(); // 待导入的文件
const fileList = ref<UploadUserFile[]>([]); // 上传组件的文件列表
const importResult = ref<FmsSubjectApi.ImportResp>(); // 导入结果

const failureRows = computed(() =>
  Object.entries(importResult.value?.failureReasons || {}).map(
    ([label, reason]) => ({ label, reason }),
  ),
); // 导入失败明细
const failureCount = computed(() => failureRows.value.length); // 导入失败数量

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
  ElMessage.error('最多只能上传一个文件！');
}

/** 下载模板操作 */
async function handleDownloadTemplate() {
  templateLoading.value = true;
  try {
    const data = await getSubjectImportTemplate();
    downloadFileFromBlobPart({ fileName: '科目导入模板.xlsx', source: data });
  } finally {
    templateLoading.value = false;
  }
}

/** 提交导入 */
async function submitForm() {
  if (!file.value) {
    ElMessage.error('请上传文件');
    return;
  }
  if (file.value.size > 2 * 1024 * 1024) {
    ElMessage.error('导入文件不能超过 2 MB');
    return;
  }
  // 提交请求
  formLoading.value = true;
  try {
    importResult.value = await importSubject(accountSetId.value, file.value);
    if (importResult.value.successSubjectCodes.length > 0) {
      // 发送导入成功的事件
      emit('success');
    }
  } finally {
    formLoading.value = false;
  }
}

/** 重置表单 */
function resetForm() {
  formLoading.value = false;
  file.value = undefined;
  fileList.value = [];
  importResult.value = undefined;
}

const [Modal, modalApi] = useVbenModal({
  showCancelButton: false,
  showConfirmButton: false,
  onOpenChange(isOpen: boolean) {
    if (!isOpen) return;
    accountSetId.value =
      modalApi.getData<{ accountSetId: number }>().accountSetId;
    resetForm();
  },
});
</script>

<template>
  <Modal title="科目导入" class="w-[600px]">
    <template v-if="!importResult">
      <ElUpload
        v-model:file-list="fileList"
        :auto-upload="false"
        :disabled="formLoading"
        :limit="1"
        :on-change="handleChange"
        :on-exceed="handleExceed"
        :on-remove="handleRemove"
        accept=".xlsx, .xls"
        drag
      >
        <IconifyIcon class="text-[56px] text-gray-400" icon="ep:upload-filled" />
        <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
      </ElUpload>
      <div class="mt-2 text-center text-xs">
        <div>一级科目的上级科目编码填写 0，多项辅助核算使用“/”分隔</div>
        <span>仅允许导入 xls、xlsx 格式文件，且不超过 2 MB。</span>
        <ElButton
          class="!align-baseline"
          link
          :loading="templateLoading"
          type="primary"
          @click="handleDownloadTemplate"
        >
          下载模板
        </ElButton>
      </div>
    </template>

    <!-- 导入结果 -->
    <template v-else>
      <ElResult
        :icon="failureCount ? 'warning' : 'success'"
        :sub-title="`共 ${importResult.totalCount} 个科目，成功 ${importResult.successSubjectCodes.length} 个，失败 ${failureCount} 个`"
        :title="failureCount ? '科目导入完成，部分数据未导入' : '科目导入成功'"
      />
      <ElTable v-if="failureCount" :data="failureRows" border max-height="260">
        <ElTableColumn
          label="导入行"
          min-width="220"
          prop="label"
          show-overflow-tooltip
        />
        <ElTableColumn
          label="失败原因"
          min-width="260"
          prop="reason"
          show-overflow-tooltip
        />
      </ElTable>
    </template>

    <template #footer>
      <template v-if="!importResult">
        <ElButton @click="modalApi.close()">取 消</ElButton>
        <ElButton :loading="formLoading" type="primary" @click="submitForm">
          确 定
        </ElButton>
      </template>
      <template v-else>
        <ElButton @click="resetForm">继续导入</ElButton>
        <ElButton type="primary" @click="modalApi.close()">完 成</ElButton>
      </template>
    </template>
  </Modal>
</template>
