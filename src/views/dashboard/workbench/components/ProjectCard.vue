<script lang="ts" setup>
import { Card, CardGrid } from 'ant-design-vue'
import { groupItems } from './data'
import { Icon } from '@/components/Icon'
</script>

<template>
  <Card title="项目" v-bind="$attrs">
    <template #extra>
      <a-button type="link">
        更多
      </a-button>
    </template>

    <CardGrid v-for="item in groupItems" :key="item.title" class="!w-full !md:w-1/3">
      <span class="flex">
        <Icon :icon="item.icon" :color="item.color" size="30" />
        <span class="ml-4 text-lg">{{ item.title }}</span>
      </span>
      <div class="text-secondary mt-2 h-10 flex">
        {{ item.desc }}
      </div>
      <div class="text-secondary flex justify-between">
        <span>{{ item.group }}</span>
        <span>{{ item.date }}</span>
      </div>
    </CardGrid>
  </Card>
</template>
