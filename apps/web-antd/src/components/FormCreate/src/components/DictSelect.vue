<!-- 数据字典 Select 选择器 -->
<script lang="ts" setup>
import { computed, useAttrs } from 'vue';

import {
  Checkbox,
  CheckboxGroup,
  Radio,
  RadioGroup,
  Select,
  SelectOption,
} from 'ant-design-vue';

import {
  getBoolDictOptions,
  getIntDictOptions,
  getStrDictOptions,
} from '#/utils/dict';

// 接受父组件参数
interface Props {
  dictType: string; // 字典类型
  valueType?: 'bool' | 'int' | 'str'; // 字典值类型
  selectType?: 'checkbox' | 'radio' | 'select'; // 选择器类型，下拉框 select、多选框 checkbox、单选框 radio
  // eslint-disable-next-line vue/require-default-prop
  formCreateInject?: any;
}

defineOptions({ name: 'DictSelect' });

const props = withDefaults(defineProps<Props>(), {
  valueType: 'str',
  selectType: 'select',
});

const attrs = useAttrs();

// 获得字典配置
const getDictOptions = computed(() => {
  switch (props.valueType) {
    case 'bool': {
      return getBoolDictOptions(props.dictType);
    }
    case 'int': {
      return getIntDictOptions(props.dictType);
    }
    case 'str': {
      return getStrDictOptions(props.dictType);
    }
    default: {
      return [];
    }
  }
});
</script>

<template>
  <Select v-if="selectType === 'select'" class="w-1/1" v-bind="attrs">
    <SelectOption
      v-for="(dict, index) in getDictOptions"
      :key="index"
      :value="dict.value"
    >
      {{ dict.label }}
    </SelectOption>
  </Select>
  <RadioGroup v-if="selectType === 'radio'" class="w-1/1" v-bind="attrs">
    <Radio
      v-for="(dict, index) in getDictOptions"
      :key="index"
      :value="dict.value"
    >
      {{ dict.label }}
    </Radio>
  </RadioGroup>
  <CheckboxGroup v-if="selectType === 'checkbox'" class="w-1/1" v-bind="attrs">
    <Checkbox
      v-for="(dict, index) in getDictOptions"
      :key="index"
      :value="dict.value"
    >
      {{ dict.label }}
    </Checkbox>
  </CheckboxGroup>
</template>
