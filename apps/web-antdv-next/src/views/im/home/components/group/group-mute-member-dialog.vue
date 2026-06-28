<script lang="ts" setup>
import { ref } from 'vue';

import { Button, message, Modal } from 'antdv-next';

import { muteMember } from '#/api/im/group';

defineOptions({ name: 'ImGroupMuteMemberDialog' });

const emit = defineEmits<{
  success: [];
}>();

const visible = ref(false);
const loading = ref(false);
const groupId = ref(0);
const userId = ref(0);
const memberName = ref('');
const selected = ref(600); // 默认 10 分钟

const presets = [
  { label: '10 分钟', value: 600 },
  { label: '1 小时', value: 3600 },
  { label: '12 小时', value: 43_200 },
  { label: '1 天', value: 86_400 },
  { label: '7 天', value: 604_800 },
  { label: '30 天', value: 2_592_000 },
  { label: '永久', value: 0 },
];

/** 打开弹窗 */
function open(gid: number, uid: number, name: string) {
  groupId.value = gid;
  userId.value = uid;
  memberName.value = name;
  selected.value = 600;
  visible.value = true;
}

/** 确认禁言 */
async function handleConfirm() {
  loading.value = true;
  try {
    await muteMember({
      id: groupId.value,
      userId: userId.value,
      mutedSeconds: selected.value,
    });
    message.success('禁言成功');
    visible.value = false;
    emit('success');
  } finally {
    loading.value = false;
  }
}

defineExpose({ open });
</script>

<template>
  <!-- 禁言时长选择弹窗 -->
  <Modal
    v-model:open="visible"
    title="设置禁言"
    width="560px"
    :mask="{ closable: false }"
  >
    <div class="flex flex-col gap-4">
      <!-- 成员信息卡：和 FriendAddDialog 的 user 卡保持一致的浅色背景 -->
      <div
        class="flex items-center gap-2 px-3 py-2.5 rounded-md bg-[var(--ant-color-fill-secondary)]"
      >
        <span class="text-13px text-[var(--ant-color-text-secondary)]">
          禁言成员
        </span>
        <span class="text-sm font-medium text-[var(--ant-color-text)] truncate">
          {{ memberName }}
        </span>
      </div>

      <!-- 禁言时长选项：用 el-button 平铺，选中走 primary，靠 gap-2 留间距 -->
      <div>
        <div class="mb-2 text-13px text-[var(--ant-color-text-secondary)]">
          禁言时长
        </div>
        <div class="grid grid-cols-3 gap-2">
          <Button
            v-for="opt in presets"
            :key="opt.value"
            :type="selected === opt.value ? 'primary' : undefined"
            class="!ml-0 w-full"
            @click="selected = opt.value"
          >
            {{ opt.label }}
          </Button>
        </div>
      </div>
    </div>
    <template #footer>
      <Button @click="visible = false">取消</Button>
      <Button type="primary" :loading="loading" @click="handleConfirm">
        确定
      </Button>
    </template>
  </Modal>
</template>
