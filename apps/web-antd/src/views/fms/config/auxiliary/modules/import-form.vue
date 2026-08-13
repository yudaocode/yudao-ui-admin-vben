<script lang="ts" setup>
import type { FileType } from 'ant-design-vue/es/upload/interface';

import type { FmsAuxiliaryItemApi } from '#/api/fms/config/auxiliary/item';
import type { FmsAuxiliaryTypeApi } from '#/api/fms/config/auxiliary/type';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { downloadFileFromBlobPart } from '@vben/utils';

import { Button, message, Result, Table, Upload } from 'ant-design-vue';

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
const file = ref<File>(); // 待导入的文件
const importResult = ref<FmsAuxiliaryItemApi.ImportResp>(); // 导入结果

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

const failureColumns = [
  { title: '导入行', dataIndex: 'label', ellipsis: true },
  { title: '失败原因', dataIndex: 'reason', ellipsis: true },
];

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

/** 上传前：拦截文件，等待手动提交导入 */
function beforeUpload(uploadFile: FileType) {
  file.value = uploadFile;
  return false;
}

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
  if (!file.value || !auxiliaryType.value?.id) {
    message.warning('请选择需要导入的文件');
    return;
  }
  if (file.value.size > 2 * 1024 * 1024) {
    message.error('导入文件不能超过 2MB');
    return;
  }
  formLoading.value = true;
  try {
    importResult.value = await importAuxiliaryItem(
      accountSetId.value,
      auxiliaryType.value.id,
      file.value,
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
  file.value = undefined;
  importResult.value = undefined;
}
</script>

<template>
  <Modal title="导入辅助核算项目" class="w-[680px]">
    <div v-if="!importResult" class="px-4">
      <div class="mb-7">
        <div class="text-[15px] mb-3 font-semibold">
          一、请按照数据模板的格式准备要导入的辅助核算项目
        </div>
        <Button
          :loading="templateLoading"
          type="link"
          @click="downloadTemplate"
        >
          <span class="icon-[ant-design--download-outlined]"></span>
          下载《{{ auxiliaryType?.name }}导入模板》
        </Button>
        <div class="text-[13px] mt-1 text-gray-500">{{ templateTip }}</div>
      </div>
      <div>
        <div class="text-[15px] mb-3 font-semibold">
          二、请选择需要导入的文件
        </div>
        <Upload.Dragger
          :before-upload="beforeUpload"
          :max-count="1"
          accept=".xlsx,.xls"
          @remove="file = undefined"
        >
          <p class="ant-upload-drag-icon">
            <span class="icon-[ant-design--inbox-outlined] text-2xl"></span>
          </p>
          <p class="ant-upload-text">将文件拖到此处，或点击选择文件</p>
          <p class="ant-upload-hint">
            仅支持 xls、xlsx 格式，文件不能超过 2MB
          </p>
        </Upload.Dragger>
      </div>
    </div>

    <template v-else>
      <Result
        :status="failureCount ? 'warning' : 'success'"
        :sub-title="`共 ${importResult.totalCount} 个项目，成功 ${importResult.successItemCodes.length} 个，失败 ${failureCount} 个`"
        :title="failureCount ? '导入完成，部分数据未导入' : '辅助核算项目导入成功'"
      />
      <Table
        v-if="failureCount"
        :columns="failureColumns"
        :data-source="failureRows"
        :pagination="false"
        bordered
        row-key="label"
        size="small"
      />
    </template>

    <template #footer>
      <template v-if="!importResult">
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
