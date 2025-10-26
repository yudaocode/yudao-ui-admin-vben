<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { useClipboard } from '@vueuse/core';
import { ElButton as Button, ElCard as Card, ElMessage as message } from 'element-plus';

const props = defineProps({
  content: {
    type: String,
    default: '',
  }, // 生成的结果
  isWriting: {
    type: Boolean,
    default: false,
  }, // 是否正在生成文章
});

const emits = defineEmits(['update:content', 'stopStream']);
const { copied, copy } = useClipboard();

/** 通过计算属性，双向绑定，更改生成的内容，考虑到用户想要更改生成文章的情况 */
const compContent = computed({
  get() {
    return props.content;
  },
  set(val) {
    emits('update:content', val);
  },
});

/** 滚动 */
const contentRef = ref<HTMLDivElement>();
defineExpose({
  scrollToBottom() {
    contentRef.value?.scrollTo(0, contentRef.value?.scrollHeight);
  },
});

/** 点击复制的时候复制内容 */
const showCopy = computed(() => props.content && !props.isWriting); // 是否展示复制按钮，在生成内容完成的时候展示
function copyContent() {
  copy(props.content);
}

/** 复制成功的时候 copied.value 为 true */
watch(copied, (val) => {
  if (val) {
    message.success('复制成功');
  }
});
</script>
<template>
  <Card class="flex h-full flex-col">
    <template #header>
      <h3 class="m-0 flex shrink-0 items-center justify-between px-7">
        <span>预览</span>
        <Button
          type="primary"
          v-show="showCopy"
          @click="copyContent"
          size="small"
        >
          <IconifyIcon icon="lucide:copy" />
          复制
        </Button>
      </h3>
    </template>
    <div
      ref="contentRef"
      class="hide-scroll-bar box-border h-full overflow-y-auto"
    >
      <div
        class="bg-card relative box-border min-h-full w-full flex-grow p-2 sm:p-5"
      >
        <Button
          v-show="isWriting"
          class="absolute bottom-1 left-1/2 z-40 flex -translate-x-1/2 sm:bottom-2"
          @click="emits('stopStream')"
          size="small"
        >
          <template #icon>
            <div class="flex items-center justify-center">
              <IconifyIcon icon="lucide:ban" />
            </div>
          </template>
          终止生成
        </Button>
        <el-input
          id="inputId"
          v-model="compContent"
          type="textarea"
          :autosize="{ minRows: 4, maxRows: 25 }"
          placeholder="生成的内容……"
        />
      </div>
    </div>
  </Card>
</template>

<style lang="scss" scoped>
// 定义一个 mixin 替代 extend
@mixin hide-scroll-bar {
  -ms-overflow-style: none;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    width: 0;
    height: 0;
  }
}

.hide-scroll-bar {
  @include hide-scroll-bar;
}

.my-card {
  :deep(.el-card__body) {
    box-sizing: border-box;
    flex-grow: 1;
    padding: 0;
    overflow-y: auto;

    @include hide-scroll-bar;
  }
}

// markmap 的 tool 样式覆盖
:deep(.markmap) {
  width: 100%;
}

:deep(.mm-toolbar-brand) {
  display: none;
}

:deep(.mm-toolbar) {
  display: flex;
  flex-direction: row;
}
</style>
