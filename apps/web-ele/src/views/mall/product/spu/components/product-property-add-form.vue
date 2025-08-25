<script lang="ts" setup>
import type { PropType } from 'vue';

import type { MallPropertyApi } from '#/api/mall/product/property';

import { ref, watch } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { ElMessage } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import { getPropertySimpleList } from '#/api/mall/product/property';
import * as PropertyApi from '#/api/mall/product/property';
import { $t } from '#/locales';

// 扩展Property接口，添加values属性
interface ExtendedProperty extends MallPropertyApi.Property {
  values?: any[];
}

// 商品属性名称下拉框

const props = defineProps({
  propertyList: {
    type: Array as PropType<ExtendedProperty[]>,
    default: () => [],
  },
});

const emit = defineEmits(['success']);

const attributeList = ref<ExtendedProperty[]>([]); // 商品属性列表
const attributeOptions = ref([] as MallPropertyApi.Property[]);
const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    formItemClass: 'col-span-2',
    labelWidth: 120,
  },
  layout: 'horizontal',
  schema: [
    {
      fieldName: 'name',
      label: '属性名称',
      component: 'ApiSelect',
      componentProps: {
        api: getPropertySimpleList,
        labelField: 'name',
        valueField: 'id',
        defaultFirstOption: true,
        filterable: true,
        allowCreate: true,
        placeholder: '请选择属性名称。如果不存在，可手动输入选择',
      },
    },
  ],
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    modalApi.lock();
    const { name } = await formApi.getValues();
    // 1.1 重复添加校验
    for (const attrItem of attributeList.value) {
      if (attrItem.name === name) {
        return ElMessage.error('该属性已存在，请勿重复添加');
      }
    }
    // 1.2 校验表单
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }

    // 2.1 情况一：属性名已存在，则直接使用并结束
    const existProperty = attributeOptions.value.find(
      (item) => item.name === name,
    );
    if (existProperty) {
      // 添加到属性列表
      attributeList.value.push({
        id: existProperty.id,
        ...(await formApi.getValues()),
        values: [],
      });
      // 关闭弹窗
      modalApi.close();
      return;
    }

    // 2.2 情况二：如果是不存在的属性，则需要执行新增
    // 提交请求
    modalApi.lock();
    try {
      const data = (await formApi.getValues()) as MallPropertyApi.Property;
      const propertyId = await PropertyApi.createProperty(data);
      // 添加到属性列表
      attributeList.value.push({
        id: propertyId,
        ...(await formApi.getValues()),
        values: [],
      });
      // 关闭弹窗
      ElMessage.success($t('common.createSuccess'));
      modalApi.close();
    } finally {
      modalApi.unlock();
    }
  },
});

watch(
  () => props.propertyList, // 解决 props 无法直接修改父组件的问题
  (data) => {
    if (!data) return;
    attributeList.value = data;
  },
  {
    deep: true,
    immediate: true,
  },
);
</script>

<template>
  <Modal class="w-2/5" title="添加商品属性">
    <Form class="mx-4" />
  </Modal>
</template>
