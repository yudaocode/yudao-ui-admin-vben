<script lang="ts" setup>
import type { UploadFile } from 'element-plus';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { getDictLabel } from '@vben/hooks';
import { IconifyIcon } from '@vben/icons';
import { downloadFileFromBlobPart } from '@vben/utils';

import { ElButton, ElMessageBox, ElUpload } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import {
  getWorkItemImportTemplate,
  importWorkItem,
} from '#/api/pms/pm/workitem';
import { PmsWorkItemType } from '#/views/pms/pm/utils/constants';

import { useWorkItemImportFormSchema } from '../data';

defineOptions({ name: 'PmsWorkItemImportForm' });

const emit = defineEmits(['success']); // 定义 success 事件，用于操作成功后的回调

const projectId = ref(0); // 项目编号
const workItemType = ref<number>(PmsWorkItemType.TASK); // 工作项类型
const workItemTypeName = computed(
  () => getDictLabel(DICT_TYPE.PMS_WORK_ITEM_TYPE, workItemType.value) || '-',
); // 工作项类型名称

const [Form, formApi] = useVbenForm({
  commonConfig: {
    formItemClass: 'col-span-2',
    labelWidth: 120,
  },
  layout: 'horizontal',
  schema: useWorkItemImportFormSchema(),
  showDefaultActions: false,
});

/** 记录手动上传所选的原始文件 */
function handleChange(uploadFile: UploadFile) {
  formApi.setFieldValue('file', uploadFile.raw);
}

/** 移除已选文件 */
function handleRemove() {
  formApi.setFieldValue('file', undefined);
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
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    const { file } = await formApi.getValues();
    modalApi.lock();
    try {
      const result = await importWorkItem(
        projectId.value,
        workItemType.value,
        file,
      );
      const failureEntries = Object.entries(result.failureReasons);
      const failureText = failureEntries
        .map(([row, reason]) => `第 ${row} 行：${reason}`)
        .join('；');
      await ElMessageBox.alert(
        `导入成功 ${result.successCount} 条，失败 ${failureEntries.length} 条${
          failureText ? `；${failureText}` : ''
        }`,
        '导入结果',
      );
      await modalApi.close();
      emit('success');
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      return;
    }
    const data = modalApi.getData() as { projectId: number; type: number };
    projectId.value = data.projectId;
    workItemType.value = data.type;
    await formApi.resetForm();
  },
});
</script>

<template>
  <Modal :title="`${workItemTypeName}导入`" class="w-[460px]">
    <Form class="mx-4">
      <template #file>
        <div class="w-full">
          <ElUpload
            :auto-upload="false"
            :limit="1"
            :on-change="handleChange"
            :on-remove="handleRemove"
            accept=".xls,.xlsx"
          >
            <ElButton type="primary">
              <IconifyIcon class="mr-1" icon="lucide:upload" />
              选择 Excel 文件
            </ElButton>
          </ElUpload>
          <div class="mt-2 text-xs text-muted-foreground">
            处理人填写用户编号，状态填写当前项目的状态名称；标签用逗号分隔。
          </div>
        </div>
      </template>
    </Form>
    <template #prepend-footer>
      <div class="flex flex-auto items-center">
        <ElButton @click="downloadTemplate">下载导入模板</ElButton>
      </div>
    </template>
  </Modal>
</template>
