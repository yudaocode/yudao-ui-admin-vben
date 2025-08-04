<script setup lang="ts">
import type { NoticeBarProperty } from './config';

/** 公告栏 */
defineOptions({ name: 'NoticeBar' });

defineProps<{ property: NoticeBarProperty }>();
</script>

<template>
  <div
    class="p-y-4px text-12px flex items-center"
    :style="{
      backgroundColor: property.backgroundColor,
      color: property.textColor,
    }"
  >
    <el-image :src="property.iconUrl" class="h-18px" />
    <el-divider direction="vertical" />
    <el-carousel
      height="24px"
      direction="vertical"
      :autoplay="true"
      class="p-r-8px flex-1"
    >
      <el-carousel-item v-for="(item, index) in property.contents" :key="index">
        <div class="h-24px leading-24px truncate">{{ item.text }}</div>
      </el-carousel-item>
    </el-carousel>
    <Icon icon="ep:arrow-right" />
  </div>
</template>

<style scoped lang="scss"></style>
