<script lang="ts" setup>
import type { FormType } from '../data';

import type { MesWmWarehouseLocationApi } from '#/api/mes/wm/warehouse/location';

import { computed, ref } from 'vue';

import { confirm, useVbenModal } from '@vben/common-ui';
import { BarcodeBizTypeEnum } from '@vben/constants';

import { Button, message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import {
  createWarehouseLocation,
  getWarehouseLocation,
  updateAreaByLocationId,
  updateWarehouseLocation,
} from '#/api/mes/wm/warehouse/location';
import { $t } from '#/locales';
import { BarcodeDetail } from '#/views/mes/wm/barcode/components';

import { useFormSchema } from '../data';

const emit = defineEmits(['success']);
const formType = ref<FormType>('create');
const formData = ref<MesWmWarehouseLocationApi.WarehouseLocation>();
const barcodeDetailRef = ref<InstanceType<typeof BarcodeDetail>>();

const getTitle = computed(() => {
  if (formType.value === 'detail') {
    return $t('ui.actionTitle.view', ['库区']);
  }
  return formType.value === 'update'
    ? $t('ui.actionTitle.edit', ['库区'])
    : $t('ui.actionTitle.create', ['库区']);
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
    BarcodeBizTypeEnum.LOCATION,
    formData.value.code,
    formData.value.name,
  );
}

/** 批量设置库位混放规则 */
async function setMixingRule(type: 'batch' | 'item', allow: boolean) {
  if (!formData.value?.id) {
    return;
  }
  const text = type === 'item' ? '产品混放' : '批次混放';
  try {
    await confirm(`确认要重置库区下所有库位的${text}规则吗？`);
  } catch {
    return;
  }
  await updateAreaByLocationId(
    formData.value.id,
    type === 'item' ? allow : undefined,
    type === 'batch' ? allow : undefined,
  );
  message.success('设置成功');
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
    const data =
      (await formApi.getValues()) as MesWmWarehouseLocationApi.WarehouseLocation;
    try {
      await (formData.value?.id
        ? updateWarehouseLocation(data)
        : createWarehouseLocation(data));
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
    const data = modalApi.getData<{
      formType: FormType;
      id?: number;
      warehouseId?: number;
    }>();
    formType.value = data.formType;
    formApi.setState({ schema: useFormSchema(formType.value, formApi) });
    formApi.setDisabled(formType.value === 'detail');
    modalApi.setState({ showConfirmButton: formType.value !== 'detail' });
    if (data?.id) {
      modalApi.lock();
      try {
        formData.value = await getWarehouseLocation(data.id);
        // 设置到 values
        await formApi.setValues(formData.value);
      } finally {
        modalApi.unlock();
      }
      return;
    }
    if (data?.warehouseId) {
      await formApi.setFieldValue('warehouseId', data.warehouseId);
    }
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-3/5">
    <Form class="mx-4" />
    <div
      v-if="formType === 'update' && formData?.id"
      class="mx-4 mt-2 border-t pt-4"
    >
      <div class="mb-2 font-medium">库位混放规则（批量设置）</div>
      <div class="flex flex-wrap items-center gap-3">
        <span class="w-20">产品混放</span>
        <Button size="small" type="primary" @click="setMixingRule('item', true)">
          允许
        </Button>
        <Button size="small" danger @click="setMixingRule('item', false)">
          不允许
        </Button>
      </div>
      <div class="mt-2 flex flex-wrap items-center gap-3">
        <span class="w-20">批次混放</span>
        <Button
          size="small"
          type="primary"
          @click="setMixingRule('batch', true)"
        >
          允许
        </Button>
        <Button size="small" danger @click="setMixingRule('batch', false)">
          不允许
        </Button>
      </div>
    </div>
    <template v-if="formType === 'detail' && formData?.id" #prepend-footer>
      <Button @click="handleBarcode"> 查看条码 </Button>
    </template>
    <BarcodeDetail ref="barcodeDetailRef" />
  </Modal>
</template>
