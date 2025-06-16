<script setup lang="ts">
import { computed, ref } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { Tooltip } from 'ant-design-vue';

const props = defineProps<{
  segments: {
    content: string;
    documentId: number;
    documentName: string;
    id: number;
  }[];
}>();

const document = ref<null | {
  id: number;
  segments: {
    content: string;
    id: number;
  }[];
  title: string;
}>(null); // 知识库文档列表
const dialogVisible = ref(false); // 知识引用详情弹窗
const documentRef = ref<HTMLElement>(); // 知识引用详情弹窗 Ref

/** 按照 document 聚合 segments */
const documentList = computed(() => {
  if (!props.segments) return [];

  const docMap = new Map();
  props.segments.forEach((segment) => {
    if (!docMap.has(segment.documentId)) {
      docMap.set(segment.documentId, {
        id: segment.documentId,
        title: segment.documentName,
        segments: [],
      });
    }
    docMap.get(segment.documentId).segments.push({
      id: segment.id,
      content: segment.content,
    });
  });
  return [...docMap.values()];
});

/** 点击 document 处理 */
function handleClick(doc: any) {
  document.value = doc;
  dialogVisible.value = true;
}
</script>

<template>
  <!-- 知识引用列表 -->
  <div
    v-if="segments && segments.length > 0"
    class="mt-[10px] rounded-[8px] bg-[#f5f5f5] p-[10px]"
  >
    <div class="text-14px mb-8px flex items-center text-[#666]">
      <IconifyIcon icon="ep:document" class="mr-[5px]" /> 知识引用
    </div>
    <div class="flex flex-wrap gap-[8px]">
      <div
        v-for="(doc, index) in documentList"
        :key="index"
        class="cursor-pointer rounded-[6px] bg-white p-[8px] px-[12px] transition-all hover:bg-[#e6f4ff]"
        @click="handleClick(doc)"
      >
        <div class="mb-[4px] text-[14px] text-[#333]">
          {{ doc.title }}
          <span class="ml-[4px] text-[12px] text-[#999]">
            （{{ doc.segments.length }} 条）
          </span>
        </div>
      </div>
    </div>
  </div>
  <Tooltip placement="topLeft" trigger="click">
    <div ref="documentRef"></div>
    <template #title>
      <div class="mb-[12px] text-[16px] font-bold">{{ document?.title }}</div>
      <div class="max-h-[60vh] overflow-y-auto">
        <div
          v-for="(segment, index) in document?.segments"
          :key="index"
          class="border-b-solid border-b-[#eee] p-[12px] last:border-b-0"
        >
          <div
            class="mb-[8px] block w-fit rounded-[4px] bg-[#f5f5f5] px-[8px] py-[2px] text-[12px] text-[#666]"
          >
            分段 {{ segment.id }}
          </div>
          <div class="mt-[10px] text-[14px] leading-[1.6] text-[#333]">
            {{ segment.content }}
          </div>
        </div>
      </div>
    </template>
  </Tooltip>
</template>
