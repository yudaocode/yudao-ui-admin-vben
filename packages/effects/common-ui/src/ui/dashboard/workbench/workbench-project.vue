<script setup lang="ts">
import type { WorkbenchProjectItem } from '../typing';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  VbenIcon,
} from '@vben-core/shadcn-ui';

interface Props {
  items?: WorkbenchProjectItem[];
  title: string;
}

defineOptions({
  name: 'WorkbenchProject',
});

withDefaults(defineProps<Props>(), {
  items: () => [],
});

defineEmits(['click']);
</script>

<template>
  <Card class="@container gap-4 overflow-hidden pt-4 pb-0">
    <CardHeader class="px-4">
      <CardTitle class="text-base">{{ title }}</CardTitle>
    </CardHeader>
    <CardContent class="grid grid-cols-1 p-0 @xl:grid-cols-2">
      <div
        v-for="(item, index) in items"
        :key="item.title"
        class="border-border group min-w-0 cursor-pointer border-t p-4 transition-colors hover:bg-accent/50 @xl:odd:border-r"
        @click="$emit('click', item)"
      >
        <div class="flex items-center gap-3">
          <VbenIcon
            :color="item.color"
            :icon="item.icon"
            class="size-7 shrink-0 transition-all duration-300 group-hover:scale-110"
          />
          <div class="min-w-0 text-base font-semibold break-words">
            {{ item.title }}
          </div>
        </div>

        <!-- 内容区域支持插槽自定义 -->
        <slot name="content" :item="item" :index="index">
          <div class="text-muted-foreground mt-2 text-xs break-words">
            {{ item.content }}
          </div>
        </slot>

        <!-- 底部信息区域支持插槽自定义 -->
        <slot name="footer" :item="item" :index="index">
          <div
            class="text-foreground/80 mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm"
          >
            <span class="min-w-0 break-words">{{ item.group }}</span>
            <span class="text-muted-foreground text-xs whitespace-nowrap">
              {{ item.date }}
            </span>
          </div>
        </slot>
      </div>
    </CardContent>
  </Card>
</template>
