<script lang="ts" setup>
import type { UploadFile } from 'antdv-next';

import type { FmsSubjectApi } from '#/api/fms/config/subject';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { downloadFileFromBlobPart } from '@vben/utils';

import { Button, message, Result, Table, Upload } from 'antdv-next';

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
const fileList = ref<UploadFile[]>([]); // 上传组件的文件列表
const importResult = ref<FmsSubjectApi.ImportResp>(); // 导入结果

const failureRows = computed(() =>
  Object.entries(importResult.value?.failureReasons || {}).map(
    ([label, reason]) => ({ label, reason }),
  ),
); // 导入失败明细
const failureCount = computed(() => failureRows.value.length); // 导入失败数量

const failureColumns = [
  { dataIndex: 'label', title: '导入行', width: 220, ellipsis: true },
  { dataIndex: 'reason', title: '失败原因', width: 260, ellipsis: true },
]; // 导入失败明细列

/** 上传前：拦截文件，等待手动提交导入 */
function beforeUpload(uploadFile: File) {
  if (file.value) {
    message.error('最多只能上传一个文件！');
    return Upload.LIST_IGNORE;
  }
  file.value = uploadFile;
  return false;
}

/** 移除文件 */
function handleRemove() {
  file.value = undefined;
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
    message.error('请上传文件');
    return;
  }
  if (file.value.size > 2 * 1024 * 1024) {
    message.error('导入文件不能超过 2 MB');
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
      <Upload.Dragger
        v-model:file-list="fileList"
        :before-upload="beforeUpload"
        :disabled="formLoading"
        accept=".xlsx, .xls"
        @remove="handleRemove"
      >
        <p class="ant-upload-drag-icon">
          <span class="icon-[ep--upload-filled] text-4xl"></span>
        </p>
        <p class="ant-upload-text">将文件拖到此处，或<em>点击上传</em></p>
      </Upload.Dragger>
      <div class="mt-2 text-center text-xs">
        <div>一级科目的上级科目编码填写 0，多项辅助核算使用“/”分隔</div>
        <span>仅允许导入 xls、xlsx 格式文件，且不超过 2 MB。</span>
        <Button
          :loading="templateLoading"
          class="!align-baseline"
          size="small"
          type="link"
          @click="handleDownloadTemplate"
        >
          下载模板
        </Button>
      </div>
    </template>

    <!-- 导入结果 -->
    <template v-else>
      <Result
        :status="failureCount ? 'warning' : 'success'"
        :sub-title="`共 ${importResult.totalCount} 个科目，成功 ${importResult.successSubjectCodes.length} 个，失败 ${failureCount} 个`"
        :title="failureCount ? '科目导入完成，部分数据未导入' : '科目导入成功'"
      />
      <Table
        v-if="failureCount"
        :columns="failureColumns"
        :data-source="failureRows"
        :pagination="false"
        :scroll="{ y: 260 }"
        bordered
        row-key="label"
        size="small"
      />
    </template>

    <template #footer>
      <template v-if="!importResult">
        <Button @click="modalApi.close()">取 消</Button>
        <Button :loading="formLoading" type="primary" @click="submitForm">
          确 定
        </Button>
      </template>
      <template v-else>
        <Button @click="resetForm">继续导入</Button>
        <Button type="primary" @click="modalApi.close()">完 成</Button>
      </template>
    </template>
  </Modal>
</template>
