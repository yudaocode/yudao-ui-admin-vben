<script setup lang="ts">
import type { ComponentStyle } from '../util';

import { useVModel } from '@vueuse/core';
import {
  Card,
  Form,
  FormItem,
  Radio,
  RadioGroup,
  Slider,
  TabPane,
  Tabs,
  Tree,
} from 'ant-design-vue';

import UploadImg from '#/components/upload/image-upload.vue';
import { ColorInput } from '#/views/mall/promotion/components';

/**
 * 组件容器属性：目前右边部分
 * 用于包裹组件，为组件提供 背景、外边距、内边距、边框等样式
 */
defineOptions({ name: 'ComponentContainer' });

const props = defineProps<{ modelValue: ComponentStyle }>();
const emit = defineEmits(['update:modelValue']);
const formData = useVModel(props, 'modelValue', emit);

const treeData = [
  {
    label: '外部边距',
    prop: 'margin',
    children: [
      {
        label: '上',
        prop: 'marginTop',
      },
      {
        label: '右',
        prop: 'marginRight',
      },
      {
        label: '下',
        prop: 'marginBottom',
      },
      {
        label: '左',
        prop: 'marginLeft',
      },
    ],
  },
  {
    label: '内部边距',
    prop: 'padding',
    children: [
      {
        label: '上',
        prop: 'paddingTop',
      },
      {
        label: '右',
        prop: 'paddingRight',
      },
      {
        label: '下',
        prop: 'paddingBottom',
      },
      {
        label: '左',
        prop: 'paddingLeft',
      },
    ],
  },
  {
    label: '边框圆角',
    prop: 'borderRadius',
    children: [
      {
        label: '上左',
        prop: 'borderTopLeftRadius',
      },
      {
        label: '上右',
        prop: 'borderTopRightRadius',
      },
      {
        label: '下右',
        prop: 'borderBottomRightRadius',
      },
      {
        label: '下左',
        prop: 'borderBottomLeftRadius',
      },
    ],
  },
];

const handleSliderChange = (prop: string) => {
  switch (prop) {
    case 'borderRadius': {
      formData.value.borderTopLeftRadius = formData.value.borderRadius;
      formData.value.borderTopRightRadius = formData.value.borderRadius;
      formData.value.borderBottomRightRadius = formData.value.borderRadius;
      formData.value.borderBottomLeftRadius = formData.value.borderRadius;
      break;
    }
    case 'margin': {
      formData.value.marginTop = formData.value.margin;
      formData.value.marginRight = formData.value.margin;
      formData.value.marginBottom = formData.value.margin;
      formData.value.marginLeft = formData.value.margin;
      break;
    }
    case 'padding': {
      formData.value.paddingTop = formData.value.padding;
      formData.value.paddingRight = formData.value.padding;
      formData.value.paddingBottom = formData.value.padding;
      formData.value.paddingLeft = formData.value.padding;
      break;
    }
  }
};
</script>

<template>
  <Tabs>
    <!-- 每个组件的自定义内容 -->
    <TabPane tab="内容" key="content" v-if="$slots.default">
      <slot></slot>
    </TabPane>

    <!-- 每个组件的通用内容 -->
    <TabPane tab="样式" key="style">
      <Card title="组件样式" class="property-group">
        <Form
          :model="formData"
          label-col="{ span: 6 }"
          wrapper-col="{ span: 18 }"
        >
          <FormItem label="组件背景" name="bgType">
            <RadioGroup v-model:value="formData.bgType">
              <Radio value="color">纯色</Radio>
              <Radio value="img">图片</Radio>
            </RadioGroup>
          </FormItem>
          <FormItem
            label="选择颜色"
            name="bgColor"
            v-if="formData.bgType === 'color'"
          >
            <ColorInput v-model="formData.bgColor" />
          </FormItem>
          <FormItem label="上传图片" name="bgImg" v-else>
            <UploadImg
              v-model="formData.bgImg"
              :limit="1"
              :show-description="false"
            >
              <template #tip>建议宽度 750px</template>
            </UploadImg>
          </FormItem>
          <Tree
            :tree-data="treeData"
            :expand-on-click-node="false"
            default-expand-all
          >
            <template #title="{ data, node }">
              <FormItem
                :label="data.label"
                :name="data.prop"
                class="mb-0 w-full"
              >
                <Slider
                  v-model:value="
                    formData[data.prop as keyof ComponentStyle] as number
                  "
                  :max="100"
                  :min="0"
                  @change="handleSliderChange(data.prop)"
                />
              </FormItem>
            </template>
          </Tree>
          <slot name="style" :style="formData"></slot>
        </Form>
      </Card>
    </TabPane>
  </Tabs>
</template>

<style scoped lang="scss">
:deep(.ant-slider) {
  margin-right: 16px;
}

:deep(.ant-input-number) {
  width: 50px;
}
</style>
