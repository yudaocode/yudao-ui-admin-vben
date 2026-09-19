<script lang="ts" setup>
import type { TableColumnsType } from 'antdv-next';

import type { OaScheduleApi } from '#/api/oa/schedule';

import { computed, ref } from 'vue';

import { useAccess } from '@vben/access';
import { useVbenModal } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';
import { formatDateTime } from '@vben/utils';

import { Button, Table, Tag } from 'antdv-next';

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

/** 参与人阅读情况表格列 */
const participantColumns: TableColumnsType<OaScheduleApi.ScheduleParticipant> =
  [
    { title: '参与人', key: 'userName', minWidth: 140 },
    { title: '阅读状态', key: 'readStatus', width: 100 },
    { title: '首次阅读时间', key: 'readTime', minWidth: 180 },
  ];

const [Descriptions] = useDescription({
  bordered: true,
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
  onConfirm: async () => {
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
      <Table
        :columns="participantColumns"
        :data-source="formData?.participants || []"
        :pagination="false"
        bordered
        row-key="userId"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'readStatus'">
            <Tag :color="record.readStatus ? 'success' : 'default'">
              {{ record.readStatus ? '已读' : '未读' }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'readTime'">
            {{ formatDateTime(record.readTime) || '-' }}
          </template>
        </template>
      </Table>
    </div>
    <template #prepend-footer>
      <Button v-if="canEdit" type="primary" @click="handleEdit">修 改</Button>
    </template>
  </Modal>
</template>
