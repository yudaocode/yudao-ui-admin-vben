<script lang="ts" setup>
import type { PageParam } from '@vben/request';

import type { HrmPortalPerformanceAssessmentApi } from '#/api/hrm/portal/performance/assessment';

import { computed, onActivated, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import { confirm, Page, useVbenDrawer, useVbenModal } from '@vben/common-ui';

import { Card, message, Pagination } from 'ant-design-vue';

import {
  confirmPerformanceAssessmentResult,
  getPerformanceAssessmentAppealTaskPage,
  getPerformanceAssessmentFillQuotaTaskPage,
  getPerformanceAssessmentResultAuditTaskPage,
  getPerformanceAssessmentResultConfirmationTaskPage,
  getPerformanceAssessmentReviewTaskPage,
  getPerformanceAssessmentTargetConfirmationTaskPage,
  getPerformanceAssessmentTaskCount,
} from '#/api/hrm/portal/performance/assessment';
import {
  HrmPerformanceAssessmentStageStatus,
  HrmPerformanceStageType,
} from '#/views/hrm/utils/constants';
import { checkHrmPortalAccess } from '#/views/hrm/utils/employee';

import PerformanceAssessmentDetail from './modules/detail-drawer.vue';
import PerformanceAppealForm from './modules/performance-appeal-form.vue';
import PerformanceHandleForm from './modules/performance-handle-form.vue';
import PerformanceQuotaForm from './modules/performance-quota-form.vue';
import PerformanceReviewForm from './modules/performance-review-form.vue';
import PerformanceTargetConfirmForm from './modules/performance-target-confirm-form.vue';
import PerformanceTaskTable from './modules/performance-task-table.vue';
import PerformanceTaskTabs from './modules/performance-task-tabs.vue';

defineOptions({ name: 'HrmPortalPerformanceAssessment' });

const router = useRouter();
const accessible = ref(false);
const loading = ref(false);
const activeTab = ref<number>(HrmPerformanceStageType.FILL_QUOTA);
const activeStatus = ref<number>(HrmPerformanceAssessmentStageStatus.PENDING);
const keyword = ref('');
const list = ref<
  HrmPortalPerformanceAssessmentApi.PortalPerformanceAssessment[]
>([]);
const total = ref(0);
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
});
const taskCount = ref<HrmPortalPerformanceAssessmentApi.TaskCount>({
  fillPendingCount: 0,
  fillCompletedCount: 0,
  targetPendingCount: 0,
  targetCompletedCount: 0,
  reviewPendingCount: 0,
  reviewCompletedCount: 0,
  resultAuditPendingCount: 0,
  resultAuditCompletedCount: 0,
  resultConfirmationPendingCount: 0,
  resultConfirmationCompletedCount: 0,
  resultConfirmationAppealedCount: 0,
  appealPendingCount: 0,
  appealCompletedCount: 0,
});

const [DetailDrawer, detailDrawerApi] = useVbenDrawer({
  connectedComponent: PerformanceAssessmentDetail,
  destroyOnClose: true,
});
const [TargetConfirmDrawer, targetConfirmDrawerApi] = useVbenDrawer({
  connectedComponent: PerformanceTargetConfirmForm,
  destroyOnClose: true,
});
const [ReviewDrawer, reviewDrawerApi] = useVbenDrawer({
  connectedComponent: PerformanceReviewForm,
  destroyOnClose: true,
});
const [QuotaDrawer, quotaDrawerApi] = useVbenDrawer({
  connectedComponent: PerformanceQuotaForm,
  destroyOnClose: true,
});
const [ResultAuditModal, resultAuditModalApi] = useVbenModal({
  connectedComponent: PerformanceHandleForm,
  destroyOnClose: true,
});
const [AppealHandleModal, appealHandleModalApi] = useVbenModal({
  connectedComponent: PerformanceHandleForm,
  destroyOnClose: true,
});
const [AppealModal, appealModalApi] = useVbenModal({
  connectedComponent: PerformanceAppealForm,
  destroyOnClose: true,
});

const statusTabs = computed(() => {
  if (activeTab.value === HrmPerformanceStageType.FILL_QUOTA) {
    return [
      {
        label: '待填写',
        name: HrmPerformanceAssessmentStageStatus.PENDING,
        count: taskCount.value.fillPendingCount,
      },
      {
        label: '已填写',
        name: HrmPerformanceAssessmentStageStatus.PROCESSED,
        count: taskCount.value.fillCompletedCount,
      },
    ];
  }
  if (activeTab.value === HrmPerformanceStageType.TARGET_CONFIRM) {
    return [
      {
        label: '待确认',
        name: HrmPerformanceAssessmentStageStatus.PENDING,
        count: taskCount.value.targetPendingCount,
      },
      {
        label: '已确认',
        name: HrmPerformanceAssessmentStageStatus.PROCESSED,
        count: taskCount.value.targetCompletedCount,
      },
    ];
  }
  if (activeTab.value === HrmPerformanceStageType.OTHER_SCORE) {
    return [
      {
        label: '待评分',
        name: HrmPerformanceAssessmentStageStatus.PENDING,
        count: taskCount.value.reviewPendingCount,
      },
      {
        label: '已评分',
        name: HrmPerformanceAssessmentStageStatus.PROCESSED,
        count: taskCount.value.reviewCompletedCount,
      },
    ];
  }
  if (activeTab.value === HrmPerformanceStageType.RESULT_AUDIT) {
    return [
      {
        label: '待审核',
        name: HrmPerformanceAssessmentStageStatus.PENDING,
        count: taskCount.value.resultAuditPendingCount,
      },
      {
        label: '已审核',
        name: HrmPerformanceAssessmentStageStatus.PROCESSED,
        count: taskCount.value.resultAuditCompletedCount,
      },
    ];
  }
  if (activeTab.value === HrmPerformanceStageType.RESULT_CONFIRM) {
    return [
      {
        label: '待确认结果',
        name: HrmPerformanceAssessmentStageStatus.PENDING,
        count: taskCount.value.resultConfirmationPendingCount,
      },
      {
        label: '已确认',
        name: HrmPerformanceAssessmentStageStatus.PROCESSED,
        count: taskCount.value.resultConfirmationCompletedCount,
      },
      {
        label: '已申诉',
        name: HrmPerformanceAssessmentStageStatus.APPEALED,
        count: taskCount.value.resultConfirmationAppealedCount,
      },
    ];
  }
  return [
    {
      label: '待确认',
      name: HrmPerformanceAssessmentStageStatus.PENDING,
      count: taskCount.value.appealPendingCount,
    },
    {
      label: '已确认',
      name: HrmPerformanceAssessmentStageStatus.PROCESSED,
      count: taskCount.value.appealCompletedCount,
    },
  ];
});

/** 打开详情 */
function openDetail(
  row: HrmPortalPerformanceAssessmentApi.PortalPerformanceAssessment,
) {
  detailDrawerApi.setData({ row, taskType: activeTab.value }).open();
}

/** 确认绩效结果 */
async function confirmResult(id?: number) {
  if (!id) {
    return;
  }
  try {
    await confirm('确认当前绩效结果？确认后将进入后续流程。');
    await confirmPerformanceAssessmentResult({
      assessmentId: id,
      pass: 1,
      comment: '结果确认',
    });
    message.success('绩效结果已确认');
    await loadData();
  } catch {
    // 用户取消
  }
}

function openAppeal(id?: number) {
  appealModalApi.setData({ assessmentId: id }).open();
}

function openTargetConfirm(assessmentId?: number, stageId?: number) {
  targetConfirmDrawerApi.setData({ assessmentId, stageId }).open();
}

function openReview(assessmentId?: number, stageId?: number) {
  reviewDrawerApi.setData({ assessmentId, stageId }).open();
}

function openQuota(assessmentId?: number) {
  quotaDrawerApi.setData({ assessmentId }).open();
}

function openResultAudit(assessmentId?: number, stageId?: number) {
  resultAuditModalApi.setData({ assessmentId, stageId }).open();
}

function openAppealHandle(assessmentId?: number, stageId?: number) {
  appealHandleModalApi.setData({ assessmentId, stageId }).open();
}

/** 获取任务分页 */
async function getTaskPage(
  params: PageParam & { search?: string; stageStatus?: number },
) {
  if (activeTab.value === HrmPerformanceStageType.FILL_QUOTA) {
    return getPerformanceAssessmentFillQuotaTaskPage(params);
  }
  if (activeTab.value === HrmPerformanceStageType.TARGET_CONFIRM) {
    return getPerformanceAssessmentTargetConfirmationTaskPage(params);
  }
  if (activeTab.value === HrmPerformanceStageType.OTHER_SCORE) {
    return getPerformanceAssessmentReviewTaskPage(params);
  }
  if (activeTab.value === HrmPerformanceStageType.RESULT_AUDIT) {
    return getPerformanceAssessmentResultAuditTaskPage(params);
  }
  if (activeTab.value === HrmPerformanceStageType.RESULT_CONFIRM) {
    return getPerformanceAssessmentResultConfirmationTaskPage(params);
  }
  return getPerformanceAssessmentAppealTaskPage(params);
}

/** 查询列表 */
async function getList() {
  loading.value = true;
  try {
    const search = keyword.value.trim() || undefined;
    const pageResult = await getTaskPage({
      ...queryParams,
      search,
      stageStatus: activeStatus.value,
    });
    list.value = pageResult.list || [];
    total.value = pageResult.total || 0;
  } finally {
    loading.value = false;
  }
}

/** 获取任务数量 */
async function getTaskCount() {
  taskCount.value = await getPerformanceAssessmentTaskCount(
    keyword.value.trim() || undefined,
  );
}

/** 加载页面数据 */
async function loadData() {
  await Promise.all([getList(), getTaskCount()]);
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.pageNo = 1;
  loadData();
}

/** 主页签切换操作 */
function handleMainTabChange() {
  activeStatus.value = HrmPerformanceAssessmentStageStatus.PENDING;
  queryParams.pageNo = 1;
  loadData();
}

/** 状态页签切换操作 */
function handleStatusTabChange() {
  queryParams.pageNo = 1;
  getList();
}

/** 页面激活时刷新绩效任务 */
onActivated(async () => {
  accessible.value = await checkHrmPortalAccess(router);
  if (!accessible.value) {
    return;
  }
  await loadData();
});
</script>

<template>
  <Page v-if="accessible">
    <Card>
      <PerformanceTaskTabs
        v-model:active-status="activeStatus"
        v-model:active-tab="activeTab"
        v-model:keyword="keyword"
        :status-tabs="statusTabs"
        :task-count="taskCount"
        @main-change="handleMainTabChange"
        @query="handleQuery"
        @status-change="handleStatusTabChange"
      />
      <PerformanceTaskTable
        :active-status="activeStatus"
        :active-tab="activeTab"
        :list="list"
        :loading="loading"
        @appeal="openAppeal"
        @appeal-handle="openAppealHandle"
        @detail="openDetail"
        @quota="openQuota"
        @result-audit="openResultAudit"
        @result-confirm="confirmResult"
        @review="openReview"
        @target-confirm="openTargetConfirm"
      />
      <div class="mt-4 flex justify-end">
        <Pagination
          v-model:current="queryParams.pageNo"
          v-model:page-size="queryParams.pageSize"
          :show-size-changer="true"
          :total="total"
          @change="getList"
        />
      </div>
    </Card>

    <DetailDrawer />
    <QuotaDrawer @success="loadData" />
    <TargetConfirmDrawer @success="loadData" />
    <ReviewDrawer @success="loadData" />
    <AppealModal @success="loadData" />
    <ResultAuditModal mode="result-audit" @success="loadData" />
    <AppealHandleModal mode="appeal" @success="loadData" />
  </Page>
</template>
