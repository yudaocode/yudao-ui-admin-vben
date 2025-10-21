<!-- 商品发布 - 库存价格 - 添加属性 -->
<script lang="ts" setup>
import type { VbenFormSchema } from '#/adapter/form';
import type { MallPropertyApi } from '#/api/mall/product/property';

import { ref, watch } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import {
  createProperty,
  getPropertySimpleList,
} from '#/api/mall/product/property';
import { $t } from '#/locales';

defineOptions({ name: 'ProductPropertyAddForm' });

const props = defineProps({
  propertyList: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits<{
  success: [];
}>();

const attributeList = ref<any[]>([]); // 商品属性列表
const attributeOptions = ref<MallPropertyApi.Property[]>([]); // 商品属性名称下拉框

watch(
  () => props.propertyList,
  (data) => {
    if (!data) return;
    attributeList.value = data as any[];
  },
  {
    deep: true,
    immediate: true,
  },
);

// 表单配置
const formSchema: VbenFormSchema[] = [
  {
    fieldName: 'name',
    label: '属性名称',
    component: 'ApiSelect',
    componentProps: {
      api: async () => {
        const data = await getPropertySimpleList();
        attributeOptions.value = data;
        return data.map((item: MallPropertyApi.Property) => ({
          label: item.name,
          value: item.name,
        }));
      },
      showSearch: true,
      filterOption: true,
      placeholder: '请选择属性名称。如果不存在，可手动输入选择',
      // 支持手动输入新选项
      mode: 'tags',
      maxTagCount: 1,
      allowClear: true,
    },
    rules: 'required',
  },
];

// 初始化表单
const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    formItemClass: 'col-span-2',
    labelWidth: 120,
  },
  layout: 'horizontal',
  schema: formSchema,
  showDefaultActions: false,
});

// 初始化弹窗
const [Modal, modalApi] = useVbenModal({
  destroyOnClose: true, // 关键：关闭时销毁弹窗，确保每次打开都是全新状态
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;

    const values = await formApi.getValues();
    const name = Array.isArray(values.name) ? values.name[0] : values.name;

    // 重复添加校验
    for (const attrItem of attributeList.value) {
      if (attrItem.name === name) {
        message.error('该属性已存在，请勿重复添加');
        return;
      }
    }

    // 情况一：属性名已存在，则直接使用
    const existProperty = attributeOptions.value.find(
      (item: MallPropertyApi.Property) => item.name === name,
    );
    if (existProperty) {
      attributeList.value.push({
        id: existProperty.id,
        name,
        values: [],
      });
      await modalApi.close();
      emit('success');
      return;
    }

    // 情况二：如果是不存在的属性，则需要执行新增
    try {
      const data = { name } as MallPropertyApi.Property;
      const propertyId = await createProperty(data);
      // 添加到属性列表
      attributeList.value.push({
        id: propertyId,
        name,
        values: [],
      });
      message.success($t('common.createSuccess'));
      await modalApi.close();
      emit('success');
    } catch (error) {
      // 发生错误时不关闭弹窗
      console.error('添加属性失败:', error);
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      return;
    }
    // 重置表单
    await formApi.resetForm();
  },
});
</script>

<template>
  <Modal title="添加商品属性">
    <Form />
  </Modal>
</template>
