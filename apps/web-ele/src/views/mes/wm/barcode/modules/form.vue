<script lang="ts" setup>
import type { MesWmBarcodeApi } from '#/api/mes/wm/barcode';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { BarcodeBizTypeEnum, CommonStatusEnum } from '@vben/constants';

import { ElMessage } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import {
  createBarcode,
  getBarcode,
  updateBarcode,
} from '#/api/mes/wm/barcode';
import { getWarehouseArea } from '#/api/mes/wm/warehouse/area';
import { getWarehouseLocation } from '#/api/mes/wm/warehouse/location';
import { $t } from '#/locales';

import { useFormSchema } from '../data';

const emit = defineEmits(['success']);

const formData = ref<MesWmBarcodeApi.Barcode>();

const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['条码'])
    : $t('ui.actionTitle.create', ['条码']);
});

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    formItemClass: 'col-span-2',
    labelWidth: 110,
  },
  layout: 'horizontal',
  schema: [],
  showDefaultActions: false,
});

/** 加载级联选择器的数据（编辑时回填上级仓库/库区） */
async function loadCascadeData(data: MesWmBarcodeApi.Barcode) {
  if (!data.bizType || !data.bizId) {
    return;
  }
  if (data.bizType === BarcodeBizTypeEnum.LOCATION) {
    const location = await getWarehouseLocation(data.bizId);
    if (location?.warehouseId) {
      await formApi.setFieldValue('locationWarehouseId', location.warehouseId);
    }
  } else if (data.bizType === BarcodeBizTypeEnum.AREA) {
    const area = await getWarehouseArea(data.bizId);
    await formApi.setValues({
      areaWarehouseId: area?.warehouseId,
      areaLocationId: area?.locationId,
    });
  }
}

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    modalApi.lock();
    // 提交表单
    const data = (await formApi.getValues()) as MesWmBarcodeApi.Barcode;
    try {
      await (formData.value?.id
        ? updateBarcode({ ...data, id: formData.value.id })
        : createBarcode(data));
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
    formApi.setState({ schema: useFormSchema(formApi) });
    await formApi.setValues({ status: CommonStatusEnum.ENABLE });
    // 加载数据
    const data = modalApi.getData<MesWmBarcodeApi.Barcode>();
    if (!data || !data.id) {
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getBarcode(data.id);
      // 设置到 values
      await formApi.setValues(formData.value);
      await loadCascadeData(formData.value);
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-1/2">
    <Form class="mx-4" />
  </Modal>
</template>
