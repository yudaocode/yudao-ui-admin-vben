<script lang="ts" setup>
import type { OaSupplyItemApi } from '#/api/oa/supply/item';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { stockInSupplyItem } from '#/api/oa/supply/item';

import { useStockFormSchema } from '../data';

const emit = defineEmits(['success']);
const formData = ref<OaSupplyItemApi.SupplyItem>();
const getTitle = computed(() => `入库 - ${formData.value?.name || ''}`);

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    labelWidth: 90,
  },
  layout: 'horizontal',
  schema: useStockFormSchema(),
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
    const data = (await formApi.getValues()) as OaSupplyItemApi.SupplyItem & {
      quantity: number;
    };
    try {
      await stockInSupplyItem(formData.value!.id!, data.quantity);
      // 关闭并提示
      await modalApi.close();
      emit('success');
      message.success('入库成功');
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      formData.value = undefined;
      return;
    }
    // 设置当前入库物品
    const data = modalApi.getData() as OaSupplyItemApi.SupplyItem;
    formData.value = data;
    await formApi.setValues({ ...data, quantity: undefined });
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-[550px]">
    <Form class="mx-4" />
  </Modal>
</template>
