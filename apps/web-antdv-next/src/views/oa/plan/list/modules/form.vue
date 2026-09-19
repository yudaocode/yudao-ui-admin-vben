<script lang="ts" setup>
import type { OaPlanApi } from '#/api/oa/plan';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'antdv-next';
import dayjs from 'dayjs';

import { useVbenForm } from '#/adapter/form';
import { createPlan, getPlan, updatePlan } from '#/api/oa/plan';
import { $t } from '#/locales';
import { OA_PLAN_TYPE } from '#/views/oa/utils/constants';

import { useFormSchema } from '../data';

const emit = defineEmits(['success']);
const formData = ref<OaPlanApi.Plan>();
const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['工作计划'])
    : $t('ui.actionTitle.create', ['工作计划']);
});

let syncingPeriod = false;

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    labelWidth: 80,
  },
  wrapperClass: 'grid-cols-2',
  layout: 'horizontal',
  schema: useFormSchema(),
  showDefaultActions: false,
  async handleValuesChange(values, changedFields) {
    // 切换计划类型时，按日、周、月初始化计划周期
    if (!syncingPeriod && changedFields.includes('type')) {
      await initPlanPeriod(values.type);
    }
  },
});

/** 按日、周、月计划初始化周期，用户仍可手动调整起止时间 */
async function initPlanPeriod(type: number) {
  const beginTime = dayjs().second(0).millisecond(0);
  const endTime =
    type === OA_PLAN_TYPE.DAY
      ? beginTime.add(1, 'day')
      : type === OA_PLAN_TYPE.WEEK
        ? beginTime.add(7, 'day')
        : beginTime.add(1, 'month');
  syncingPeriod = true;
  try {
    await formApi.setValues({
      startTime: beginTime.valueOf(),
      endTime: endTime.valueOf(),
    });
  } finally {
    syncingPeriod = false;
  }
}

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    // 校验计划时间
    const data = (await formApi.getValues()) as OaPlanApi.Plan;
    if (Number(data.endTime) <= Number(data.startTime)) {
      message.error('结束时间必须晚于开始时间');
      return;
    }
    modalApi.lock();
    // 提交表单
    try {
      await (formData.value?.id ? updatePlan(data) : createPlan(data));
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
    const data = modalApi.getData() as OaPlanApi.Plan;
    if (!data || !data.id) {
      // 新增时，按默认计划类型初始化周期
      await initPlanPeriod(OA_PLAN_TYPE.DAY);
      return;
    }
    modalApi.lock();
    // 编辑加载数据期间不触发计划周期初始化，避免覆盖已保存的起止时间
    syncingPeriod = true;
    try {
      formData.value = await getPlan(data.id);
      // 设置到 values
      await formApi.setValues(formData.value);
    } finally {
      syncingPeriod = false;
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
