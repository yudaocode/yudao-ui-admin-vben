<script setup lang="ts">
import type { Item } from './ui/typing';

import { onMounted, onUnmounted, ref } from 'vue';

import { Tinyflow as TinyflowNative } from './ui/index';

import './ui/index.css';

const props = defineProps<{
  className?: string;
  data?: Record<string, any>;
  provider?: {
    internal?: () => Item[] | Promise<Item[]>;
    knowledge?: () => Item[] | Promise<Item[]>;
    llm?: () => Item[] | Promise<Item[]>;
  };
  style?: Record<string, string>;
}>();

const divRef = ref<HTMLDivElement | null>(null);
let tinyflow: null | TinyflowNative = null;
// 定义默认的 provider 方法
const defaultProvider = {
  llm: () => [] as Item[],
  knowledge: () => [] as Item[],
  internal: () => [] as Item[],
};

onMounted(() => {
  if (divRef.value) {
    // 合并默认 provider 和传入的 props.provider
    const mergedProvider = {
      ...defaultProvider,
      ...props.provider,
    };
    tinyflow = new TinyflowNative({
      element: divRef.value as Element,
      data: props.data || {},
      provider: mergedProvider,
    });
  }
});

onUnmounted(() => {
  if (tinyflow) {
    tinyflow.destroy();
    tinyflow = null;
  }
});

const getData = () => {
  if (tinyflow) {
    return tinyflow.getData();
  }
  console.warn('Tinyflow instance is not initialized');
  return null;
};

defineExpose({
  getData,
});
</script>

<template>
  <div
    ref="divRef"
    class="tinyflow"
    :class="[className]"
    :style="style"
    style="height: 100%"
  ></div>
</template>
