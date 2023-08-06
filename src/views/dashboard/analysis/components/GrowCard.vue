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
        class="md:w-1/4 w-full !md:mt-0"
        :class="{ '!md:mr-4': index + 1 < 4, '!mt-4': index > 0 }"
      >
        <template #extra>
          <Tag :color="item.color">
            {{ item.action }}
          </Tag>
        </template>

        <div class="py-4 px-4 flex justify-between items-center">
          <CountTo prefix="$" :start-val="1" :end-val="item.value" class="text-2xl" />
          <Icon :icon="item.icon" :size="40" />
        </div>

        <div class="p-2 px-4 flex justify-between">
          <span>总{{ item.title }}</span>
          <CountTo prefix="$" :start-val="1" :end-val="item.total" />
        </div>
      </Card>
    </template>
  </div>
</template>
