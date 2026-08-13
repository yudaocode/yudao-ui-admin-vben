<script lang="ts" setup>
import type { FmsVoucherWordApi } from '#/api/fms/config/voucher-word';
import type { FmsVoucherApi } from '#/api/fms/voucher';

import { useVbenForm, useVbenModal } from '@vben/common-ui';

import { message } from 'antdv-next';

import { moveVoucher } from '#/api/fms/voucher';

import { useMoveFormSchema } from '../data';

defineOptions({ name: 'FmsVoucherMoveForm' });

const emit = defineEmits<{ success: [] }>();

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
  },
  layout: 'horizontal',
  schema: useMoveFormSchema(),
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
        sourceNumber: undefined,
        targetNumber: undefined,
      });
    } finally {
      modalApi.setState({ loading: false });
    }
  },
});

/** 提交凭证移动 */
async function submitForm() {
  const { valid } = await formApi.validate();
  if (!valid) return;
  const values = await formApi.getValues();
  // 移动到的凭证号必须小于原凭证号，校验逻辑对齐源项目
  if (values.targetNumber >= values.sourceNumber) {
    message.warning('移动到的凭证号必须小于原凭证号');
    return;
  }
  const data = modalApi.getData<{ accountSetId: number }>();
  modalApi.lock();
  try {
    const params: FmsVoucherApi.MoveReq = {
      accountSetId: data.accountSetId,
      month: values.month,
      voucherWordId: values.voucherWordId,
      sourceNumber: values.sourceNumber,
      targetNumber: values.targetNumber,
    };
    await moveVoucher(params);
    message.success('移动成功');
    modalApi.close();
    // 发送操作成功的事件
    emit('success');
  } finally {
    modalApi.unlock();
  }
}
</script>

<template>
  <Modal title="移动凭证" class="w-[480px]">
    <Form />
  </Modal>
</template>
