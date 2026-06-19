<script lang="ts" setup>
import type { Conversation, Friend } from '../../../../types'

import { computed, ref, watch } from 'vue'

import { IconifyIcon as Icon } from '@vben/icons'

import { Button, Drawer, Input, message, Popover, Spin, Switch } from 'ant-design-vue'

import { useConversationStore } from '#/views/im/home/store/conversationStore'
import { useFriendStore } from '#/views/im/home/store/friendStore'
import { useGroupStore } from '#/views/im/home/store/groupStore'
import { ImConversationType } from '#/views/im/utils/constants'
import { getFriendDisplayName, getGroupDisplayName } from '#/views/im/utils/user'

import { GroupCreateDialog } from '../../../../components/group'
import { UserAvatar } from '../../../../components/user'

defineOptions({ name: 'ImConversationPrivateSide' })

const props = withDefaults(
  defineProps<{
    conversation?: Conversation | null // 当前会话（取置顶 / 免打扰态）
    friend?: Friend // 对方好友信息（取头像 / 昵称）
    modelValue?: boolean // 抽屉开关（v-model）
  }>(),
  {
    conversation: null,
    friend: undefined,
    modelValue: false
  }
)

const emit = defineEmits<{
  openHistory: [] // 点击 "查找聊天内容" 行 → 父组件打开 MessageHistory 弹窗
  'update:modelValue': [value: boolean]
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const conversationStore = useConversationStore()
const friendStore = useFriendStore()
const groupStore = useGroupStore()

/** tile 标签 / 后续聊天界面用的展示名：备注优先 */
const displayName = computed(() => (props.friend ? getFriendDisplayName(props.friend) : ''))

const createGroupDialogRef = ref<InstanceType<typeof GroupCreateDialog>>() // 发起群聊弹窗 ref：handleOpenCreateGroup 调 open({ lockedIds }) 锁定对方

/** 打开发起群聊弹窗：把对方默认勾上且不可取消，对应微信"基于私聊发起群聊" */
function handleOpenCreateGroup() {
  const lockedIds = props.friend ? [props.friend.friendUserId] : []
  createGroupDialogRef.value?.open({ lockedIds })
}

const displayNamePopoverVisible = ref(false)
const editDisplayName = ref('')

// popover 弹出时把当前备注灌进编辑态，避免上次未保存的脏值
watch(displayNamePopoverVisible, (open) => {
  if (open) {
    editDisplayName.value = props.friend?.displayName || ''
  }
})

// 抽屉关闭时把还没收掉的 popover 一并清掉，避免下次打开闪一下
watch(visible, (open) => {
  if (!open) {
    displayNamePopoverVisible.value = false
  }
})

/** 备注 popover 点击保存 */
async function handleSaveDisplayName() {
  if (!props.friend) {
    return
  }
  await friendStore.setFriendDisplayName(props.friend.friendUserId, editDisplayName.value)
  displayNamePopoverVisible.value = false
  message.success('保存成功')
}

/**
 * 切免打扰：乐观双写 conversationStore + friendStore；后端失败回滚 conversation 状态，保持与 ConversationItem.handleMuted 一致
 */
function handleMutedChange(value: boolean | number | string) {
  if (!props.conversation) {
    return
  }
  const next = !!value
  const { type, targetId } = props.conversation
  conversationStore.setConversationSilent(type, targetId, next)
  if (type !== ImConversationType.PRIVATE) {
    return
  }
  friendStore.setFriendSilent(targetId, next).catch((error) => {
    console.error('[IM ConversationPrivateSide] 切换免打扰失败', { targetId }, error)
    conversationStore.setConversationSilent(type, targetId, !next)
  })
}

/** 切置顶：纯本地 conversationStore 排序态（无后端字段） */
function handleTopChange(value: boolean | number | string) {
  if (!props.conversation) {
    return
  }
  conversationStore.setConversationTop(props.conversation.type, props.conversation.targetId, !!value)
}

/** 群创建成功：跳到新群会话 + 关掉本侧抽屉，让用户专注新群 */
function handleGroupCreated(groupId: number) {
  const group = groupStore.getGroup(groupId)
  if (!group) {
    return
  }
  conversationStore.openConversation(
    groupId,
    ImConversationType.GROUP,
    getGroupDisplayName(group),
    group.avatar || '',
    { silent: !!group.silent }
  )
  visible.value = false
}
</script>

<template>
  <!--
    私聊侧边抽屉
    - 整体结构对齐 ConversationGroupSide：宫格 + 信息行 + 开关
    - 顶部好友宫格 + "+" tile：点 + 调起 GroupCreateDialog 并锁定对方，对齐微信"基于私聊发起群聊"
    - "清空聊天记录"按钮在 WeChat 里有，但目前后端没建消息清空能力，先不加避免做半吊子
  -->
  <Drawer
    v-model:open="visible"
    :body-style="{ padding: 0 }"
    :closable="false"
    placement="right"
    width="340px"
    root-class-name="im-conversation-private-side__modal"
  >
    <!-- friend 缺失场景：陌生人会话刚打开 / 好友数据还没补拉到；空白会让用户以为抽屉坏了，给个加载占位 -->
    <div
      v-if="!friend"
      class="flex flex-col items-center justify-center h-full text-13px text-[var(--ant-color-text-placeholder)] bg-[var(--ant-color-bg-container)]"
    >
      <Spin tip="加载中..." />
    </div>
    <div v-else class="flex flex-col h-full bg-[var(--ant-color-bg-container)]">
      <div class="flex-1 overflow-y-auto bg-[var(--ant-color-fill-secondary)]">
        <!-- 好友宫格：原 tile + "+" tile，对齐 GroupSide 视觉，让两种抽屉看起来是一家的 -->
        <div class="flex flex-wrap gap-1 px-4 pt-4 pb-[14px] bg-[var(--ant-color-bg-container)]">
          <div class="flex flex-col items-center w-[66px]">
            <UserAvatar
              :id="friend.friendUserId"
              :url="friend.avatar"
              :name="friend.nickname"
              :size="50"
            />
            <div class="w-full mt-1.5 overflow-hidden text-12px leading-[1.5] text-[var(--ant-color-text)] text-center truncate">
              {{ displayName }}
            </div>
          </div>

          <!-- + tile：点击调起 GroupCreateDialog，把对方 id 作为 lockedIds 传入 -->
          <div
            class="im-conversation-private-side__tile-wrap-clickable flex flex-col items-center w-[66px] cursor-pointer"
            title="发起群聊"
            @click="handleOpenCreateGroup"
          >
            <div class="im-conversation-private-side__icon-tile flex items-center justify-center w-[50px] h-[50px] text-20px text-[var(--ant-color-text)] bg-[var(--ant-color-fill-tertiary)] border border-dashed border-[var(--ant-color-border)] rounded-md transition-colors duration-200">
              <Icon icon="ant-design:plus-outlined" />
            </div>
            <div class="w-full mt-1.5 overflow-hidden text-12px leading-[1.5] text-[var(--ant-color-text)] text-center truncate">添加</div>
          </div>
        </div>

        <div class="flex-shrink-0 h-[10px]"></div>

        <!-- 备注（仅自己可见）：点击弹 popover 编辑，保存后立即刷新本抽屉 + 会话列表展示名 -->
        <div class="bg-[var(--ant-color-bg-container)]">
          <Popover
            v-model:open="displayNamePopoverVisible"
            trigger="click"
            placement="leftTop"
            :overlay-style="{ width: '280px' }"
          >
            <div
              class="im-conversation-private-side__row flex flex-col items-stretch gap-1.5 px-4 py-[14px] text-14px min-h-6 cursor-pointer transition-colors duration-150 hover:bg-[var(--ant-color-fill-tertiary)]"
            >
              <span class="flex-shrink-0 text-14px text-[var(--ant-color-text)]">备注</span>
              <span
                v-if="friend.displayName"
                class="text-13px leading-[1.6] text-[var(--ant-color-text)] break-all line-clamp-2"
              >
                {{ friend.displayName }}
              </span>
              <span v-else class="text-13px leading-[1.6] text-[var(--ant-color-text-placeholder)]">
                好友备注仅自己可见
              </span>
            </div>
            <template #content>
              <div class="flex flex-col gap-2">
                <Input
                  v-model:value="editDisplayName"
                  :maxlength="16"
                  show-count
                  placeholder="请输入备注名"
                />
                <div class="flex justify-end gap-2">
                  <Button size="small" @click="displayNamePopoverVisible = false">取消</Button>
                  <Button size="small" type="primary" @click="handleSaveDisplayName">
                    保存
                  </Button>
                </div>
              </div>
            </template>
          </Popover>
        </div>

        <div class="flex-shrink-0 h-[10px]"></div>

        <!-- 查找聊天内容 -->
        <div class="bg-[var(--ant-color-bg-container)]">
          <div
            class="im-conversation-private-side__row flex items-center justify-between gap-3 px-4 py-[13px] text-14px min-h-6 cursor-pointer transition-colors duration-150 hover:bg-[var(--ant-color-fill-tertiary)]"
            @click="emit('openHistory')"
          >
            <span class="flex-shrink-0 text-14px text-[var(--ant-color-text)]">查找聊天内容</span>
            <Icon
              icon="ant-design:right-outlined"
              :size="11"
              class="text-[var(--ant-color-text-placeholder)]"
            />
          </div>
        </div>

        <div class="flex-shrink-0 h-[10px]"></div>

        <!-- 开关项 -->
        <div class="bg-[var(--ant-color-bg-container)]">
          <div class="im-conversation-private-side__row flex items-center justify-between gap-3 px-4 py-[13px] text-14px min-h-6 transition-colors duration-150">
            <span class="flex-shrink-0 text-14px text-[var(--ant-color-text)]">消息免打扰</span>
            <Switch :checked="!!conversation?.silent" @change="handleMutedChange" />
          </div>
          <div class="im-conversation-private-side__row flex items-center justify-between gap-3 px-4 py-[13px] text-14px min-h-6 transition-colors duration-150">
            <span class="flex-shrink-0 text-14px text-[var(--ant-color-text)]">置顶聊天</span>
            <Switch :checked="!!conversation?.top" @change="handleTopChange" />
          </div>
        </div>
      </div>
    </div>

    <!-- 子对话框：发起群聊（锁定对方为已选） -->
    <GroupCreateDialog ref="createGroupDialogRef" @created="handleGroupCreated" />
  </Drawer>
</template>

<style scoped>
/* 「+」 tile： hover 时联动内部 icon-tile 走主色； 跨子元素的 hover 联动无法用单元素工具类表达 */
.im-conversation-private-side__tile-wrap-clickable:hover .im-conversation-private-side__icon-tile {
  color: var(--ant-color-primary);
  border-color: var(--ant-color-primary);
  background-color: var(--ant-color-primary-bg);
}

/* :deep 穿透 Icon 内部 svg； el-icon 全局 color 在暗色模式下被主题盖过，锁 fill 到当前色 */
.im-conversation-private-side__icon-tile :deep(svg) {
  fill: currentColor !important;
}

/* 抽屉内「卡片之间」的浅底色，与群聊抽屉保持一致。
   必须 :global —— antd Drawer 传送到 body 后只带 root-class-name、不带 scoped data-v，
   普通作用域选择器匹配不到，会导致灰色分隔底色失效、区块间隔显白 */
:global(.im-conversation-private-side__modal) {
  --im-conversation-side-bg: #f5f7fa;
}

/* 相邻信息行加分隔线； 相邻兄弟选择器无法用工具类表达 */
.im-conversation-private-side__row + .im-conversation-private-side__row {
  border-top: 1px solid var(--im-border-color-lighter);
}

/* 整体放进 :global()，避免 Vue scoped 把 `:global(.dark) .xxx` 塌缩成裸 `.dark` 而把变量刷到 <html> */
:global(.dark .im-conversation-private-side__modal) {
  --im-conversation-side-bg: rgb(255 255 255 / 5%);
}
</style>

<!-- 同 GroupSide：antd Drawer 传送到 body 后 scoped data-v 落不到 body 上，靠 root-class-name 作祖先选择器写全局规则压掉默认 padding -->
<style>
.im-conversation-private-side__modal .ant-drawer-body {
  padding: 0;
}
</style>
