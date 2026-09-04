<script lang="ts" setup>
import type { HrmAttendanceGroupApi } from '#/api/hrm/attendance/group';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { useVbenForm } from '#/adapter/form';

import { useWifiFormSchema } from '../data';

defineOptions({ name: 'HrmAttendanceGroupWifiForm' });

const emit = defineEmits<{
  confirm: [wifi: HrmAttendanceGroupApi.Wifi, index?: number];
}>();
const editIndex = ref<number>();

const [Form, formApi] = useVbenForm({
  commonConfig: { componentProps: { class: 'w-full' }, labelWidth: 88 },
  layout: 'horizontal',
  schema: useWifiFormSchema(),
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;
    emit(
      'confirm',
      (await formApi.getValues()) as HrmAttendanceGroupApi.Wifi,
      editIndex.value,
    );
    await modalApi.close();
  },
  async onOpenChange(isOpen) {
    if (!isOpen) return;
    const { index, wifi } = modalApi.getData() as any;
    editIndex.value = index;
    modalApi.setState({
      title: index === undefined ? '新增打卡 WiFi' : '编辑打卡 WiFi',
    });
    await formApi.reset();
    if (wifi) await formApi.setValues(wifi);
  },
});
</script>

<template>
  <Modal class="w-[560px]">
    <Form class="mx-4" />
  </Modal>
</template>
