<script setup lang="ts">
import { computed, type PropType } from 'vue';

import { requestClient } from '#/api/request';

import { ApiCheckboxGroup, ApiRadioGroup, ApiSelect } from '..';

type OptionsItem = { disabled?: boolean; label: string; value: string };

const props = defineProps({
  renderType: {
    type: String as PropType<'CheckboxGroup' | 'RadioGroup' | 'Select'>,
    default: 'Select',
  },
  api: {
    type: [Function, String] as PropType<
      (arg?: any) => Promise<OptionsItem[]> | String
    >,
    default: null,
  },
  requestMethod: {
    // 请求方法
    type: String,
    default: 'post',
  },
  // api params
  params: {
    type: Object as PropType<any>,
    default: () => ({}),
  },
  code: {
    type: String,
    default: undefined,
  },
});
const DictComponent = computed(() => {
  if (props.renderType === 'RadioGroup') {
    return ApiRadioGroup;
  } else if (props.renderType === 'CheckboxGroup') {
    return ApiCheckboxGroup;
  }
  return ApiSelect;
});
const fetch = () => {
  return requestClient.post('/sys/dict/getByDictType', {
    dictType: props.code,
    ...props.params,
  });
};
</script>
<template>
  <DictComponent :api="props.code ? fetch : props.api" />
</template>
