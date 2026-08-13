<script lang="ts" setup>
import type { FmsAccountSetApi } from '#/api/fms/config/account-set';

import { ref } from 'vue';

import { useVbenForm, useVbenModal } from '@vben/common-ui';

import dayjs from 'dayjs';
import { ElAlert, ElMessage } from 'element-plus';

import { initializeAccountSet } from '#/api/fms/config/account-set';
import {
  FMS_ACCOUNTING_STANDARD_OPTIONS,
  FMS_CURRENCY_CODE,
  FMS_DEFAULT_SUBJECT_CODE_RULE,
  FMS_DEFAULT_SUBJECT_LEVEL,
  FMS_LEDGER_BALANCE_MODE,
} from '#/views/fms/utils/constants';

import { useInitializeFormSchema } from '../data';

defineOptions({ name: 'FmsAccountSetInitializeForm' });

const emit = defineEmits<{ success: [] }>();
const accountSet = ref<FmsAccountSetApi.AccountSet>(); // 当前账套

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    labelWidth: 104,
  },
  layout: 'horizontal',
  schema: useInitializeFormSchema(),
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid || !accountSet.value?.id) {
      return;
    }
    modalApi.lock();
    const values = await formApi.getValues();
    const data: FmsAccountSetApi.InitializeReq = {
      accountSetId: accountSet.value.id,
      currencyCode: values.currencyCode,
      startTime: Number(values.startTime),
      standard: values.standard,
      level: values.level,
      subjectCodeRule: values.subjectCodeRule,
      ledgerBalanceMode: values.ledgerBalanceMode,
    };
    try {
      await initializeAccountSet(data);
      ElMessage.success('账套初始化成功');
      await modalApi.close();
      emit('success');
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      accountSet.value = undefined;
      return;
    }
    accountSet.value = modalApi.getData<FmsAccountSetApi.AccountSet>();
    await formApi.setValues({
      companyName: accountSet.value?.companyName,
      currencyCode: FMS_CURRENCY_CODE.RMB,
      startTime: dayjs().startOf('month').valueOf(),
      standard: FMS_ACCOUNTING_STANDARD_OPTIONS[0].value,
      level: FMS_DEFAULT_SUBJECT_LEVEL,
      subjectCodeRule: FMS_DEFAULT_SUBJECT_CODE_RULE,
      ledgerBalanceMode: FMS_LEDGER_BALANCE_MODE.SAME_AS_SUBJECT,
    });
  },
});
</script>

<template>
  <Modal title="开始记账" class="w-[640px]" confirm-text="开始记账">
    <Form class="mx-4" />
    <ElAlert
      class="mx-4"
      type="info"
      show-icon
      :closable="false"
      title="初始化后将建立本位币、财务参数和默认凭证字，启用期间不可随意变更"
    />
  </Modal>
</template>
