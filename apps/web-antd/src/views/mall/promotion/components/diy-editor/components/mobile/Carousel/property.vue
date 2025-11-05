<script setup lang="ts">
import type { CarouselProperty } from './config';

import { IconifyIcon } from '@vben/icons';

import { useVModel } from '@vueuse/core';
import {
  Card,
  Form,
  FormItem,
  Radio,
  RadioButton,
  RadioGroup,
  Slider,
  Switch,
  Tooltip,
} from 'ant-design-vue';

import UploadFile from '#/components/upload/file-upload.vue';
import UploadImg from '#/components/upload/image-upload.vue';
import { AppLinkInput, Draggable } from '#/views/mall/promotion/components';

import ComponentContainerProperty from '../../component-container-property.vue';

// 轮播图属性面板
defineOptions({ name: 'CarouselProperty' });

const props = defineProps<{ modelValue: CarouselProperty }>();
const emit = defineEmits(['update:modelValue']);
const formData = useVModel(props, 'modelValue', emit);
</script>

<template>
  <ComponentContainerProperty v-model="formData.style">
    <Form label-width="80px" :model="formData">
      <Card header="样式设置" class="property-group" shadow="never">
        <FormItem label="样式" prop="type">
          <RadioGroup v-model="formData.type">
            <Tooltip class="item" content="默认" placement="bottom">
              <RadioButton value="default">
                <IconifyIcon icon="system-uicons:carousel" class="size-6" />
              </RadioButton>
            </Tooltip>
            <Tooltip class="item" content="卡片" placement="bottom">
              <RadioButton value="card">
                <IconifyIcon icon="ic:round-view-carousel" class="size-6" />
              </RadioButton>
            </Tooltip>
          </RadioGroup>
        </FormItem>
        <FormItem label="指示器" prop="indicator">
          <RadioGroup v-model="formData.indicator">
            <Radio value="dot">小圆点</Radio>
            <Radio value="number">数字</Radio>
          </RadioGroup>
        </FormItem>
        <FormItem label="是否轮播" prop="autoplay">
          <Switch v-model="formData.autoplay" />
        </FormItem>
        <FormItem label="播放间隔" prop="interval" v-if="formData.autoplay">
          <Slider
            v-model="formData.interval"
            :max="10"
            :min="0.5"
            :step="0.5"
            show-input
            input-size="small"
            :show-input-controls="false"
          />
          <p class="text-info">单位：秒</p>
        </FormItem>
      </Card>
      <Card header="内容设置" class="property-group" shadow="never">
        <Draggable v-model="formData.items" :empty-item="{ type: 'img' }">
          <template #default="{ element }">
            <FormItem label="类型" prop="type" class="mb-2" label-width="40px">
              <RadioGroup v-model="element.type">
                <Radio value="img">图片</Radio>
                <Radio value="video">视频</Radio>
              </RadioGroup>
            </FormItem>
            <FormItem
              label="图片"
              class="mb-2"
              label-width="40px"
              v-if="element.type === 'img'"
            >
              <UploadImg
                v-model="element.imgUrl"
                draggable="false"
                height="80px"
                width="100%"
                class="min-w-20"
                :show-description="false"
              />
            </FormItem>
            <template v-else>
              <FormItem label="封面" class="mb-2" label-width="40px">
                <UploadImg
                  v-model="element.imgUrl"
                  draggable="false"
                  :show-description="false"
                  height="80px"
                  width="100%"
                  class="min-w-20"
                />
              </FormItem>
              <FormItem label="视频" class="mb-2" label-width="40px">
                <UploadFile
                  v-model="element.videoUrl"
                  :file-type="['mp4']"
                  :limit="1"
                  :file-size="100"
                  class="min-w-20"
                />
              </FormItem>
            </template>
            <FormItem label="链接" class="mb-2" label-width="40px">
              <AppLinkInput v-model="element.url" />
            </FormItem>
          </template>
        </Draggable>
      </Card>
    </Form>
  </ComponentContainerProperty>
</template>
