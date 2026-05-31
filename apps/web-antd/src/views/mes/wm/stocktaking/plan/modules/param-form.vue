<script lang="ts" setup>
import type { MesWmStockTakingPlanParamApi } from '#/api/mes/wm/stocktaking/plan/param';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { MesWmStockTakingParamTypeEnum } from '@vben/constants';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import {
  createStockTakingPlanParam,
  getStockTakingPlanParam,
  updateStockTakingPlanParam,
} from '#/api/mes/wm/stocktaking/plan/param';
import { $t } from '#/locales';

import { useParamFormSchema } from '../data';

const emit = defineEmits(['success']);
const formId = ref<number>(); // 当前编辑的条件编号
const planId = ref<number>(); // 所属盘点方案编号

const getTitle = computed(() =>
  formId.value
    ? $t('ui.actionTitle.edit', ['盘点条件'])
    : $t('ui.actionTitle.create', ['盘点条件']),
);

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
  },
  layout: 'horizontal',
  schema: [],
  showDefaultActions: false,
  wrapperClass: 'grid-cols-1',
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    const values =
      (await formApi.getValues()) as MesWmStockTakingPlanParamApi.StockTakingPlanParam;
    // 质量状态校验 valueCode，其余类型校验 valueId
    const valueValid =
      values.type === MesWmStockTakingParamTypeEnum.QUALITY_STATUS
        ? !!values.valueCode
        : values.valueId != null;
    if (!valueValid) {
      message.warning('请选择条件值');
      return;
    }
    modalApi.lock();
    // 提交表单
    const data = {
      ...values,
      id: formId.value,
      planId: planId.value,
    } as MesWmStockTakingPlanParamApi.StockTakingPlanParam;
    try {
      await (formId.value
        ? updateStockTakingPlanParam(data)
        : createStockTakingPlanParam(data));
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
      formId.value = undefined;
      return;
    }
    formApi.setState({ schema: useParamFormSchema(formApi) });
    // 加载数据
    const data = modalApi.getData<{ id?: number; planId: number }>();
    planId.value = data.planId;
    formId.value = data.id;
    if (!data.id) {
      return;
    }
    modalApi.lock();
    try {
      const param = await getStockTakingPlanParam(data.id);
      // 设置到 values
      await formApi.setValues(param);
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-3/5">
    <Form class="mx-4" />
  </Modal>
</template>
