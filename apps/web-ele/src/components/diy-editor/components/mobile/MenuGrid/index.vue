<script setup lang="ts">
import type { MenuGridProperty } from './config';

/** 宫格导航 */
defineOptions({ name: 'MenuGrid' });
defineProps<{ property: MenuGridProperty }>();
</script>

<template>
  <div class="flex flex-row flex-wrap">
    <div
      v-for="(item, index) in property.list"
      :key="index"
      class="p-b-14px p-t-20px relative flex flex-col items-center"
      :style="{ width: `${100 * (1 / property.column)}%` }"
    >
      <!-- 右上角角标 -->
      <span
        v-if="item.badge?.show"
        class="left-50% top-10px z-1 h-20px rounded-50% p-x-6px text-12px leading-20px absolute text-center"
        :style="{
          color: item.badge.textColor,
          backgroundColor: item.badge.bgColor,
        }"
      >
        {{ item.badge.text }}
      </span>
      <el-image v-if="item.iconUrl" class="h-28px w-28px" :src="item.iconUrl" />
      <span
        class="m-t-8px h-16px text-12px leading-16px"
        :style="{ color: item.titleColor }"
      >
        {{ item.title }}
      </span>
      <span
        class="m-t-6px h-12px text-10px leading-12px"
        :style="{ color: item.subtitleColor }"
      >
        {{ item.subtitle }}
      </span>
    </div>
  </div>
</template>

<style scoped lang="scss"></style>
