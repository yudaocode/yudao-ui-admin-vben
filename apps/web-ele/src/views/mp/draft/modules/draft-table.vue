<script lang="ts" setup>
import type { Article } from './types';

import News from '#/views/mp/components/news/news.vue';

defineOptions({ name: 'DraftTableCell' });

const props = defineProps<{
  row: Article;
}>();
</script>

<template>
  <div class="draft-content">
    <div v-if="props.row.content && props.row.content.newsItem">
      <News :articles="props.row.content.newsItem" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.draft-content {
  padding: 10px;
}
</style>
