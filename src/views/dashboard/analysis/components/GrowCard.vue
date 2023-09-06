<script lang="ts" setup>
import { Card, Tag } from 'ant-design-vue'
import { growCardList } from '../data'
import { CountTo } from '@/components/CountTo'
import { Icon } from '@/components/Icon'

defineProps({
  loading: {
    type: Boolean,
  },
})
</script>

<template>
  <div class="md:flex">
    <template v-for="(item, index) in growCardList" :key="item.title">
      <Card
        :loading="loading"
        :title="item.title"
        class="w-full md:w-1/4 !md:mt-0"
        :class="{ '!md:mr-4': index + 1 < 4, '!mt-4': index > 0 }"
      >
        <template #extra>
          <Tag :color="item.color">
            {{ item.action }}
          </Tag>
        </template>

        <div class="flex items-center justify-between px-4 py-4">
          <CountTo prefix="$" :start-val="1" :end-val="item.value" class="text-2xl" />
          <Icon :icon="item.icon" :size="40" />
        </div>

        <div class="flex justify-between p-2 px-4">
          <span>总{{ item.title }}</span>
          <CountTo prefix="$" :start-val="1" :end-val="item.total" />
        </div>
      </Card>
    </template>
  </div>
</template>
