<script lang="ts" setup>
import type { HrmEmployeeFileApi } from '#/api/hrm/employee/file';

import { onMounted, ref } from 'vue';

import { useAccess } from '@vben/access';

import { Button, Card, Modal } from 'antdv-next';

import {
  getEmployeeFileList,
  saveEmployeeFiles,
} from '#/api/hrm/employee/file';
import { FileUpload } from '#/components/upload';
import { HrmEmployeeFileGroups } from '#/views/hrm/utils/constants';
const props = defineProps<{ employeeId: number }>();
const emit = defineEmits(['success']);
const { hasAccessByCodes } = useAccess();
const loading = ref(false);
const saving = ref(false);
const fileList = ref<HrmEmployeeFileApi.EmployeeFile[]>([]);
const dialogVisible = ref(false);
const dialogTitle = ref('');
const selectedType = ref<number>();
const dialogFileUrls = ref<string[]>([]);
const canUpdate = hasAccessByCodes(['hrm:employee:update']);
function getFileUrls(type: number) {
  return fileList.value
    .filter((file) => file.type === type)
    .map((file) => file.url)
    .filter((url): url is string => typeof url === 'string' && url.length > 0);
}
async function getFileListData() {
  loading.value = true;
  try {
    fileList.value = await getEmployeeFileList(props.employeeId);
  } finally {
    loading.value = false;
  }
}
function openFileDialog(option: { label: string; value: number }) {
  selectedType.value = option.value;
  dialogTitle.value = option.label;
  dialogFileUrls.value = [...getFileUrls(option.value)];
  dialogVisible.value = true;
}
async function saveFiles() {
  if (selectedType.value === undefined) return;
  saving.value = true;
  try {
    await saveEmployeeFiles({
      employeeId: props.employeeId,
      type: selectedType.value,
      fileUrls: dialogFileUrls.value,
    });
    dialogVisible.value = false;
    await getFileListData();
    emit('success');
  } finally {
    saving.value = false;
  }
}
onMounted(getFileListData);
</script>
<template>
  <div v-loading="loading">
    <Card
      v-for="group in HrmEmployeeFileGroups"
      :key="group.label"
      :title="group.label"
      :style="{ marginBottom: '15px' }"
    >
      <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
        <button
          v-for="option in group.options"
          :key="option.value"
          type="button"
          class="border-border hover:border-primary flex min-h-[72px] items-center rounded-md border px-4 py-3 text-left"
          @click="openFileDialog(option)"
        >
          <span class="flex-1">{{ option.label }}</span>
          <span>{{ getFileUrls(option.value).length }}</span>
        </button>
      </div>
    </Card>
    <Modal v-model:open="dialogVisible" :title="dialogTitle" width="620px">
      <FileUpload
        v-model="dialogFileUrls"
        :disabled="!canUpdate"
        :max-number="20"
        directory="hrm/employee/file"
      />
      <template #footer>
        <Button @click="dialogVisible = false">取消</Button>
        <Button
          v-if="canUpdate"
          type="primary"
          :loading="saving"
          @click="saveFiles"
        >
          保存
        </Button>
      </template>
    </Modal>
  </div>
</template>
