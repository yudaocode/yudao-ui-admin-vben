<script setup lang="ts">
import type { NavigationBarProperty } from './config';

import { watch } from 'vue';

import { useVModel } from '@vueuse/core';
import {
  Card,
  Checkbox,
  Form,
  FormItem,
  Radio,
  RadioGroup,
  Tooltip,
} from 'antdv-next';

import UploadImg from '#/components/upload/image-upload.vue';
import { ColorInput } from '#/views/mall/promotion/components';

import NavigationBarCellProperty from './components/cell-property.vue';
import { isNavigationBarAlwaysShow, isNavigationBarShowType } from './config';

/** 导航栏属性面板 */
defineOptions({ name: 'NavigationBarProperty' });

const props = defineProps<{ modelValue: NavigationBarProperty }>();

const emit = defineEmits(['update:modelValue']);

const rules: Record<string, any> = {
  name: [{ required: true, message: '请输入页面名称', trigger: 'blur' }],
}; // 表单校验

const formData = useVModel(props, 'modelValue', emit);
if (!isNavigationBarShowType(formData.value.showType)) {
  formData.value.showType = isNavigationBarAlwaysShow(formData.value)
    ? 'always'
    : 'scroll';
}
formData.value.alwaysShow = formData.value.showType === 'always';
if (!formData.value._local) {
  formData.value._local = { previewMp: true, previewOther: false };
}

watch(
  () => formData.value.showType,
  (showType) => {
    formData.value.alwaysShow = showType === 'always';
  },
  { immediate: true },
);
</script>

<template>
  <Form
    :label-col="{ span: 6 }"
    :wrapper-col="{ span: 18 }"
    :model="formData"
    :rules="rules"
  >
    <FormItem label="样式" name="styleType">
      <RadioGroup v-model:value="formData!.styleType">
        <Radio value="normal">标准</Radio>
        <Tooltip
          title="沉侵式头部仅支持微信小程序、APP，建议页面第一个组件为图片展示类组件"
          placement="top"
        >
          <Radio value="inner">沉浸式</Radio>
        </Tooltip>
      </RadioGroup>
    </FormItem>
    <FormItem
      label="显示方式"
      name="showType"
      v-if="formData.styleType === 'inner'"
    >
      <RadioGroup v-model:value="formData!.showType">
        <Tooltip title="头部导航栏固定显示" placement="top">
          <Radio value="always">常驻显示</Radio>
        </Tooltip>
        <Tooltip title="头部导航栏将在页面滑动时淡入" placement="top">
          <Radio value="scroll">滚动显示</Radio>
        </Tooltip>
      </RadioGroup>
    </FormItem>
    <FormItem label="背景类型" name="bgType">
      <RadioGroup v-model:value="formData.bgType">
        <Radio value="color">纯色</Radio>
        <Radio value="img">图片</Radio>
      </RadioGroup>
    </FormItem>
    <FormItem
      label="背景颜色"
      name="bgColor"
      v-if="formData.bgType === 'color'"
    >
      <ColorInput v-model="formData.bgColor" />
    </FormItem>
    <FormItem label="背景图片" name="bgImg" v-else>
      <div class="flex items-center">
        <UploadImg
          v-model="formData.bgImg"
          :limit="1"
          width="56px"
          height="56px"
          :show-description="false"
        />
        <span class="mb-2 ml-2 text-xs text-gray-400">建议宽度：750</span>
      </div>
    </FormItem>
    <Card class="property-group" variant="borderless">
      <template #title>
        <div class="flex items-center justify-between">
          <span>内容（小程序）</span>
          <FormItem name="_local.previewMp" class="mb-0">
            <Checkbox
              v-model:checked="formData._local.previewMp"
              @change="
                formData._local.previewOther = !formData._local.previewMp
              "
            >
              预览
            </Checkbox>
          </FormItem>
        </div>
      </template>
      <NavigationBarCellProperty v-model="formData.mpCells" is-mp />
    </Card>
    <Card class="property-group" variant="borderless">
      <template #title>
        <div class="flex items-center justify-between">
          <span>内容（非小程序）</span>
          <FormItem name="_local.previewOther" class="mb-0">
            <Checkbox
              v-model:checked="formData._local.previewOther"
              @change="
                formData._local.previewMp = !formData._local.previewOther
              "
            >
              预览
            </Checkbox>
          </FormItem>
        </div>
      </template>
      <NavigationBarCellProperty v-model="formData.otherCells" :is-mp="false" />
    </Card>
  </Form>
</template>
