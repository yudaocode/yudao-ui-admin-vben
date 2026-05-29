<script lang="ts" setup>
import type { MesProRouteProductBomApi } from '#/api/mes/pro/route/productbom';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { ElMessage } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import {
  createRouteProductBom,
  getRouteProductBom,
  updateRouteProductBom,
} from '#/api/mes/pro/route/productbom';
import { $t } from '#/locales';

import { useRouteProductBomFormSchema } from '../data';

const emit = defineEmits(['success']);
const formData = ref<MesProRouteProductBomApi.RouteProductBom>();
const productId = ref<number>(0); // 当前产品物料编号，供 BOM 选择器筛选可用 BOM
const getTitle = computed(() =>
  formData.value?.id
    ? $t('ui.actionTitle.edit', ['BOM 物料'])
    : $t('ui.actionTitle.create', ['BOM 物料']),
);

/** MdProductBomSelect change 回调：把 BOM 物料编码/名称/规格/单位/默认用量回填到 form */
async function handleBomChange(bom?: any) {
  if (!bom) {
    return;
  }
  await formApi.setValues({
    itemCode: bom.bomItemCode,
    itemName: bom.bomItemName,
    quantity: bom.quantity ?? 1,
    specification: bom.specification,
    unitName: bom.unitName,
  });
}

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: { class: 'w-full' },
    formItemClass: 'col-span-1',
    labelWidth: 110,
  },
  layout: 'horizontal',
  schema: useRouteProductBomFormSchema(() => productId.value, handleBomChange),
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    modalApi.lock();
    // 提交表单
    const data =
      (await formApi.getValues()) as MesProRouteProductBomApi.RouteProductBom;
    try {
      await (formData.value?.id
        ? updateRouteProductBom(data)
        : createRouteProductBom(data));
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
    // 加载数据
    const data = modalApi.getData<{
      id?: number;
      processId: number;
      productId: number;
      routeId: number;
    }>();
    if (!data) {
      return;
    }
    productId.value = data.productId;
    if (!data.id) {
      // 新增时，给 routeId/processId/productId 兜底默认值
      await formApi.setValues({
        processId: data.processId,
        productId: data.productId,
        quantity: 1,
        routeId: data.routeId,
      });
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getRouteProductBom(data.id);
      // 设置到 values
      await formApi.setValues(formData.value);
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-1/3">
    <Form class="mx-4" />
  </Modal>
</template>
