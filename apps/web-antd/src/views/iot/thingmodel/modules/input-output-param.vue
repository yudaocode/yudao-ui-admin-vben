<script lang="ts" setup>
import type { Ref } from 'vue';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { IoTDataSpecsDataTypeEnum } from '@vben/constants';
import { cloneDeep, isEmpty } from '@vben/utils';

import { useVModel } from '@vueuse/core';
import { Button, Divider, Form, Input, message } from 'ant-design-vue';

import { ThingModelFormRules } from '#/api/iot/thingmodel';

import ThingModelProperty from './property.vue';

const props = defineProps<{
  direction: string;
  existingIdentifiers?: string[];
  modelValue: any;
}>();
const emits = defineEmits(['update:modelValue']);
const thingModelParams = useVModel(props, 'modelValue', emits) as Ref<any[]>;

const paramFormRef = ref();
const formData = ref<any>(buildEmptyFormData());

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    try {
      await paramFormRef.value?.validate();
    } catch {
      return;
    }
    if (!thingModelParams.value) {
      thingModelParams.value = [];
    }
    // 组装表单
    const data = formData.value;
    if (
      data.identifier &&
      props.existingIdentifiers?.includes(data.identifier)
    ) {
      message.warning('输入参数和输出参数标识符不能重复');
      return;
    }
    const item = {
      identifier: data.identifier,
      name: data.name,
      description: data.description,
      dataType: data.property.dataType,
      paraOrder: 0,
      direction: props.direction,
      dataSpecs:
        !isEmpty(data.property.dataSpecs) &&
        Object.keys(data.property.dataSpecs).length > 1
          ? data.property.dataSpecs
          : undefined,
      dataSpecsList: isEmpty(data.property.dataSpecsList)
        ? undefined
        : data.property.dataSpecsList,
    };
    // 按 identifier 去重；存在则更新，否则追加
    const existingIndex = thingModelParams.value.findIndex(
      (spec) => spec.identifier === data.identifier,
    );
    if (existingIndex === -1) {
      thingModelParams.value.push(item);
    } else {
      thingModelParams.value[existingIndex] = item;
    }
    // 关闭
    await modalApi.close();
  },
  onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      return;
    }
    formData.value = buildEmptyFormData();
    paramFormRef.value?.clearValidate?.();
    // 加载数据
    const data = modalApi.getData<any>();
    if (isEmpty(data)) {
      return;
    }
    // 编辑回显时 cloneDeep，避免弹窗 v-model 改到原始对象（用户取消时不污染外层 thingModelParams）
    formData.value = {
      identifier: data.identifier ?? '',
      name: data.name ?? '',
      description: data.description ?? '',
      property: {
        dataType: data.dataType ?? IoTDataSpecsDataTypeEnum.INT,
        dataSpecs: data.dataSpecs ? cloneDeep(data.dataSpecs) : {},
        dataSpecsList: data.dataSpecsList ? cloneDeep(data.dataSpecsList) : [],
      },
    };
  },
});

/** 构造空白参数表单 */
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

/** 打开参数表单（新增或编辑） */
function openParamForm(val: any) {
  modalApi.setData(val).open();
}

/** 删除参数项 */
function deleteParamItem(index: number) {
  thingModelParams.value.splice(index, 1);
}
</script>

<template>
  <div
    v-for="(item, index) in thingModelParams"
    :key="index"
    class="mb-2.5 flex w-full justify-between bg-gray-100 px-2.5 dark:bg-gray-800"
  >
    <span>参数名称：{{ item.name }}</span>
    <div>
      <Button type="link" @click="openParamForm(item)">编辑</Button>
      <Divider type="vertical" />
      <Button danger type="link" @click="deleteParamItem(index)">删除</Button>
    </div>
  </div>
  <Button type="link" @click="openParamForm(null)">+ 新增参数</Button>

  <!-- 参数表单 -->
  <Modal class="w-2/5" title="参数配置">
    <Form
      ref="paramFormRef"
      :label-col="{ span: 6 }"
      :model="formData"
      :wrapper-col="{ span: 18 }"
      class="mx-4"
    >
      <Form.Item :rules="ThingModelFormRules.name" label="参数名称" name="name">
        <Input v-model:value="formData.name" placeholder="请输入参数名称" />
      </Form.Item>
      <Form.Item
        :rules="ThingModelFormRules.identifier"
        label="标识符"
        name="identifier"
      >
        <Input v-model:value="formData.identifier" placeholder="请输入标识符" />
      </Form.Item>
      <!-- 属性配置 -->
      <ThingModelProperty v-model="formData.property" is-params />
    </Form>
  </Modal>
</template>
