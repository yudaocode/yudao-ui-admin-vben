<script lang="ts" setup>
import type { HrmSalaryChangeTemplateApi } from '#/api/hrm/salary/config/change-template';

import { computed, nextTick, reactive, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { ElMessage } from 'element-plus';

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

const formRules = reactive({
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
      ElMessage.success($t('ui.actionMessage.operationSuccess'));
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
    <ElForm
      ref="formRef"
      :model="formData"
      :rules="formRules"
      class="mx-4"
      label-width="96px"
    >
      <ElFormItem label="模板名称" name="name">
        <ElInput
          v-model="formData.name"
          maxlength="64"
          placeholder="请输入模板名称"
        />
      </ElFormItem>
      <ElFormItem label="默认模板" name="defaultStatus">
        <ElSwitch v-model="formData.defaultStatus" />
      </ElFormItem>
      <ElFormItem label="调薪项" name="options">
        <ChangeOptionSelect ref="optionSelectRef" v-model="formData.options" />
      </ElFormItem>
    </ElForm>
  </Modal>
</template>
