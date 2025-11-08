<script setup lang="ts">
import type { PromotionArticleProperty } from './config';

import type { MallArticleApi } from '#/api/mall/promotion/article';

import { onMounted, ref } from 'vue';

import { useVModel } from '@vueuse/core';
import { Form, FormItem, Select } from 'ant-design-vue';

import { getArticlePage } from '#/api/mall/promotion/article';

import ComponentContainerProperty from '../../component-container-property.vue';

// 营销文章属性面板
defineOptions({ name: 'PromotionArticleProperty' });

const props = defineProps<{ modelValue: PromotionArticleProperty }>();
const emit = defineEmits(['update:modelValue']);
const formData = useVModel(props, 'modelValue', emit);
// 文章列表
const articles = ref<MallArticleApi.Article[]>([]);

// 加载中
const loading = ref(false);
// 查询文章列表
const queryArticleList = async (title?: string) => {
  loading.value = true;
  const { list } = await getArticlePage({
    title,
    pageNo: 1,
    pageSize: 10,
  });
  articles.value = list;
  loading.value = false;
};

// 初始化
onMounted(() => {
  queryArticleList();
});
</script>

<template>
  <ComponentContainerProperty v-model="formData.style">
    <Form
      :label-col="{ span: 6 }"
      :wrapper-col="{ span: 18 }"
      :model="formData"
    >
      <FormItem label="文章" prop="id">
        <Select
          v-model:value="formData.id"
          placeholder="请选择文章"
          class="w-full"
          filterable
          :loading="loading"
          :options="
            articles.map((item: any) => ({ label: item.title, value: item.id }))
          "
          @search="queryArticleList"
        />
      </FormItem>
    </Form>
  </ComponentContainerProperty>
</template>
