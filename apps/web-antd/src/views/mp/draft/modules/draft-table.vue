<script lang="ts" setup>
import type { Article } from './types';

import { WxNews } from '#/views/mp/modules/wx-news';

defineOptions({ name: 'DraftTableCell' });

const props = defineProps<{
  row: Article;
}>();
</script>

<template>
  <div class="draft-content">
    <div v-if="props.row.content && props.row.content.newsItem">
      <WxNews :articles="props.row.content.newsItem" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.draft-content {
  padding: 10px;
}
</style>
