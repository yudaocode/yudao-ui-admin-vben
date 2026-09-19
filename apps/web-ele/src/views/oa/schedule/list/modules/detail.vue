<script lang="ts" setup>
import type { OaScheduleApi } from '#/api/oa/schedule';

import { computed, ref } from 'vue';

import { useAccess } from '@vben/access';
import { useVbenModal } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';
import { formatDateTime } from '@vben/utils';

import { ElButton, ElTable, ElTableColumn, ElTag } from 'element-plus';

import { getSchedule, updateScheduleReadStatus } from '#/api/oa/schedule';
import { useDescription } from '#/components/description';

import { useDetailSchema } from '../data';

defineOptions({ name: 'OaScheduleDetail' });

const emit = defineEmits(['edit']); // 修改日程事件

const { hasAccessByCodes } = useAccess();
const userStore = useUserStore(); // 当前用户信息

const formData = ref<OaScheduleApi.Schedule>(); // 日程详情
const modalOpened = ref(false); // 弹窗是否打开，关闭后不继续标记已读

/** 是否允许修改，仅创建人且有修改权限时展示 */
const canEdit = computed(() => {
  return (
    formData.value?.creator === String(userStore.userInfo?.id) &&
    hasAccessByCodes(['oa:schedule:update'])
  );
});

const [Descriptions] = useDescription({
  border: true,
  column: 1,
  schema: useDetailSchema(),
});

/** 修改日程 */
function handleEdit() {
  if (!formData.value?.id) {
    return;
  }
  modalApi.close();
  emit('edit', formData.value.id);
}

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    await modalApi.close();
  },
  async onOpenChange(isOpen: boolean) {
    modalOpened.value = isOpen;
    if (!isOpen) {
      formData.value = undefined;
      return;
    }
    // 加载数据
    const data = modalApi.getData() as { id: number };
    if (!data?.id) {
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getSchedule(data.id);
      // 仅本人参与且尚未阅读时提交，列表、日历和编辑表单不调用此接口
      const participant = formData.value?.participants?.find(
        (item) => item.userId === userStore.userInfo?.id,
      );
      if (modalOpened.value && participant && !participant.readStatus) {
        await updateScheduleReadStatus(data.id);
        formData.value = await getSchedule(data.id);
      }
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal
    title="日程详情"
    class="w-1/2"
    :show-cancel-button="false"
    confirm-text="关 闭"
  >
    <Descriptions :data="formData" />
    <!-- 参与人阅读情况 -->
    <div class="mt-5">
      <div class="mb-3 font-semibold">参与人阅读情况</div>
      <ElTable :data="formData?.participants || []" border row-key="userId">
        <ElTableColumn label="参与人" prop="userName" min-width="140" />
        <ElTableColumn label="阅读状态" width="100">
          <template #default="scope">
            <ElTag :type="scope.row.readStatus ? 'success' : 'info'">
              {{ scope.row.readStatus ? '已读' : '未读' }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="首次阅读时间" min-width="180">
          <template #default="scope">
            {{ formatDateTime(scope.row.readTime) || '-' }}
          </template>
        </ElTableColumn>
      </ElTable>
    </div>
    <template #prepend-footer>
      <ElButton v-if="canEdit" type="primary" @click="handleEdit">
        修 改
      </ElButton>
    </template>
  </Modal>
</template>
