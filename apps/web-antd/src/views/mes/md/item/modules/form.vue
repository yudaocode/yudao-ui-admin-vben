<script lang="ts" setup>
import type { MesMdItemApi } from '#/api/mes/md/item';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Button, Empty, message, Tabs } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { createItem, getItem, updateItem } from '#/api/mes/md/item';
import { $t } from '#/locales';
import { BarcodeBizTypeEnum } from '#/views/mes/utils/constants';
import { BarcodeDetail } from '#/views/mes/wm/barcode/components';

import { useFormSchema } from '../data';
import ItemBatchConfigForm from './item-batch-config-form.vue';
import ProductBomForm from './product-bom-form.vue';
import ProductSipForm from './product-sip-form.vue';
import ProductSopForm from './product-sop-form.vue';

type FormMode = 'create' | 'detail' | 'update';

const emit = defineEmits(['success']);
const formMode = ref<FormMode>('create'); // 表单模式
const subTabsName = ref('bom'); // 当前子表页签
const formData = ref<MesMdItemApi.Item>();
const barcodeDetailRef = ref<InstanceType<typeof BarcodeDetail>>(); // 条码详情弹窗

const isDetail = computed(() => formMode.value === 'detail'); // 是否查看模式
const getTitle = computed(() => {
  if (formMode.value === 'detail') {
    return '查看物料/产品';
  }
  return formMode.value === 'update' ? '修改物料/产品' : '新增物料/产品';
});
const currentItemOrProduct = computed(
  () => formData.value?.itemOrProduct || '',
); // 当前物料/产品标识

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

/** 查看物料条码 */
function handleBarcode() {
  if (!formData.value?.id) {
    return;
  }
  barcodeDetailRef.value?.openByBusiness(
    formData.value.id,
    BarcodeBizTypeEnum.ITEM,
    formData.value.code,
    formData.value.name,
  );
}

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
    const data = (await formApi.getValues()) as MesMdItemApi.Item;
    try {
      if (formMode.value === 'create') {
        const id = await createItem(data);
        formData.value = { ...data, id };
        await formApi.setFieldValue('id', id);
        formMode.value = 'update';
        message.success($t('ui.actionMessage.operationSuccess'));
      } else {
        await updateItem(data);
        formData.value = { ...formData.value, ...data };
        message.success($t('ui.actionMessage.operationSuccess'));
      }
      emit('success');
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
    subTabsName.value = 'bom';
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
      formData.value = await getItem(data.id);
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
      <Tabs.TabPane key="bom" tab="BOM 组成">
        <ProductBomForm :form-type="formMode" :item-id="formData.id" />
      </Tabs.TabPane>
      <Tabs.TabPane v-if="formData.batchFlag" key="batch" tab="批次属性">
        <ItemBatchConfigForm
          :form-type="formMode"
          :item-id="formData.id"
          :item-or-product="currentItemOrProduct"
        />
      </Tabs.TabPane>
      <Tabs.TabPane key="substitute" tab="替代品">
        <Empty description="替代品（待实现）" />
      </Tabs.TabPane>
      <Tabs.TabPane key="sip" tab="SIP">
        <ProductSipForm :form-type="formMode" :item-id="formData.id" />
      </Tabs.TabPane>
      <Tabs.TabPane key="sop" tab="SOP">
        <ProductSopForm :form-type="formMode" :item-id="formData.id" />
      </Tabs.TabPane>
    </Tabs>
    <template #prepend-footer>
      <div class="flex flex-auto items-center">
        <Button
          v-if="isDetail && formData?.id"
          type="primary"
          @click="handleBarcode"
        >
          查看条码
        </Button>
      </div>
    </template>
    <BarcodeDetail ref="barcodeDetailRef" />
  </Modal>
</template>
