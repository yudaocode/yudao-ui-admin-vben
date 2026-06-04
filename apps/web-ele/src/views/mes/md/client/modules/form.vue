<script lang="ts" setup>
import type { FormType } from '../data';

import type { MesMdClientApi } from '#/api/mes/md/client';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { ElMessage, ElTabPane, ElTabs } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import { createClient, getClient, updateClient } from '#/api/mes/md/client';
import { $t } from '#/locales';

import { useFormSchema } from '../data';
import ClientProductSalesLineList from './product-sales-line-list.vue';
import ClientProductSalesList from './product-sales-list.vue';

const emit = defineEmits(['success']);
const formType = ref<FormType>('create'); // 表单模式
const subTabsName = ref('productSalesLine'); // 当前子表页签
const formData = ref<MesMdClientApi.Client>();

const isDetail = computed(() => formType.value === 'detail'); // 是否查看模式
const getTitle = computed(() => {
  if (formType.value === 'detail') {
    return '查看客户';
  }
  return formType.value === 'update' ? '修改客户' : '新增客户';
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
      ElMessage.success($t('ui.actionMessage.operationSuccess'));
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      formData.value = undefined;
      return;
    }
    subTabsName.value = 'productSalesLine';
    // 加载数据
    const data = modalApi.getData<{ formType: FormType; id?: number }>();
    formType.value = data.formType;
    formApi.setState({ schema: useFormSchema(data.formType, formApi) });
    formApi.setDisabled(formType.value === 'detail');
    modalApi.setState({ showConfirmButton: formType.value !== 'detail' });
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
    <ElTabs
      v-if="formType !== 'create' && formData?.id"
      v-model="subTabsName"
      class="mx-4 mt-4"
    >
      <ElTabPane label="产品清单" name="productSalesLine">
        <ClientProductSalesLineList :client-id="formData.id" />
      </ElTabPane>
      <ElTabPane label="销售记录" name="productSales">
        <ClientProductSalesList :client-id="formData.id" />
      </ElTabPane>
    </ElTabs>
  </Modal>
</template>
