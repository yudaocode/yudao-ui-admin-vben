<script setup lang="ts">
import type { FloatingActionButtonProperty } from './config';

import { useVModel } from '@vueuse/core';
import {
  Card,
  Form,
  FormItem,
  Radio,
  RadioGroup,
  Switch,
} from 'ant-design-vue';

import UploadImg from '#/components/upload/image-upload.vue';
import {
  AppLinkInput,
  Draggable,
  InputWithColor,
} from '#/views/mall/promotion/components';

/** 悬浮按钮属性面板 */
defineOptions({ name: 'FloatingActionButtonProperty' });

const props = defineProps<{ modelValue: FloatingActionButtonProperty }>();

const emit = defineEmits(['update:modelValue']);

const formData = useVModel(props, 'modelValue', emit);
</script>

<template>
  <Form :model="formData">
    <Card title="按钮配置" class="property-group">
      <FormItem label="展开方向" name="direction">
        <RadioGroup v-model:value="formData.direction">
          <Radio value="vertical">垂直</Radio>
          <Radio value="horizontal">水平</Radio>
        </RadioGroup>
      </FormItem>
      <FormItem label="显示文字" name="showText">
        <Switch v-model:checked="formData.showText" />
      </FormItem>
    </Card>
    <Card title="按钮列表" class="property-group">
      <Draggable v-model="formData.list" :empty-item="{ textColor: '#fff' }">
        <template #default="{ element, index }">
          <FormItem label="图标" :name="`list[${index}].imgUrl`">
            <UploadImg
              v-model="element.imgUrl"
              height="56px"
              width="56px"
              :show-description="false"
            />
          </FormItem>
          <FormItem label="文字" :name="`list[${index}].text`">
            <InputWithColor
              v-model="element.text"
              v-model:color="element.textColor"
            />
          </FormItem>
          <FormItem label="跳转链接" :name="`list[${index}].url`">
            <AppLinkInput v-model="element.url" />
          </FormItem>
        </template>
      </Draggable>
    </Card>
  </Form>
</template>
