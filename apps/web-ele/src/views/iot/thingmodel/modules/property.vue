<!-- 产品的物模型表单（property 项） -->
<script lang="ts" setup>
import type { Ref } from 'vue';

import type { ThingModelApi } from '#/api/iot/thingmodel';

import { computed, watch } from 'vue';

import {
  getDataTypeOptions,
  IoTDataSpecsDataTypeEnum,
  IoTThingModelAccessModeEnum,
} from '@vben/constants';
import { isEmpty } from '@vben/utils';

import { useVModel } from '@vueuse/core';
import {
  ElFormItem,
  ElInput,
  ElOption,
  ElRadio,
  ElRadioGroup,
  ElSelect,
} from 'element-plus';

import { ThingModelFormRules, validateBoolName } from '#/api/iot/thingmodel';

import {
  ThingModelArrayDataSpecs,
  ThingModelEnumDataSpecs,
  ThingModelNumberDataSpecs,
  ThingModelStructDataSpecs,
} from './data-specs';

const props = defineProps<{
  isParams?: boolean;
  isStructDataSpecs?: boolean;
  modelValue: any;
}>();
const emits = defineEmits(['update:modelValue']);
/** 嵌套在结构体里时，禁止再选数组 / 结构体（最多支持两层嵌套） */
const NESTED_EXCLUDED_TYPES = new Set<string>([
  IoTDataSpecsDataTypeEnum.ARRAY,
  IoTDataSpecsDataTypeEnum.STRUCT,
]);
const STRUCT_CHILD_OPTIONS = getDataTypeOptions().filter(
  (item) => !NESTED_EXCLUDED_TYPES.has(item.value),
);
/** 数值型数据类型集合 */
const NUMERIC_TYPES = new Set<string>([
  IoTDataSpecsDataTypeEnum.DOUBLE,
  IoTDataSpecsDataTypeEnum.FLOAT,
  IoTDataSpecsDataTypeEnum.INT,
]);

const property = useVModel(
  props,
  'modelValue',
  emits,
) as Ref<ThingModelApi.Property>;

const dataTypeOptions = computed(() =>
  props.isStructDataSpecs ? STRUCT_CHILD_OPTIONS : getDataTypeOptions(),
);

/** 数据类型切换时，重置 dataSpecs / dataSpecsList 并按新类型初始化 */
function handleChange(dataType: any) {
  property.value.dataSpecs = {};
  property.value.dataSpecsList = [];
  // 数值 / 文本 / 时间 / 数组型把 dataType 同步到 dataSpecs；布尔 / 枚举 / 结构走 dataSpecsList
  const listLike = [
    IoTDataSpecsDataTypeEnum.BOOL,
    IoTDataSpecsDataTypeEnum.ENUM,
    IoTDataSpecsDataTypeEnum.STRUCT,
  ];
  if (!listLike.includes(dataType)) {
    property.value.dataSpecs.dataType = dataType;
  }
  if (dataType === IoTDataSpecsDataTypeEnum.BOOL) {
    for (let i = 0; i < 2; i++) {
      property.value.dataSpecsList.push({
        dataType: IoTDataSpecsDataTypeEnum.BOOL,
        name: '', // 布尔描述
        value: i, // 布尔值
      });
    }
  } else if (dataType === IoTDataSpecsDataTypeEnum.ENUM) {
    property.value.dataSpecsList.push({
      dataType: IoTDataSpecsDataTypeEnum.ENUM,
      name: '', // 枚举项描述
      value: undefined, // 枚举值
    });
  }
}

/** 顶层属性表单首次进入时，默认选中「读写」 */
if (!props.isStructDataSpecs && !props.isParams) {
  watch(
    () => property.value.accessMode,
    (val: string | undefined) => {
      if (isEmpty(val)) {
        property.value.accessMode =
          IoTThingModelAccessModeEnum.READ_WRITE.value;
      }
    },
    { immediate: true },
  );
}
</script>

<template>
  <ElFormItem
    :rules="[{ required: true, message: '请选择数据类型', trigger: 'change' }]"
    label="数据类型"
    prop="property.dataType"
  >
    <ElSelect
      v-model="property.dataType"
      placeholder="请选择数据类型"
      @change="handleChange"
    >
      <!-- ARRAY 和 STRUCT 类型数据相互嵌套时，最多支持递归嵌套 2 层（父和子） -->
      <ElOption
        v-for="option in dataTypeOptions"
        :key="option.value"
        :label="`${option.value}(${option.label})`"
        :value="option.value"
      />
    </ElSelect>
  </ElFormItem>
  <!-- 数值型配置 -->
  <ThingModelNumberDataSpecs
    v-if="NUMERIC_TYPES.has(property.dataType || '')"
    v-model="property.dataSpecs"
  />
  <!-- 枚举型配置 -->
  <ThingModelEnumDataSpecs
    v-if="property.dataType === IoTDataSpecsDataTypeEnum.ENUM"
    v-model="property.dataSpecsList"
  />
  <!-- 布尔型配置 -->
  <ElFormItem
    v-if="property.dataType === IoTDataSpecsDataTypeEnum.BOOL"
    label="布尔值"
  >
    <template v-for="(item, index) in property.dataSpecsList" :key="item.value">
      <div class="mb-[5px] flex w-full items-center justify-start">
        <span>{{ item.value }}</span>
        <span class="mx-2">-</span>
        <ElFormItem
          :prop="`property.dataSpecsList.${index}.name`"
          :rules="[
            { required: true, message: '布尔描述不能为空', trigger: 'blur' },
            { validator: validateBoolName, trigger: 'blur' },
          ]"
          class="mb-0 flex-1"
        >
          <ElInput
            v-model="item.name"
            :placeholder="`如：${item.value === 0 ? '关' : '开'}`"
            class="!w-[255px]"
          />
        </ElFormItem>
      </div>
    </template>
  </ElFormItem>
  <!-- 文本型配置 -->
  <ElFormItem
    v-if="property.dataType === IoTDataSpecsDataTypeEnum.TEXT"
    :rules="ThingModelFormRules.length"
    label="数据长度"
    prop="property.dataSpecs.length"
  >
    <ElInput
      v-model="property.dataSpecs.length"
      class="!w-[255px]"
      placeholder="请输入文本字节长度"
    >
      <template #append>字节</template>
    </ElInput>
  </ElFormItem>
  <!-- 时间型配置 -->
  <ElFormItem
    v-if="property.dataType === IoTDataSpecsDataTypeEnum.DATE"
    label="时间格式"
    prop="date"
  >
    <ElInput
      class="!w-[255px]"
      disabled
      placeholder="String 类型的 UTC 时间戳（毫秒）"
    />
  </ElFormItem>
  <!-- 数组型配置-->
  <ThingModelArrayDataSpecs
    v-if="property.dataType === IoTDataSpecsDataTypeEnum.ARRAY"
    v-model="property.dataSpecs"
  />
  <!-- Struct 型配置-->
  <ThingModelStructDataSpecs
    v-if="property.dataType === IoTDataSpecsDataTypeEnum.STRUCT"
    v-model="property.dataSpecsList"
  />
  <ElFormItem
    v-if="!isStructDataSpecs && !isParams"
    :rules="ThingModelFormRules.accessMode"
    label="读写类型"
    prop="property.accessMode"
  >
    <ElRadioGroup v-model="property.accessMode">
      <ElRadio
        v-for="accessMode in Object.values(IoTThingModelAccessModeEnum)"
        :key="accessMode.value"
        :value="accessMode.value"
      >
        {{ accessMode.label }}
      </ElRadio>
    </ElRadioGroup>
  </ElFormItem>
</template>

<style lang="scss" scoped>
:deep(.el-form-item) {
  .el-form-item {
    margin-bottom: 0;
  }
}
</style>
