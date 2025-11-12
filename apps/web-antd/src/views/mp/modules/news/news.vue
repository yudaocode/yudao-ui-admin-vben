<!--
  - Copyright (C) 2018-2019
  - All rights reserved, Designed By www.joolun.com
  【微信消息 - 图文】
  芋道源码：
  ① 代码优化，补充注释，提升阅读性
-->
<script lang="ts" setup>
import { Image } from 'ant-design-vue';

defineOptions({ name: 'News' });

const props = withDefaults(
  defineProps<{
    articles?: any[] | null;
  }>(),
  {
    articles: null,
  },
);

defineExpose({
  articles: props.articles,
});
</script>

<template>
  <!-- DONE @hw：tindwind 替代 -->
  <div class="mx-auto w-full bg-white">
    <div v-for="(article, index) in articles" :key="index">
      <!-- 头条 -->
      <a v-if="index === 0" :href="article.url" target="_blank">
        <div class="mx-auto w-full">
          <div class="relative w-full bg-[#acadae]">
            <Image
              :src="article.picUrl || article.thumbUrl"
              class="h-[120px] w-full"
              :preview="false"
            />
            <div
              class="absolute bottom-0 left-0 inline-block w-[98%] whitespace-normal bg-black p-[1%] text-xs text-white opacity-65"
            >
              <span>{{ article.title }}</span>
            </div>
          </div>
        </div>
      </a>
      <!-- 二条/三条等等 -->
      <a v-else :href="article.url" target="_blank">
        <div class="border-t border-[#eaeaea] bg-white py-[5px]">
          <div class="relative">
            <div
              class="ml-[1%] inline-block w-[70%] whitespace-normal text-[10px]"
            >
              {{ article.title }}
            </div>
            <div class="mr-[1%] inline-block w-[25%] bg-[#acadae]">
              <img
                :src="article.picUrl || article.thumbUrl"
                class="h-full w-full"
              />
            </div>
          </div>
        </div>
      </a>
    </div>
  </div>
</template>
