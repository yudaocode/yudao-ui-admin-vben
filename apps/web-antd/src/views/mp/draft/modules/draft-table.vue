<script lang="ts" setup>
import type { Article } from './types';

import { News } from '#/views/mp/modules';

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
