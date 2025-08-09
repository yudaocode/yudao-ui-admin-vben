<script lang="ts" setup>
import { ref, watch } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';

import { ElMessage, ElSpace } from 'element-plus';

import { useVbenForm } from '#/adapter/form';

import { getPropertyList } from './data';
import ProductAttributes from './product-attributes.vue';
import ProductPropertyAddForm from './product-property-add-form.vue';
import SkuList from './sku-list.vue';

const props = defineProps<{
  propFormData: Object;
}>();

const emit = defineEmits(['update:activeName']);

interface PropertyAndValues {
  id: number;
  name: string;
  values?: PropertyAndValues[];
}

interface RuleConfig {
  // 需要校验的字段
  // 例：name: 'name' 则表示校验 sku.name 的值
  // 例：name: 'productConfig.stock' 则表示校验 sku.productConfig.name 的值,此处 productConfig 表示我在 Sku 上扩展的属性
  name: string;
  // 校验规格为一个毁掉函数，其中 arg 为需要校验的字段的值。
  // 例：需要校验价格必须大于0.01
  // {
  //  name:'price',
  //  rule:(arg: number) => arg > 0.01
  // }
  rule: (arg: any) => boolean;
  // 校验不通过时的消息提示
  message: string;
}

const propertyList = ref<PropertyAndValues[]>([]); // 商品属性列表

// sku 相关属性校验规则
const ruleConfig: RuleConfig[] = [
  {
    name: 'stock',
    rule: (arg) => arg >= 0,
    message: '商品库存必须大于等于 1 ！！！',
  },
  {
    name: 'price',
    rule: (arg) => arg >= 0.01,
    message: '商品销售价格必须大于等于 0.01 元！！！',
  },
  {
    name: 'marketPrice',
    rule: (arg) => arg >= 0.01,
    message: '商品市场价格必须大于等于 0.01 元！！！',
  },
  {
    name: 'costPrice',
    rule: (arg) => arg >= 0.01,
    message: '商品成本价格必须大于等于 0.00 元！！！',
  },
];

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
    ElMessage.error('【库存价格】不完善，请填写相关信息');
    emit('update:activeName', 'sku');
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
      fieldName: 'subCommissionType',
      label: '分销类型',
      component: 'RadioGroup',
      componentProps: {
        options: [
          {
            label: '默认设置',
            value: false,
          },
          {
            label: '单独设置',
            value: true,
          },
        ],
      },
      defaultValue: false,
      rules: 'required',
    },
    {
      fieldName: 'specType',
      label: '商品规格',
      component: 'RadioGroup',
      componentProps: {
        options: [
          {
            label: '单规格',
            value: false,
          },
          {
            label: '多规格',
            value: true,
          },
        ],
      },
      defaultValue: false,
      rules: 'required',
    },
    {
      fieldName: 'skuList',
      component: 'Input',
      dependencies: {
        triggerFields: ['specType'],
        show: (values) => !values.specType,
      },
    },
    {
      fieldName: 'specTypeItem',
      label: '商品属性',
      component: 'Input',
      dependencies: {
        triggerFields: ['specType'],
        show: (values) => values.specType,
      },
    },
    {
      fieldName: 'batchSettings',
      label: '批量设置',
      component: 'Input',
      dependencies: {
        triggerFields: ['specType'],
        show: (values) => values.specType && propertyList.value.length > 0,
      },
    },
    {
      fieldName: 'specTypeItemList',
      label: '规格列表',
      component: 'Input',
      dependencies: {
        triggerFields: ['specType'],
        show: (values) => values.specType && propertyList.value.length > 0,
      },
    },
  ],
  showDefaultActions: false,
});

const [ProductPropertyAddFormModal, productPropertyAddFormApi] = useVbenModal({
  connectedComponent: ProductPropertyAddForm,
  destroyOnClose: true,
});

/** 调用 SkuList generateTableData 方法*/
const skuListRef = ref();
const generateSkus = (propertyList: any[]) => {
  skuListRef.value.generateTableData(propertyList);
};

/** 将传进来的值赋值给 formData */
watch(
  () => props.propFormData,
  (data) => {
    if (!data) {
      return;
    }
    // 将 SKU 的属性，整理成 PropertyAndValues 数组
    propertyList.value = getPropertyList(data);
  },
  {
    immediate: true,
  },
);
</script>
<template>
  <Page :auto-content-height="true">
    <Form>
      <template #skuList>
        <SkuList
          ref="skuListRef"
          :prop-form-data="props.propFormData"
          :property-list="propertyList"
          :rule-config="ruleConfig"
        />
      </template>
      <template #specTypeItem>
        <ElSpace direction="vertical" alignment="flex-start">
          <ElButton type="primary" @click="productPropertyAddFormApi.open()">
            添加属性
          </ElButton>
          <ProductAttributes
            :property-list="propertyList"
            @success="generateSkus"
          />
        </ElSpace>
      </template>
      <template #batchSettings>
        <SkuList
          :is-batch="true"
          :prop-form-data="props.propFormData"
          :property-list="propertyList"
        />
      </template>
      <template #specTypeItemList>
        <SkuList
          :prop-form-data="props.propFormData"
          :property-list="propertyList"
          :rule-config="ruleConfig"
        />
      </template>
    </Form>
    <ProductPropertyAddFormModal :property-list="propertyList" />
  </Page>
</template>
