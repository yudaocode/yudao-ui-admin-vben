<script lang="ts" setup>
import type { FormType } from '../data';

import type { MesMdItemApi } from '#/api/mes/md/item';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { BarcodeBizTypeEnum } from '@vben/constants';

import { ElButton, ElEmpty, ElMessage, ElTabPane, ElTabs } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import { createItem, getItem, updateItem } from '#/api/mes/md/item';
import { $t } from '#/locales';
import { BarcodeDetail } from '#/views/mes/wm/barcode/components';

import { useFormSchema } from '../data';
import ItemBatchConfigForm from './item-batch-config-form.vue';
import ProductBomForm from './product-bom-form.vue';
import ProductSipForm from './product-sip-form.vue';
import ProductSopForm from './product-sop-form.vue';

const emit = defineEmits(['success']);
const formType = ref<FormType>('create'); // 表单模式
const subTabsName = ref('bom'); // 当前子表页签
const formData = ref<MesMdItemApi.Item>();
const barcodeDetailRef = ref<InstanceType<typeof BarcodeDetail>>(); // 条码详情弹窗

const isDetail = computed(() => formType.value === 'detail'); // 是否查看模式
const getTitle = computed(() => {
  if (formType.value === 'detail') {
    return '查看物料/产品';
  }
  return formType.value === 'update' ? '修改物料/产品' : '新增物料/产品';
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
      if (formType.value === 'create') {
        const id = await createItem(data);
        formData.value = { ...data, id };
        await formApi.setFieldValue('id', id);
        formType.value = 'update';
        ElMessage.success($t('ui.actionMessage.operationSuccess'));
      } else {
        await updateItem(data);
        formData.value = { ...formData.value, ...data };
        ElMessage.success($t('ui.actionMessage.operationSuccess'));
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
    subTabsName.value = 'bom';
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
    <ElTabs
      v-if="formType !== 'create' && formData?.id"
      v-model="subTabsName"
      class="mx-4 mt-4"
    >
      <ElTabPane name="bom" label="BOM 组成">
        <ProductBomForm :form-type="formType" :item-id="formData.id" />
      </ElTabPane>
      <ElTabPane v-if="formData.batchFlag" name="batch" label="批次属性">
        <ItemBatchConfigForm
          :form-type="formType"
          :item-id="formData.id"
          :item-or-product="currentItemOrProduct"
        />
      </ElTabPane>
      <ElTabPane name="substitute" label="替代品">
        <ElEmpty description="替代品（待实现）" />
      </ElTabPane>
      <ElTabPane name="sip" label="SIP">
        <ProductSipForm :form-type="formType" :item-id="formData.id" />
      </ElTabPane>
      <ElTabPane name="sop" label="SOP">
        <ProductSopForm :form-type="formType" :item-id="formData.id" />
      </ElTabPane>
    </ElTabs>
    <template #prepend-footer>
      <div class="flex flex-auto items-center">
        <ElButton
          v-if="isDetail && formData?.id"
          type="primary"
          @click="handleBarcode"
        >
          查看条码
        </ElButton>
      </div>
    </template>
    <BarcodeDetail ref="barcodeDetailRef" />
  </Modal>
</template>
