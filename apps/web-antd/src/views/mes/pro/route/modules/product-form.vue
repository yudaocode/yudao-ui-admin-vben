<script lang="ts" setup>
import type { FormInstance } from 'ant-design-vue';

import type { MesProRouteProductApi } from '#/api/mes/pro/route/product';

import { computed, reactive, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import {
  Form as AForm,
  Divider,
  FormItem,
  InputNumber,
  message,
  Select,
  Textarea,
} from 'ant-design-vue';

import {
  createRouteProduct,
  updateRouteProduct,
} from '#/api/mes/pro/route/product';
import { $t } from '#/locales';
import { MdItemSelect } from '#/views/mes/md/item/components';

import ProductBomList from './product-bom-list.vue';

const emit = defineEmits(['success']);
const isUpdate = ref(false);
const formRef = ref<FormInstance>();
const formData = reactive<MesProRouteProductApi.RouteProduct>({
  productionTime: 1,
  quantity: 1,
  timeUnitType: 'MINUTE',
});
const formRules = {
  itemId: [{ message: '产品不能为空', required: true }],
  quantity: [{ message: '生产数量不能为空', required: true }],
};
const timeUnitOptions = computed(() =>
  getDictOptions(DICT_TYPE.MES_TIME_UNIT_TYPE).map((item) => ({
    label: item.label,
    value: item.value as string,
  })),
);
const getTitle = computed(() =>
  isUpdate.value
    ? $t('ui.actionTitle.edit', ['工艺路线产品'])
    : $t('ui.actionTitle.create', ['工艺路线产品']),
);

/** 重置表单数据 */
function resetForm(routeId?: number) {
  Object.assign(formData, {
    id: undefined,
    itemCode: undefined,
    itemId: undefined,
    itemName: undefined,
    productionTime: 1,
    quantity: 1,
    remark: undefined,
    routeId: routeId ?? formData.routeId,
    specification: undefined,
    timeUnitType: 'MINUTE',
    unitName: undefined,
  });
  formRef.value?.clearValidate();
}

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    try {
      await formRef.value?.validate();
    } catch {
      return;
    }
    modalApi.lock();
    try {
      if (isUpdate.value) {
        await updateRouteProduct(formData);
      } else {
        const id = await createRouteProduct(formData);
        formData.id = id;
        isUpdate.value = true;
      }
      emit('success');
      message.success($t('ui.actionMessage.operationSuccess'));
    } finally {
      modalApi.unlock();
    }
  },
  onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      resetForm();
      isUpdate.value = false;
      return;
    }
    const data = modalApi.getData<{
      id?: number;
      routeId: number;
      row?: MesProRouteProductApi.RouteProduct;
    }>();
    if (!data) {
      return;
    }
    if (data.row) {
      Object.assign(formData, data.row);
      isUpdate.value = true;
    } else {
      resetForm(data.routeId);
      isUpdate.value = false;
    }
  },
});

/** 物料编号变化时回填名称等 */
function handleItemChange(item?: any) {
  if (!item) {
    return;
  }
  formData.itemCode = item.code;
  formData.itemName = item.name;
  formData.specification = item.specification;
  formData.unitName = item.unitName;
}
</script>

<template>
  <Modal :title="getTitle" class="w-3/5">
    <AForm
      ref="formRef"
      class="mx-4"
      :label-col="{ flex: '0 0 110px' }"
      :wrapper-col="{ flex: 'auto' }"
      :model="formData"
      :rules="formRules"
    >
      <div class="grid grid-cols-2 gap-x-4">
        <FormItem class="col-span-2" label="产品" name="itemId">
          <MdItemSelect
            v-model="formData.itemId"
            @change="handleItemChange"
          />
        </FormItem>
        <FormItem label="生产数量" name="quantity">
          <InputNumber
            v-model:value="formData.quantity"
            class="!w-full"
            :min="1"
            :precision="0"
          />
        </FormItem>
        <FormItem label="生产用时" name="productionTime">
          <InputNumber
            v-model:value="formData.productionTime"
            class="!w-full"
            :min="0"
            :precision="2"
          />
        </FormItem>
        <FormItem label="时间单位" name="timeUnitType">
          <Select
            v-model:value="formData.timeUnitType"
            allow-clear
            :options="timeUnitOptions"
            placeholder="请选择"
          />
        </FormItem>
        <FormItem class="col-span-2" label="备注" name="remark">
          <Textarea
            v-model:value="formData.remark"
            :max-length="250"
            placeholder="请输入备注"
            :rows="2"
          />
        </FormItem>
      </div>
    </AForm>
    <template v-if="isUpdate && formData.id && formData.itemId">
      <Divider class="!my-3" orientation="left">产品 BOM 配置</Divider>
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
