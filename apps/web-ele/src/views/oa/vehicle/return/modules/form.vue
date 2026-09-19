<script lang="ts" setup>
import type { OaVehicleApplyApi } from '#/api/oa/vehicle/apply';
import type { OaVehicleReturnApi } from '#/api/oa/vehicle/return';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { BpmProcessInstanceStatus } from '@vben/constants';
import { formatDateTime } from '@vben/utils';

import { ElMessage } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import { getVehicleApply } from '#/api/oa/vehicle/apply';
import {
  createVehicleReturn,
  getVehicleReturn,
  updateVehicleReturn,
} from '#/api/oa/vehicle/return';
import { $t } from '#/locales';
import { OA_VEHICLE_RETURN_STATUS } from '#/views/oa/utils/constants';

import OaVehicleApplySelect from '../../apply/components/apply-select.vue';
import { useFormSchema } from '../data';

const emit = defineEmits(['success']);
const formData = ref<OaVehicleReturnApi.VehicleReturn>();
const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['还车申请'])
    : $t('ui.actionTitle.create', ['还车申请']);
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
    modalApi.lock();
    // 提交表单
    const data = (await formApi.getValues()) as OaVehicleReturnApi.VehicleReturn;
    try {
      await (formData.value?.id
        ? updateVehicleReturn(data)
        : createVehicleReturn(data));
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
    const data = modalApi.getData() as { applyId?: number; id?: number };
    if (data?.id) {
      modalApi.lock();
      try {
        formData.value = await getVehicleReturn(data.id);
        // 设置到 values
        await formApi.setValues(formData.value);
      } finally {
        modalApi.unlock();
      }
    } else if (data?.applyId) {
      // 从用车申请发起还车时，回填关联申请及计划值
      const apply = await getVehicleApply(data.applyId);
      await formApi.setValues({ applyId: data.applyId });
      await handleApplyChange(apply);
    }
  },
});

/** 切换申请时带入计划值，还车人可按实际行程修改 */
async function handleApplyChange(apply?: OaVehicleApplyApi.VehicleApply) {
  await formApi.setValues({
    actualStartTime: apply?.startTime
      ? formatDateTime(apply.startTime)
      : undefined,
    startLocation: apply?.startLocation || '',
    reason: apply?.reason || '',
    passenger: apply?.passenger || '',
  });
}
</script>

<template>
  <Modal :title="getTitle" class="w-2/3">
    <Form class="mx-4">
      <template #applyId="slotProps">
        <OaVehicleApplySelect
          :model-value="slotProps.componentField.modelValue"
          :status="BpmProcessInstanceStatus.APPROVE"
          :return-status="OA_VEHICLE_RETURN_STATUS.PENDING_RETURN"
          class="w-full"
          @change="handleApplyChange"
          @update:model-value="slotProps.componentField['onUpdate:modelValue']"
        />
      </template>
    </Form>
  </Modal>
</template>
