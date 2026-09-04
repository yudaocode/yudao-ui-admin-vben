<script lang="ts" setup>
import type { HrmAttendanceGroupApi } from '#/api/hrm/attendance/group';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Button } from 'antdv-next';

import { useVbenForm } from '#/adapter/form';
import { MapDialog } from '#/components/map';

import { usePointFormSchema } from '../data';

defineOptions({ name: 'HrmAttendanceGroupPointForm' });

const emit = defineEmits<{
  confirm: [point: HrmAttendanceGroupApi.Point, index?: number];
}>();

const editIndex = ref<number>();
const mapDialogRef = ref<InstanceType<typeof MapDialog>>();

const [Form, formApi] = useVbenForm({
  commonConfig: { componentProps: { class: 'w-full' }, labelWidth: 88 },
  layout: 'horizontal',
  schema: usePointFormSchema(),
  showDefaultActions: false,
});

async function openMap() {
  const values = await formApi.getValues();
  mapDialogRef.value?.open(
    Number.isFinite(values.longitude) ? values.longitude : undefined,
    Number.isFinite(values.latitude) ? values.latitude : undefined,
  );
}

async function handleMapConfirm(data: {
  address: string;
  latitude: string;
  longitude: string;
}) {
  await formApi.setValues({
    address: data.address || undefined,
    latitude: Number(data.latitude),
    longitude: Number(data.longitude),
  });
}

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;
    emit(
      'confirm',
      (await formApi.getValues()) as HrmAttendanceGroupApi.Point,
      editIndex.value,
    );
    await modalApi.close();
  },
  async onOpenChange(isOpen) {
    if (!isOpen) return;
    const { index, point } = modalApi.getData() as any;
    editIndex.value = index;
    modalApi.setState({
      title: index === undefined ? '新增打卡地址' : '编辑打卡地址',
    });
    await formApi.reset();
    if (point) await formApi.setValues(point);
  },
});
</script>

<template>
  <Modal class="w-[640px]">
    <Form class="mx-4" />
    <div class="mb-4 ml-[116px]">
      <Button type="primary" @click="openMap">地图选点</Button>
    </div>
    <MapDialog ref="mapDialogRef" @confirm="handleMapConfirm" />
  </Modal>
</template>
