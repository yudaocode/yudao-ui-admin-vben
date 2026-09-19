<script lang="ts" setup>
import type { OaVehicleApi } from '#/api/oa/vehicle';
import type { OaVehicleApplyApi } from '#/api/oa/vehicle/apply';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'antdv-next';

import { useVbenForm } from '#/adapter/form';
import {
  createVehicleApply,
  getVehicleApply,
  updateVehicleApply,
} from '#/api/oa/vehicle/apply';
import { $t } from '#/locales';

import OaVehicleSelect from '../../components/select.vue';
import { useFormSchema } from '../data';

const emit = defineEmits(['success']);
const formData = ref<OaVehicleApplyApi.VehicleApply>();
const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['用车申请'])
    : $t('ui.actionTitle.create', ['用车申请']);
});

/** 编辑时回显的车辆 */
const selectedVehicle = computed(() => {
  if (formData.value?.vehicleId === undefined) {
    return undefined;
  }
  return {
    id: formData.value.vehicleId,
    no: formData.value.vehicleNo,
  };
});

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    labelWidth: 110,
  },
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
    // 校验预计回车时间晚于出车时间
    const data = (await formApi.getValues()) as OaVehicleApplyApi.VehicleApply;
    if (data.startTime! >= data.endTime!) {
      message.warning('预计回车时间必须晚于预计出车时间');
      return;
    }
    modalApi.lock();
    // 保存草稿，提交审批由列表单独操作
    try {
      await (formData.value?.id
        ? updateVehicleApply(data)
        : createVehicleApply(data));
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
    const data = modalApi.getData() as { id?: number };
    if (!data?.id) {
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getVehicleApply(data.id);
      // 设置到 values
      await formApi.setValues(formData.value);
    } finally {
      modalApi.unlock();
    }
  },
});

/** 回填选中的车牌号 */
function handleVehicleSelected(vehicle?: OaVehicleApi.Vehicle) {
  if (formData.value) {
    formData.value.vehicleNo = vehicle?.no;
  }
}
</script>

<template>
  <Modal :title="getTitle" class="w-2/3">
    <Form class="mx-4">
      <template #vehicleId="slotProps">
        <OaVehicleSelect
          :model-value="slotProps.componentField.modelValue"
          :selected-vehicle="selectedVehicle"
          @update:model-value="slotProps.componentField['onUpdate:modelValue']"
          @change="handleVehicleSelected"
        />
      </template>
    </Form>
  </Modal>
</template>
