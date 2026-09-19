<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { OaMeetingRoomApi } from '#/api/oa/meetingroom/room';

import { nextTick, ref } from 'vue';

import { Button, message, Modal } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getBookableMeetingRoomPage } from '#/api/oa/meetingroom/room';

import {
  useRoomSelectGridColumns,
  useRoomSelectGridFormSchema,
} from '../data';
import ScheduleDialog from './schedule-dialog.vue';

defineOptions({ name: 'OaMeetingRoomSelectDialog' });

const emit = defineEmits<{
  selected: [rows: OaMeetingRoomApi.MeetingRoom[]];
}>();

const open = ref(false); // 弹窗是否打开
const selectedRows = ref<OaMeetingRoomApi.MeetingRoom[]>([]); // 已选会议室列表
const preSelectedIds = ref<number[]>([]); // 预选会议室编号列表
const scheduleDialogRef = ref<InstanceType<typeof ScheduleDialog>>(); // 预定信息弹窗

/** 处理单选切换 */
function handleRadioChange(row: OaMeetingRoomApi.MeetingRoom) {
  selectedRows.value = [row];
}

/** 处理行双击：直接确认选择 */
async function handleCellDblclick({ row }: { row: OaMeetingRoomApi.MeetingRoom }) {
  selectedRows.value = [row];
  await gridApi.grid.setRadioRow(row);
  handleConfirm();
}

/** 回显预选会议室 */
async function applyPreSelection() {
  if (preSelectedIds.value.length === 0) {
    return;
  }
  const rows = gridApi.grid.getData() as OaMeetingRoomApi.MeetingRoom[];
  for (const row of rows) {
    if (row.id === undefined || !preSelectedIds.value.includes(row.id)) {
      continue;
    }
    await gridApi.grid.setRadioRow(row);
    selectedRows.value = [row];
    return;
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useRoomSelectGridFormSchema(),
  },
  gridOptions: {
    columns: useRoomSelectGridColumns(),
    height: 520,
    keepSource: true,
    radioConfig: {
      highlight: true,
      trigger: 'row',
    },
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getBookableMeetingRoomPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          });
        },
      },
    },
    rowConfig: {
      keyField: 'id',
      isHover: true,
    },
    toolbarConfig: {
      refresh: true,
      search: true,
    },
  } as VxeTableGridOptions<OaMeetingRoomApi.MeetingRoom>,
  gridEvents: {
    cellDblclick: handleCellDblclick,
    radioChange: ({ row }: { row: OaMeetingRoomApi.MeetingRoom }) => {
      handleRadioChange(row);
    },
  },
});

/** 查看会议室预定信息 */
function handleSchedule(row: OaMeetingRoomApi.MeetingRoom) {
  scheduleDialogRef.value?.open(row.id!, row.name!);
}

/** 打开会议室选择弹窗 */
async function openModal(roomId?: number) {
  open.value = true;
  preSelectedIds.value = roomId === undefined ? [] : [roomId];
  await nextTick();
  selectedRows.value = [];
  await gridApi.grid.clearRadioRow();
  await gridApi.formApi.reset();
  await gridApi.query();
  await nextTick();
  await applyPreSelection();
}

/** 关闭会议室选择弹窗 */
function closeModal() {
  open.value = false;
}

/** 确认选择会议室 */
function handleConfirm() {
  const room = selectedRows.value[0];
  // 未重新选择时保留原会议室，不要求原记录位于当前页
  if (!room && preSelectedIds.value.length > 0) {
    open.value = false;
    return;
  }
  if (!room) {
    message.warning('请选择会议室');
    return;
  }
  emit('selected', [room]);
  open.value = false;
}

defineExpose({ open: openModal }); // 提供 open 方法，用于打开弹窗
</script>

<template>
  <Modal
    v-model:open="open"
    title="选择会议室"
    width="1050px"
    :destroy-on-close="true"
    @ok="handleConfirm"
    @cancel="closeModal"
  >
    <Grid table-title="会议室列表">
      <template #actions="{ row }">
        <Button type="link" size="small" @click.stop="handleSchedule(row)">
          查看预定信息
        </Button>
      </template>
    </Grid>
    <template #footer>
      <Button @click="closeModal">取消</Button>
      <Button type="primary" @click="handleConfirm">确定</Button>
    </template>
  </Modal>
  <ScheduleDialog ref="scheduleDialogRef" :show-bookings="false" />
</template>
