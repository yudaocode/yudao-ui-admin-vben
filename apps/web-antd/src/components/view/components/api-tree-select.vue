<script setup lang="ts">
import { computed, onMounted, type PropType, ref } from 'vue';

import { requestClient } from '#/api/request';

const props = defineProps({
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
  api: {
    // 接口请求对象
    type: [Function, String] as PropType<
      ((...arg: any) => Promise<any>) | String
    >,
    default() {
      return () => {
        return new Promise((resolve) => {
          resolve([]);
        });
      };
    },
  },
  params: {
    type: Object,
    default() {
      return {};
    },
  },
  cacheKey: {
    type: String,
    default: '',
  },
  requestMethod: {
    type: String,
    default: 'post',
  },
  valueField: {
    type: String,
    default: 'id',
  },
  labelField: {
    type: String,
    default: 'name',
  },
  multiple: {
    type: Boolean,
    default: false,
  },
});
const currentData = ref({});
const cValue = computed(() => {
  return (currentData.value as any)[props.labelField] || props.value;
});
onMounted(() => {
  const api: (...arg: any) => Promise<any> =
    typeof props.api === 'string'
      ? (params: any) => {
          return (requestClient as any)[props.requestMethod](
            props.api as any,
            params,
          );
        }
      : (props.api as (...arg: any) => Promise<any>);
  const searchType = props.multiple ? 'IN' : 'EQ';
  const params =
    props.requestMethod === 'get'
      ? {
          params: {
            ...props.params,
            [`m_${searchType}_${props.valueField}`]: props.value,
          },
        }
      : {
          ...props.params,
          [`m_${searchType}_${props.valueField}`]: props.value,
        };
  api(params).then((res) => {
    if (res.length > 0) {
      currentData.value = res[0];
    }
  });
});
</script>
<template>
  <div>{{ cValue }}</div>
</template>
<style lang="less" scoped></style>
