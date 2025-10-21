<!-- 商品发布 - 库存价格 - 属性列表 -->
<script lang="ts" setup>
import type { PropertyAndValues } from './index';

import type { MallPropertyApi } from '#/api/mall/product/property';

import { computed, ref, watch } from 'vue';

import { Button, Col, Divider, message, Select, Tag } from 'ant-design-vue';

import {
  createPropertyValue,
  getPropertyValueSimpleList,
} from '#/api/mall/product/property';
import { $t } from '#/locales';

defineOptions({ name: 'ProductAttributes' });

const props = withDefaults(defineProps<Props>(), {
  propertyList: () => [],
  isDetail: false,
});

/** 输入框失去焦点或点击回车时触发 */
const emit = defineEmits(['success']);

interface Props {
  propertyList?: PropertyAndValues[];
  isDetail?: boolean;
}

const inputValue = ref(''); // 输入框值
const attributeIndex = ref<null | number>(null); // 获取焦点时记录当前属性项的index
// 输入框显隐控制
const inputVisible = computed(() => (index: number) => {
  if (attributeIndex.value === null) return false;
  if (attributeIndex.value === index) return true;
});

interface InputRefItem {
  inputRef?: {
    attributes: {
      id: string;
    };
  };
  focus: () => void;
}

const inputRef = ref<InputRefItem[]>([]); // 标签输入框Ref
/** 解决 ref 在 v-for 中的获取问题*/
const setInputRef = (el: any) => {
  if (el === null || el === undefined) return;
  // 如果不存在 id 相同的元素才添加
  if (
    !inputRef.value.some(
      (item) => item.inputRef?.attributes.id === el.inputRef?.attributes.id,
    )
  ) {
    inputRef.value.push(el);
  }
};
const attributeList = ref<PropertyAndValues[]>([]); // 商品属性列表
const attributeOptions = ref<MallPropertyApi.PropertyValue[]>([]); // 商品属性值下拉框

watch(
  () => props.propertyList,
  (data) => {
    if (!data) return;
    attributeList.value = data;
  },
  {
    deep: true,
    immediate: true,
  },
);

/** 删除属性值*/
const handleCloseValue = (index: number, valueIndex: number) => {
  attributeList.value?.[index]?.values?.splice(valueIndex, 1);
};

/** 删除属性*/
const handleCloseProperty = (index: number) => {
  attributeList.value?.splice(index, 1);
  emit('success', attributeList.value);
};

/** 显示输入框并获取焦点 */
const showInput = async (index: number) => {
  attributeIndex.value = index;
  inputRef.value?.[index]?.focus();
  // 获取属性下拉选项
  await getAttributeOptions(attributeList.value?.[index]?.id!);
};

// 定义 success 事件，用于操作成功后的回调
const handleInputConfirm = async (index: number, propertyId: number) => {
  if (inputValue.value) {
    // 1. 重复添加校验
    if (
      attributeList.value?.[index]?.values?.find(
        (item) => item.name === inputValue.value,
      )
    ) {
      message.warning('已存在相同属性值，请重试');
      attributeIndex.value = null;
      inputValue.value = '';
      return;
    }

    // 2.1 情况一：属性值已存在，则直接使用并结束
    const existValue = attributeOptions.value.find(
      (item) => item.name === inputValue.value,
    );
    if (existValue) {
      attributeIndex.value = null;
      inputValue.value = '';
      attributeList.value?.[index]?.values?.push({
        id: existValue.id!,
        name: existValue.name,
      });
      emit('success', attributeList.value);
      return;
    }

    // 2.2 情况二：新属性值，则进行保存
    try {
      const id = await createPropertyValue({
        propertyId,
        name: inputValue.value,
      });
      attributeList.value?.[index]?.values?.push({
        id,
        name: inputValue.value,
      });
      message.success($t('common.createSuccess'));
      emit('success', attributeList.value);
    } catch {
      message.error('添加失败，请重试');
    }
  }
  attributeIndex.value = null;
  inputValue.value = '';
};

/** 获取商品属性下拉选项 */
const getAttributeOptions = async (propertyId: number) => {
  attributeOptions.value = await getPropertyValueSimpleList(propertyId);
};
</script>

<template>
  <Col v-for="(item, index) in attributeList" :key="index">
    <div>
      <span class="mx-1">属性名：</span>
      <Tag
        :closable="!isDetail"
        class="mx-1"
        color="success"
        @close="handleCloseProperty(index)"
      >
        {{ item.name }}
      </Tag>
    </div>
    <div>
      <span class="mx-1">属性值：</span>
      <Tag
        v-for="(value, valueIndex) in item.values"
        :key="value.id"
        :closable="!isDetail"
        class="mx-1"
        @close="handleCloseValue(index, valueIndex)"
      >
        {{ value.name }}
      </Tag>
      <Select
        v-show="inputVisible(index)"
        :id="`input${index}`"
        :ref="setInputRef"
        v-model:value="inputValue"
        allow-clear
        class="!w-30"
        mode="tags"
        :max-tag-count="1"
        :filter-option="true"
        size="small"
        @blur="handleInputConfirm(index, item.id)"
        @change="handleInputConfirm(index, item.id)"
        @keyup.enter="handleInputConfirm(index, item.id)"
      >
        <Select.Option
          v-for="item2 in attributeOptions"
          :key="item2.id"
          :value="item2.name"
        >
          {{ item2.name }}
        </Select.Option>
      </Select>
      <Button
        v-show="!inputVisible(index)"
        class="button-new-tag ml-1"
        size="small"
        @click="showInput(index)"
      >
        + 添加
      </Button>
    </div>
    <Divider class="my-10px" />
  </Col>
</template>
