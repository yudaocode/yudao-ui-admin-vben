<!-- emoji 表情选择组件 -->
<script lang="ts" setup>
import type { Emoji } from './emoji';

import { computed } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { List } from 'ant-design-vue';

import { useEmoji } from './emoji';

defineOptions({ name: 'EmojiSelectPopover' });

/** 选择 emoji 表情 */
// TODO @jawe：这里有 linter 告警，看看要不要处理下；
const emits = defineEmits<{
  (e: 'selectEmoji', v: Emoji);
}>();
const { getEmojiList } = useEmoji();
const emojiList = computed(() => getEmojiList());

function handleSelect(item: Emoji) {
  // 整个 emoji 数据传递出去，方便以后输入框直接显示表情
  emits('selectEmoji', item);
}
</script>

<template>
  <a-popover :width="500" placement="top" trigger="click">
    <template #content>
      <List height="300px">
        <ul class="ml-2 flex flex-wrap px-2">
          <li
            v-for="(item, index) in emojiList"
            :key="index"
            :style="{
              borderColor: 'var(--primary)',
              color: 'var(--primary)',
            }"
            :title="item.name"
            class="icon-item w-1/10 mr-2 mt-1 flex cursor-pointer items-center justify-center border border-solid p-2"
            @click="handleSelect(item)"
          >
            <img :src="item.url" class="h-[24px] w-[24px]" />
          </li>
        </ul>
      </List>
    </template>
    <IconifyIcon
      :size="30"
      class="ml-[10px] cursor-pointer"
      icon="twemoji:grinning-face"
    />
  </a-popover>
</template>
