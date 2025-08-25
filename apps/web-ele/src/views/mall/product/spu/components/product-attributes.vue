<!-- 商品发布 - 库存价格 - 属性列表 -->
<script lang="ts" setup>
import type { PropType } from 'vue';

import type { PropertyAndValues } from './model';

import type { MallPropertyApi } from '#/api/mall/product/property';

import { computed, ref, watch } from 'vue';

import {
  ElButton,
  ElCol,
  ElDivider,
  ElMessage,
  ElSpace,
  ElTag,
  ElText,
} from 'element-plus';

import * as PropertyApi from '#/api/mall/product/property';
import { $t } from '#/locales';

defineOptions({ name: 'ProductAttributes' });

// 商品属性名称下拉框
const props = defineProps({
  propertyList: {
    type: Array as PropType<PropertyAndValues[]>,
    default: () => [],
  },
}); /** 输入框失去焦点或点击回车时触发 */
const emit = defineEmits(['success']);
const inputValue = ref(''); // 输入框值
const attributeIndex = ref<null | number>(null); // 获取焦点时记录当前属性项的index
// 输入框显隐控制
const inputVisible = computed(() => (index: number) => {
  if (attributeIndex.value === null) return false;
  if (attributeIndex.value === index) return true;
});
const inputRef = ref<any[]>([]); // 标签输入框Ref
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
const attributeOptions = ref([] as MallPropertyApi.PropertyValue[]);
watch(
  () => props.propertyList,
  (data) => {
    if (!data) return;
    attributeList.value = data as any;
  },
  {
    deep: true,
    immediate: true,
  },
);

/** 删除属性值*/
const handleCloseValue = (index: number, valueIndex: number) => {
  if (index < attributeList.value.length) {
    const values = attributeList.value[index]!.values as any[];
    values.splice(valueIndex, 1);
  }
};

/** 删除属性*/
const handleCloseProperty = (index: number) => {
  if (index < attributeList.value.length) {
    attributeList.value.splice(index, 1);
    emit('success', attributeList.value);
  }
};

/** 显示输入框并获取焦点 */
const showInput = async (index: number) => {
  if (index < attributeList.value.length) {
    attributeIndex.value = index;
    inputRef.value[index].focus();
    // 获取属性下拉选项
    await getAttributeOptions(attributeList.value[index]!.id);
  }
};

// 定义 success 事件，用于操作成功后的回调
const handleInputConfirm = async (index: number, propertyId: number) => {
  if (inputValue.value && index < attributeList.value.length) {
    // 1. 重复添加校验
    const values = attributeList.value[index]!.values as any[];
    if (values.find((item) => item.name === inputValue.value)) {
      ElMessage.warning('已存在相同属性值，请重试');
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
      const values = attributeList.value[index]!.values as any[];
      values.push({
        id: existValue.id!,
        name: existValue.name,
      });
      emit('success', attributeList.value);
      return;
    }

    // 2.2 情况二：新属性值，则进行保存
    try {
      const id = await PropertyApi.createPropertyValue({
        propertyId,
        name: inputValue.value,
      });
      const values = attributeList.value[index]!.values as any[];
      values.push({ id, name: inputValue.value });
      ElMessage.success($t('common.createSuccess'));
      emit('success', attributeList.value);
    } catch {
      ElMessage.error('添加失败，请重试');
    }
  }
  attributeIndex.value = null;
  inputValue.value = '';
};

/** 获取商品属性下拉选项 */
const getAttributeOptions = async (propertyId: number) => {
  attributeOptions.value =
    await PropertyApi.getPropertyValueSimpleList(propertyId);
};
</script>

<template>
  <ElCol v-for="(item, index) in attributeList" :key="index">
    <div>
      <ElText class="mx-1">属性名：</ElText>
      <ElTag class="mx-1" type="success" @close="handleCloseProperty(index)">
        {{ item.name }}
      </ElTag>
    </div>
    <div>
      <ElSpace :size="1">
        <ElText class="mx-1">属性值：</ElText>
        <ElTag
          v-for="(value, valueIndex) in item.values"
          :key="value.id"
          class="mx-1"
          @close="handleCloseValue(index, valueIndex)"
        >
          {{ value.name }}
        </ElTag>
        <ElSelect
          v-show="inputVisible(index)"
          :id="`input${index}`"
          :ref="setInputRef"
          v-model="inputValue"
          :reserve-keyword="false"
          allow-create
          class="!w-30"
          default-first-option
          filterable
          size="small"
          @blur="handleInputConfirm(index, item.id)"
          @change="handleInputConfirm(index, item.id)"
          @keyup.enter="handleInputConfirm(index, item.id)"
        >
          <el-option
            v-for="item2 in attributeOptions"
            :key="item2.id"
            :label="item2.name"
            :value="item2.name"
          />
        </ElSelect>
        <ElButton
          v-show="!inputVisible(index)"
          class="button-new-tag ml-1"
          size="small"
          @click="showInput(index)"
        >
          + 添加
        </ElButton>
      </ElSpace>
    </div>
    <ElDivider class="my-10px" />
  </ElCol>
</template>
