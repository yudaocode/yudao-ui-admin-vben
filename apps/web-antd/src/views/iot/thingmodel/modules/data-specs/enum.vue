<!-- dataType：enum 数组类型 -->
<script lang="ts" setup>
import type { Ref } from 'vue';

import { IoTDataSpecsDataTypeEnum } from '@vben/constants';
import { isEmpty } from '@vben/utils';

import { useVModel } from '@vueuse/core';
import { Button, Form, Input, message } from 'ant-design-vue';

import { buildIdentifierLikeNameValidator } from '#/api/iot/thingmodel';

const props = defineProps<{ modelValue: any }>();
const emits = defineEmits(['update:modelValue']);
const dataSpecsList = useVModel(props, 'modelValue', emits) as Ref<any[]>;

const validateEnumName = buildIdentifierLikeNameValidator('枚举描述');

/** 添加枚举项 */
function addEnum() {
  dataSpecsList.value.push({
    dataType: IoTDataSpecsDataTypeEnum.ENUM,
    name: '',
    value: '',
  } as any);
}

/** 删除枚举项 */
function deleteEnum(index: number) {
  if (dataSpecsList.value.length === 1) {
    message.warning('至少需要一个枚举项');
    return;
  }
  dataSpecsList.value.splice(index, 1);
}

/** 校验单项枚举值：必填、数字、不重复 */
function validateEnumValue(_rule: any, value: any, callback: any) {
  if (isEmpty(value)) {
    callback(new Error('枚举值不能为空'));
    return;
  }
  if (Number.isNaN(Number(value))) {
    callback(new Error('枚举值必须是数字'));
    return;
  }
  const sameCount = dataSpecsList.value.filter(
    (it) => it.value === value,
  ).length;
  if (sameCount > 1) {
    callback(new Error('枚举值不能重复'));
    return;
  }
  callback();
}

/** 校验整个枚举列表：非空、无空项、无非法数字、无重复 */
function validateEnumList(_rule: any, _value: any, callback: any) {
  if (isEmpty(dataSpecsList.value)) {
    callback(new Error('请至少添加一个枚举项'));
    return;
  }
  const hasEmpty = dataSpecsList.value.some(
    (item) => isEmpty(item.value) || isEmpty(item.name),
  );
  if (hasEmpty) {
    callback(new Error('存在未填写的枚举值或描述'));
    return;
  }
  const hasInvalidNumber = dataSpecsList.value.some((item) =>
    Number.isNaN(Number(item.value)),
  );
  if (hasInvalidNumber) {
    callback(new Error('存在非数字的枚举值'));
    return;
  }
  const values = dataSpecsList.value.map((item) => item.value);
  if (new Set(values).size !== values.length) {
    callback(new Error('存在重复的枚举值'));
    return;
  }
  callback();
}
</script>

<template>
  <Form.Item
    :rules="[{ validator: validateEnumList, trigger: 'change' }]"
    label="枚举项"
  >
    <div class="flex flex-col">
      <div class="flex items-center">
        <span class="flex-1"> 参数值 </span>
        <span class="flex-1"> 参数描述 </span>
      </div>
      <div
        v-for="(item, index) in dataSpecsList"
        :key="index"
        class="mb-[5px] flex items-center justify-between"
      >
        <Form.Item
          :name="['property', 'dataSpecsList', index, 'value']"
          :rules="[
            { required: true, message: '枚举值不能为空', trigger: 'blur' },
            { validator: validateEnumValue, trigger: 'blur' },
          ]"
          class="mb-0 flex-1"
        >
          <Input
            v-model:value="item.value"
            placeholder="请输入枚举值，如「0」"
          />
        </Form.Item>
        <span class="mx-2">~</span>
        <Form.Item
          :name="['property', 'dataSpecsList', index, 'name']"
          :rules="[
            { required: true, message: '枚举描述不能为空', trigger: 'blur' },
            { validator: validateEnumName, trigger: 'blur' },
          ]"
          class="mb-0 flex-1"
        >
          <Input v-model:value="item.name" placeholder="对该枚举项的描述" />
        </Form.Item>
        <Button class="ml-2.5" type="link" @click="deleteEnum(index)">
          删除
        </Button>
      </div>
      <Button type="link" @click="addEnum">+ 添加枚举项</Button>
    </div>
  </Form.Item>
</template>

<style lang="scss" scoped>
:deep(.ant-form-item) {
  .ant-form-item {
    margin-bottom: 0;
  }
}
</style>
