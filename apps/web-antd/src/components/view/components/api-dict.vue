<script setup lang="ts">
import { computed } from 'vue';

import { type DictItem, useDictStore } from '@vben/stores';

const props = defineProps({
  code: {
    type: String,
    default: undefined,
  },
  data: {
    type: Object,
    default() {
      return {};
    },
  },
  value: {
    // 值
    type: [String, Number, Array],
    default: undefined,
  },
  split: {
    // 分割符
    type: String,
    default: ',',
  },
  join: {
    // 连接符
    type: String,
    default: ',',
  },
});
const dictStore = useDictStore();
const cValue = computed(() => {
  if (!props.value && props.value !== 0) {
    return '';
  }
  const arr: Array<any> = [];
  if (Array.isArray(props.value)) {
    arr.push(...props.value);
  } else {
    arr.push(...props.value.toString().split(props.split));
  }
  const dictData = dictStore.getDictData(props.code as string) as DictItem[];
  const res: Array<any> = [];
  arr.forEach((item) => {
    for (let i = 0; i < dictData.length; i++) {
      if (dictData[i]?.value?.toString() === item?.toString()) {
        res.push(dictData[i]?.label);
        break;
      }
      if (i === dictData.length - 1) {
        res.push(item);
      }
    }
  });

  return res.join(props.join);
});
</script>
<template>
  <div>{{ cValue }}</div>
</template>
<style lang="less" scoped></style>
