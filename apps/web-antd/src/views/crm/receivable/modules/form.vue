<script lang="ts" setup>
import type { CrmReceivableApi } from '#/api/crm/receivable';

import { computed, ref } from 'vue';

import { useVbenForm, useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { getContractSimpleList } from '#/api/crm/contract';
import {
  createReceivable,
  getReceivable,
  updateReceivable,
} from '#/api/crm/receivable';
import { $t } from '#/locales';

import { useFormSchema } from '../data';

type ReceivablePrefillData = Partial<
  Pick<
    CrmReceivableApi.Receivable,
    'contractId' | 'customerId' | 'price' | 'returnType'
  >
> & { id?: number };

type ReceivableFormModalData = ReceivablePrefillData & {
  plan?: ReceivablePrefillData;
  receivable?: Pick<CrmReceivableApi.Receivable, 'id'>;
};

const emit = defineEmits(['success']);
const formData = ref<Partial<CrmReceivableApi.Receivable>>();
const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['回款'])
    : $t('ui.actionTitle.create', ['回款']);
});

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
  },
  wrapperClass: 'grid-cols-2',
  layout: 'horizontal',
  schema: useFormSchema(),
  showDefaultActions: false,
});

/** 构建新增回款的预填表单 */
async function buildCreateFormData(
  plan: ReceivablePrefillData,
): Promise<Partial<CrmReceivableApi.Receivable>> {
  const values: Partial<CrmReceivableApi.Receivable> = {
    contractId: plan?.contractId,
    customerId: plan?.customerId,
  };
  // 从回款计划创建时，直接继承计划的期数、金额和回款方式
  if (plan?.id) {
    values.planId = plan.id;
    values.price = plan.price;
    values.returnType = plan.returnType;
    return values;
  }
  // 从客户/合同详情创建时，没有计划期数，按合同剩余应回款金额预填
  if (values.customerId && values.contractId) {
    const contracts = await getContractSimpleList(values.customerId);
    const contract = contracts.find((item) => item.id === values.contractId);
    if (contract) {
      values.price = contract.totalPrice - contract.totalReceivablePrice;
    }
  }
  return values;
}

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    modalApi.lock();
    // 提交表单
    const data = (await formApi.getValues()) as CrmReceivableApi.Receivable;
    try {
      await (formData.value?.id
        ? updateReceivable(data)
        : createReceivable(data));
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
    formData.value = undefined;
    await formApi.resetForm();
    const data = modalApi.getData() as null | ReceivableFormModalData;
    if (!data) {
      return;
    }
    const { receivable } = data;
    const plan =
      data.plan ?? (data.customerId || data.contractId ? data : undefined);
    modalApi.lock();
    try {
      if (receivable?.id) {
        formData.value = await getReceivable(receivable.id!);
      } else if (plan) {
        formData.value = await buildCreateFormData(plan);
      }
      if (formData.value) {
        // 设置到 values
        await formApi.setValues(formData.value as any);
      }
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-2/5">
    <Form class="mx-4" />
  </Modal>
</template>
