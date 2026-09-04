<script lang="ts" setup>
import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { ElMessage } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import {
  createSalaryGroup,
  getSalaryGroup,
  updateSalaryGroup,
} from '#/api/hrm/salary/config/group';
import { $t } from '#/locales';

import { useFormSchema } from '../data';

defineOptions({ name: 'HrmSalaryGroupForm' });

const emit = defineEmits(['success']);
const formType = ref<'create' | 'update'>('create');

const [Form, formApi] = useVbenForm({
  commonConfig: { componentProps: { class: 'w-full' }, labelWidth: 104 },
  layout: 'horizontal',
  schema: useFormSchema(),
  showDefaultActions: false,
  wrapperClass: 'grid-cols-1 md:grid-cols-2',
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;
    modalApi.lock();
    try {
      const values = await formApi.getValues();
      await (formType.value === 'create'
        ? createSalaryGroup(values as any)
        : updateSalaryGroup(values as any));
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
        ['薪资组'],
      ),
    });
    await formApi.reset();
    await formApi.setValues(
      id
        ? await getSalaryGroup(id)
        : { deptIds: [], employeeIds: [], name: '', taxRuleId: undefined },
    );
  },
});
</script>

<template>
  <Modal class="w-[860px]">
    <Form class="mx-4" />
    <div class="mx-4 grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
      <div>
        <span class="text-muted-foreground">计薪标准：</span>21.75 天 / 月
      </div>
      <div>
        <span class="text-muted-foreground">调薪规则：</span>
        按转正、调薪生效日前后的工资混合计算
      </div>
    </div>
  </Modal>
</template>
