<script lang="ts" setup>
import type { HrmPortalPerformanceAssessmentApi } from '#/api/hrm/portal/performance/assessment';

import { onActivated, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import {
  ElButton,
  ElCard,
  ElForm,
  ElFormItem,
  ElInput,
  ElPagination,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import { getPerformanceAssessmentPage } from '#/api/hrm/portal/performance/assessment';
import { checkHrmPortalAccess } from '#/views/hrm/utils/employee';
import {
  formatHrmDate,
  formatHrmDateTime,
  formatHrmScore,
} from '#/views/hrm/utils/format';

import PerformanceAssessmentDetail from '../detail/index.vue';

defineOptions({ name: 'HrmPortalPerformanceHistory' });

const router = useRouter();
const accessible = ref(false);
const loading = ref(false);
const total = ref(0);
const list = ref<HrmPortalPerformanceAssessmentApi.AssessmentSummary[]>([]);
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  search: undefined as string | undefined,
  archived: true,
});
const detailRef = ref<InstanceType<typeof PerformanceAssessmentDetail>>();

/** 查询我的绩效档案 */
async function getList() {
  loading.value = true;
  try {
    const data = await getPerformanceAssessmentPage(queryParams);
    list.value = data.list || [];
    total.value = data.total || 0;
  } finally {
    loading.value = false;
  }
}

/** 搜索 */
function handleQuery() {
  queryParams.pageNo = 1;
  getList();
}

/** 重置搜索 */
function resetQuery() {
  queryParams.search = undefined;
  handleQuery();
}

/** 打开绩效档案详情 */
function openDetail(row: HrmPortalPerformanceAssessmentApi.AssessmentSummary) {
  detailRef.value?.open(row);
}

/** 页面激活时刷新绩效历史 */
onActivated(async () => {
  accessible.value = await checkHrmPortalAccess(router);
  if (!accessible.value) {
    return;
  }
  await getList();
});
</script>

<template>
  <Page v-if="accessible">
    <ElCard class="mb-4" shadow="never">
      <ElForm inline :model="queryParams">
        <ElFormItem label="考核名称">
          <ElInput
            v-model="queryParams.search"
            clearable
            class="!w-[240px]"
            placeholder="请输入考核名称"
            @keyup.enter="handleQuery"
          />
        </ElFormItem>
        <ElFormItem>
          <ElButton @click="handleQuery">
            <IconifyIcon icon="lucide:search" class="mr-1" />
            搜索
          </ElButton>
          <ElButton class="ml-2" @click="resetQuery">
            <IconifyIcon icon="lucide:refresh-cw" class="mr-1" />
            重置
          </ElButton>
        </ElFormItem>
      </ElForm>
    </ElCard>

    <ElCard shadow="never">
      <ElTable
        v-loading="loading"
        border
        :data="list"
        row-key="id"
        size="small"
      >
        <ElTableColumn
          label="考核名称"
          min-width="220"
          prop="name"
          show-overflow-tooltip
        />
        <ElTableColumn label="考核周期" min-width="210">
          <template #default="{ row }">
            {{ formatHrmDate(row.startTime) }} 至
            {{ formatHrmDate(row.endTime) }}
          </template>
        </ElTableColumn>
        <ElTableColumn align="center" label="绩效得分" width="110">
          <template #default="{ row }">
            {{ formatHrmScore(row.score) }}
          </template>
        </ElTableColumn>
        <ElTableColumn align="center" label="绩效等级" width="110">
          <template #default="{ row }">
            <ElTag v-if="row.resultLevel" type="success">
              {{ row.resultLevel }}
            </ElTag>
            <span v-else>-</span>
          </template>
        </ElTableColumn>
        <ElTableColumn
          align="center"
          label="绩效系数"
          prop="coefficient"
          width="100"
        />
        <ElTableColumn label="归档时间" width="180">
          <template #default="{ row }">
            {{ formatHrmDateTime(row.archiveTime?.valueOf()) }}
          </template>
        </ElTableColumn>
        <ElTableColumn align="center" fixed="right" label="操作" width="90">
          <template #default="{ row }">
            <ElButton
              link
              type="primary"
              @click="
                openDetail(
                  row as HrmPortalPerformanceAssessmentApi.AssessmentSummary,
                )
              "
            >
              查看
            </ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
      <div class="mt-4 flex justify-end">
        <ElPagination
          v-model:current-page="queryParams.pageNo"
          v-model:page-size="queryParams.pageSize"
          background
          layout="total, sizes, prev, pager, next"
          :page-sizes="[10, 20, 50]"
          :total="total"
          @current-change="getList"
          @size-change="getList"
        />
      </div>
    </ElCard>

    <PerformanceAssessmentDetail ref="detailRef" />
  </Page>
</template>
