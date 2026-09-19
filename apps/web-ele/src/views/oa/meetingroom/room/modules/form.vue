<script lang="ts" setup>
import type { OaMeetingRoomApi } from '#/api/oa/meetingroom/room';
import type { SystemUserApi } from '#/api/system/user';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { ElMessage } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import {
  createMeetingRoom,
  getMeetingRoom,
  updateMeetingRoom,
} from '#/api/oa/meetingroom/room';
import { $t } from '#/locales';

import { useFormSchema } from '../data';

const emit = defineEmits(['success']);
const formData = ref<OaMeetingRoomApi.MeetingRoom>();
const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['会议室'])
    : $t('ui.actionTitle.create', ['会议室']);
});

/** 选择负责人，回显联系方式 */
function handleManagerChange(
  user: SystemUserApi.User | SystemUserApi.User[] | undefined,
) {
  formApi.setFieldValue(
    'managerPhone',
    user && !Array.isArray(user) ? user.mobile : undefined,
  );
}

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    labelWidth: 110,
  },
  wrapperClass: 'grid-cols-2',
  layout: 'horizontal',
  schema: useFormSchema({ onManagerChange: handleManagerChange }),
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    modalApi.lock();
    // 提交表单
    const data = (await formApi.getValues()) as OaMeetingRoomApi.MeetingRoom;
    try {
      await (formData.value?.id
        ? updateMeetingRoom(data)
        : createMeetingRoom(data));
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
      return;
    }
    // 加载数据
    const data = modalApi.getData() as OaMeetingRoomApi.MeetingRoom;
    if (!data || !data.id) {
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getMeetingRoom(data.id);
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
    <Form class="mx-4" />
  </Modal>
</template>
