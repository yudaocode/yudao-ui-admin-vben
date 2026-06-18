<script lang="ts" setup>
import type { GroupLite } from '../../types'

import GroupAvatar from './GroupAvatar.vue'

defineOptions({ name: 'ImGroupItem' })

defineProps<{
  active?: boolean
  group: GroupLite
}>()

defineEmits<{
  click: [group: GroupLite]
}>()
</script>

<template>
  <!--
    群单行项
    - 头像 + 群名
    - 选中态 active
  -->
  <div
    class="relative flex items-center gap-2.5 px-4 py-3 cursor-pointer transition-colors hover:bg-[var(--ant-color-fill)]"
    :class="{ '!bg-[#d9ecff] dark:!bg-[var(--ant-color-primary-bg-hover)]': active }"
    @click="$emit('click', group)"
  >
    <GroupAvatar
      :group-id="group.id"
      :url="group.showImage || group.showImageThumb"
      :name="group.showGroupName || group.name"
      :size="42"
    />
    <div class="flex flex-1 min-w-0">
      <!-- 单行展示群名；成员数仅在群详情面板展示，列表里不重复 -->
      <div class="overflow-hidden text-sm truncate text-[var(--ant-color-text)]">
        {{ group.showGroupName || group.name }}
      </div>
    </div>
    <slot></slot>
  </div>
</template>
