<script lang="ts" setup>
import type { FormType } from '../data';

import type { MesWmWarehouseApi } from '#/api/mes/wm/warehouse';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { BarcodeBizTypeEnum } from '@vben/constants';

import { Button, message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import {
  createWarehouse,
  getWarehouse,
  updateWarehouse,
} from '#/api/mes/wm/warehouse';
import { $t } from '#/locales';
import { BarcodeDetail } from '#/views/mes/wm/barcode/components';

import { useFormSchema } from '../data';

const emit = defineEmits(['success']);
const formType = ref<FormType>('create');
const formData = ref<MesWmWarehouseApi.Warehouse>();
const barcodeDetailRef = ref<InstanceType<typeof BarcodeDetail>>();

const getTitle = computed(() => {
  if (formType.value === 'detail') {
    return $t('ui.actionTitle.view', ['仓库']);
  }
  return formType.value === 'update'
    ? $t('ui.actionTitle.edit', ['仓库'])
    : $t('ui.actionTitle.create', ['仓库']);
});

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    formItemClass: 'col-span-1',
    labelWidth: 110,
  },
  wrapperClass: 'grid-cols-3',
  layout: 'horizontal',
  schema: [],
  showDefaultActions: false,
});

/** 查看条码 */
function handleBarcode() {
  if (!formData.value?.id) {
    return;
  }
  barcodeDetailRef.value?.openByBusiness(
    formData.value.id,
    BarcodeBizTypeEnum.WAREHOUSE,
    formData.value.code,
    formData.value.name,
  );
}

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    if (formType.value === 'detail') {
      await modalApi.close();
      return;
    }
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    modalApi.lock();
    // 提交表单
    const data = (await formApi.getValues()) as MesWmWarehouseApi.Warehouse;
    try {
      await (formData.value?.id ? updateWarehouse(data) : createWarehouse(data));
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
    // 加载数据
    const data = modalApi.getData<{ formType: FormType; id?: number }>();
    formType.value = data.formType;
    formApi.setState({ schema: useFormSchema(formType.value, formApi) });
    formApi.setDisabled(formType.value === 'detail');
    modalApi.setState({ showConfirmButton: formType.value !== 'detail' });
    if (!data?.id) {
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getWarehouse(data.id);
      // 设置到 values
      await formApi.setValues(formData.value);
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-3/5">
    <Form class="mx-4" />
    <template v-if="formType === 'detail' && formData?.id" #prepend-footer>
      <Button @click="handleBarcode"> 查看条码 </Button>
    </template>
    <BarcodeDetail ref="barcodeDetailRef" />
  </Modal>
</template>
