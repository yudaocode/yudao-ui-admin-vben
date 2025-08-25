<script lang="ts" setup>
import type { ErpPurchaseOrderApi } from '#/api/erp/purchase/order';

import { computed, nextTick, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import {
  createPurchaseOrder,
  getPurchaseOrder,
  updatePurchaseOrder,
} from '#/api/erp/purchase/order';

import { useFormSchema } from '../data';
import PurchaseOrderItemForm from './PurchaseOrderItemForm.vue';

const emit = defineEmits(['success']);
const formData = ref<ErpPurchaseOrderApi.PurchaseOrder>();
const formType = ref('');
const itemFormRef = ref();

const getTitle = computed(() => {
  if (formType.value === 'create') return '添加采购订单';
  if (formType.value === 'update') return '编辑采购订单';
  return '采购订单详情';
});

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    labelWidth: 120,
  },
  wrapperClass: 'grid-cols-3',
  layout: 'vertical',
  schema: useFormSchema(),
  showDefaultActions: false,
  handleValuesChange: (values, changedFields) => {
    if (formData.value && changedFields.includes('discountPercent')) {
      formData.value.discountPercent = values.discountPercent;
    }
  },
});

const handleUpdateItems = (items: ErpPurchaseOrderApi.PurchaseOrderItem[]) => {
  formData.value = modalApi.getData<ErpPurchaseOrderApi.PurchaseOrder>();
  if (formData.value) {
    formData.value.items = items;
  }
};

const handleUpdateDiscountPrice = (discountPrice: number) => {
  if (formData.value) {
    formData.value.discountPrice = discountPrice;
    formApi.setValues({
      discountPrice: formData.value.discountPrice,
    });
  }
};

const handleUpdateTotalPrice = (totalPrice: number) => {
  if (formData.value) {
    formData.value.totalPrice = totalPrice;
    formApi.setValues({
      totalPrice: formData.value.totalPrice,
    });
  }
};

// TODO @nehc：这里的注释使用 /** */ 和别的模块一致哈；
/**
 * 创建或更新采购订单
 */
const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    await nextTick();

    // TODO @nehc：应该不会不存在，直接校验，简洁一点！另外，可以看看别的模块，主子表的处理哈；
    const itemFormInstance = Array.isArray(itemFormRef.value)
      ? itemFormRef.value[0]
      : itemFormRef.value;
    if (itemFormInstance && typeof itemFormInstance.validate === 'function') {
      try {
        const isValid = await itemFormInstance.validate();
        if (!isValid) {
          message.error('子表单验证失败');
          return;
        }
      } catch (error) {
        // TODO @nehc：这里的红色告警，看看怎么处理掉
        message.error(error.message || '子表单验证失败');
        return;
      }
    } else {
      message.error('子表单验证方法不存在');
      return;
    }

    // 验证产品清单不能为空
    if (!formData.value?.items || formData.value.items.length === 0) {
      message.error('产品清单不能为空，请至少添加一个产品');
      return;
    }

    modalApi.lock();
    // 提交表单
    const data =
      (await formApi.getValues()) as ErpPurchaseOrderApi.PurchaseOrder;
    data.items = formData.value?.items?.map((item) => ({
      ...item,
      // 解决新增采购订单报错
      id: undefined,
    }));
    // 将文件数组转换为字符串
    if (data.fileUrl && Array.isArray(data.fileUrl)) {
      data.fileUrl = data.fileUrl.length > 0 ? data.fileUrl[0] : '';
    }
    try {
      await (formType.value === 'create'
        ? createPurchaseOrder(data)
        : updatePurchaseOrder(data));
      // 关闭并提示
      await modalApi.close();
      emit('success');
      message.success(formType.value === 'create' ? '新增成功' : '更新成功');
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
    const data = modalApi.getData<{ id?: number; type: string }>();
    if (!data) {
      return;
    }
    formType.value = data.type;

    if (!data.id) {
      // 初始化空的表单数据
      formData.value = { items: [] } as ErpPurchaseOrderApi.PurchaseOrder;
      await nextTick();
      // TODO @nehc：看看有没办法简化
      const itemFormInstance = Array.isArray(itemFormRef.value)
        ? itemFormRef.value[0]
        : itemFormRef.value;
      if (itemFormInstance && typeof itemFormInstance.init === 'function') {
        itemFormInstance.init([]);
      }
      return;
    }

    modalApi.lock();
    try {
      formData.value = await getPurchaseOrder(data.id);
      // 将字符串形式的文件 URL 转换为数组形式以适配 FileUpload 组件
      // TODO @nehc：这里的 idea 会有黄色告警，看看是不是简化下？
      // TODO @nehc：记忆中，好像不用数组的转换，可以在看看？
      if (
        formData.value.fileUrl &&
        typeof formData.value.fileUrl === 'string'
      ) {
        formData.value.fileUrl = formData.value.fileUrl
          ? [formData.value.fileUrl]
          : [];
      }
      // 设置到 values
      await formApi.setValues(formData.value);
      // 初始化子表单
      await nextTick();
      const itemFormInstance = Array.isArray(itemFormRef.value)
        ? itemFormRef.value[0]
        : itemFormRef.value;
      if (itemFormInstance && typeof itemFormInstance.init === 'function') {
        itemFormInstance.init(formData.value.items || []);
      }
    } finally {
      modalApi.unlock();
    }
  },
});

defineExpose({ modalApi });
</script>

<template>
  <Modal
    v-bind="$attrs"
    :title="getTitle"
    class="w-1/2"
    :closable="true"
    :mask-closable="true"
    :show-confirm-button="formType !== 'detail'"
  >
    <Form class="mx-3">
      <template #product="slotProps">
        <PurchaseOrderItemForm
          v-bind="slotProps"
          ref="itemFormRef"
          class="w-full"
          :items="formData?.items ?? []"
          :disabled="formType === 'detail'"
          :discount-percent="formData?.discountPercent ?? 0"
          @update:items="handleUpdateItems"
          @update:discount-price="handleUpdateDiscountPrice"
          @update:total-price="handleUpdateTotalPrice"
        />
      </template>
    </Form>
  </Modal>
</template>
