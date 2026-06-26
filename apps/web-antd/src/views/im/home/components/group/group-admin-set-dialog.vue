<script lang="ts" setup>
import type { GroupMemberLite } from './group-member.vue';

import { ref } from 'vue';

import { Button, message, Modal } from 'ant-design-vue';

import { addGroupAdmin, removeGroupAdmin } from '#/api/im/group';
import { GROUP_ADMIN_MAX_COUNT } from '#/views/im/utils/config';

import { GroupMemberPickerPanel } from '../picker';

defineOptions({ name: 'ImGroupAdminSetDialog' });

const emit = defineEmits<{
  /** 管理员变更成功；父侧通常用来 reload 群数据 */
  reload: [];
}>();

const visible = ref(false);
const submitting = ref(false);
const groupId = ref(0);
const members = ref<GroupMemberLite[]>([]);
const currentAdminIds = ref<number[]>([]); // 当前管理员 userId 列表：默认勾选 + 提交时 diff
const hideIds = ref<number[]>([]);
const maxSize = ref(GROUP_ADMIN_MAX_COUNT);
const selectedIds = ref<number[]>([]);

defineExpose({
  /** 打开设置管理员弹窗：reset → 灌参 → visible=true */
  open(opts: {
    /** 当前管理员 userId 列表（默认勾选） */
    currentAdminIds: number[];
    groupId: number;
    /** 隐藏 userId（群主） */
    hideIds?: number[];
    /** 已选数上限；不传走 GROUP_ADMIN_MAX_COUNT */
    maxSize?: number;
    members: GroupMemberLite[];
  }) {
    groupId.value = opts.groupId;
    members.value = opts.members;
    currentAdminIds.value = [...opts.currentAdminIds];
    hideIds.value = opts.hideIds ? [...opts.hideIds] : [];
    maxSize.value = opts.maxSize ?? GROUP_ADMIN_MAX_COUNT;
    selectedIds.value = [...opts.currentAdminIds];
    submitting.value = false;
    visible.value = true;
  },
});

/** 跟当前管理员列表做差集，分别拿到要新增 / 撤销的 userId */
async function handleOk() {
  if (!groupId.value) {
    return;
  }
  const previousIds = currentAdminIds.value;
  const previousIdSet = new Set(previousIds);
  const nextIds = selectedIds.value;
  const nextIdSet = new Set(nextIds);
  const addedIds = nextIds.filter((id) => !previousIdSet.has(id));
  const removedIds = previousIds.filter((id) => !nextIdSet.has(id));
  if (addedIds.length === 0 && removedIds.length === 0) {
    visible.value = false;
    return;
  }
  submitting.value = true;
  try {
    if (addedIds.length > 0) {
      await addGroupAdmin({ id: groupId.value, userIds: addedIds });
    }
    if (removedIds.length > 0) {
      await removeGroupAdmin({ id: groupId.value, userIds: removedIds });
    }
    message.success(
      `已更新群管理员（新增 ${addedIds.length} 位，撤销 ${removedIds.length} 位）`,
    );
    emit('reload');
    visible.value = false;
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <!--
    设置群管理员：一个弹窗合并增 / 删，提交时跟当前管理员列表 diff
    - dialog 壳本组件持有；选择 UI 委托 GroupMemberPickerPanel（grid 形态对齐当前视觉）
    - 群主从候选里隐藏（不能设为管理员）
    - 对外接口：ref + open({ groupId, members, currentAdminIds, hideIds, maxSize }) + emit reload()
  -->
  <Modal
    v-model:open="visible"
    title="设置群管理员"
    width="700px"
    :mask-closable="false"
    class="im-picker-dialog"
  >
    <div class="h-[480px]">
      <GroupMemberPickerPanel
        v-model:selected-ids="selectedIds"
        :members="members"
        :hide-ids="hideIds"
        :max-size="maxSize"
        selected-display="grid"
      />
    </div>

    <template #footer>
      <Button @click="visible = false">取消</Button>
      <Button type="primary" :loading="submitting" @click="handleOk">
        确定
      </Button>
    </template>
  </Modal>
</template>

<style scoped lang="scss">
@use '../picker/picker-dialog' as picker;

/* :deep 穿透 el-dialog 内部类；复用 picker 公共 mixin */
.im-picker-dialog {
  @include picker.styles;
}
</style>
