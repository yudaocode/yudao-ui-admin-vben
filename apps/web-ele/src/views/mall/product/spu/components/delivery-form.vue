<script lang="ts" setup>
import { watch } from 'vue';

import { ElMessage } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import * as ExpressTemplateApi from '#/api/mall/trade/delivery/expressTemplate';
import { DeliveryTypeEnum, DICT_TYPE, getIntDictOptions } from '#/utils';

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
    ElMessage.error('【物流设置】不完善，请填写相关信息');
    emit('update:activeName', 'delivery');
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
      fieldName: 'deliveryTypes',
      label: '配送方式',
      component: 'CheckboxGroup',
      componentProps: {
        options: getIntDictOptions(DICT_TYPE.TRADE_DELIVERY_TYPE),
      },
      rules: 'required',
    },
    {
      fieldName: 'deliveryTemplateId',
      label: '运费模板',
      component: 'ApiSelect',
      componentProps: {
        api: ExpressTemplateApi.getSimpleTemplateList,
        labelField: 'name',
        valueField: 'id',
      },
      rules: 'required',
      dependencies: {
        triggerFields: ['deliveryTypes'],
        show: (values) =>
          values.deliveryTypes.includes(DeliveryTypeEnum.EXPRESS.type),
      },
    },
  ],
  showDefaultActions: false,
});
</script>
<template>
  <Form />
</template>
