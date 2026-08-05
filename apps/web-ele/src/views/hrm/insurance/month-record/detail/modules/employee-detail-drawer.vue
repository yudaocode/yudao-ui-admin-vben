<script lang="ts" setup>
import type { TableColumnCtx } from 'element-plus';

import type { HrmInsuranceMonthEmployeeRecordApi } from '#/api/hrm/insurance/month-record/employee';
import type { HrmInsuranceSchemeApi } from '#/api/hrm/insurance/scheme';

import { computed, ref } from 'vue';

import { DICT_TYPE } from '@vben/constants';

import { ElButton, ElDrawer, ElTable, ElTableColumn } from 'element-plus';

import { getInsuranceMonthEmployeeRecord } from '#/api/hrm/insurance/month-record/employee';
import { DictTag } from '#/components/dict-tag';
import { HrmInsuranceSchemeType } from '#/views/hrm/utils/constants';
import {
  formatHrmDate,
  formatHrmInsuranceProjectName,
  formatHrmMoney,
  formatHrmRate,
} from '#/views/hrm/utils/format';

defineOptions({ name: 'HrmInsuranceMonthEmployeeDetail' });

const props = defineProps<{
  editable?: boolean;
}>();

const emit = defineEmits<{
  edit: [
    detail: HrmInsuranceMonthEmployeeRecordApi.InsuranceMonthEmployeeRecord,
  ];
}>();

type DetailProject = HrmInsuranceSchemeApi.Project & { totalAmount: number };

const drawerVisible = ref(false);
const loading = ref(false);
const detail =
  ref<HrmInsuranceMonthEmployeeRecordApi.InsuranceMonthEmployeeRecord>();

const projects = computed<DetailProject[]>(() => {
  if (!detail.value) {
    return [];
  }
  return [
    ...detail.value.socialSecurityProjectList,
    ...detail.value.providentFundProjectList,
  ].map((project) => ({
    ...project,
    totalAmount:
      Number(project.personalAmount || 0) +
      Number(project.corporateAmount || 0),
  }));
});

const showProportionColumns = computed(
  () => detail.value?.schemeType === HrmInsuranceSchemeType.PROPORTION,
);

function getSummary({
  columns,
  data,
}: {
  columns: TableColumnCtx<DetailProject>[];
  data: DetailProject[];
}) {
  return columns.map((column, index) => {
    if (index === 0) {
      return '缴费总价';
    }
    if (
      !['corporateAmount', 'personalAmount', 'totalAmount'].includes(
        column.property,
      )
    ) {
      return '';
    }
    return formatHrmMoney(
      data.reduce(
        (total, project) =>
          total + Number(project[column.property as keyof DetailProject] || 0),
        0,
      ),
    );
  });
}

async function open(id?: number) {
  if (!id) {
    return;
  }
  drawerVisible.value = true;
  loading.value = true;
  detail.value = undefined;
  try {
    detail.value = await getInsuranceMonthEmployeeRecord(id);
  } finally {
    loading.value = false;
  }
}

function handleEdit() {
  if (detail.value) {
    emit('edit', detail.value);
  }
}

defineExpose({ open });
</script>

<template>
  <ElDrawer
    v-model="drawerVisible"
    :size="980"
    destroy-on-close
    title="员工月度社保详情"
  >
    <div v-loading="loading" class="min-h-80">
      <div class="mb-4 flex items-start justify-between gap-4">
        <div class="min-w-0">
          <div class="flex items-center gap-2">
            <span class="truncate text-xl font-semibold">
              {{ detail?.employeeName || '--' }}
            </span>
            <DictTag
              :type="DICT_TYPE.HRM_INSURANCE_EMP_STATUS"
              :value="detail?.status ?? ''"
            />
          </div>
          <div class="text-muted-foreground mt-1 text-sm">
            {{ detail?.postName || '--' }} · {{ detail?.year || '--' }} 年
            {{ detail?.month || '--' }} 月
          </div>
        </div>
        <ElButton
          v-if="editable && detail"
          v-access:code="['hrm:insurance:month-record:update']"
          type="primary"
          @click="handleEdit"
        >
          编辑
        </ElButton>
      </div>

      <div class="mb-5 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div>
          <span class="text-muted-foreground">性别：</span>
          <DictTag
            v-if="detail?.sex != null"
            :type="DICT_TYPE.SYSTEM_USER_SEX"
            :value="detail.sex"
          />
          <span v-else>--</span>
        </div>
        <div>
          <span class="text-muted-foreground">年龄：</span>
          <span>{{ detail?.age ?? '--' }}</span>
        </div>
        <div>
          <span class="text-muted-foreground">工号：</span>
          {{ detail?.jobNumber || '--' }}
        </div>
        <div>
          <span class="text-muted-foreground">部门：</span>
          {{ detail?.deptName || '--' }}
        </div>
        <div>
          <span class="text-muted-foreground">员工状态：</span>
          <DictTag
            v-if="detail?.employeeStatus != null"
            :type="DICT_TYPE.HRM_EMPLOYEE_STATUS"
            :value="detail.employeeStatus"
          />
          <span v-else>--</span>
        </div>
        <div>
          <span class="text-muted-foreground">入职日期：</span>
          {{ formatHrmDate(detail?.entryTime?.valueOf()) }}
        </div>
        <div>
          <span class="text-muted-foreground">参保城市：</span>
          {{ detail?.areaName || '--' }}
        </div>
        <div>
          <span class="text-muted-foreground">身份证号：</span>
          {{ detail?.idNumber || '--' }}
        </div>
        <div>
          <span class="text-muted-foreground">个人社保号：</span>
          {{ detail?.socialSecurityNumber || '--' }}
        </div>
        <div>
          <span class="text-muted-foreground">个人公积金号：</span>
          {{ detail?.accumulationFundNumber || '--' }}
        </div>
        <div>
          <span class="text-muted-foreground">参保方案：</span>
          {{ detail?.schemeName || '--' }}
        </div>
      </div>

      <div class="mb-2 text-base font-semibold">缴费项目</div>
      <ElTable
        :data="projects"
        :summary-method="getSummary"
        border
        row-key="schemeProjectId"
        show-summary
        size="small"
      >
        <ElTableColumn label="缴纳项目" min-width="130">
          <template #default="{ row }">
            {{ formatHrmInsuranceProjectName(row) }}
          </template>
        </ElTableColumn>
        <ElTableColumn
          align="right"
          label="缴纳基数"
          min-width="100"
          prop="baseAmount"
        >
          <template #default="{ row }">
            {{ formatHrmMoney(row.baseAmount) }}
          </template>
        </ElTableColumn>
        <ElTableColumn
          v-if="showProportionColumns"
          align="right"
          label="企业比例"
          min-width="90"
          prop="corporateRate"
        >
          <template #default="{ row }">
            {{ formatHrmRate(row.corporateRate) }}
          </template>
        </ElTableColumn>
        <ElTableColumn
          v-if="showProportionColumns"
          align="right"
          label="个人比例"
          min-width="90"
          prop="personalRate"
        >
          <template #default="{ row }">
            {{ formatHrmRate(row.personalRate) }}
          </template>
        </ElTableColumn>
        <ElTableColumn
          align="right"
          label="个人缴纳"
          min-width="100"
          prop="personalAmount"
        >
          <template #default="{ row }">
            {{ formatHrmMoney(row.personalAmount) }}
          </template>
        </ElTableColumn>
        <ElTableColumn
          align="right"
          label="企业缴纳"
          min-width="100"
          prop="corporateAmount"
        >
          <template #default="{ row }">
            {{ formatHrmMoney(row.corporateAmount) }}
          </template>
        </ElTableColumn>
        <ElTableColumn
          align="right"
          label="合计缴费"
          min-width="100"
          prop="totalAmount"
        >
          <template #default="{ row }">
            {{ formatHrmMoney(row.totalAmount) }}
          </template>
        </ElTableColumn>
      </ElTable>
    </div>
  </ElDrawer>
</template>
