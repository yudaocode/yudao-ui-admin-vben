<script lang="ts" setup>
import type { UploadUserFile } from 'element-plus';

import type { FmsAuxiliaryItemApi } from '#/api/fms/config/auxiliary/item';
import type { FmsAuxiliaryTypeApi } from '#/api/fms/config/auxiliary/type';

import { computed, nextTick, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
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
  getAuxiliaryItemImportTemplate,
  importAuxiliaryItem,
} from '#/api/fms/config/auxiliary/item';
import { FMS_AUXILIARY_TYPE } from '#/views/fms/utils/constants';

defineOptions({ name: 'FmsAuxiliaryItemImportForm' });

const emit = defineEmits(['success']);

const formLoading = ref(false); // 导入的加载中
const templateLoading = ref(false); // 模板下载的加载中
const accountSetId = ref(0); // 账套编号
const auxiliaryType = ref<FmsAuxiliaryTypeApi.AuxiliaryType>(); // 辅助核算类别
const fileList = ref<UploadUserFile[]>([]); // 上传文件列表
const importResult = ref<FmsAuxiliaryItemApi.ImportResp>(); // 导入结果
const uploadRef = ref<InstanceType<typeof ElUpload>>(); // 上传 Ref

const failureRows = computed(() =>
  Object.entries(importResult.value?.failureReasons || {}).map(
    ([label, reason]) => ({ label, reason }),
  ),
); // 导入失败列表
const failureCount = computed(() => failureRows.value.length); // 导入失败数量
const templateTip = computed(() => {
  if (
    auxiliaryType.value?.type === FMS_AUXILIARY_TYPE.CUSTOMER ||
    auxiliaryType.value?.type === FMS_AUXILIARY_TYPE.SUPPLIER
  ) {
    return '编码、名称为必填项，备注可选；已有编码不会被覆盖';
  }
  if (auxiliaryType.value?.type === FMS_AUXILIARY_TYPE.INVENTORY) {
    return '编码、名称为必填项，规格、单位可选；已有编码不会被覆盖';
  }
  return '编码、名称为必填项；已有编码不会被覆盖';
}); // 导入模板说明

const [Modal, modalApi] = useVbenModal({
  showCancelButton: false,
  showConfirmButton: false,
  onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      return;
    }
    const data = modalApi.getData<{
      accountSetId: number;
      auxiliaryType: FmsAuxiliaryTypeApi.AuxiliaryType;
    }>();
    accountSetId.value = data.accountSetId;
    auxiliaryType.value = data.auxiliaryType;
    resetImport();
  },
});

/** 下载导入模板 */
async function downloadTemplate() {
  if (!auxiliaryType.value?.type) {
    return;
  }
  templateLoading.value = true;
  try {
    const data = await getAuxiliaryItemImportTemplate(auxiliaryType.value.type);
    downloadFileFromBlobPart({
      fileName: `${auxiliaryType.value.name}导入模板.xlsx`,
      source: data,
    });
  } finally {
    templateLoading.value = false;
  }
}

/** 提交导入 */
async function submitImport() {
  const rawFile = fileList.value[0]?.raw;
  if (!rawFile || !auxiliaryType.value?.id) {
    ElMessage.warning('请选择需要导入的文件');
    return;
  }
  if (rawFile.size > 2 * 1024 * 1024) {
    ElMessage.error('导入文件不能超过 2MB');
    return;
  }
  formLoading.value = true;
  try {
    importResult.value = await importAuxiliaryItem(
      accountSetId.value,
      auxiliaryType.value.id,
      rawFile,
    );
    if (importResult.value.successItemCodes.length > 0) {
      emit('success');
    }
  } finally {
    formLoading.value = false;
  }
}

/** 重置导入 */
function resetImport() {
  fileList.value = [];
  importResult.value = undefined;
  nextTick(() => uploadRef.value?.clearFiles());
}

/** 文件数超出提示 */
function handleExceed() {
  ElMessage.warning('每次只能上传一个文件');
}
</script>

<template>
  <Modal title="导入辅助核算项目" class="w-[680px]">
    <div v-if="!importResult" class="px-4">
      <div class="mb-7">
        <div class="text-[15px] mb-3 font-semibold">
          一、请按照数据模板的格式准备要导入的辅助核算项目
        </div>
        <ElButton
          :loading="templateLoading"
          link
          type="primary"
          @click="downloadTemplate"
        >
          <span class="icon-[ep--download]"></span>
          下载《{{ auxiliaryType?.name }}导入模板》
        </ElButton>
        <div class="text-[13px] mt-1 text-gray-500">{{ templateTip }}</div>
      </div>
      <div>
        <div class="text-[15px] mb-3 font-semibold">
          二、请选择需要导入的文件
        </div>
        <ElUpload
          ref="uploadRef"
          v-model:file-list="fileList"
          :auto-upload="false"
          :limit="1"
          :on-exceed="handleExceed"
          accept=".xlsx,.xls"
          action="none"
          drag
        >
          <span class="icon-[ep--upload-filled] text-[56px] text-gray-400"></span>
          <div class="el-upload__text">将文件拖到此处，或<em>点击选择文件</em></div>
          <template #tip>
            <div class="el-upload__tip">
              仅支持 xls、xlsx 格式，文件不能超过 2MB
            </div>
          </template>
        </ElUpload>
      </div>
    </div>

    <template v-else>
      <ElResult
        :icon="failureCount ? 'warning' : 'success'"
        :sub-title="`共 ${importResult.totalCount} 个项目，成功 ${importResult.successItemCodes.length} 个，失败 ${failureCount} 个`"
        :title="failureCount ? '导入完成，部分数据未导入' : '辅助核算项目导入成功'"
      />
      <ElTable v-if="failureCount" :data="failureRows" border max-height="260px">
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
        <ElButton
          :disabled="fileList.length === 0"
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
