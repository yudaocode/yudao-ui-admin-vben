<script lang="ts" setup>
import type { MemberConfigApi } from '#/api/member/config';

import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { ElCard, ElMessage } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import { getConfig, saveConfig } from '#/api/member/config';
import { $t } from '#/locales';

const emit = defineEmits(['success']);
const formData = ref<MemberConfigApi.Config>();

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
      component: 'Input',
      fieldName: 'id',
      dependencies: {
        triggerFields: [''],
        show: () => false,
      },
    },
    {
      component: 'Switch',
      fieldName: 'pointTradeDeductEnable',
      label: '积分抵扣',
      help: '开启后，用户可以积分抵扣',
    },
    {
      component: 'InputNumber',
      fieldName: 'pointTradeDeductUnitPrice',
      label: '积分抵扣单价',
      help: '用户每消费1元，可以抵扣多少积分',
      componentProps: {
        min: 0,
        precision: 2,
        class: 'w-full',
      },
    },
    {
      component: 'InputNumber',
      fieldName: 'pointTradeDeductMaxPrice',
      label: '积分抵扣最大值',
      help: '单次下单积分使用上限，0 不限制',
      componentProps: {
        min: 0,
        class: 'w-full',
      },
    },
    {
      component: 'InputNumber',
      fieldName: 'pointTradeGivePoint',
      label: '1 元赠送多少分',
      help: '下单支付金额按比例赠送积分（实际支付 1 元赠送多少积分）',
      componentProps: {
        min: 0,
        class: 'w-full',
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
  const data = (await formApi.getValues()) as MemberConfigApi.Config;
  formApi.setState({ commonConfig: { disabled: true } });
  try {
    await saveConfig(data);
    // 关闭并提示
    emit('success');
    ElMessage.success($t('ui.actionMessage.operationSuccess'));
  } finally {
    formApi.setState({ commonConfig: { disabled: false } });
  }
}

async function getConfigInfo() {
  try {
    const res = await getConfig();
    formData.value = res;
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
    <ElCard title="积分设置">
      <Form class="w-1/4" />
    </ElCard>
  </Page>
</template>
