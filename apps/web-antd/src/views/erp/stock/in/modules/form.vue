<script lang="ts" setup>
import type { ErpStockInApi } from '#/api/erp/stock/in';

import { computed, nextTick, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import {
  createStockIn,
  getStockIn,
  updateStockIn,
  updateStockInStatus,
} from '#/api/erp/stock/in';

import { useFormSchema } from '../data';
import StockInItemForm from './StockInItemForm.vue';

const emit = defineEmits(['success']);
const formData = ref<ErpStockInApi.StockIn>();
const formType = ref('');
const itemFormRef = ref();

const getTitle = computed(() => {
  if (formType.value === 'create') return '添加其它入库单';
  if (formType.value === 'update') return '编辑其它入库单';
  return '其它入库单详情';
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
});

const handleUpdateItems = (items: ErpStockInApi.StockInItem[]) => {
  formData.value = modalApi.getData<ErpStockInApi.StockIn>();
  if (formData.value) {
    formData.value.items = items;
  }
};

/**
 * 创建或更新其它入库单
 */
const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    await nextTick();

    const itemFormInstance = Array.isArray(itemFormRef.value)
      ? itemFormRef.value[0]
      : itemFormRef.value;
    if (itemFormInstance && typeof itemFormInstance.validate === 'function') {
      try {
        const isValid = await itemFormInstance.validate();
        if (!isValid) {
          message.error('产品清单验证失败，请检查必填项');
          return;
        }
      } catch (error) {
        message.error(error.message || '产品清单验证失败');
        return;
      }
    } else {
      message.error('产品清单验证方法不存在');
      return;
    }

    // 验证产品清单不能为空
    if (!formData.value?.items || formData.value.items.length === 0) {
      message.error('产品清单不能为空，请至少添加一个产品');
      return;
    }

    modalApi.lock();
    // 提交表单
    const data = (await formApi.getValues()) as ErpStockInApi.StockIn;
    data.items = formData.value?.items?.map((item) => ({
      ...item,
      id: undefined,
    }));
    // 将文件数组转换为字符串
    if (data.fileUrl && Array.isArray(data.fileUrl)) {
      data.fileUrl = data.fileUrl.length > 0 ? data.fileUrl[0] : '';
    }
    try {
      await (formType.value === 'create'
        ? createStockIn(data)
        : updateStockIn(data));
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
      formData.value = { items: [] } as ErpStockInApi.StockIn;
      await nextTick();
      const itemFormInstance = Array.isArray(itemFormRef.value)
        ? itemFormRef.value[0]
        : itemFormRef.value;
      if (itemFormInstance && typeof itemFormInstance.init === 'function') {
        itemFormInstance.init([]);
      }
      // 如果是新增，自动添加一行
      if (formType.value === 'create' && itemFormInstance) {
        itemFormInstance.handleAdd();
      }
      return;
    }

    modalApi.lock();
    try {
      formData.value = await getStockIn(data.id);
      // 将字符串形式的文件URL转换为数组形式以适配FileUpload组件
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

/** 审核/反审核 */
async function handleUpdateStatus(id: number, status: number) {
  try {
    await updateStockInStatus({ id, status });
    message.success(status === 20 ? '审核成功' : '反审核成功');
    emit('success');
    await modalApi.close();
  } catch (error) {
    message.error(error.message || '操作失败');
  }
}

defineExpose({ modalApi, handleUpdateStatus });
</script>

<template>
  <Modal
    v-bind="$attrs"
    :title="getTitle"
    class="w-4/5"
    :closable="true"
    :mask-closable="true"
    :show-confirm-button="formType !== 'detail'"
  >
    <Form class="mx-3">
      <template #product="slotProps">
        <StockInItemForm
          v-bind="slotProps"
          ref="itemFormRef"
          class="w-full"
          :items="formData?.items ?? []"
          :disabled="formType === 'detail'"
          @update:items="handleUpdateItems"
        />
      </template>
    </Form>
  </Modal>
</template>
