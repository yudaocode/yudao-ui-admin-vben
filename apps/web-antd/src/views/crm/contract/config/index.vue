<script lang="ts" setup>
import type { CrmContractConfigApi } from '#/api/crm/contract/config';

import { onMounted } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import {
  getContractConfig,
  saveContractConfig,
} from '#/api/crm/contract/config';
import { $t } from '#/locales';

const emit = defineEmits(['success']);

const [Form, formApi] = useVbenForm({
  commonConfig: {
    // 所有表单项
    labelClass: 'w-2/6',
  },
  layout: 'horizontal',
  wrapperClass: 'grid-cols-1',
  actionWrapperClass: 'text-center',
  schema: [
    {
      component: 'RadioGroup',
      fieldName: 'notifyEnabled',
      label: '提前提醒设置',
      componentProps: {
        options: [
          { label: '提醒', value: true },
          { label: '不提醒', value: false },
        ],
      },
    },
    {
      component: 'InputNumber',
      fieldName: 'notifyDays',
      componentProps: {
        min: 0,
        precision: 0,
      },
      renderComponentContent: () => ({
        addonBefore: () => '提前',
        addonAfter: () => '天提醒',
      }),
      dependencies: {
        triggerFields: ['notifyEnabled'],
        trigger(values) {
          values.notifyDays = undefined;
        },
        show: (value) => value.notifyEnabled,
      },
    },
  ],
  // 提交函数
  handleSubmit: onSubmit,
});

async function onSubmit() {
  const { valid } = await formApi.validate();
  if (!valid) {
    return;
  }
  // 提交表单
  const data = (await formApi.getValues()) as CrmContractConfigApi.Config;
  if (!data.notifyEnabled) {
    data.notifyDays = undefined;
  }
  formApi.setValues(data);
  try {
    await saveContractConfig(data);
    // 关闭并提示
    emit('success');
    message.success($t('ui.actionMessage.operationSuccess'));
  } finally {
    formApi.setValues(data);
  }
}

async function getConfigInfo() {
  try {
    const res = await getContractConfig();
    formApi.setValues(res);
  } catch (error) {
    console.error(error);
  }
}

onMounted(() => {
  getConfigInfo();
});
</script>

<template>
  <Page auto-content-height>
    <Card title="合同配置设置">
      <Form class="w-1/4" />
    </Card>
  </Page>
</template>
