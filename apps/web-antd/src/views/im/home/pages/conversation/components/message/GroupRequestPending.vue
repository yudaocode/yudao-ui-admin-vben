<script lang="ts" setup>
import { computed, ref } from 'vue'

import { IconifyIcon as Icon } from '@vben/icons'

import { getCurrentUserId } from '#/views/im/utils/auth'
import { ImGroupMemberRole } from '#/views/im/utils/constants'

import GroupRequestListDialog from '../../../../components/group/GroupRequestListDialog.vue'
import { useGroupRequestStore } from '../../../../store/groupRequestStore'
import { useGroupStore } from '../../../../store/groupStore'

defineOptions({ name: 'ImGroupRequestPending' })

const props = defineProps<{
  groupId: number
}>()

const groupStore = useGroupStore()
const groupRequestStore = useGroupRequestStore()

const requestListDialogRef = ref<InstanceType<typeof GroupRequestListDialog>>() // 申请列表弹窗 ref：handleOpen 调 open({ groupId }) 触发

/** 打开当前群的进群申请列表 */
function handleOpen() {
  requestListDialogRef.value?.open({ groupId: props.groupId })
}

/** 当前群（含 ownerUserId / members） */
const group = computed(() => groupStore.getGroup(props.groupId))

/** 当前用户在群里的角色；优先用 group.members，懒加载未到时回退到 ownerUserId 直判 */
const myRole = computed(() => {
  const myId = getCurrentUserId()
  if (group.value?.ownerUserId === myId) {
    return ImGroupMemberRole.OWNER
  }
  return group.value?.members?.find((m) => m.userId === myId)?.role
})

/** 仅群主 / 管理员可见 */
const canManage = computed(
  () => myRole.value === ImGroupMemberRole.OWNER || myRole.value === ImGroupMemberRole.ADMIN
)

/** 当前群未处理申请数；从 store 派生 */
const pendingCount = computed(() => groupRequestStore.getUnhandledGroupRequestCount(props.groupId))
</script>

<template>
  <!--
    群顶部「待处理加群申请」横幅
    - 仅当登录用户是该群 owner / admin 且该群下未处理申请数 > 0 时显示
    - count 从 groupRequestStore 派生（全局存）；本端处理 / WS 通知到达后 store 自动更新
    - 点击横幅打开 GroupRequestListDialog（含历史已处理记录），不再就地展开
  -->
  <div
    v-if="canManage && pendingCount > 0"
    class="flex flex-shrink-0 flex-col items-start px-4 pt-1.5 pb-2 bg-[var(--ant-color-fill-secondary)]"
  >
    <div
      class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-13px text-[var(--ant-color-text)] bg-[var(--ant-color-bg-container)] cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-colors hover:bg-[var(--ant-color-fill-tertiary)]"
      @click="handleOpen"
    >
      <Icon
        icon="ant-design:user-add-outlined"
        :size="14"
        class="im-group-request-pending__icon flex-shrink-0 text-[var(--ant-color-success)]"
      />
      <span class="flex-1 min-w-0 truncate"> 新进群申请（{{ pendingCount }}） </span>
      <Icon
        icon="ant-design:right-outlined"
        :size="11"
        class="flex-shrink-0 text-[var(--ant-color-text-placeholder)]"
      />
    </div>

    <!-- 申请列表 dialog：复用同一组件，避免群管理面板与会话顶部各写一份 -->
    <GroupRequestListDialog ref="requestListDialogRef" />
  </div>
</template>

<style scoped>
/* :deep 穿透 Icon 子组件 DOM；强制 svg 走 currentColor 应对暗色模式 el-icon 全局色覆盖 */
.im-group-request-pending__icon :deep(svg) {
  fill: currentColor !important;
}
</style>
