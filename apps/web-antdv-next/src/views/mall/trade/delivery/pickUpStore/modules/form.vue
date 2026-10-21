<script lang="ts" setup>
import type { MallDeliveryPickUpStoreApi } from '#/api/mall/trade/delivery/pickUpStore';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Button, message } from 'antdv-next';
import dayjs from 'dayjs';

import { useVbenForm } from '#/adapter/form';
import {
  createDeliveryPickUpStore,
  getDeliveryPickUpStore,
  updateDeliveryPickUpStore,
} from '#/api/mall/trade/delivery/pickUpStore';
import {
  bd09ToGcj02,
  gcj02ToBd09,
  MapDialog,
  toMapCoordinate,
} from '#/components/map';
import { $t } from '#/locales';

import { useFormSchema } from '../data';

const emit = defineEmits(['success']);
const formData = ref<MallDeliveryPickUpStoreApi.DeliveryPickUpStore>();
const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['门店'])
    : $t('ui.actionTitle.create', ['门店']);
});

const mapDialogRef = ref<InstanceType<typeof MapDialog>>(); // 地图选点弹窗

/** 打开地图选点：门店坐标为 GCJ02，百度地图使用 BD09 */
async function openMapDialog() {
  const values = await formApi.getValues();
  const coordinate = toMapCoordinate(values.longitude, values.latitude);
  const point = coordinate
    ? gcj02ToBd09(coordinate.longitude, coordinate.latitude)
    : undefined;
  mapDialogRef.value?.open(point?.longitude, point?.latitude);
}

/** 地图选点确认：BD09 转回 GCJ02 回填 */
async function handleMapConfirm(data: { latitude: string; longitude: string }) {
  const coordinate = toMapCoordinate(data.longitude, data.latitude);
  if (!coordinate) {
    return;
  }
  const point = bd09ToGcj02(coordinate.longitude, coordinate.latitude);
  await formApi.setFieldValue('longitude', Number(point.longitude.toFixed(6)));
  await formApi.setFieldValue('latitude', Number(point.latitude.toFixed(6)));
}

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    labelWidth: 120,
  },
  fieldMappingTime: [['rangeTime', ['openingTime', 'closingTime'], 'HH:mm']],
  wrapperClass: 'grid-cols-2',
  layout: 'horizontal',
  schema: useFormSchema(),
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
    const data =
      (await formApi.getValues()) as MallDeliveryPickUpStoreApi.DeliveryPickUpStore;
    try {
      await (formData.value?.id
        ? updateDeliveryPickUpStore(data)
        : createDeliveryPickUpStore(data));
      // 关闭并提示
      await modalApi.close();
      emit('success');
      message.success($t('ui.actionMessage.operationSuccess'));
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
    const data =
      modalApi.getData() as MallDeliveryPickUpStoreApi.DeliveryPickUpStore;
    if (!data || !data.id) {
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getDeliveryPickUpStore(data.id);
      formData.value.rangeTime = [
        dayjs(formData.value.openingTime, 'HH:mm'),
        dayjs(formData.value.closingTime, 'HH:mm'),
      ];
      // 设置到 values
      await formApi.setValues(formData.value);
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-2/5">
    <Form class="mx-4" />
    <template #prepend-footer>
      <Button @click="openMapDialog"> 获取经纬度 </Button>
    </template>
  </Modal>

  <!-- 地图选点弹窗 -->
  <MapDialog ref="mapDialogRef" @confirm="handleMapConfirm" />
</template>
