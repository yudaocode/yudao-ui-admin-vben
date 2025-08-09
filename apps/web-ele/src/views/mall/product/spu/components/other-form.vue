<script lang="ts" setup>
import { watch } from 'vue';

import { ElMessage } from 'element-plus';

import { useVbenForm } from '#/adapter/form';

const props = defineProps<{
  propFormData: Object;
}>();

const emit = defineEmits(['update:activeName']);

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

const validate = async () => {
  const { valid } = await formApi.validate();
  if (!valid) {
    return;
  }
  try {
    // 校验通过更新数据
    Object.assign(props.propFormData, formApi.getValues());
  } catch (error) {
    ElMessage.error('【其它设置】不完善，请填写相关信息');
    emit('update:activeName', 'other');
    throw error; // 目的截断之后的校验
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
      fieldName: 'sort',
      label: '商品排序',
      component: 'InputNumber',
      componentProps: {
        min: 0,
        step: 1,
      },
      rules: 'required',
    },
    {
      fieldName: 'giveIntegral',
      label: '赠送积分',
      component: 'InputNumber',
      componentProps: {
        min: 0,
        step: 1,
      },
      rules: 'required',
    },
    {
      fieldName: 'virtualSalesCount',
      label: '虚拟销量',
      component: 'InputNumber',
      componentProps: {
        min: 0,
        step: 1,
      },
      rules: 'required',
    },
  ],
  showDefaultActions: false,
});
</script>
<template>
  <Form />
</template>
