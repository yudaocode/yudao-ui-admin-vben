<script lang="ts" setup>
import type { FormType } from '../data';

import type { MesMdVendorApi } from '#/api/mes/md/vendor';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message, Tabs } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { createVendor, getVendor, updateVendor } from '#/api/mes/md/vendor';
import { $t } from '#/locales';

import { useFormSchema } from '../data';
import VendorItemReceiptLineList from './item-receipt-line-list.vue';
import VendorItemReceiptList from './item-receipt-list.vue';

const emit = defineEmits(['success']);
const formType = ref<FormType>('create'); // 表单模式
const subTabsName = ref('itemReceiptLine'); // 当前子表页签
const formData = ref<MesMdVendorApi.Vendor>();

const isDetail = computed(() => formType.value === 'detail'); // 是否查看模式
const getTitle = computed(() => {
  if (formType.value === 'detail') {
    return $t('ui.actionTitle.view', ['供应商']);
  }
  return formType.value === 'update'
    ? $t('ui.actionTitle.edit', ['供应商'])
    : $t('ui.actionTitle.create', ['供应商']);
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
    const data = (await formApi.getValues()) as MesMdVendorApi.Vendor;
    try {
      await (formData.value?.id ? updateVendor(data) : createVendor(data));
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
    subTabsName.value = 'itemReceiptLine';
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
      formData.value = await getVendor(data.id);
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
      v-if="formType !== 'create' && formData?.id"
      v-model:active-key="subTabsName"
      class="mx-4 mt-4"
    >
      <Tabs.TabPane key="itemReceiptLine" tab="物料清单">
        <VendorItemReceiptLineList :vendor-id="formData.id" />
      </Tabs.TabPane>
      <Tabs.TabPane key="itemReceipt" tab="采购记录">
        <VendorItemReceiptList :vendor-id="formData.id" />
      </Tabs.TabPane>
    </Tabs>
  </Modal>
</template>
