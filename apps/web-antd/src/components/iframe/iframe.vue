<script setup lang="ts">
import { onMounted, ref } from 'vue';

interface IFrameProps {
  /** iframe 的源地址 */
  src: string;
}

const props = defineProps<IFrameProps>();

const loading = ref(true);
const height = ref('');
const frameRef = ref<HTMLElement | null>(null);

function init() {
  height.value = `${document.documentElement.clientHeight - 94.5}px`;
  loading.value = false;
}

onMounted(() => {
  setTimeout(() => {
    init();
  }, 300);
});
// TODO @芋艿：优化：未来使用 vben 自带的内链实现
</script>

<template>
  <div v-loading="loading" :style="`height:${height}`">
    <iframe
      ref="frameRef"
      :src="props.src"
      style="width: 100%; height: 100%"
      frameborder="no"
      scrolling="auto"
    ></iframe>
  </div>
</template>
