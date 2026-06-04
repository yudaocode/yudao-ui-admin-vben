<script lang="ts" setup>
import type { MesProWorkRecordApi } from '#/api/mes/pro/workrecord';

import { computed, onMounted, ref } from 'vue';

import { confirm } from '@vben/common-ui';
import { MesProWorkRecordTypeEnum } from '@vben/constants';
import { IconifyIcon } from '@vben/icons';
import { formatDateTime } from '@vben/utils';

import { ElButton, ElDialog, ElMessage, ElTag } from 'element-plus';

import {
  clockInWorkRecord,
  clockOutWorkRecord,
  getMyWorkRecord,
} from '#/api/mes/pro/workrecord';
import { MdWorkstationSelect } from '#/views/mes/md/workstation/components';

const emit = defineEmits<{
  (e: 'change'): void;
}>();

const myWorkstation = ref<MesProWorkRecordApi.MyWorkRecord | null>(null); // 当前用户绑定的工作站状态
const clockInDialogVisible = ref(false); // 上工弹窗是否可见
const selectedWorkstationId = ref<number>(); // 当前选中的工作站编号

const isClockIn = computed(() => // 是否处于上工状态
  myWorkstation.value?.type === MesProWorkRecordTypeEnum.CLOCK_IN,
);

/** 加载当前用户工作站 */
async function loadMyWorkstation() {
  myWorkstation.value = await getMyWorkRecord();
}

/** 打开上工弹窗 */
function handleOpenClockIn() {
  selectedWorkstationId.value = undefined;
  clockInDialogVisible.value = true;
}

/** 上工 */
async function handleClockIn() {
  if (!selectedWorkstationId.value) {
    return;
  }
  await clockInWorkRecord(selectedWorkstationId.value);
  ElMessage.success('上工成功');
  clockInDialogVisible.value = false;
  selectedWorkstationId.value = undefined;
  await loadMyWorkstation();
  emit('change');
}

/** 下工 */
async function handleClockOut() {
  try {
    await confirm('确认下工当前工作站？');
  } catch {
    return;
  }
  await clockOutWorkRecord();
  ElMessage.success('下工成功');
  await loadMyWorkstation();
  emit('change');
}

onMounted(loadMyWorkstation);
</script>

<template>
  <div
    class="bg-card mb-3 flex items-center justify-between rounded border p-3"
  >
    <div class="flex flex-wrap items-center gap-3">
      <span class="text-sm font-semibold">我的工作站</span>
      <template v-if="isClockIn">
        <ElTag type="success">
          <IconifyIcon class="mr-1 inline-block size-4" icon="lucide:check" />
          {{ myWorkstation!.workstationCode }} -
          {{ myWorkstation!.workstationName }}
        </ElTag>
        <span class="text-muted-foreground text-xs">
          上工时间：{{ formatDateTime(myWorkstation!.clockInTime as Date) }}
        </span>
      </template>
      <ElTag v-else type="info">当前未上工</ElTag>
    </div>
    <div>
      <ElButton v-if="!isClockIn" type="primary" @click="handleOpenClockIn">
        <IconifyIcon class="mr-1 inline-block size-4" icon="lucide:play" />
        上工
      </ElButton>
      <ElButton v-else type="danger" @click="handleClockOut">
        <IconifyIcon class="mr-1 inline-block size-4" icon="lucide:pause" />
        下工
      </ElButton>
    </div>

    <ElDialog
      v-model="clockInDialogVisible"
      title="选择工作站"
      width="420px"
    >
      <MdWorkstationSelect
        v-model="selectedWorkstationId"
        class="w-full"
        placeholder="请选择工作站"
      />
      <template #footer>
        <ElButton @click="clockInDialogVisible = false">取消</ElButton>
        <ElButton
          :disabled="!selectedWorkstationId"
          type="primary"
          @click="handleClockIn"
        >
          确认上工
        </ElButton>
      </template>
    </ElDialog>
  </div>
</template>
