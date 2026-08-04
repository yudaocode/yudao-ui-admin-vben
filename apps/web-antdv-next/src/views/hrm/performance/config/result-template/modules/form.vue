<script lang="ts" setup>
import type { HrmPerformanceResultTemplateApi } from '#/api/hrm/performance/config/result-template';

import { ref } from 'vue';

import { useVbenForm, useVbenModal } from '@vben/common-ui';

import { FormItem, message } from 'antdv-next';

import {
  createPerformanceResultTemplate,
  getPerformanceResultTemplate,
  updatePerformanceResultTemplate,
} from '#/api/hrm/performance/config/result-template';
import { $t } from '#/locales';

import LevelForm from '../components/level-form.vue';
import { useFormSchema } from '../data';

const emit = defineEmits(['success']);

const levels = ref<HrmPerformanceResultTemplateApi.ResultLevel[]>([]);
const levelFormRef = ref<InstanceType<typeof LevelForm>>();
const formType = ref<'create' | 'update'>('create');

const [FormComp, formApi] = useVbenForm({
  commonConfig: { componentProps: { class: 'w-full' }, labelWidth: 112 },
  layout: 'horizontal',
  schema: useFormSchema(),
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;
    if (!levelFormRef.value?.validate()) return;
    modalApi.lock();
    const values = await formApi.getValues();
    const data: HrmPerformanceResultTemplateApi.PerformanceResultTemplate = {
      ...values,
      name: values.name as string,
      levels: levels.value,
    };
    try {
      await (formType.value === 'create'
        ? createPerformanceResultTemplate(data)
        : updatePerformanceResultTemplate(data));
      await modalApi.close();
      emit('success');
      message.success($t('ui.actionMessage.operationSuccess'));
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) return;
    const payload = modalApi.getData<{
      id?: number;
      type: 'create' | 'update';
    }>();
    formType.value = payload?.type || 'create';
    if (payload?.id) {
      modalApi.lock();
      try {
        const detail = await getPerformanceResultTemplate(payload.id);
        levels.value = detail.levels || [];
        await formApi.setValues(detail);
      } finally {
        modalApi.unlock();
      }
    } else {
      levels.value = [
        { name: 'S', minScore: 85, maxScore: 100, coefficient: 1.2 },
        { name: 'A', minScore: 75, maxScore: 84.99, coefficient: 1 },
        { name: 'B', minScore: 60, maxScore: 74.99, coefficient: 0.8 },
        { name: 'C', minScore: 0, maxScore: 59.99, coefficient: 0.6 },
      ];
      await formApi.setValues({ name: '' });
    }
  },
});

function open(type: 'create' | 'update', id?: number) {
  modalApi.setData({ type, id }).open();
}

defineExpose({ open });
</script>

<template>
  <Modal
    :title="
      formType === 'create'
        ? $t('ui.actionTitle.create', ['考核结果设置'])
        : $t('ui.actionTitle.edit', ['考核结果设置'])
    "
    class="w-[920px]"
  >
    <FormComp class="mx-4" />
    <FormItem class="mx-4" label="结果等级" required>
      <LevelForm ref="levelFormRef" v-model="levels" />
    </FormItem>
  </Modal>
</template>
