<script lang="ts" setup>
import type { MallArticleApi } from '#/api/mall/promotion/article';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { ElMessage } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import {
  createArticle,
  getArticle,
  updateArticle,
} from '#/api/mall/promotion/article';
import { $t } from '#/locales';
import { SpuShowcase } from '#/views/mall/product/spu/components';

import { useFormSchema } from '../data';

const emit = defineEmits(['success']);

const formData = ref<MallArticleApi.Article>();
const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['文章'])
    : $t('ui.actionTitle.create', ['文章']);
});

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    labelWidth: 120,
  },
  wrapperClass: 'grid-cols-2',
  layout: 'horizontal',
  schema: useFormSchema(),
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    // 同步商品选择到表单，确保验证时能获取到值
    if (formData.value?.spuId) {
      await formApi.setFieldValue('spuId', formData.value.spuId);
    }
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    modalApi.lock();
    // 提交表单
    const data = (await formApi.getValues()) as MallArticleApi.Article;
    try {
      await (formData.value?.id ? updateArticle(data) : createArticle(data));
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
    const data = modalApi.getData<MallArticleApi.Article>();
    if (!data || !data.id) {
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getArticle(data.id);
      // 设置到 values
      await formApi.setValues(formData.value);
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-2/5">
    <Form class="mx-4">
      <!-- 自定义插槽：商品选择 -->
      <template #spuId>
        <SpuShowcase v-model="formData!.spuId" :limit="1" />
      </template>
    </Form>
  </Modal>
</template>
