<script lang="ts" setup>
import type { MallTradeConfigApi } from '#/api/mall/trade/config';

import { onMounted, ref } from 'vue';

import { DocAlert, Page } from '@vben/common-ui';

import { Card, message, Tabs } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { getTradeConfig, saveTradeConfig } from '#/api/mall/trade/config';
import { $t } from '#/locales';

import { useFormSchema } from './data';

const activeKey = ref('afterSale');
const formData = ref<MallTradeConfigApi.Config & { type?: string }>();

function handleTabChange(key: any) {
  activeKey.value = key;
  formData.value!.type = activeKey.value;
  formApi.setValues(formData.value!);
  formApi.updateSchema(useFormSchema());
}

async function loadConfig() {
  const res = await getTradeConfig();
  if (res) {
    formData.value = res;
    // 金额缩小
    formData.value.deliveryExpressFreePrice =
      formData.value.deliveryExpressFreePrice! / 100 || 0;
    formData.value.brokerageWithdrawMinPrice =
      formData.value.brokerageWithdrawMinPrice! / 100 || 0;
    formData.value!.type = activeKey.value;
    formApi.updateSchema(useFormSchema());
    await formApi.setValues(formData.value);
  }
}

async function onSubmit() {
  const { valid } = await formApi.validate();
  if (!valid) {
    return;
  }
  // 提交表单
  const data = (await formApi.getValues()) as MallTradeConfigApi.Config;
  formApi.setState({ commonConfig: { disabled: true } });
  try {
    await saveTradeConfig(data);
    message.success($t('ui.actionMessage.operationSuccess'));
  } finally {
    formApi.setState({ commonConfig: { disabled: false } });
  }
}

onMounted(() => {
  loadConfig();
});

const [Form, formApi] = useVbenForm({
  commonConfig: {
    // 所有表单项
    labelClass: 'w-2/6',
  },
  wrapperClass: 'grid-cols-1',
  actionWrapperClass: 'text-center',
  handleSubmit: onSubmit,
  layout: 'horizontal',
  resetButtonOptions: {
    show: false,
  },
  schema: useFormSchema(),
});
</script>

<template>
  <Page>
    <template #doc>
      <DocAlert
        title="【交易】交易订单"
        url="https://doc.iocoder.cn/mall/trade-order/"
      />
      <DocAlert
        title="【交易】购物车"
        url="https://doc.iocoder.cn/mall/trade-cart/"
      />
    </template>
    <Card>
      <Tabs :active-key="activeKey" @change="handleTabChange">
        <Tabs.TabPane tab="售后" key="afterSale" :force-render="true" />
        <Tabs.TabPane tab="配送" key="delivery" :force-render="true" />
        <Tabs.TabPane tab="分销" key="brokerage" :force-render="true" />
      </Tabs>
      <Form class="w-3/5" />
    </Card>
  </Page>
</template>
