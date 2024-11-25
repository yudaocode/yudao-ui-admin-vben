<script setup lang="ts">
import { computed, onMounted, type PropType, watch } from 'vue';

import { type DictItem, useDictStore } from '@vben/stores';

import { requestClient } from '#/api/request';

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
});
const dictStore = useDictStore();
/**
 * 获取包含的id
 */
const getIncludeIds = () => {
  if (!props.value && props.value !== 0) {
    return [];
  }
  const arr: Array<any> = [];
  if (Array.isArray(props.value)) {
    arr.push(...props.value);
  } else {
    arr.push(...props.value.toString().split(props.split));
  }
  return arr;
};
/**
 * 获取缓存key
 */
const getCacheKey = () => {
  let cacheKey = props.cacheKey;
  if (typeof props.api === 'string' && !cacheKey) {
    cacheKey = props.api as string;
  }
  return cacheKey;
};
const cValue = computed(() => {
  if (!props.value && props.value !== 0) {
    return '';
  }
  const arr: Array<any> = getIncludeIds();
  const cacheKey = getCacheKey();
  const dictData = dictStore.getDictData(cacheKey) as DictItem[];
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
const requestData = () => {
  const api: (...arg: any) => Promise<any> =
    typeof props.api === 'string'
      ? (params: any) => {
          return (requestClient as any)[props.requestMethod](
            props.api as any,
            params,
          );
        }
      : (props.api as (...arg: any) => Promise<any>);
  const cacheKey = getCacheKey();
  const params =
    props.requestMethod === 'get'
      ? {
          params: {
            ...props.params,
            dictType: cacheKey,
            includeType: 2,
            includeIds: getIncludeIds(),
          },
        }
      : {
          data: {
            ...props.params,
            dictType: cacheKey,
            includeType: 2,
            includeIds: getIncludeIds(),
          },
        };
  dictStore.setDictCacheByApi(api, params);
};
onMounted(() => {
  requestData();
});
watch(
  () => props.value,
  () => {
    requestData();
  },
);
</script>
<template>
  <div>{{ cValue }}</div>
</template>
<style lang="less" scoped></style>
