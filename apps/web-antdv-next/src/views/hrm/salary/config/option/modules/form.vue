<script lang="ts" setup>
import { useVbenModal } from '@vben/common-ui';

import { message } from 'antdv-next';

import { useVbenForm } from '#/adapter/form';
import {
  createSalaryOption,
  getSalaryOptionList,
} from '#/api/hrm/salary/config/option';
import { $t } from '#/locales';
import { HrmSalaryOptionCategoryCode } from '#/views/hrm/utils/constants';

import { useFormSchema } from '../data';

defineOptions({ name: 'HrmSalaryOptionForm' });

const emit = defineEmits(['success']);

const [Form, formApi] = useVbenForm({
  commonConfig: { componentProps: { class: 'w-full' }, labelWidth: 96 },
  layout: 'horizontal',
  schema: useFormSchema(),
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;
    modalApi.lock();
    try {
      await createSalaryOption((await formApi.getValues()) as any);
      message.success($t('ui.actionMessage.operationSuccess'));
      await modalApi.close();
      emit('success');
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen) {
    if (!isOpen) return;
    const { parentCode } = modalApi.getData() as { parentCode?: number };
    const options = await getSalaryOptionList();
    const categories = options.filter(
      (item) =>
        item.parentCode === HrmSalaryOptionCategoryCode.ROOT &&
        !item.systemFlag &&
        item.enabled,
    );
    formApi.updateSchema([
      {
        fieldName: 'parentCode',
        componentProps: {
          disabled: true,
          options: categories.map((item) => ({
            label: item.name,
            value: item.code,
          })),
          placeholder: '请选择工资项分类',
        },
      },
    ]);
    await formApi.reset();
    await formApi.setValues({ name: '', parentCode, remark: '' });
  },
});
</script>

<template>
  <Modal :title="$t('ui.actionTitle.create', ['工资项'])" class="w-[560px]">
    <Form class="mx-4" />
  </Modal>
</template>
