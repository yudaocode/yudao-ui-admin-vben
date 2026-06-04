<script lang="ts" setup>
import type { DataRuleApi } from '#/api/iot/rule/data/rule';

import { computed, nextTick, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import {
  createDataRule,
  getDataRule,
  updateDataRule,
} from '#/api/iot/rule/data/rule';
import { $t } from '#/locales';

import { useRuleFormSchema } from '../data';
import SourceConfigForm from './source-config-form.vue';

const emit = defineEmits(['success']);
const formData = ref<DataRuleApi.DataRule>();
const sourceConfigRef = ref<InstanceType<typeof SourceConfigForm>>();
const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['数据规则'])
    : $t('ui.actionTitle.create', ['数据规则']);
});

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    formItemClass: 'col-span-2',
    labelWidth: 100,
  },
  layout: 'horizontal',
  schema: useRuleFormSchema(),
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    // 校验数据源配置
    try {
      await sourceConfigRef.value?.validate();
    } catch {
      return;
    }
    modalApi.lock();
    // 提交表单
    const data = (await formApi.getValues()) as DataRuleApi.DataRule;
    data.sourceConfigs = sourceConfigRef.value?.getData() || [];
    try {
      await (formData.value?.id ? updateDataRule(data) : createDataRule(data));
      // 关闭并提示
      await modalApi.close();
      emit('success');
      message.success($t('ui.actionMessage.operationSuccess'));
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      formData.value = undefined;
      sourceConfigRef.value?.setData([]);
      return;
    }
    // 加载数据
    const data = modalApi.getData<DataRuleApi.DataRule>();
    if (!data || !data.id) {
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getDataRule(data.id);
      // 设置到 values
      await formApi.setValues(formData.value);
      // 设置数据源配置
      await nextTick();
      sourceConfigRef.value?.setData(formData.value.sourceConfigs || []);
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal class="w-4/5" :title="getTitle">
    <Form class="mx-4" />
    <div class="mx-4 mt-4">
      <div class="mb-2 text-sm font-medium">数据源配置</div>
      <SourceConfigForm ref="sourceConfigRef" />
    </div>
  </Modal>
</template>
