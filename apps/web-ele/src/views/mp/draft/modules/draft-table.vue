<script lang="ts" setup>
import type { Article } from './types';

import News from '#/views/mp/components/wx-news/wx-news.vue';

// TODO @hw：按照微信里说的，感觉这个可以干掉。少点组件哈。= = mp 模块，小组件可太多了。。。
defineOptions({ name: 'DraftTableCell' });

const props = defineProps<{
  row: Article;
}>();
</script>

<template>
  <div class="p-2.5">
    <div v-if="props.row.content && props.row.content.newsItem">
      <News :articles="props.row.content.newsItem" />
    </div>
  </div>
</template>
