<script lang="ts" setup>
import type { FriendLite } from '../../types'

import { useImUiStore } from '../../store/uiStore'
import { UserAvatar } from '../user'

defineOptions({ name: 'ImFriendItem' })

const props = withDefaults(
  defineProps<{
    active?: boolean
    friend: FriendLite
    menu?: boolean // 是否启用右键菜单；在选择器弹窗里一般关闭
  }>(),
  {
    active: false,
    menu: true
  }
)

const emit = defineEmits<{
  chat: [friend: FriendLite]
  click: [friend: FriendLite]
  delete: [friend: FriendLite]
}>()

const uiStore = useImUiStore()

/** 右键菜单：发送消息 / 删除好友 */
function handleContextMenu(event: MouseEvent) {
  if (!props.menu) {
    return
  }
  uiStore.openContextMenu(
    { x: event.clientX, y: event.clientY },
    [
      { key: 'chat', name: '发送消息' },
      { key: 'delete', name: '删除好友' }
    ],
    (item) => {
      if (item.key === 'chat') emit('chat', props.friend)
      else if (item.key === 'delete') emit('delete', props.friend)
    }
  )
}
</script>

<template>
  <!--
    好友单行项
    - 头像 + 昵称
    - 选中态 active
    - 右键菜单（发消息 / 删除好友）由全局 ContextMenu 承接
  -->
  <div
    class="relative flex items-center gap-2.5 px-4 py-3 cursor-pointer transition-colors hover:bg-[var(--ant-color-fill)]"
    :class="{ '!bg-[#d9ecff] dark:!bg-[var(--ant-color-primary-bg-hover)]': active }"
    @click="$emit('click', friend)"
    @contextmenu.prevent="handleContextMenu"
  >
    <!-- prefix slot：放在头像前，给选择类弹窗的 checkbox / 圆点用，不传则不渲染 -->
    <slot name="prefix"></slot>
    <!-- 头像 -->
    <UserAvatar
      :id="friend.id"
      :url="friend.avatar"
      :name="friend.nickname"
      :size="42"
      :clickable="false"
    />
    <!-- 单行展示 displayName 优先；昵称仅在好友详情面板展示，列表里不重复 -->
    <div class="flex flex-1 min-w-0">
      <div class="overflow-hidden text-sm truncate text-[var(--ant-color-text)]">
        {{ friend.displayName || friend.nickname }}
      </div>
    </div>
    <slot></slot>
  </div>
</template>
