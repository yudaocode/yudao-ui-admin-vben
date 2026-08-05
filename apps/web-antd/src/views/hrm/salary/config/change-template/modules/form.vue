<script lang="ts" setup>
import type { Rule } from 'ant-design-vue/es/form';

import type { HrmSalaryChangeTemplateApi } from '#/api/hrm/salary/config/change-template';

import { computed, nextTick, reactive, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Form, Input, message, Switch } from 'ant-design-vue';

import {
  createSalaryChangeTemplate,
  getSalaryChangeTemplate,
  updateSalaryChangeTemplate,
} from '#/api/hrm/salary/config/change-template';
import { $t } from '#/locales';

import ChangeOptionSelect from '../../option/components/change-option-select.vue';

defineOptions({ name: 'HrmSalaryChangeTemplateForm' });

const emit = defineEmits(['success']);

const formType = ref<'create' | 'update'>('create');
const formRef = ref();
const optionSelectRef = ref<InstanceType<typeof ChangeOptionSelect>>();
const formData =
  ref<HrmSalaryChangeTemplateApi.SalaryChangeTemplate>(createDefault());

const dialogTitle = computed(() =>
  formType.value === 'create'
    ? $t('ui.actionTitle.create', ['调薪模板'])
    : $t('ui.actionTitle.edit', ['调薪模板']),
);

const formRules = reactive<Record<string, Rule[]>>({
  name: [{ required: true, message: '模板名称不能为空', trigger: 'blur' }],
});

function createDefault(): HrmSalaryChangeTemplateApi.SalaryChangeTemplate {
  return { name: '', defaultStatus: false, options: [] };
}

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    await formRef.value?.validate();
    modalApi.lock();
    try {
      await (formType.value === 'create'
        ? createSalaryChangeTemplate(formData.value)
        : updateSalaryChangeTemplate(formData.value));
      message.success($t('ui.actionMessage.operationSuccess'));
      await modalApi.close();
      emit('success');
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      formData.value = createDefault();
      return;
    }
    const data = modalApi.getData<{ id?: number; type: 'create' | 'update' }>();
    formType.value = data?.type || 'create';
    formData.value = data?.id
      ? await getSalaryChangeTemplate(data.id)
      : createDefault();
    await nextTick();
    await optionSelectRef.value?.init(formType.value === 'create');
  },
});
</script>

<template>
  <Modal :title="dialogTitle" class="w-[720px]">
    <Form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      class="mx-4"
      label-width="96px"
    >
      <Form.Item label="模板名称" name="name">
        <Input
          v-model:value="formData.name"
          :maxlength="64"
          placeholder="请输入模板名称"
        />
      </Form.Item>
      <Form.Item label="默认模板" name="defaultStatus">
        <Switch v-model:checked="formData.defaultStatus" />
      </Form.Item>
      <Form.Item label="调薪项" name="options">
        <ChangeOptionSelect ref="optionSelectRef" v-model="formData.options" />
      </Form.Item>
    </Form>
  </Modal>
</template>
