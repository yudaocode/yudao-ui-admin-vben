<script lang="ts" setup>
import type { FormType } from '../data';

import type { MesWmProductSalesApi } from '#/api/mes/wm/productsales';

import { computed, ref } from 'vue';

import { confirm, useVbenModal } from '@vben/common-ui';
import { MesWmProductSalesStatusEnum } from '@vben/constants';

import { ElButton, ElDivider, ElMessage, ElPopconfirm } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import {
  checkProductSalesQuantity,
  createProductSales,
  finishProductSales,
  getProductSales,
  shippingProductSales,
  stockProductSales,
  submitProductSales,
  updateProductSales,
} from '#/api/mes/wm/productsales';
import { $t } from '#/locales';

import { useFormSchema } from '../data';
import LineList from './line-list.vue';

const emit = defineEmits(['success']);
const formType = ref<FormType>('create');
const formData = ref<MesWmProductSalesApi.ProductSales>();
const originalSnapshot = ref(''); // 表单原始数据快照，用于提交时跳过未变更的保存请求
const isEditable = computed(() => // 是否为编辑模式（可保存）
  ['create', 'update'].includes(formType.value),
);
const isStock = computed(() => formType.value === 'stock'); // 是否为拣货模式
const isShipping = computed(() => formType.value === 'shipping'); // 是否为填写运单模式
const isFinish = computed(() => formType.value === 'finish'); // 是否为执行出库模式
const canSubmit = computed(() => // 是否可提交
  formType.value === 'update' &&
  formData.value?.status === MesWmProductSalesStatusEnum.PREPARE,
);
const getTitle = computed(() => {
  if (formType.value === 'detail') {
    return $t('ui.actionTitle.view', ['销售出库单']);
  }
  if (formType.value === 'stock') {
    return '执行拣货';
  }
  if (formType.value === 'shipping') {
    return '填写运单';
  }
  if (formType.value === 'finish') {
    return '执行出库';
  }
  return formType.value === 'update'
    ? $t('ui.actionTitle.edit', ['销售出库单'])
    : $t('ui.actionTitle.create', ['销售出库单']);
});

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    formItemClass: 'col-span-1',
    labelWidth: 110,
  },
  layout: 'horizontal',
  schema: [],
  showDefaultActions: false,
  wrapperClass: 'grid-cols-3',
});

/** 提交出库单：表单有修改时先保存，再调用提交接口 */
async function handleSubmit() {
  const { valid } = await formApi.validate();
  if (!valid || !formData.value?.id) {
    return;
  }
  modalApi.lock();
  try {
    const current = JSON.stringify(await formApi.getValues());
    if (current !== originalSnapshot.value) {
      const data =
        (await formApi.getValues()) as MesWmProductSalesApi.ProductSales;
      await updateProductSales({ ...formData.value, ...data });
      originalSnapshot.value = current;
    }
    await submitProductSales(formData.value.id);
    ElMessage.success('提交成功');
    await modalApi.close();
    emit('success');
  } finally {
    modalApi.unlock();
  }
}

/** 执行拣货：出库数量与拣货数量不一致时二次确认 */
async function handleStock() {
  if (!formData.value?.id) {
    return;
  }
  const quantityMatch = await checkProductSalesQuantity(formData.value.id);
  if (!quantityMatch) {
    try {
      await confirm('出库数量与拣货数量不一致，确认执行拣货？');
    } catch {
      return;
    }
  }
  modalApi.lock();
  try {
    await stockProductSales(formData.value.id);
    ElMessage.success('拣货成功');
    await modalApi.close();
    emit('success');
  } finally {
    modalApi.unlock();
  }
}

/** 填写运单 */
async function handleShipping() {
  if (!formData.value?.id) {
    return;
  }
  const values = (await formApi.getValues()) as MesWmProductSalesApi.ProductSales;
  modalApi.lock();
  try {
    await shippingProductSales({
      carrier: values.carrier,
      id: formData.value.id,
      shippingNumber: values.shippingNumber,
    });
    ElMessage.success('运单信息填写成功');
    await modalApi.close();
    emit('success');
  } finally {
    modalApi.unlock();
  }
}

/** 执行出库 */
async function handleFinish() {
  if (!formData.value?.id) {
    return;
  }
  modalApi.lock();
  try {
    await finishProductSales(formData.value.id);
    ElMessage.success('出库成功');
    await modalApi.close();
    emit('success');
  } finally {
    modalApi.unlock();
  }
}

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    if (!isEditable.value) {
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
      (await formApi.getValues()) as MesWmProductSalesApi.ProductSales;
    try {
      if (formData.value?.id) {
        await updateProductSales({ ...formData.value, ...data });
        formData.value = { ...formData.value, ...data };
      } else {
        const id = await createProductSales(data);
        formData.value = {
          ...data,
          id,
          status: MesWmProductSalesStatusEnum.PREPARE,
        };
        await formApi.setFieldValue('id', id);
        await formApi.setFieldValue('status', formData.value.status);
        formType.value = 'update';
      }
      originalSnapshot.value = JSON.stringify(await formApi.getValues());
      emit('success');
      ElMessage.success($t('ui.actionMessage.operationSuccess'));
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      formData.value = undefined;
      originalSnapshot.value = '';
      return;
    }
    // 加载数据
    const data = modalApi.getData<{ formType: FormType; id?: number }>();
    formType.value = data.formType;
    formApi.setState({ schema: useFormSchema(formType.value, formApi) });
    formApi.setDisabled(false);
    modalApi.setState({ showConfirmButton: isEditable.value });
    if (data?.id) {
      modalApi.lock();
      try {
        formData.value = await getProductSales(data.id);
        // 设置到 values
        await formApi.setValues(formData.value);
      } finally {
        modalApi.unlock();
      }
    }
    originalSnapshot.value = JSON.stringify(await formApi.getValues());
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-3/5">
    <Form class="mx-4" />
    <!-- 非新建模式展示物料信息 -->
    <template v-if="formData?.id">
      <ElDivider>物料信息</ElDivider>
      <div class="mx-4">
        <LineList
          :form-type="formType"
          :notice-id="formData.noticeId"
          :sales-id="formData.id"
        />
      </div>
    </template>
    <template #prepend-footer>
      <div class="flex flex-auto items-center gap-2">
        <ElPopconfirm
          v-if="canSubmit"
          title="确认提交该销售出库单？【提交后将不能修改】"
          width="260"
          @confirm="handleSubmit"
        >
          <template #reference>
            <ElButton type="primary">提交</ElButton>
          </template>
        </ElPopconfirm>
        <ElButton v-if="isStock" type="primary" @click="handleStock">
          执行拣货
        </ElButton>
        <ElPopconfirm
          v-if="isShipping"
          title="确认提交运单信息？"
          width="260"
          @confirm="handleShipping"
        >
          <template #reference>
            <ElButton type="primary">确认填写</ElButton>
          </template>
        </ElPopconfirm>
        <ElPopconfirm
          v-if="isFinish"
          title="确认执行出库？执行后将扣减库存。"
          width="260"
          @confirm="handleFinish"
        >
          <template #reference>
            <ElButton type="primary">确认出库</ElButton>
          </template>
        </ElPopconfirm>
      </div>
    </template>
  </Modal>
</template>
