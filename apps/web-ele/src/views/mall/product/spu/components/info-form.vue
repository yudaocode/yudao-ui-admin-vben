<script lang="ts" setup>
import { useVbenForm } from '#/adapter/form';
import { handleTree } from '@vben/utils';
import * as ProductCategoryApi from '#/api/mall/product/category';
import * as ProductBrandApi from '#/api/mall/product/brand';
import { watch } from 'vue';
import { ElMessage } from 'element-plus';

const getCategoryList = async () => {
  const data = await ProductCategoryApi.getCategorySimpleList();
  return handleTree(data, 'id');
};

const props = defineProps<{
  propFormData: Object;
}>();

/** 将传进来的值赋值给 formData */
watch(
  () => props.propFormData,
  (data) => {
    if (!data) {
      return;
    }
    formApi.setValues(data);
  },
);

const emit = defineEmits(['update:activeName']);
const validate = async () => {
  const { valid } = await formApi.validate();
  if (!valid) {
    return;
  }
  try {
    // 校验通过更新数据
    Object.assign(props.propFormData, formApi.getValues());
  } catch (e) {
    ElMessage.error('【基础设置】不完善，请填写相关信息');
    emit('update:activeName', 'info');
    throw e; // 目的截断之后的校验
  }
};
defineExpose({ validate });

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: '!w-1/6',
    },
    formItemClass: 'col-span-2',
    labelWidth: 120,
  },
  layout: 'horizontal',
  schema: [
    {
      fieldName: 'name',
      label: '商品名称',
      component: 'Input',
      componentProps: {
        placeholder: '请输入商品名称',
      },
      rules: 'required',
    },
    {
      fieldName: 'categoryId',
      label: '商品分类',
      component: 'ApiCascader',
      componentProps: {
        api: getCategoryList,
        props: {
          label: 'name',
          value: 'id',
          children: 'children',
        },
      },
      rules: 'required',
    },
    {
      fieldName: 'brandId',
      label: '商品品牌',
      component: 'ApiSelect',
      componentProps: {
        api: ProductBrandApi.getSimpleBrandList,
        labelField: 'name',
        valueField: 'id',
      },
    },
    {
      fieldName: 'keyword',
      label: '商品关键字',
      component: 'Input',
      componentProps: {
        placeholder: '请输入商品关键字',
      },
      rules: 'required',
    },
    {
      fieldName: 'introduction',
      label: '商品简介',
      component: 'Input',
      componentProps: {
        type: 'textarea',
        placeholder: '请输入商品简介',
        maxlength: 128,
        showWordLimit: true,
        autosize: {
          minRows: 4,
          maxRows: 4,
        },
      },
      rules: 'required',
    },
    {
      fieldName: 'picUrl',
      label: '商品封面图',
      component: 'ImageUpload',
      componentProps: {
        max: 1,
        class: 'w-full',
      },
    },
    {
      fieldName: 'sliderPicUrls',
      label: '商品轮播图',
      component: 'ImageUpload',
      componentProps: {
        max: 10,
        class: 'w-full',
      },
    },
  ],
  showDefaultActions: false,
});
</script>
<template>
  <Form />
</template>
