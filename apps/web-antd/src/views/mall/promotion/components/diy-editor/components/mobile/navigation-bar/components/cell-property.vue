<script lang="ts" setup>
import type { NavigationBarCellProperty } from '../config';

import type { Rect } from '#/views/mall/promotion/components/magic-cube-editor/util';

import { computed, ref } from 'vue';

import { useVModel } from '@vueuse/core';
import {
  FormItem,
  Image,
  Input,
  Radio,
  RadioGroup,
  Slider,
} from 'ant-design-vue';

import appNavBarMp from '#/assets/imgs/diy/app-nav-bar-mp.png';
import UploadImg from '#/components/upload/image-upload.vue';
import {
  AppLinkInput,
  ColorInput,
  MagicCubeEditor,
} from '#/views/mall/promotion/components';

// 导航栏属性面板
defineOptions({ name: 'NavigationBarCellProperty' });

const props = defineProps({
  isMp: {
    type: Boolean,
    default: true,
  },
  modelValue: {
    type: Array as () => NavigationBarCellProperty[],
    default: () => [],
  },
});
const emit = defineEmits(['update:modelValue']);
const cellList = useVModel(props, 'modelValue', emit);

// 单元格数量：小程序6个（右侧胶囊按钮占了2个），其它平台8个
const cellCount = computed(() => (props.isMp ? 6 : 8));

// 转换为Rect格式的数据
const rectList = computed<Rect[]>(() => {
  return cellList.value.map((cell) => ({
    left: cell.left,
    top: cell.top,
    width: cell.width,
    height: cell.height,
    right: cell.left + cell.width,
    bottom: cell.top + cell.height,
  }));
});

// 选中的热区
const selectedHotAreaIndex = ref(0);
const handleHotAreaSelected = (
  cellValue: NavigationBarCellProperty,
  index: number,
) => {
  selectedHotAreaIndex.value = index;
  if (!cellValue.type) {
    cellValue.type = 'text';
    cellValue.textColor = '#111111';
  }
};
</script>

<template>
  <div class="h-40px flex items-center justify-center">
    <MagicCubeEditor
      v-model="rectList"
      :cols="cellCount"
      :cube-size="38"
      :rows="1"
      class="m-b-16px"
      @hot-area-selected="handleHotAreaSelected"
    />
    <Image v-if="isMp" alt="" class="w-19 h-8" :src="appNavBarMp" />
  </div>
  <template v-for="(cell, cellIndex) in cellList" :key="cellIndex">
    <template v-if="selectedHotAreaIndex === Number(cellIndex)">
      <FormItem label="类型">
        <RadioGroup v-model:value="cell.type">
          <Radio value="text">文字</Radio>
          <Radio value="image">图片</Radio>
          <Radio value="search">搜索框</Radio>
        </RadioGroup>
      </FormItem>
      <!-- 1. 文字 -->
      <template v-if="cell.type === 'text'">
        <FormItem label="内容">
          <Input v-model:value="cell!.text" :maxlength="10" show-count />
        </FormItem>
        <FormItem label="颜色">
          <ColorInput v-model="cell!.textColor" />
        </FormItem>
        <FormItem label="链接">
          <AppLinkInput v-model="cell.url" />
        </FormItem>
      </template>
      <!-- 2. 图片 -->
      <template v-else-if="cell.type === 'image'">
        <FormItem label="图片">
          <UploadImg
            v-model="cell.imgUrl"
            :limit="1"
            :show-description="false"
            class="size-14"
          />
          <span class="text-xs text-gray-500">建议尺寸 56*56</span>
        </FormItem>
        <FormItem label="链接">
          <AppLinkInput v-model="cell.url" />
        </FormItem>
      </template>
      <!-- 3. 搜索框 -->
      <template v-else>
        <FormItem label="提示文字">
          <Input v-model:value="cell.placeholder" :maxlength="10" show-count />
        </FormItem>
        <FormItem label="圆角">
          <Slider v-model:value="cell.borderRadius" :max="100" :min="0" />
        </FormItem>
      </template>
    </template>
  </template>
</template>
