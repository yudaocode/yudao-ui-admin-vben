<script lang="ts" setup>
import type { MallBargainActivityApi } from '#/api/mall/promotion/bargain/bargainActivity';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import {
  createBargainActivity,
  getBargainActivity,
  updateBargainActivity,
} from '#/api/mall/promotion/bargain/bargainActivity';
import { $t } from '#/locales';
import { SpuShowcase } from '#/views/mall/product/spu/components';

import { useFormSchema } from '../data';

defineOptions({ name: 'PromotionBargainActivityForm' });

const emit = defineEmits(['success']);

const formData = ref<Partial<MallBargainActivityApi.BargainActivity>>({});
const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['砍价活动'])
    : $t('ui.actionTitle.create', ['砍价活动']);
});

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    formItemClass: 'col-span-2',
    labelWidth: 120,
  },
  layout: 'horizontal',
  schema: useFormSchema(),
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
    const values = await formApi.getValues();
    const data = {
      ...values,
      spuId: formData.value.spuId,
    } as MallBargainActivityApi.BargainActivity;
    try {
      await (formData.value?.id
        ? updateBargainActivity(data)
        : createBargainActivity(data));
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
      formData.value = {};
      return;
    }
    // 加载数据
    const data = modalApi.getData<MallBargainActivityApi.BargainActivity>();
    if (!data || !data.id) {
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getBargainActivity(data.id);
      // 设置到 values
      await formApi.setValues(formData.value);
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal class="w-2/5" :title="getTitle">
    <Form class="mx-4">
      <!-- 自定义插槽：商品选择 -->
      <template #spuId>
        <SpuShowcase v-model="formData.spuId" :limit="1" />
      </template>
    </Form>
  </Modal>
</template>
