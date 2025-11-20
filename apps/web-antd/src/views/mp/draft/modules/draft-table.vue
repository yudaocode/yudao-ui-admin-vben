<script lang="ts" setup>
import type { MpDraftApi } from '#/api/mp/draft';

import { WxNews } from '#/views/mp/components';

defineOptions({ name: 'DraftTableCell' });

const props = defineProps<{
  row: MpDraftApi.DraftArticle;
}>();
</script>

<template>
  <div class="p-2.5">
    <div v-if="props.row.content && props.row.content.newsItem">
      <WxNews :articles="props.row.content.newsItem" />
    </div>
  </div>
</template>
