<script lang="ts" setup>
import type { HrmPortalPerformanceAssessmentApi } from '#/api/hrm/portal/performance/assessment';

import { onActivated, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import {
  Button,
  Card,
  Form,
  FormItem,
  Input,
  Pagination,
  Table,
  Tag,
} from 'antdv-next';

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

const columns = [
  {
    title: '考核名称',
    dataIndex: 'name',
    key: 'name',
    minWidth: 220,
    ellipsis: true,
  },
  { title: '考核周期', key: 'cycle', minWidth: 210 },
  { title: '绩效得分', key: 'score', width: 110, align: 'center' as const },
  {
    title: '绩效等级',
    key: 'resultLevel',
    width: 110,
    align: 'center' as const,
  },
  {
    title: '绩效系数',
    dataIndex: 'coefficient',
    key: 'coefficient',
    width: 100,
    align: 'center' as const,
  },
  { title: '归档时间', key: 'archiveTime', width: 180 },
  {
    title: '操作',
    key: 'action',
    width: 90,
    align: 'center' as const,
    fixed: 'right' as const,
  },
];

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
    <Card class="mb-4">
      <Form layout="inline" :model="queryParams">
        <FormItem label="考核名称">
          <Input
            v-model:value="queryParams.search"
            allow-clear
            class="w-[240px]"
            placeholder="请输入考核名称"
            @press-enter="handleQuery"
          />
        </FormItem>
        <FormItem>
          <Button @click="handleQuery">
            <IconifyIcon icon="lucide:search" class="mr-1" />
            搜索
          </Button>
          <Button class="ml-2" @click="resetQuery">
            <IconifyIcon icon="lucide:refresh-cw" class="mr-1" />
            重置
          </Button>
        </FormItem>
      </Form>
    </Card>

    <Card>
      <Table
        bordered
        :columns="columns"
        :data-source="list"
        :loading="loading"
        :pagination="false"
        row-key="id"
        :scroll="{ x: 1000 }"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'cycle'">
            {{ formatHrmDate(record.startTime) }} 至
            {{ formatHrmDate(record.endTime) }}
          </template>
          <template v-else-if="column.key === 'score'">
            {{ formatHrmScore(record.score) }}
          </template>
          <template v-else-if="column.key === 'resultLevel'">
            <Tag v-if="record.resultLevel" color="success">
              {{ record.resultLevel }}
            </Tag>
            <span v-else>-</span>
          </template>
          <template v-else-if="column.key === 'archiveTime'">
            {{ formatHrmDateTime(record.archiveTime) }}
          </template>
          <template v-else-if="column.key === 'action'">
            <Button type="link" @click="openDetail(record)">查看</Button>
          </template>
        </template>
      </Table>
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

    <PerformanceAssessmentDetail ref="detailRef" />
  </Page>
</template>
