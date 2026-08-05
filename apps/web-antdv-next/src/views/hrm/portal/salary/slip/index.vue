<script lang="ts" setup>
import type { Dayjs } from 'dayjs';

import type { HrmPortalSalarySlipApi } from '#/api/hrm/portal/salary/slip';

import { computed, onActivated, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import {
  Button,
  Card,
  DatePicker,
  Empty,
  Select,
  Spin,
  Table,
  Tag,
  Tooltip,
} from 'antdv-next';

import {
  getSalarySlipList,
  markSalarySlipRead,
} from '#/api/hrm/portal/salary/slip';
import {
  HRM_SALARY_SLIP_SORT_OPTIONS,
  HrmSalarySlipSort,
} from '#/views/hrm/utils/constants';
import { checkHrmPortalAccess } from '#/views/hrm/utils/employee';
import { formatHrmMoney } from '#/views/hrm/utils/format';

defineOptions({ name: 'HrmPortalSalarySlip' });

const router = useRouter();
const accessible = ref(false);
const loading = ref(false);
const monthRange = ref<[Dayjs, Dayjs]>();
const sort = ref(HrmSalarySlipSort.RECENT_SEND);
const slips = ref<HrmPortalSalarySlipApi.PortalSalarySlip[]>([]);

const hasFilter = computed(
  () =>
    !!monthRange.value?.length || sort.value !== HrmSalarySlipSort.RECENT_SEND,
);

/** 加载工资条 */
async function loadSlips() {
  loading.value = true;
  try {
    const params: HrmPortalSalarySlipApi.SlipListReq = {};
    if (monthRange.value?.length === 2) {
      params.startMonth = monthRange.value[0].format('YYYY-MM');
      params.endMonth = monthRange.value[1].format('YYYY-MM');
    }
    const sortOption = HRM_SALARY_SLIP_SORT_OPTIONS.find(
      (item) => item.value === sort.value,
    );
    if (sortOption) {
      params.orderType = sortOption.orderType;
      params.order = sortOption.order;
    }
    const data = (await getSalarySlipList(params)) || [];
    slips.value = data;
    const unreadIds = data
      .filter((slip) => slip.readStatus === 0)
      .map((slip) => slip.id);
    if (unreadIds.length > 0) {
      await markSalarySlipRead(unreadIds);
    }
  } finally {
    loading.value = false;
  }
}

/** 重置筛选条件 */
function resetFilter() {
  monthRange.value = undefined;
  sort.value = HrmSalarySlipSort.RECENT_SEND;
  loadSlips();
}

/** 获取工资条末级项目 */
function getLeafOptions(options: HrmPortalSalarySlipApi.SlipOption[]) {
  const result: HrmPortalSalarySlipApi.SlipOption[] = [];
  options.forEach((option) => {
    if (option.children?.length) {
      result.push(...getLeafOptions(option.children));
    } else {
      result.push(option);
    }
  });
  return result;
}

/** 构建工资条展示行 */
function buildSlipRow(slip: HrmPortalSalarySlipApi.PortalSalarySlip) {
  const row: Record<string, number | string> = {
    monthTitle: `${slip.year}-${String(slip.month).padStart(2, '0')}`,
  };
  for (const option of getLeafOptions(slip.options)) {
    row[`option${option.code}`] = option.value || 0;
  }
  return row;
}

/** 构建工资条表格列 */
function buildSlipColumns(slip: HrmPortalSalarySlipApi.PortalSalarySlip) {
  const columns: Record<string, unknown>[] = [
    {
      title: '所属月份',
      dataIndex: 'monthTitle',
      key: 'monthTitle',
      minWidth: 110,
      fixed: 'left',
    },
  ];
  slip.options.forEach((option) => {
    if (option.children?.length) {
      columns.push({
        title: option.name,
        align: 'center',
        children: option.children.map((child) => ({
          title: child.name,
          dataIndex: `option${child.code}`,
          key: `option${child.code}`,
          minWidth: 120,
          remark: child.remark,
        })),
      });
    } else {
      columns.push({
        title: option.name,
        dataIndex: `option${option.code}`,
        key: `option${option.code}`,
        minWidth: 120,
        remark: option.remark,
      });
    }
  });
  return columns;
}

/** 获取工资项说明 */
function getSlipColumnRemark(
  slip: HrmPortalSalarySlipApi.PortalSalarySlip,
  key: unknown,
) {
  const optionCode = String(key).replace(/^option/, '');
  return getLeafOptions(slip.options).find(
    (option) => String(option.code) === optionCode,
  )?.remark;
}

/** 页面激活时刷新工资条 */
onActivated(async () => {
  accessible.value = await checkHrmPortalAccess(router);
  if (!accessible.value) {
    return;
  }
  await loadSlips();
});
</script>

<template>
  <Page v-if="accessible">
    <Spin :spinning="loading">
      <Card class="mb-4">
        <div
          class="flex flex-wrap items-center justify-between gap-4 text-lg font-semibold"
        >
          <span>我的工资条</span>
          <div class="flex flex-wrap items-center gap-3">
            <DatePicker.RangePicker
              v-model:value="monthRange"
              class="w-[260px]"
              format="YYYY-MM"
              picker="month"
              @change="loadSlips"
            />
            <Select
              v-model:value="sort"
              class="w-[180px]"
              :options="[...HRM_SALARY_SLIP_SORT_OPTIONS]"
              @change="loadSlips"
            />
            <Button v-if="hasFilter" type="link" @click="resetFilter">
              清除筛选
            </Button>
          </div>
        </div>
      </Card>

      <template v-if="slips.length">
        <Card
          v-for="(slip, index) in slips"
          :key="slip.id"
          :class="index ? 'mt-5' : ''"
        >
          <div class="mb-3 flex items-center gap-2 font-semibold">
            <span>{{ slip.year }} 年 {{ slip.month }} 月工资条</span>
            <Tag v-if="slip.readStatus === 0" color="error">新工资条</Tag>
          </div>
          <Table
            bordered
            :columns="buildSlipColumns(slip)"
            :data-source="[buildSlipRow(slip)]"
            :pagination="false"
            row-key="monthTitle"
            :scroll="{ x: 'max-content' }"
            size="small"
          >
            <template #headerCell="{ column }">
              <Tooltip
                v-if="getSlipColumnRemark(slip, column.key)"
                :title="getSlipColumnRemark(slip, column.key)"
              >
                <span>
                  {{ column.title }}
                  <IconifyIcon icon="lucide:circle-help" class="ml-1 inline" />
                </span>
              </Tooltip>
              <span v-else>{{ column.title }}</span>
            </template>
            <template #bodyCell="{ column, record }">
              <template v-if="String(column.key).startsWith('option')">
                ¥
                {{
                  formatHrmMoney(record[column.dataIndex as string] as number)
                }}
              </template>
            </template>
          </Table>
        </Card>
      </template>
      <Card v-else><Empty description="暂无工资条" /></Card>
    </Spin>
  </Page>
</template>
