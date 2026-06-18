<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { ImManagerGroupApi } from '#/api/im/manager/group';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { confirm, Page, useVbenModal } from '@vben/common-ui';
import { CommonStatusEnum, DICT_TYPE } from '@vben/constants';

import { ElAvatar, ElMessage, ElTag, ElTooltip } from 'element-plus'

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  dissolveManagerGroup,
  getManagerGroupPage,
  unbanManagerGroup,
} from '#/api/im/manager/group';
import { DictTag } from '#/components/dict-tag';
import { formatUserLabel } from '#/views/im/manager/utils/format';

import { useGroupGridColumns, useGroupGridFormSchema } from './data';
import BanForm from './modules/ban-form.vue';
import Detail from './modules/detail.vue';

defineOptions({ name: 'ImManagerGroup' });

const router = useRouter();
const detailRef = ref<InstanceType<typeof Detail>>();

const [BanModal, banModalApi] = useVbenModal({
  connectedComponent: BanForm,
  destroyOnClose: true,
});

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 打开详情 */
function handleDetail(row: ImManagerGroupApi.Group) {
  detailRef.value?.open(row);
}

/** 查看群聊消息 */
function handleConversation(row: ImManagerGroupApi.Group) {
  router.push({
    name: 'ImGroupMessage',
    query: { groupId: row.id },
  });
}

/** 打开封禁弹窗 */
function handleBan(row: ImManagerGroupApi.Group) {
  banModalApi.setData(row).open();
}

/** 解封群 */
async function handleUnban(row: ImManagerGroupApi.Group) {
  await confirm(`确认解封群「${row.name}」吗？`);
  await unbanManagerGroup(row.id);
  ElMessage.success('解封成功');
  handleRefresh();
}

/** 解散群 */
async function handleDissolve(row: ImManagerGroupApi.Group) {
  await confirm(`确认解散群「${row.name}」吗？`);
  await dissolveManagerGroup(row.id);
  ElMessage.success('解散成功');
  handleRefresh();
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGroupGridFormSchema(),
  },
  gridOptions: {
    columns: useGroupGridColumns(),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getManagerGroupPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          });
        },
      },
    },
    rowConfig: {
      keyField: 'id',
      isHover: true,
    },
    toolbarConfig: {
      refresh: true,
      search: true,
    },
  } as VxeTableGridOptions<ImManagerGroupApi.Group>,
});
</script>

<template>
  <Page auto-content-height>
    <BanModal @success="handleRefresh" />
    <Detail ref="detailRef" />
    <Grid table-title="群列表">
      <template #avatar="{ row }">
        <ElAvatar :src="row.avatar" :size="40">
          {{ row.name?.charAt(0) || '?' }}
        </ElAvatar>
      </template>
      <template #owner="{ row }">
        {{ formatUserLabel(row.ownerNickname, row.ownerUserId) }}
      </template>
      <template #banned="{ row }">
        <ElTooltip v-if="row.banned" :content="row.bannedReason">
          <span class="inline-flex">
            <DictTag :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="row.banned" />
          </span>
        </ElTooltip>
        <DictTag v-else :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="row.banned" />
      </template>
      <template #mutedAll="{ row }">
        <ElTag v-if="row.mutedAll" type="danger">已禁言</ElTag>
        <ElTag v-else>未禁言</ElTag>
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: '详情',
              link: true,
              icon: ACTION_ICON.VIEW,
              auth: ['im:manager:group:query'],
              onClick: handleDetail.bind(null, row),
            },
            {
              label: '查看对话',
              link: true,
              icon: ACTION_ICON.VIEW,
              onClick: handleConversation.bind(null, row),
            },
            {
              label: row.banned ? '解封' : '封禁',
              link: true,
              type: row.banned ? 'primary' : 'danger',
              icon: ACTION_ICON.CLOSE,
              auth: ['im:manager:group:ban'],
              onClick: row.banned ? handleUnban.bind(null, row) : handleBan.bind(null, row),
            },
            {
              label: '解散',
              link: true,
              type: 'danger',
              icon: ACTION_ICON.DELETE,
              auth: ['im:manager:group:dissolve'],
              ifShow: row.status === CommonStatusEnum.ENABLE,
              onClick: handleDissolve.bind(null, row),
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
