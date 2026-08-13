<script lang="ts" setup>
import type { FmsFinanceIndicatorApi } from '#/api/fms/config/finance-indicator';

import { computed, ref } from 'vue';

import { useVbenForm, useVbenModal } from '@vben/common-ui';
import { CommonStatusEnum } from '@vben/constants';

import { ElMessage } from 'element-plus';

import {
  createFinanceIndicator,
  getFinanceIndicator,
  updateFinanceIndicator,
} from '#/api/fms/config/finance-indicator';
import { $t } from '#/locales';
import { FMS_FINANCE_INDICATOR_TYPE } from '#/views/fms/utils/constants';

import { useFormSchema } from '../data';

const emit = defineEmits(['success']);

const formData = ref<FmsFinanceIndicatorApi.FinanceIndicator>();
const getTitle = computed(() =>
  formData.value?.id
    ? $t('ui.actionTitle.edit', ['财务指标'])
    : $t('ui.actionTitle.create', ['财务指标']),
);

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    labelWidth: 92,
  },
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
    const values = await formApi.getValues();
    const data: FmsFinanceIndicatorApi.FinanceIndicator = {
      id: values.id,
      accountSetId: values.accountSetId,
      name: values.name,
      code: values.code,
      type: values.type,
      formula: values.formula,
      sort: values.sort,
      status: values.status,
    };
    try {
      await (formData.value?.id
        ? updateFinanceIndicator(data)
        : createFinanceIndicator(data));
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
    const data = modalApi.getData<{ accountSetId: number; id?: number }>();
    if (!data?.id) {
      // 新增：账套编号由列表页传入，其余字段使用业务默认值
      await formApi.setValues({
        accountSetId: data.accountSetId,
        name: '',
        code: '',
        type: FMS_FINANCE_INDICATOR_TYPE.INCOME_STATEMENT,
        formula: 'L1',
        sort: 10,
        status: CommonStatusEnum.ENABLE,
      });
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getFinanceIndicator(data.accountSetId, data.id);
      await formApi.setValues(formData.value);
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-[620px]">
    <Form class="mx-4" />
  </Modal>
</template>
