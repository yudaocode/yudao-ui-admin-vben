<script lang="ts" setup>
import type { FmsVoucherWordApi } from '#/api/fms/config/voucher-word';
import type { FmsVoucherApi } from '#/api/fms/voucher';

import { useVbenForm, useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { tidyVoucher } from '#/api/fms/voucher';
import { FMS_VOUCHER_TIDY_TYPE } from '#/views/fms/utils/constants';

import { useTidyFormSchema } from '../data';

defineOptions({ name: 'FmsVoucherTidyForm' });

const emit = defineEmits<{ success: [] }>();

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
  },
  layout: 'horizontal',
  schema: useTidyFormSchema(),
  showDefaultActions: false,
  wrapperClass: 'grid-cols-1',
});

const [Modal, modalApi] = useVbenModal({
  onConfirm: submitForm,
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) return;
    const data = modalApi.getData<{
      accountSetId: number;
      defaultMonth: string;
      voucherWords: FmsVoucherWordApi.VoucherWord[];
    }>();
    modalApi.setState({ loading: true });
    try {
      await formApi.updateSchema([
        {
          fieldName: 'voucherWordId',
          componentProps: {
            options: data.voucherWords,
            placeholder: '请选择凭证字',
          },
        },
      ]);
      await formApi.setValues({
        month: data.defaultMonth,
        voucherWordId:
          data.voucherWords.find((item) => item.defaultStatus)?.id ||
          data.voucherWords[0]?.id,
        startNumber: 1,
        type: FMS_VOUCHER_TIDY_TYPE.FILL_GAPS,
      });
    } finally {
      modalApi.setState({ loading: false });
    }
  },
});

/** 提交凭证整理 */
async function submitForm() {
  const { valid } = await formApi.validate();
  if (!valid) return;
  const data = modalApi.getData<{ accountSetId: number }>();
  const values = await formApi.getValues();
  modalApi.lock();
  try {
    const params: FmsVoucherApi.TidyReq = {
      accountSetId: data.accountSetId,
      month: values.month,
      voucherWordId: values.voucherWordId,
      startNumber: values.startNumber,
      type: values.type,
    };
    await tidyVoucher(params);
    message.success('整理成功');
    modalApi.close();
    // 发送操作成功的事件
    emit('success');
  } finally {
    modalApi.unlock();
  }
}
</script>

<template>
  <Modal title="整理凭证" class="w-[500px]">
    <Form />
  </Modal>
</template>
