<script lang="ts" setup>
import type { VbenFormSchema } from '#/adapter/form';
import type { CrmCustomerPoolConfigApi } from '#/api/crm/customer/poolConfig';

import { onMounted } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import {
  getCustomerPoolConfig,
  saveCustomerPoolConfig,
} from '#/api/crm/customer/poolConfig';
import { $t } from '#/locales';

const emit = defineEmits(['success']);

const schema: VbenFormSchema[] = [
  {
    component: 'RadioGroup',
    fieldName: 'enabled',
    label: '客户公海规则设置',
    componentProps: {
      options: [
        { label: '开启', value: true },
        { label: '关闭', value: false },
      ],
    },
  },
  {
    component: 'InputNumber',
    fieldName: 'contactExpireDays',
    componentProps: {
      min: 0,
      precision: 0,
    },
    renderComponentContent: () => ({
      addonAfter: () => '天不跟进或',
    }),
    dependencies: {
      triggerFields: ['enabled'],
      show: (value) => value.enabled,
    },
  },
  {
    component: 'InputNumber',
    fieldName: 'dealExpireDays',
    renderComponentContent: () => ({
      addonBefore: () => '或',
      addonAfter: () => '天未成交',
    }),
    componentProps: {
      min: 0,
      precision: 0,
    },
    dependencies: {
      triggerFields: ['enabled'],
      show: (value) => value.enabled,
    },
  },
  {
    component: 'RadioGroup',
    fieldName: 'notifyEnabled',
    label: '提前提醒设置',
    componentProps: {
      options: [
        { label: '开启', value: true },
        { label: '关闭', value: false },
      ],
    },
    dependencies: {
      triggerFields: ['enabled'],
      show: (value) => value.enabled,
    },
    defaultValue: false,
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
      show: (value) => value.enabled && value.notifyEnabled,
    },
  },
];

const [Form, formApi] = useVbenForm({
  commonConfig: {
    labelClass: 'w-2/6',
  },
  layout: 'horizontal',
  wrapperClass: 'grid-cols-1',
  actionWrapperClass: 'text-center',
  schema,
  handleSubmit,
});

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formApi.validate();
  if (!valid) {
    return;
  }
  // 提交表单
  const data =
    (await formApi.getValues()) as CrmCustomerPoolConfigApi.CustomerPoolConfig;
  if (!data.enabled) {
    data.contactExpireDays = undefined;
    data.dealExpireDays = undefined;
    data.notifyEnabled = false;
  }
  if (!data.notifyEnabled) {
    data.notifyDays = undefined;
  }
  await saveCustomerPoolConfig(data);
  // 关闭并提示
  await formApi.setValues(data);
  emit('success');
  message.success($t('ui.actionMessage.operationSuccess'));
}

/** 获取配置 */
async function getConfigInfo() {
  const res = await getCustomerPoolConfig();
  await formApi.setValues(res);
}

/** 初始化 */
onMounted(() => {
  getConfigInfo();
});
</script>

<template>
  <Page auto-content-height>
    <Card title="客户公海规则设置">
      <Form class="w-1/4" />
    </Card>
  </Page>
</template>
