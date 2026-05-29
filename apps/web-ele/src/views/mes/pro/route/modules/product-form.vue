<script lang="ts" setup>
import type { MesProRouteProductApi } from '#/api/mes/pro/route/product';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { ElDivider, ElMessage } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import {
  createRouteProduct,
  getRouteProduct,
  updateRouteProduct,
} from '#/api/mes/pro/route/product';
import { $t } from '#/locales';

import { useRouteProductFormSchema } from '../data';
import ProductBomList from './product-bom-list.vue';

const emit = defineEmits(['success']);
const formData = ref<MesProRouteProductApi.RouteProduct>();
const getTitle = computed(() =>
  formData.value?.id
    ? $t('ui.actionTitle.edit', ['工艺路线产品'])
    : $t('ui.actionTitle.create', ['工艺路线产品']),
);

/** MdItemSelect change 回调：把物料编码/名称/规格/单位回填到 form */
async function handleItemChange(item?: any) {
  if (!item) {
    return;
  }
  await formApi.setValues({
    itemCode: item.code,
    itemName: item.name,
    specification: item.specification,
    unitName: item.unitMeasureName,
  });
}

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: { class: 'w-full' },
    formItemClass: 'col-span-1',
    labelWidth: 100,
  },
  layout: 'horizontal',
  schema: useRouteProductFormSchema(handleItemChange),
  showDefaultActions: false,
  wrapperClass: 'grid-cols-2',
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
      (await formApi.getValues()) as MesProRouteProductApi.RouteProduct;
    try {
      if (formData.value?.id) {
        await updateRouteProduct(data);
        // 用最新表单值同步 formData，确保产品 BOM 子表绑定的 itemId 与表单一致
        formData.value = { ...formData.value, ...data };
      } else {
        // 新增成功后切换到编辑模式，方便继续维护产品 BOM
        const id = await createRouteProduct(data);
        formData.value = { ...data, id };
        await formApi.setFieldValue('id', id);
      }
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
      routeId: number;
    }>();
    if (!data) {
      return;
    }
    if (!data.id) {
      await formApi.setValues({ routeId: data.routeId });
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getRouteProduct(data.id);
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
    <!-- 编辑模式下展示产品 BOM 子表，新增模式下隐藏 -->
    <template v-if="formData?.id && formData?.itemId">
      <ElDivider class="!my-3" content-position="left">产品 BOM 配置</ElDivider>
      <div class="mx-4">
        <ProductBomList
          :route-id="formData.routeId!"
          :product-id="formData.itemId"
          :product-name="formData.itemName"
        />
      </div>
    </template>
  </Modal>
</template>
