<script lang="ts" setup>
import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { getDictLabel } from '@vben/hooks';
import { IconifyIcon } from '@vben/icons';
import { downloadFileFromBlobPart } from '@vben/utils';

import { ElLink, ElMessage, ElMessageBox, ElUpload } from 'element-plus';

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
function beforeUpload(uploadFile: File) {
  if (file.value) {
    ElMessage.error('最多只能上传一个文件');
    return false;
  }
  file.value = uploadFile;
  return false;
}

/** 移除已选文件 */
function handleRemove() {
  file.value = undefined;
}

/** 下载导入模板 */
async function downloadTemplate() {
  const data = await getWorkItemImportTemplate();
  downloadFileFromBlobPart({
    fileName: '工作项导入模板.xlsx',
    source: data,
  });
}

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    if (!file.value) {
      ElMessage.error('请上传文件');
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
      await ElMessageBox.alert(
        `导入成功 ${result.successCount} 条，失败 ${failureEntries.length} 条` +
          (failureText ? `；${failureText}` : ''),
        '导入结果',
      );
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
  <Modal :title="`${workItemTypeName}导入`" class="w-[460px]">
    <!-- 导入文件 -->
    <ElUpload
      :auto-upload="false"
      :before-upload="beforeUpload"
      :disabled="formLoading"
      :limit="1"
      :on-remove="handleRemove"
      accept=".xlsx, .xls"
      drag
    >
      <IconifyIcon icon="ep:upload" />
      <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
      <template #tip>
        <div class="el-upload__tip text-center">
          <span>仅允许导入 xls、xlsx 格式文件。</span>
          <span>处理人请填写用户编号，状态请填写当前项目的状态名称。</span>
          <span>
            优先级、缺陷类型可直接使用模板下拉（缺陷类型仅缺陷填写），标签支持多个名称（用逗号分隔）。
          </span>
          <ElLink :underline="false" type="primary" @click="downloadTemplate">
            下载模板
          </ElLink>
        </div>
      </template>
    </ElUpload>
  </Modal>
</template>
