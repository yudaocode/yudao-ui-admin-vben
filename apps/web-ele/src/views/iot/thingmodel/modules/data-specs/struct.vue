<script lang="ts" setup>
import type { Ref } from 'vue';

import { onMounted, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { IoTDataSpecsDataTypeEnum } from '@vben/constants';
import { cloneDeep, isEmpty } from '@vben/utils';

import { useVModel } from '@vueuse/core';
import { ElButton, ElDivider, ElForm, ElFormItem, ElInput } from 'element-plus';

import { ThingModelFormRules } from '#/api/iot/thingmodel';

import ThingModelProperty from '../property.vue';

const props = withDefaults(
  defineProps<{
    /** 父表单中 dataSpecsList 的 prop 路径（点号分隔），默认 property.dataSpecsList；
     * array 嵌套 struct 时父级需传 'property.dataSpecs.dataSpecsList'，
     * 否则父表单 validate() 无法定位该字段，非空校验不会触发。 */
    fieldPath?: string;
    modelValue: any;
  }>(),
  {
    fieldPath: 'property.dataSpecsList',
  },
);
const emits = defineEmits(['update:modelValue']);
const dataSpecsList = useVModel(props, 'modelValue', emits) as Ref<any[]>;

const structFormRef = ref();
const formData = ref<any>(buildEmptyFormData());

/** 校验结构体属性对象非空 */
function validateStructSpecsList(_rule: any, _value: any, callback: any) {
  if (isEmpty(dataSpecsList.value)) {
    callback(new Error('请至少添加一个结构体属性对象'));
    return;
  }
  callback();
}

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    try {
      await structFormRef.value?.validate();
    } catch {
      return;
    }
    const data = formData.value;
    const item = {
      identifier: data.identifier,
      name: data.name,
      description: data.description,
      dataType: IoTDataSpecsDataTypeEnum.STRUCT,
      childDataType: data.property.dataType,
      dataSpecs:
        !isEmpty(data.property.dataSpecs) &&
        Object.keys(data.property.dataSpecs).length > 1
          ? data.property.dataSpecs
          : undefined,
      dataSpecsList: isEmpty(data.property.dataSpecsList)
        ? undefined
        : data.property.dataSpecsList,
    };
    const existingIndex = dataSpecsList.value.findIndex(
      (spec) => spec.identifier === data.identifier,
    );
    if (existingIndex === -1) {
      dataSpecsList.value.push(item);
    } else {
      dataSpecsList.value[existingIndex] = item;
    }
    await modalApi.close();
  },
  onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      return;
    }
    formData.value = buildEmptyFormData();
    structFormRef.value?.clearValidate?.();
    const data = modalApi.getData<any>();
    if (isEmpty(data)) {
      return;
    }
    // 编辑回显时 cloneDeep，避免弹窗 v-model 改到原始对象（用户取消时不污染外层 dataSpecsList）
    formData.value = {
      identifier: data.identifier ?? '',
      name: data.name ?? '',
      description: data.description ?? '',
      property: {
        dataType: data.childDataType ?? IoTDataSpecsDataTypeEnum.INT,
        dataSpecs: data.dataSpecs ? cloneDeep(data.dataSpecs) : {},
        dataSpecsList: data.dataSpecsList ? cloneDeep(data.dataSpecsList) : [],
      },
    };
  },
});

/** 构造空白结构体表单 */
function buildEmptyFormData() {
  return {
    identifier: '',
    name: '',
    description: '',
    property: {
      dataType: IoTDataSpecsDataTypeEnum.INT,
      dataSpecs: { dataType: IoTDataSpecsDataTypeEnum.INT },
      dataSpecsList: [],
    },
  };
}

/** 打开结构体表单 */
function openStructForm(val: any) {
  modalApi.setData(val).open();
}

/** 删除结构体项 */
function deleteStructItem(index: number) {
  dataSpecsList.value.splice(index, 1);
}

onMounted(() => {
  if (isEmpty(dataSpecsList.value)) {
    dataSpecsList.value = [];
  }
});
</script>

<template>
  <ElFormItem
    :prop="fieldPath"
    :rules="[{ validator: validateStructSpecsList, trigger: 'change' }]"
    label="属性对象"
  >
    <div
      v-for="(item, index) in dataSpecsList"
      :key="index"
      class="mb-2.5 flex w-full justify-between bg-gray-100 px-2.5 dark:bg-gray-800"
    >
      <span>参数：{{ item.name }}</span>
      <div>
        <ElButton link type="primary" @click="openStructForm(item)">
          编辑
        </ElButton>
        <ElDivider direction="vertical" />
        <ElButton link type="danger" @click="deleteStructItem(index)">
          删除
        </ElButton>
      </div>
    </div>
    <ElButton link type="primary" @click="openStructForm(null)">
      + 新增参数
    </ElButton>
  </ElFormItem>

  <!-- 结构体参数表单 -->
  <Modal class="w-2/5" title="结构体参数">
    <ElForm
      ref="structFormRef"
      :model="formData"
      class="mx-4"
      label-width="140px"
    >
      <ElFormItem
        :rules="ThingModelFormRules.name"
        label="参数名称"
        prop="name"
      >
        <ElInput v-model="formData.name" placeholder="请输入参数名称" />
      </ElFormItem>
      <ElFormItem
        :rules="ThingModelFormRules.identifier"
        label="标识符"
        prop="identifier"
      >
        <ElInput v-model="formData.identifier" placeholder="请输入标识符" />
      </ElFormItem>
      <!-- 属性配置 -->
      <ThingModelProperty v-model="formData.property" is-struct-data-specs />
    </ElForm>
  </Modal>
</template>
