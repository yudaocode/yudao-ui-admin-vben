<script lang="ts" setup>
import type { FileType } from 'ant-design-vue/es/upload/interface';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { getDictLabel } from '@vben/hooks';
import { IconifyIcon } from '@vben/icons';
import { downloadFileFromBlobPart } from '@vben/utils';

import { Button, message, Modal, UploadDragger } from 'ant-design-vue';

import {
  getWorkItemImportTemplate,
  importWorkItem,
} from '#/api/pms/pm/workitem';
import { PmsWorkItemType } from '#/views/pms/pm/utils/constants';

defineOptions({ name: 'PmsWorkItemImportForm' });

const emit = defineEmits(['success']); // 定义 success 事件，用于操作成功后的回调

const formLoading = ref(false); // 导入中
const file = ref<File>(); // 待导入的文件
const projectId = ref(0); // 项目编号
const workItemType = ref<number>(PmsWorkItemType.TASK); // 工作项类型
const workItemTypeName = computed(() =>
  getDictLabel(DICT_TYPE.PMS_WORK_ITEM_TYPE, workItemType.value) || '-',
); // 工作项类型名称

/** 上传前：拦截文件，等待手动提交导入 */
function beforeUpload(uploadFile: FileType) {
  if (file.value) {
    message.error('最多只能上传一个文件');
    return false;
  }
  file.value = uploadFile;
  return false;
}

/** 移除已选文件 */
function handleRemove() {
  file.value = undefined;
  return true;
}

/** 下载导入模板 */
async function downloadTemplate() {
  const data = await getWorkItemImportTemplate();
  downloadFileFromBlobPart({
    fileName: '工作项导入模板.xlsx',
    source: data,
  });
}

const [ModalComponent, modalApi] = useVbenModal({
  async onConfirm() {
    if (!file.value) {
      message.error('请上传文件');
      return;
    }
    modalApi.lock();
    try {
      const result = await importWorkItem(
        projectId.value,
        workItemType.value,
        file.value,
      );
      const failureEntries = Object.entries(result.failureReasons);
      const failureText = failureEntries
        .map(([row, reason]) => `第 ${row} 行：${reason}`)
        .join('；');
      Modal.info({
        title: '导入结果',
        content:
          `导入成功 ${result.successCount} 条，失败 ${failureEntries.length} 条` +
          (failureText ? `；${failureText}` : ''),
      });
      await modalApi.close();
      emit('success');
    } catch {
      file.value = undefined;
    } finally {
      modalApi.unlock();
    }
  },
  onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      return;
    }
    const data = modalApi.getData() as { projectId: number; type: number };
    projectId.value = data.projectId;
    workItemType.value = data.type;
    file.value = undefined;
    formLoading.value = false;
  },
});
</script>

<template>
  <ModalComponent :title="`${workItemTypeName}导入`" class="w-[460px]">
    <!-- 导入文件 -->
    <UploadDragger
      :before-upload="beforeUpload"
      :disabled="formLoading"
      :max-count="1"
      :on-remove="handleRemove"
      accept=".xlsx, .xls"
    >
      <p class="flex justify-center">
        <IconifyIcon icon="lucide:upload" :size="40" />
      </p>
      <p>将文件拖到此处，或点击上传</p>
    </UploadDragger>
    <div class="mt-3 text-center text-xs text-muted-foreground">
      <div>仅允许导入 xls、xlsx 格式文件。</div>
      <div>处理人请填写用户编号，状态请填写当前项目的状态名称。</div>
      <div>
        优先级、缺陷类型可直接使用模板下拉（缺陷类型仅缺陷填写），标签支持多个名称（用逗号分隔）。
      </div>
      <Button size="small" type="link" @click="downloadTemplate">
        下载模板
      </Button>
    </div>
  </ModalComponent>
</template>
