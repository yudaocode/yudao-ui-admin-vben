<script setup lang="ts">
import type { ProductListProperty } from './config';

import { IconifyIcon } from '@vben/icons';

import { useVModel } from '@vueuse/core';

import {
  Card,
  Checkbox,
  Form,
  FormItem,
  RadioButton,
  RadioGroup,
  Slider,
  Switch,
  Tooltip,
} from 'ant-design-vue';

import UploadImg from '#/components/upload/image-upload.vue';
import { InputWithColor as ColorInput } from '#/views/mall/promotion/components';

import ComponentContainerProperty from '../../component-container-property.vue';
// TODO: 添加组件
// import SpuShowcase from '#/views/mall/product/spu/components/spu-showcase.vue';

// 商品栏属性面板
defineOptions({ name: 'ProductListProperty' });

const props = defineProps<{ modelValue: ProductListProperty }>();
const emit = defineEmits(['update:modelValue']);
const formData = useVModel(props, 'modelValue', emit);
</script>

<template>
  <ComponentContainerProperty v-model="formData.style">
    <Form :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }" :model="formData">
      <Card title="商品列表" class="property-group" :bordered="false">
        <!-- <SpuShowcase v-model="formData.spuIds" /> -->
      </Card>
      <Card title="商品样式" class="property-group" :bordered="false">
        <FormItem label="布局" prop="type">
          <RadioGroup v-model:value="formData.layoutType">
            <Tooltip title="双列" placement="bottom">
              <RadioButton value="twoCol">
                <IconifyIcon icon="fluent:text-column-two-24-filled" />
              </RadioButton>
            </Tooltip>
            <Tooltip title="三列" placement="bottom">
              <RadioButton value="threeCol">
                <IconifyIcon icon="fluent:text-column-three-24-filled" />
              </RadioButton>
            </Tooltip>
            <Tooltip title="水平滑动" placement="bottom">
              <RadioButton value="horizSwiper">
                <IconifyIcon icon="system-uicons:carousel" />
              </RadioButton>
            </Tooltip>
          </RadioGroup>
        </FormItem>
        <FormItem label="商品名称" prop="fields.name.show">
          <div class="flex gap-2">
            <ColorInput v-model="formData.fields.name.color" />
            <Checkbox v-model:checked="formData.fields.name.show" />
          </div>
        </FormItem>
        <FormItem label="商品价格" prop="fields.price.show">
          <div class="flex gap-2">
            <ColorInput v-model="formData.fields.price.color" />
            <Checkbox v-model:checked="formData.fields.price.show" />
          </div>
        </FormItem>
      </Card>
      <Card title="角标" class="property-group" :bordered="false">
        <FormItem label="角标" prop="badge.show">
          <Switch v-model:checked="formData.badge.show" />
        </FormItem>
        <FormItem label="角标" prop="badge.imgUrl" v-if="formData.badge.show">
          <UploadImg
            v-model="formData.badge.imgUrl"
            height="44px"
            width="72px"
            :show-description="false"
          >
            <template #tip> 建议尺寸：36 * 22 </template>
          </UploadImg>
        </FormItem>
      </Card>
      <Card title="商品样式" class="property-group" :bordered="false">
        <FormItem label="上圆角" prop="borderRadiusTop">
          <Slider
            v-model:value="formData.borderRadiusTop"
            :max="100"
            :min="0"
          />
        </FormItem>
        <FormItem label="下圆角" prop="borderRadiusBottom">
          <Slider
            v-model:value="formData.borderRadiusBottom"
            :max="100"
            :min="0"
          />
        </FormItem>
        <FormItem label="间隔" prop="space">
          <Slider
            v-model:value="formData.space"
            :max="100"
            :min="0"
          />
        </FormItem>
      </Card>
    </Form>
  </ComponentContainerProperty>
</template>

<style scoped lang="scss"></style>
