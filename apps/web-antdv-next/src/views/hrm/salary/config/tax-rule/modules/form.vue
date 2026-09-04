<script lang="ts" setup>
import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'antdv-next';

import { useVbenForm } from '#/adapter/form';
import {
  createSalaryTaxRule,
  getSalaryTaxRule,
  updateSalaryTaxRule,
} from '#/api/hrm/salary/config/tax-rule';
import { $t } from '#/locales';
import {
  HrmSalaryTaxCycleType,
  HrmSalaryTaxType,
} from '#/views/hrm/utils/constants';

import { useFormSchema } from '../data';

defineOptions({ name: 'HrmSalaryTaxRuleForm' });

const emit = defineEmits(['success']);
const formType = ref<'create' | 'update'>('create');

const [Form, formApi] = useVbenForm({
  commonConfig: { componentProps: { class: 'w-full' }, labelWidth: 96 },
  layout: 'horizontal',
  schema: useFormSchema(),
  showDefaultActions: false,
  wrapperClass: 'grid-cols-1 md:grid-cols-2',
  handleValuesChange(values, fieldsChanged) {
    if (!fieldsChanged.includes('type')) return;
    if (values.type === HrmSalaryTaxType.SALARY) {
      formApi.setValues({
        cycleType: HrmSalaryTaxCycleType.JANUARY_TO_DECEMBER,
        decimalScale: 2,
        taxEnabled: true,
        threshold: 5000,
      });
    } else if (values.type === HrmSalaryTaxType.REMUNERATION) {
      formApi.setValues({
        cycleType: undefined,
        decimalScale: 2,
        taxEnabled: true,
        threshold: 800,
      });
    } else {
      formApi.setValues({
        cycleType: undefined,
        decimalScale: undefined,
        taxEnabled: false,
        threshold: 0,
      });
    }
  },
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;
    modalApi.lock();
    try {
      const values = await formApi.getValues();
      await (formType.value === 'create'
        ? createSalaryTaxRule(values as any)
        : updateSalaryTaxRule(values as any));
      message.success($t('ui.actionMessage.operationSuccess'));
      await modalApi.close();
      emit('success');
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen) {
    if (!isOpen) return;
    const { id, type = 'create' } = modalApi.getData() as {
      id?: number;
      type?: 'create' | 'update';
    };
    formType.value = type;
    modalApi.setState({
      title: $t(
        type === 'create' ? 'ui.actionTitle.create' : 'ui.actionTitle.edit',
        ['计税规则'],
      ),
    });
    await formApi.reset();
    await formApi.setValues(
      id
        ? await getSalaryTaxRule(id)
        : {
            cycleType: HrmSalaryTaxCycleType.JANUARY_TO_DECEMBER,
            decimalScale: 2,
            name: '',
            taxEnabled: true,
            threshold: 5000,
            type: HrmSalaryTaxType.SALARY,
          },
    );
  },
});
</script>

<template>
  <Modal class="w-[620px]">
    <Form class="mx-4" />
  </Modal>
</template>
