<script lang="ts" setup>
import type { FormInstance, FormRules } from 'element-plus';

import type { MesProRouteProductApi } from '#/api/mes/pro/route/product';

import { computed, reactive, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import {
  ElDivider,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElMessage,
  ElOption,
  ElSelect,
} from 'element-plus';

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
const formRules: FormRules = {
  itemId: [{ message: '产品不能为空', required: true }],
  quantity: [{ message: '生产数量不能为空', required: true }],
};
const timeUnitOptions = computed(() =>
  getDictOptions(DICT_TYPE.MES_TIME_UNIT_TYPE),
);
const getTitle = computed(() =>
  isUpdate.value
    ? $t('ui.actionTitle.edit', ['工艺路线产品'])
    : $t('ui.actionTitle.create', ['工艺路线产品']),
);

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
      ElMessage.success($t('ui.actionMessage.operationSuccess'));
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
    <ElForm
      ref="formRef"
      class="mx-4"
      label-width="120px"
      :model="formData"
      :rules="formRules"
    >
      <div class="grid grid-cols-2 gap-x-4">
        <ElFormItem class="col-span-2" label="产品" prop="itemId">
          <MdItemSelect
            v-model="formData.itemId"
            @change="handleItemChange"
          />
        </ElFormItem>
        <ElFormItem label="生产数量" prop="quantity">
          <ElInputNumber
            v-model="formData.quantity"
            class="!w-full"
            controls-position="right"
            :min="1"
            :precision="0"
          />
        </ElFormItem>
        <ElFormItem label="生产用时" prop="productionTime">
          <ElInputNumber
            v-model="formData.productionTime"
            class="!w-full"
            controls-position="right"
            :min="0"
            :precision="2"
          />
        </ElFormItem>
        <ElFormItem label="时间单位" prop="timeUnitType">
          <ElSelect
            v-model="formData.timeUnitType"
            class="!w-full"
            clearable
            placeholder="请选择"
          >
            <ElOption
              v-for="dict in timeUnitOptions"
              :key="dict.value as string"
              :label="dict.label"
              :value="dict.value as string"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem class="col-span-2" label="备注" prop="remark">
          <ElInput
            v-model="formData.remark"
            :maxlength="250"
            placeholder="请输入备注"
            :rows="2"
            type="textarea"
          />
        </ElFormItem>
      </div>
    </ElForm>
    <template v-if="isUpdate && formData.id && formData.itemId">
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
