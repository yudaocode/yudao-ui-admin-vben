<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmRecruitCandidateApi } from '#/api/hrm/recruit/candidate';
import type { HrmRecruitCandidateStatusValue } from '#/views/hrm/utils/constants';

import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { useAccess } from '@vben/access';
import { confirm, DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { getDictLabel, getDictOptions } from '@vben/hooks';

import {
  Button,
  Dropdown,
  Menu,
  MenuItem,
  message,
  TabPane,
  Tabs,
} from 'antdv-next';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteRecruitCandidate,
  getRecruitCandidatePage,
  getRecruitCandidateStatusCount,
  updateRecruitCandidateStatus,
} from '#/api/hrm/recruit/candidate';
import { getRecruitInterview } from '#/api/hrm/recruit/interview';
import { DictTag } from '#/components/dict-tag';
import { $t } from '#/locales';
import EmployeeForm from '#/views/hrm/employee/modules/form.vue';
import { executeBatch } from '#/views/hrm/utils/batch';
import {
  HRM_RECRUIT_CANDIDATE_EMPLOYEE_EDUCATION_MAP,
  HrmEmployeeEntryStatus,
  HrmEmployeeStatus,
  HrmEmployeeType,
  HrmRecruitCandidateStatus,
  HrmRecruitInterviewResult,
} from '#/views/hrm/utils/constants';

import { useGridColumns, useGridFormSchema } from './data';
import ChannelBatchForm from './modules/channel-batch-form.vue';
import CleanForm from './modules/clean-form.vue';
import EliminateForm from './modules/eliminate-form.vue';
import Form from './modules/form.vue';
import InterviewForm from './modules/interview-form.vue';
import InterviewResultForm from './modules/interview-result-form.vue';
import PostBatchForm from './modules/post-batch-form.vue';
import StatusBatchForm from './modules/status-batch-form.vue';

defineOptions({ name: 'HrmRecruitCandidate' });

const { push } = useRouter();
const route = useRoute();
const { hasAccessByCodes } = useAccess();

const activeStatus = ref('all');
const statusCounts = ref<HrmRecruitCandidateApi.StatusCount[]>([]);
const checkedIds = ref<number[]>([]);

const statusTabOptions = computed(() => {
  const countMap: Record<number, number> = {};
  for (const item of statusCounts.value) {
    countMap[item.status] = item.count;
  }
  return getDictOptions(DICT_TYPE.HRM_RECRUIT_CANDIDATE_STATUS, 'number').map(
    (item) => ({
      label: item.label,
      value: String(item.value),
      count: countMap[Number(item.value)] ?? 0,
    }),
  );
});

const allStatusCount = computed(() => {
  let total = 0;
  for (const item of statusCounts.value) {
    total += item.count;
  }
  return total;
});

const activeStatusValue = computed<HrmRecruitCandidateStatusValue | undefined>(
  () =>
    activeStatus.value === 'all'
      ? undefined
      : (Number(activeStatus.value) as HrmRecruitCandidateStatusValue),
);

/** 判断当前是否为指定候选人状态 */
function isActiveStatusIn(statuses: number[]) {
  return (
    activeStatusValue.value !== undefined &&
    statuses.includes(activeStatusValue.value)
  );
}

const canBatchUpdateStatus = computed(() =>
  isActiveStatusIn([
    HrmRecruitCandidateStatus.NEW,
    HrmRecruitCandidateStatus.PRIMARY_PASS,
    HrmRecruitCandidateStatus.INTERVIEW_PASS,
  ]),
);
const canBatchInterview = computed(() => canBatchUpdateStatus.value);
const canBatchUpdatePostOrChannel = computed(() => canBatchUpdateStatus.value);
const canBatchEliminate = computed(() =>
  isActiveStatusIn([
    HrmRecruitCandidateStatus.NEW,
    HrmRecruitCandidateStatus.PRIMARY_PASS,
    HrmRecruitCandidateStatus.INTERVIEW,
    HrmRecruitCandidateStatus.INTERVIEW_PASS,
    HrmRecruitCandidateStatus.OFFER_SENT,
    HrmRecruitCandidateStatus.PENDING_ENTRY,
  ]),
);
const candidateDeleteStatuses: number[] = [
  HrmRecruitCandidateStatus.NEW,
  HrmRecruitCandidateStatus.PRIMARY_PASS,
  HrmRecruitCandidateStatus.INTERVIEW,
  HrmRecruitCandidateStatus.INTERVIEW_PASS,
  HrmRecruitCandidateStatus.ELIMINATED,
];
const canBatchDelete = computed(() =>
  isActiveStatusIn(candidateDeleteStatuses),
);

const hasBatchPermission = computed(
  () =>
    hasAccessByCodes(['hrm:recruit:candidate:update']) ||
    hasAccessByCodes(['hrm:recruit:interview:create']) ||
    hasAccessByCodes(['hrm:recruit:candidate:delete']),
);

const hasBatchNonDeleteOperations = computed(
  () =>
    (hasAccessByCodes(['hrm:recruit:candidate:update']) &&
      (canBatchUpdateStatus.value ||
        canBatchUpdatePostOrChannel.value ||
        canBatchEliminate.value)) ||
    (hasAccessByCodes(['hrm:recruit:interview:create']) &&
      canBatchInterview.value),
);

const hasBatchOperations = computed(
  () =>
    hasBatchNonDeleteOperations.value ||
    (hasAccessByCodes(['hrm:recruit:candidate:delete']) &&
      canBatchDelete.value),
);

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});
const [StatusBatchModal, statusBatchModalApi] = useVbenModal({
  connectedComponent: StatusBatchForm,
  destroyOnClose: true,
});
const [PostBatchModal, postBatchModalApi] = useVbenModal({
  connectedComponent: PostBatchForm,
  destroyOnClose: true,
});
const [ChannelBatchModal, channelBatchModalApi] = useVbenModal({
  connectedComponent: ChannelBatchForm,
  destroyOnClose: true,
});
const [EliminateModal, eliminateModalApi] = useVbenModal({
  connectedComponent: EliminateForm,
  destroyOnClose: true,
});
const [CleanModal, cleanModalApi] = useVbenModal({
  connectedComponent: CleanForm,
  destroyOnClose: true,
});
const [InterviewModal, interviewModalApi] = useVbenModal({
  connectedComponent: InterviewForm,
  destroyOnClose: true,
});
const [InterviewResultModal, interviewResultModalApi] = useVbenModal({
  connectedComponent: InterviewResultForm,
  destroyOnClose: true,
});
const [EmployeeFormModal, employeeFormModalApi] = useVbenModal({
  connectedComponent: EmployeeForm,
  destroyOnClose: true,
});

/** 刷新列表和状态统计 */
async function handleRefresh() {
  await Promise.all([gridApi.query(), getStatusCounts()]);
}

/** 查询状态统计（不带 status，避免切换页签后数量被当前状态过滤） */
async function getStatusCounts() {
  const formValues = await gridApi.formApi.getValues();
  statusCounts.value = await getRecruitCandidateStatusCount({
    ...formValues,
  });
}

/** 切换状态页签 */
function handleStatusTabChange(key: number | string) {
  activeStatus.value = String(key);
  checkedIds.value = [];
  handleRefresh();
}

/** 新增 */
function handleCreate() {
  formModalApi.setData(null).open();
}

/** 编辑 */
function handleEdit(row: HrmRecruitCandidateApi.RecruitCandidate) {
  formModalApi.setData(row).open();
}

/** 详情 */
function handleDetail(id?: number) {
  if (!id) {
    return;
  }
  push({ name: 'HrmRecruitCandidateDetail', params: { id } });
}

/** 安排面试 */
function openInterview(candidateId: number) {
  interviewModalApi
    .setData({ type: 'create', candidateIdOrIds: candidateId })
    .open();
}

/** 安排复试 */
function openReinterview(candidateId: number) {
  interviewModalApi
    .setData({
      type: 'create',
      candidateIdOrIds: candidateId,
      createTitle: '安排复试',
    })
    .open();
}

/** 批量面试 */
function openBatchInterview() {
  if (checkedIds.value.length === 0) {
    return;
  }
  interviewModalApi
    .setData({ type: 'batch', candidateIdOrIds: checkedIds.value })
    .open();
}

/** 登记面试结果 */
async function openInterviewResult(
  candidate: HrmRecruitCandidateApi.RecruitCandidate,
) {
  if (!candidate.interviewId) {
    message.warning('请先安排面试');
    return;
  }
  const interview = await getRecruitInterview(candidate.interviewId);
  interviewResultModalApi.setData({ interview }).open();
}

/** 更改面试安排 */
async function openInterviewChange(
  candidate: HrmRecruitCandidateApi.RecruitCandidate,
) {
  if (!candidate.id || !candidate.interviewId) {
    return;
  }
  const interview = await getRecruitInterview(candidate.interviewId);
  interviewModalApi
    .setData({
      type: 'update',
      candidateIdOrIds: candidate.id,
      interview,
    })
    .open();
}

/** 取消面试 */
async function openInterviewCancel(
  candidate: HrmRecruitCandidateApi.RecruitCandidate,
) {
  if (!candidate.interviewId) {
    return;
  }
  const interview = await getRecruitInterview(candidate.interviewId);
  interviewResultModalApi
    .setData({ interview, result: HrmRecruitInterviewResult.CANCELED })
    .open();
}

/** 批量流转 */
function openBatchStatusForm() {
  if (!activeStatusValue.value) {
    return;
  }
  statusBatchModalApi
    .setData({ ids: checkedIds.value, status: activeStatusValue.value })
    .open();
}

/** 批量改职位 */
function openBatchPostForm() {
  postBatchModalApi.setData({ ids: checkedIds.value }).open();
}

/** 批量改渠道 */
function openBatchChannelForm() {
  channelBatchModalApi.setData({ ids: checkedIds.value }).open();
}

/** 淘汰 */
function openEliminateForm(candidate: HrmRecruitCandidateApi.RecruitCandidate) {
  if (!candidate.id) {
    return;
  }
  eliminateModalApi.setData({ ids: candidate.id, name: candidate.name }).open();
}

/** 批量淘汰 */
function openBatchEliminateForm() {
  eliminateModalApi.setData({ ids: checkedIds.value }).open();
}

/** 转员工 */
function openEntryForm(candidate: HrmRecruitCandidateApi.RecruitCandidate) {
  if (!candidate.id) {
    return;
  }
  const entryTime = candidate.entryTime
    ? Number(candidate.entryTime)
    : Date.now();
  employeeFormModalApi
    .setData({
      type: 'candidate',
      defaultData: {
        candidateId: candidate.id,
        name: candidate.name,
        mobile: candidate.mobile,
        sex: candidate.sex,
        age: candidate.age,
        email: candidate.email,
        highestEducation:
          candidate.education === undefined || candidate.education === null
            ? undefined
            : HRM_RECRUIT_CANDIDATE_EMPLOYEE_EDUCATION_MAP[candidate.education],
        deptId: candidate.deptId,
        postName: candidate.postName,
        channelId: candidate.channelId,
        entryStatus: HrmEmployeeEntryStatus.PENDING_ENTRY,
        status: HrmEmployeeStatus.PROBATION,
        type: HrmEmployeeType.FORMAL,
        entryTime,
        companyAgeStartTime: entryTime,
        probation: 3,
        remark: candidate.remark,
      },
    })
    .open();
}

/** 确认入职 */
function handleConfirmEntry(
  candidate: HrmRecruitCandidateApi.RecruitCandidate,
) {
  if (!candidate.employeeId) {
    return;
  }
  employeeFormModalApi
    .setData({ type: 'confirm', id: candidate.employeeId })
    .open();
}

/** 一键清理 */
function openCleanForm() {
  cleanModalApi.open();
}

/** 获得候选人的主操作 */
function getPrimaryAction(
  candidate: HrmRecruitCandidateApi.RecruitCandidate,
): undefined | { command: string; label: string } {
  if (
    hasAccessByCodes(['hrm:recruit:interview:update']) &&
    candidate.status === HrmRecruitCandidateStatus.INTERVIEW &&
    candidate.interviewId &&
    candidate.interviewResult === HrmRecruitInterviewResult.CANCELED
  ) {
    return { command: 'interview-change', label: '重新安排' };
  }
  if (
    hasAccessByCodes(['hrm:recruit:interview:update']) &&
    candidate.status === HrmRecruitCandidateStatus.INTERVIEW &&
    candidate.interviewId &&
    candidate.interviewResult !== HrmRecruitInterviewResult.CANCELED
  ) {
    return { command: 'interview-result', label: '登记结果' };
  }
  if (
    hasAccessByCodes(['hrm:employee:update']) &&
    candidate.status === HrmRecruitCandidateStatus.PENDING_ENTRY &&
    candidate.employeeId
  ) {
    return { command: 'confirm-entry', label: '确认入职' };
  }
  if (
    hasAccessByCodes(['hrm:recruit:candidate:update']) &&
    (candidate.status === HrmRecruitCandidateStatus.INTERVIEW_PASS ||
      candidate.status === HrmRecruitCandidateStatus.OFFER_SENT) &&
    !candidate.employeeId
  ) {
    return { command: 'convert-employee', label: '转为员工' };
  }
  if (
    hasAccessByCodes(['hrm:recruit:interview:create']) &&
    (candidate.status === HrmRecruitCandidateStatus.NEW ||
      candidate.status === HrmRecruitCandidateStatus.PRIMARY_PASS ||
      candidate.status === HrmRecruitCandidateStatus.INTERVIEW_PASS)
  ) {
    return { command: 'interview', label: '安排面试' };
  }
  return undefined;
}

/** 获得候选人的更多操作 */
function getMoreActions(candidate: HrmRecruitCandidateApi.RecruitCandidate) {
  const actions: Array<{ command: string; label: string }> = [];
  if (
    hasAccessByCodes(['hrm:recruit:interview:update']) &&
    candidate.status === HrmRecruitCandidateStatus.INTERVIEW &&
    candidate.interviewId &&
    candidate.interviewResult !== HrmRecruitInterviewResult.CANCELED
  ) {
    actions.push(
      { command: 'interview-change', label: '更改面试安排' },
      { command: 'interview-cancel', label: '取消面试' },
    );
  }
  if (
    hasAccessByCodes(['hrm:recruit:interview:create']) &&
    candidate.status === HrmRecruitCandidateStatus.INTERVIEW_PASS
  ) {
    actions.push({ command: 'reinterview', label: '安排复试' });
  }
  if (hasAccessByCodes(['hrm:recruit:candidate:update'])) {
    if (candidate.status === HrmRecruitCandidateStatus.NEW) {
      actions.push({ command: 'primary-pass', label: '初选通过' });
    }
    if (candidate.status === HrmRecruitCandidateStatus.INTERVIEW_PASS) {
      actions.push({ command: 'offer', label: '发 Offer' });
    }
    if (candidate.status === HrmRecruitCandidateStatus.ELIMINATED) {
      actions.push({ command: 'restore', label: '恢复为新候选人' });
    }
    if (
      candidate.status !== HrmRecruitCandidateStatus.ELIMINATED &&
      candidate.status !== HrmRecruitCandidateStatus.JOINED
    ) {
      actions.push({ command: 'eliminate', label: '淘汰' });
    }
  }
  if (
    hasAccessByCodes(['hrm:recruit:candidate:delete']) &&
    !candidate.employeeId &&
    candidate.status !== undefined &&
    candidate.status !== null &&
    candidateDeleteStatuses.includes(candidate.status)
  ) {
    actions.push({ command: 'delete', label: '删除' });
  }
  return actions;
}

/** 主操作 */
async function handlePrimaryAction(
  command: string,
  candidate: HrmRecruitCandidateApi.RecruitCandidate,
) {
  if (command === 'interview-result') {
    await openInterviewResult(candidate);
    return;
  }
  if (command === 'interview-change') {
    await openInterviewChange(candidate);
    return;
  }
  if (command === 'confirm-entry') {
    handleConfirmEntry(candidate);
    return;
  }
  if (command === 'convert-employee') {
    openEntryForm(candidate);
    return;
  }
  if (command === 'interview' && candidate.id) {
    openInterview(candidate.id);
  }
}

/** 更多操作 */
async function handleMoreCommand(
  command: string,
  candidate: HrmRecruitCandidateApi.RecruitCandidate,
) {
  if (command === 'primary-pass') {
    await handleStatus(candidate, HrmRecruitCandidateStatus.PRIMARY_PASS);
    return;
  }
  if (command === 'offer') {
    await handleStatus(candidate, HrmRecruitCandidateStatus.OFFER_SENT);
    return;
  }
  if (command === 'restore') {
    await handleStatus(candidate, HrmRecruitCandidateStatus.NEW);
    return;
  }
  if (command === 'interview-change') {
    await openInterviewChange(candidate);
    return;
  }
  if (command === 'interview-cancel') {
    await openInterviewCancel(candidate);
    return;
  }
  if (command === 'reinterview' && candidate.id) {
    openReinterview(candidate.id);
    return;
  }
  if (command === 'eliminate') {
    openEliminateForm(candidate);
    return;
  }
  if (command === 'delete') {
    await handleDelete(candidate);
  }
}

/** 修改状态 */
async function handleStatus(
  candidate: HrmRecruitCandidateApi.RecruitCandidate,
  status: HrmRecruitCandidateStatusValue,
) {
  if (!candidate.id) {
    return;
  }
  await updateRecruitCandidateStatus({ id: candidate.id, status });
  message.success($t('ui.actionMessage.operationSuccess'));
  await handleRefresh();
}

/** 删除 */
async function handleDelete(row: HrmRecruitCandidateApi.RecruitCandidate) {
  if (!row.id) {
    return;
  }
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.name]),
    duration: 0,
  });
  try {
    await deleteRecruitCandidate(row.id);
    message.success($t('ui.actionMessage.deleteSuccess', [row.name]));
    await handleRefresh();
  } finally {
    hideLoading();
  }
}

/** 批量删除 */
async function handleBatchDelete() {
  if (checkedIds.value.length === 0) {
    return;
  }
  try {
    await confirm(`确认删除选中的 ${checkedIds.value.length} 位候选人吗？`);
    const hasSuccess = await executeBatch(
      checkedIds.value.map((id) => deleteRecruitCandidate(id)),
    );
    if (!hasSuccess) {
      return;
    }
    await handleBatchSuccess();
  } catch {
    // 取消确认
  }
}

/** 批量操作成功 */
async function handleBatchSuccess() {
  checkedIds.value = [];
  await handleRefresh();
}

/** 行操作 actions */
function getRowActions(row: HrmRecruitCandidateApi.RecruitCandidate) {
  const primary = getPrimaryAction(row);
  const actions = [
    {
      label: $t('common.edit'),
      type: 'link' as const,
      icon: ACTION_ICON.EDIT,
      auth: ['hrm:recruit:candidate:update'],
      onClick: handleEdit.bind(null, row),
    },
  ];
  if (primary) {
    actions.push({
      label: primary.label,
      type: 'link' as const,
      icon: ACTION_ICON.EDIT,
      auth: [],
      onClick: () => handlePrimaryAction(primary.command, row),
    });
  }
  return actions;
}

/** 行更多操作 */
function getRowDropDownActions(row: HrmRecruitCandidateApi.RecruitCandidate) {
  return getMoreActions(row).map((action) => ({
    label: action.label,
    auth: [] as string[],
    danger: action.command === 'delete',
    ...(action.command === 'delete'
      ? {
          popConfirm: {
            title: $t('ui.actionMessage.deleteConfirm', [row.name]),
            confirm: () => handleMoreCommand(action.command, row),
          },
        }
      : {
          onClick: () => handleMoreCommand(action.command, row),
        }),
  }));
}

/** 工具栏批量操作 */
function getBatchDropDownActions() {
  const actions: Array<{
    danger?: boolean;
    label: string;
    onClick?: () => void;
  }> = [];
  if (
    canBatchUpdateStatus.value &&
    hasAccessByCodes(['hrm:recruit:candidate:update'])
  ) {
    actions.push({
      label: '批量流转',
      onClick: openBatchStatusForm,
    });
  }
  if (
    canBatchInterview.value &&
    hasAccessByCodes(['hrm:recruit:interview:create'])
  ) {
    actions.push({
      label: '批量面试',
      onClick: openBatchInterview,
    });
  }
  if (
    canBatchUpdatePostOrChannel.value &&
    hasAccessByCodes(['hrm:recruit:candidate:update'])
  ) {
    actions.push(
      {
        label: '修改职位',
        onClick: openBatchPostForm,
      },
      {
        label: '修改渠道',
        onClick: openBatchChannelForm,
      },
    );
  }
  if (
    canBatchEliminate.value &&
    hasAccessByCodes(['hrm:recruit:candidate:update'])
  ) {
    actions.push({
      label: '批量淘汰',
      onClick: openBatchEliminateForm,
    });
  }
  if (
    canBatchDelete.value &&
    hasAccessByCodes(['hrm:recruit:candidate:delete'])
  ) {
    actions.push({
      label: '批量删除',
      danger: true,
      onClick: handleBatchDelete,
    });
  }
  return actions;
}

function handleRowCheckboxChange({
  records,
}: {
  records: HrmRecruitCandidateApi.RecruitCandidate[];
}) {
  checkedIds.value = records.map((item) => item.id!);
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    collapsed: true,
    schema: useGridFormSchema(),
  },
  gridOptions: {
    checkboxConfig: {
      checkMethod: () => activeStatus.value !== 'all',
    },
    columns: useGridColumns(),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getRecruitCandidatePage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            status: activeStatusValue.value,
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
  } as VxeTableGridOptions<HrmRecruitCandidateApi.RecruitCandidate>,
  gridEvents: {
    checkboxAll: handleRowCheckboxChange,
    checkboxChange: handleRowCheckboxChange,
  },
});

/** 初始化 */
onMounted(async () => {
  if (route.query.status) {
    const status = Number(route.query.status) as HrmRecruitCandidateStatusValue;
    activeStatus.value = String(status);
  }
  await getStatusCounts();
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="【招聘】招聘管理"
        url="https://doc.iocoder.cn/hrm/recruit/"
      />
    </template>
    <FormModal @success="handleRefresh" />
    <StatusBatchModal @success="handleBatchSuccess" />
    <PostBatchModal @success="handleBatchSuccess" />
    <ChannelBatchModal @success="handleBatchSuccess" />
    <EliminateModal @success="handleBatchSuccess" />
    <CleanModal @success="handleRefresh" />
    <InterviewModal @success="handleBatchSuccess" />
    <InterviewResultModal @success="handleRefresh" />
    <EmployeeFormModal @success="handleRefresh" />

    <Grid class="candidate-grid">
      <template #toolbar-actions>
        <div class="candidate-status-tabs">
          <Tabs
            :active-key="activeStatus"
            class="w-full"
            @change="handleStatusTabChange"
          >
            <TabPane key="all" :tab="`全部（${allStatusCount}）`" />
            <TabPane
              v-for="item in statusTabOptions"
              :key="item.value"
              :tab="`${item.label}（${item.count}）`"
            />
          </Tabs>
        </div>
      </template>
      <template #toolbar-tools>
        <div class="flex shrink-0 flex-nowrap items-center gap-2">
          <TableAction
            :actions="[
              {
                label: '新增',
                type: 'primary',
                icon: ACTION_ICON.ADD,
                auth: ['hrm:recruit:candidate:create'],
                onClick: handleCreate,
              },
              {
                label: '一键清理',
                type: 'primary',
                danger: true,
                icon: ACTION_ICON.DELETE,
                auth: ['hrm:recruit:candidate:delete'],
                onClick: openCleanForm,
              },
            ]"
          />
          <Dropdown
            v-if="hasBatchPermission"
            :disabled="
              !hasBatchOperations ||
              checkedIds.length === 0 ||
              activeStatus === 'all'
            "
          >
            <Button
              type="primary"
              :disabled="
                !hasBatchOperations ||
                checkedIds.length === 0 ||
                activeStatus === 'all'
              "
            >
              批量操作
            </Button>
            <template #popupRender>
              <Menu>
                <MenuItem
                  v-for="action in getBatchDropDownActions()"
                  :key="action.label"
                  :danger="action.danger"
                  @click="action.onClick?.()"
                >
                  {{ action.label }}
                </MenuItem>
              </Menu>
            </template>
          </Dropdown>
        </div>
      </template>
      <template #name="{ row }">
        <Button type="link" @click="handleDetail(row.id)">
          {{ row.name }}
        </Button>
      </template>
      <template #status="{ row }">
        <DictTag
          :type="DICT_TYPE.HRM_RECRUIT_CANDIDATE_STATUS"
          :value="row.status"
        />
        <span
          v-if="
            row.status === HrmRecruitCandidateStatus.INTERVIEW &&
            row.interviewResult &&
            row.interviewResult !== HrmRecruitInterviewResult.UNFINISHED
          "
        >
          （面试{{
            getDictLabel(
              DICT_TYPE.HRM_RECRUIT_INTERVIEW_RESULT,
              row.interviewResult,
            )
          }}）
        </span>
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="getRowActions(row)"
          :drop-down-actions="getRowDropDownActions(row)"
        />
      </template>
    </Grid>
  </Page>
</template>

<style scoped>
/*
 * 状态 Tabs 独占一行（对齐源 vue3），右侧按钮在下一行右对齐。
 * 避免与 toolbar-tools 抢宽度导致折行 / 切换页签时抖动。
 */
.candidate-grid :deep(.vxe-toolbar) {
  flex-wrap: wrap;
  row-gap: 0;
  align-items: center;
}

.candidate-grid :deep(.vxe-buttons--wrapper) {
  flex: 1 0 100%;
  width: 100%;
  min-width: 100%;
  max-width: 100%;
  overflow: hidden;
}

.candidate-grid :deep(.vxe-tools--wrapper),
.candidate-grid :deep(.vxe-tools--operate) {
  flex: 1 1 auto;
  flex-wrap: nowrap;
  justify-content: flex-end;
  margin-left: auto;
}

.candidate-status-tabs {
  width: 100%;
  min-width: 0;
  overflow: hidden;
}

.candidate-status-tabs :deep(.ant-tabs-nav) {
  margin-bottom: 0;
}

.candidate-status-tabs :deep(.ant-tabs-nav::before) {
  border-bottom: none;
}
</style>
