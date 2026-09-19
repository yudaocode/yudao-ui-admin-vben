<script lang="ts" setup>
import type { OaNoteCategoryApi } from '#/api/oa/note/category';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

defineOptions({ name: 'OaNoteSidebar' });

defineProps<{
  categories: OaNoteCategoryApi.NoteCategory[]; // 本人的目录列表
  categoryId?: number; // 当前目录编号
  type?: number; // 当前笔记类型
}>();

const emit = defineEmits<{
  categorySelect: [index: string];
  manage: [];
  typeSelect: [index: string];
}>(); // 筛选和管理操作交由列表页处理
</script>

<template>
  <div class="text-sm">
    <!-- 分类导航 -->
    <div
      class="mb-3 flex items-center justify-between border-b border-border pb-3 font-semibold"
    >
      <span>分类</span>
      <span
        class="cursor-pointer font-normal text-primary"
        @click="emit('manage')"
      >
        管理分类
      </span>
    </div>
    <div
      class="flex h-10 cursor-pointer items-center rounded px-3 hover:bg-accent"
      :class="{
        'bg-accent font-semibold text-primary': categoryId === undefined,
      }"
      @click="emit('categorySelect', 'all')"
    >
      最近
    </div>
    <div
      v-for="category in categories"
      :key="category.id"
      class="flex h-10 cursor-pointer items-center rounded px-3 hover:bg-accent"
      :class="{
        'bg-accent font-semibold text-primary': categoryId === category.id,
      }"
      :title="category.name"
      @click="emit('categorySelect', String(category.id))"
    >
      <span class="truncate">{{ category.name }}</span>
    </div>

    <!-- 类型导航，与分类组合筛选 -->
    <div class="my-4 border-t border-border"></div>
    <div class="mb-3 font-semibold">类型</div>
    <div
      class="flex h-10 cursor-pointer items-center rounded px-3 hover:bg-accent"
      :class="{
        'bg-accent font-semibold text-primary': type === undefined,
      }"
      @click="emit('typeSelect', 'all')"
    >
      全部类型
    </div>
    <div
      v-for="dict in getDictOptions(DICT_TYPE.OA_NOTE_TYPE, 'number')"
      :key="dict.value"
      class="flex h-10 cursor-pointer items-center rounded px-3 hover:bg-accent"
      :class="{
        'bg-accent font-semibold text-primary': type === dict.value,
      }"
      @click="emit('typeSelect', String(dict.value))"
    >
      {{ dict.label }}
    </div>
  </div>
</template>
