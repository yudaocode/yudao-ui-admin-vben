<script lang="ts" setup>
import { useVbenForm } from '#/adapter/form';
import * as ExpressTemplateApi from '#/api/mall/trade/delivery/expressTemplate';
import { watch } from 'vue';
import { ElMessage } from 'element-plus';
import { DICT_TYPE, getIntDictOptions, DeliveryTypeEnum } from '#/utils';

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
    ElMessage.error('【其它设置】不完善，请填写相关信息');
    emit('update:activeName', 'other');
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
