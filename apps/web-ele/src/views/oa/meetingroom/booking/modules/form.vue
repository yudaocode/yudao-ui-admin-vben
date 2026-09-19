<script lang="ts" setup>
import type { OaMeetingRoomBookingApi } from '#/api/oa/meetingroom/booking';
import type { OaMeetingRoomApi } from '#/api/oa/meetingroom/room';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { ElInput, ElMessage } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import {
  createMeetingRoomBooking,
  getMeetingRoomBooking,
  updateMeetingRoomBooking,
} from '#/api/oa/meetingroom/booking';
import { $t } from '#/locales';

import RoomSelectDialog from '../../room/components/select-dialog.vue';
import { useFormSchema } from '../data';

const emit = defineEmits(['success']);
const formData = ref<OaMeetingRoomBookingApi.MeetingRoomBooking>();
const roomName = ref(''); // 当前选择的会议室名称
const roomSelectDialogRef = ref<InstanceType<typeof RoomSelectDialog>>(); // 会议室选择弹窗
const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['会议室预定'])
    : $t('ui.actionTitle.create', ['会议室预定']);
});

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    labelWidth: 100,
  },
  wrapperClass: 'grid-cols-2',
  layout: 'horizontal',
  schema: useFormSchema(),
  showDefaultActions: false,
});

/** 选择会议室，回显名称和位置 */
function handleRoomSelect(rows: OaMeetingRoomApi.MeetingRoom[]) {
  const room = rows[0];
  if (!room) {
    return;
  }
  roomName.value = room.name || '';
  formApi.setValues({
    roomId: room.id,
    roomName: room.name,
    roomLocation: room.location,
  });
}

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    modalApi.lock();
    // 提交表单
    const data =
      (await formApi.getValues()) as OaMeetingRoomBookingApi.MeetingRoomBooking;
    try {
      await (formData.value?.id
        ? updateMeetingRoomBooking(data)
        : createMeetingRoomBooking(data));
      // 关闭并提示
      await modalApi.close();
      emit('success');
      ElMessage.success($t('ui.actionMessage.operationSuccess'));
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      formData.value = undefined;
      roomName.value = '';
      return;
    }
    // 加载数据
    const data = modalApi.getData() as OaMeetingRoomBookingApi.MeetingRoomBooking;
    if (!data || !data.id) {
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getMeetingRoomBooking(data.id);
      roomName.value = formData.value.roomName || '';
      // 设置到 values
      await formApi.setValues(formData.value);
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-2/3">
    <Form class="mx-4">
      <template #roomId="slotProps">
        <ElInput
          class="cursor-pointer"
          :model-value="roomName"
          placeholder="请选择会议室"
          readonly
          @click="roomSelectDialogRef?.open(slotProps.componentField.modelValue)"
        >
          <template #suffix>
            <IconifyIcon class="size-4" icon="lucide:search" />
          </template>
        </ElInput>
      </template>
    </Form>
    <RoomSelectDialog ref="roomSelectDialogRef" @selected="handleRoomSelect" />
  </Modal>
</template>
