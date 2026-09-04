<script lang="ts" setup>
import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { ElMessage } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import {
  createSalaryChangeTemplate,
  getSalaryChangeTemplate,
  updateSalaryChangeTemplate,
} from '#/api/hrm/salary/config/change-template';
import { getSalaryOptionSimpleList } from '#/api/hrm/salary/config/option';
import { $t } from '#/locales';

import { useFormSchema } from '../data';

defineOptions({ name: 'HrmSalaryChangeTemplateForm' });

const emit = defineEmits(['success']);
const formType = ref<'create' | 'update'>('create');

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
      const values = await formApi.getValues();
      await (formType.value === 'create'
        ? createSalaryChangeTemplate(values as any)
        : updateSalaryChangeTemplate(values as any));
      ElMessage.success($t('ui.actionMessage.operationSuccess'));
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
        ['调薪模板'],
      ),
    });
    await formApi.reset();
    await formApi.setValues(
      id
        ? await getSalaryChangeTemplate(id)
        : {
            defaultStatus: false,
            name: '',
            options: await getSalaryOptionSimpleList(true),
          },
    );
  },
});
</script>

<template>
  <Modal class="w-[720px]">
    <Form class="mx-4" />
  </Modal>
</template>
