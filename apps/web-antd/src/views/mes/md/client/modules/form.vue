<script lang="ts" setup>
import type { MesMdClientApi } from '#/api/mes/md/client';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message, Tabs } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { createClient, getClient, updateClient } from '#/api/mes/md/client';
import { $t } from '#/locales';

import { useFormSchema } from '../data';
import ClientProductSalesLineList from './product-sales-line-list.vue';
import ClientProductSalesList from './product-sales-list.vue';

type FormMode = 'create' | 'detail' | 'update';

const emit = defineEmits(['success']);
const formMode = ref<FormMode>('create'); // 表单模式
const subTabsName = ref('productSalesLine'); // 当前子表页签
const formData = ref<MesMdClientApi.Client>();

const isDetail = computed(() => formMode.value === 'detail'); // 是否查看模式
const getTitle = computed(() => {
  if (formMode.value === 'detail') {
    return '查看客户';
  }
  return formMode.value === 'update' ? '修改客户' : '新增客户';
});

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    formItemClass: 'col-span-1',
    labelWidth: 120,
  },
  wrapperClass: 'grid-cols-3',
  layout: 'horizontal',
  schema: [],
  showDefaultActions: false,
});

/** 表单 schema 需要 formApi 引用，所以通过 setState 设置 schema */
formApi.setState({ schema: useFormSchema(formApi) });

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    if (isDetail.value) {
      await modalApi.close();
      return;
    }
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    modalApi.lock();
    // 提交表单
    const data = (await formApi.getValues()) as MesMdClientApi.Client;
    try {
      await (formData.value?.id ? updateClient(data) : createClient(data));
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
      return;
    }
    await formApi.resetForm();
    subTabsName.value = 'productSalesLine';
    // 加载数据
    const data = modalApi.getData<{ id?: number; type?: FormMode }>();
    formMode.value = data?.type || 'create';
    formApi.setDisabled(formMode.value === 'detail');
    modalApi.setState({ showConfirmButton: formMode.value !== 'detail' });
    if (!data?.id) {
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getClient(data.id);
      // 设置到 values
      await formApi.setValues(formData.value);
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-4/5">
    <Form class="mx-4" />
    <Tabs
      v-if="formMode !== 'create' && formData?.id"
      v-model:active-key="subTabsName"
      class="mx-4 mt-4"
    >
      <Tabs.TabPane key="productSalesLine" tab="产品清单">
        <ClientProductSalesLineList :client-id="formData.id" />
      </Tabs.TabPane>
      <Tabs.TabPane key="productSales" tab="销售记录">
        <ClientProductSalesList :client-id="formData.id" />
      </Tabs.TabPane>
    </Tabs>
  </Modal>
</template>
