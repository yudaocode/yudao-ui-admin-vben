<script lang="ts" setup>
import type { HrmPortalSalarySlipApi } from '#/api/hrm/portal/salary/slip';

import { computed, onActivated, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import {
  ElButton,
  ElCard,
  ElDatePicker,
  ElEmpty,
  ElOption,
  ElSelect,
  ElTable,
  ElTableColumn,
  ElTag,
  ElTooltip,
} from 'element-plus';

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
const monthRange = ref<[string, string]>();
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
      params.startMonth = monthRange.value[0];
      params.endMonth = monthRange.value[1];
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
    <div v-loading="loading">
      <ElCard class="mb-4" shadow="never">
        <div
          class="flex flex-wrap items-center justify-between gap-4 text-lg font-semibold"
        >
          <span>我的工资条</span>
          <div class="flex flex-wrap items-center gap-3">
            <ElDatePicker
              v-model="monthRange"
              class="!w-[260px]"
              format="YYYY-MM"
              type="monthrange"
              value-format="YYYY-MM"
              @change="loadSlips"
            />
            <ElSelect v-model="sort" class="!w-[180px]" @change="loadSlips">
              <ElOption
                v-for="item in HRM_SALARY_SLIP_SORT_OPTIONS"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </ElSelect>
            <ElButton v-if="hasFilter" link type="primary" @click="resetFilter">
              清除筛选
            </ElButton>
          </div>
        </div>
      </ElCard>

      <template v-if="slips.length">
        <ElCard
          v-for="(slip, index) in slips"
          :key="slip.id"
          :class="index ? 'mt-5' : ''"
          shadow="never"
        >
          <div class="mb-3 flex items-center gap-2 font-semibold">
            <span>{{ slip.year }} 年 {{ slip.month }} 月工资条</span>
            <ElTag v-if="slip.readStatus === 0" type="danger">新工资条</ElTag>
          </div>
          <ElTable
            border
            :data="[buildSlipRow(slip)]"
            row-key="monthTitle"
            size="small"
          >
            <ElTableColumn
              fixed="left"
              label="所属月份"
              min-width="110"
              prop="monthTitle"
            />
            <template v-for="option in slip.options" :key="option.code">
              <ElTableColumn
                v-if="!option.children?.length"
                :label="option.name"
                min-width="120"
                :prop="`option${option.code}`"
              >
                <template #header>
                  <ElTooltip v-if="option.remark" :content="option.remark">
                    <span>
                      {{ option.name }}
                      <IconifyIcon
                        icon="lucide:circle-help"
                        class="ml-1 inline"
                      />
                    </span>
                  </ElTooltip>
                  <span v-else>{{ option.name }}</span>
                </template>
                <template #default="{ row }">
                  ¥ {{ formatHrmMoney(row[`option${option.code}`] as number) }}
                </template>
              </ElTableColumn>
              <ElTableColumn v-else :label="option.name" align="center">
                <ElTableColumn
                  v-for="child in option.children"
                  :key="child.code"
                  :label="child.name"
                  min-width="120"
                  :prop="`option${child.code}`"
                >
                  <template #header>
                    <ElTooltip v-if="child.remark" :content="child.remark">
                      <span>
                        {{ child.name }}
                        <IconifyIcon
                          icon="lucide:circle-help"
                          class="ml-1 inline"
                        />
                      </span>
                    </ElTooltip>
                    <span v-else>{{ child.name }}</span>
                  </template>
                  <template #default="{ row }">
                    ¥ {{ formatHrmMoney(row[`option${child.code}`] as number) }}
                  </template>
                </ElTableColumn>
              </ElTableColumn>
            </template>
          </ElTable>
        </ElCard>
      </template>
      <ElCard v-else shadow="never">
        <ElEmpty description="暂无工资条" />
      </ElCard>
    </div>
  </Page>
</template>
