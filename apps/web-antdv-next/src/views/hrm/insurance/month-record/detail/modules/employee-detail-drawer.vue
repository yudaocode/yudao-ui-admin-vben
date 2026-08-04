<script lang="ts" setup>
import type { HrmInsuranceMonthEmployeeRecordApi } from '#/api/hrm/insurance/month-record/employee';
import type { HrmInsuranceSchemeApi } from '#/api/hrm/insurance/scheme';

import { computed, ref } from 'vue';

import { DICT_TYPE } from '@vben/constants';

import { Button, Drawer, Spin, Table } from 'antdv-next';

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

const projectColumns = computed(() => {
  const columns = [
    {
      title: '缴纳项目',
      dataIndex: 'name',
      minWidth: 130,
    },
    {
      title: '缴纳基数',
      dataIndex: 'baseAmount',
      align: 'right' as const,
      minWidth: 100,
    },
  ];
  if (detail.value?.schemeType === HrmInsuranceSchemeType.PROPORTION) {
    columns.push(
      {
        title: '企业比例',
        dataIndex: 'corporateRate',
        align: 'right' as const,
        minWidth: 90,
      },
      {
        title: '个人比例',
        dataIndex: 'personalRate',
        align: 'right' as const,
        minWidth: 90,
      },
    );
  }
  columns.push(
    {
      title: '个人缴纳',
      dataIndex: 'personalAmount',
      align: 'right' as const,
      minWidth: 100,
    },
    {
      title: '企业缴纳',
      dataIndex: 'corporateAmount',
      align: 'right' as const,
      minWidth: 100,
    },
    {
      title: '合计缴费',
      dataIndex: 'totalAmount',
      align: 'right' as const,
      minWidth: 100,
    },
  );
  return columns;
});

function projectSummary(pageData: readonly DetailProject[]) {
  const sumFields = [
    'corporateAmount',
    'personalAmount',
    'totalAmount',
  ] as const;
  return projectColumns.value.map((column, index) => {
    if (index === 0) {
      return '缴费总价';
    }
    if (!sumFields.includes(column.dataIndex as (typeof sumFields)[number])) {
      return '';
    }
    return formatHrmMoney(
      pageData.reduce(
        (total, project) =>
          total + Number(project[column.dataIndex as keyof DetailProject] || 0),
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
  <Drawer
    v-model:open="drawerVisible"
    :width="980"
    destroy-on-close
    title="员工月度社保详情"
  >
    <Spin :spinning="loading">
      <div class="min-h-80">
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
          <Button
            v-if="editable && detail"
            v-access:code="['hrm:insurance:month-record:update']"
            type="primary"
            @click="handleEdit"
          >
            编辑
          </Button>
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
            <span class="text-muted-foreground">年龄：</span>{{ detail?.age ?? '--' }}
          </div>
          <div>
            <span class="text-muted-foreground">工号：</span>{{ detail?.jobNumber || '--' }}
          </div>
          <div>
            <span class="text-muted-foreground">部门：</span>{{ detail?.deptName || '--' }}
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
            {{ formatHrmDate(detail?.entryTime) }}
          </div>
          <div>
            <span class="text-muted-foreground">参保城市：</span>{{ detail?.areaName || '--' }}
          </div>
          <div>
            <span class="text-muted-foreground">身份证号：</span>{{ detail?.idNumber || '--' }}
          </div>
          <div>
            <span class="text-muted-foreground">个人社保号：</span>{{ detail?.socialSecurityNumber || '--' }}
          </div>
          <div>
            <span class="text-muted-foreground">个人公积金号：</span>{{ detail?.accumulationFundNumber || '--' }}
          </div>
          <div>
            <span class="text-muted-foreground">参保方案：</span>{{ detail?.schemeName || '--' }}
          </div>
        </div>

        <div class="mb-2 text-base font-semibold">缴费项目</div>
        <Table
          :columns="projectColumns"
          :data-source="projects"
          :pagination="false"
          :summary="projectSummary"
          bordered
          row-key="schemeProjectId"
          size="small"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.dataIndex === 'name'">
              {{ formatHrmInsuranceProjectName(record) }}
            </template>
            <template v-else-if="column.dataIndex === 'baseAmount'">
              {{ formatHrmMoney(record.baseAmount) }}
            </template>
            <template v-else-if="column.dataIndex === 'corporateRate'">
              {{ formatHrmRate(record.corporateRate) }}
            </template>
            <template v-else-if="column.dataIndex === 'personalRate'">
              {{ formatHrmRate(record.personalRate) }}
            </template>
            <template v-else-if="column.dataIndex === 'personalAmount'">
              {{ formatHrmMoney(record.personalAmount) }}
            </template>
            <template v-else-if="column.dataIndex === 'corporateAmount'">
              {{ formatHrmMoney(record.corporateAmount) }}
            </template>
            <template v-else-if="column.dataIndex === 'totalAmount'">
              {{ formatHrmMoney(record.totalAmount) }}
            </template>
          </template>
        </Table>
      </div>
    </Spin>
  </Drawer>
</template>
