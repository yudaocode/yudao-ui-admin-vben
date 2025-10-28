<script setup lang="ts">
import type { ImageBarProperty } from './config';

import { useVModel } from '@vueuse/core';
import { Form, FormItem } from 'ant-design-vue';

import UploadImg from '#/components/upload/image-upload.vue';
import { AppLinkInput } from '#/views/mall/promotion/components';

import ComponentContainerProperty from '../../component-container-property.vue';

// 图片展示属性面板
defineOptions({ name: 'ImageBarProperty' });

const props = defineProps<{ modelValue: ImageBarProperty }>();
const emit = defineEmits(['update:modelValue']);
const formData = useVModel(props, 'modelValue', emit);
</script>

<template>
  <ComponentContainerProperty v-model="formData.style">
    <Form
      :label-col="{ span: 6 }"
      :wrapper-col="{ span: 18 }"
      :model="formData"
    >
      <FormItem label="上传图片" prop="imgUrl">
        <UploadImg
          v-model="formData.imgUrl"
          draggable="false"
          height="80px"
          width="100%"
          class="min-w-[80px]"
          :show-description="false"
        >
          <template #tip> 建议宽度750 </template>
        </UploadImg>
      </FormItem>
      <FormItem label="链接" prop="url">
        <AppLinkInput v-model="formData.url" />
      </FormItem>
    </Form>
  </ComponentContainerProperty>
</template>

<style scoped lang="scss"></style>
