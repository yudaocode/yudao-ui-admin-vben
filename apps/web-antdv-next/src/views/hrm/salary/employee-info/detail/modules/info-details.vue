<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmSalaryEmployeeInfoApi } from '#/api/hrm/salary/employee-info';

import { nextTick, watch } from 'vue';

import { DICT_TYPE } from '@vben/constants';

import {
  Card,
  Col,
  Descriptions,
  DescriptionsItem,
  Empty,
  Row,
} from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { DictTag } from '#/components/dict-tag';
import { formatHrmDate, formatHrmMoney } from '#/views/hrm/utils/format';

import { useSalaryOptionGridColumns } from '../../data';

defineOptions({ name: 'HrmSalaryEmployeeInfoDetails' });

const props = defineProps<{
  salaryEmployee: HrmSalaryEmployeeInfoApi.SalaryEmployeeInfo;
}>();

const gridOptions = {
  border: true,
  columns: useSalaryOptionGridColumns(),
  data: [],
  minHeight: 180,
  pagerConfig: { enabled: false },
  rowConfig: { keyField: 'code', isHover: true },
  toolbarConfig: { enabled: false },
} as VxeTableGridOptions<any>;

const [RegularGrid, regularGridApi] = useVbenVxeGrid({ gridOptions });
const [ProbationGrid, probationGridApi] = useVbenVxeGrid({
  gridOptions: { ...gridOptions },
});

watch(
  () => [
    props.salaryEmployee.salaryOptions,
    props.salaryEmployee.probationSalaryOptions,
  ],
  async () => {
    await nextTick();
    await Promise.all([
      regularGridApi.grid.reloadData(props.salaryEmployee.salaryOptions || []),
      probationGridApi.grid.reloadData(
        props.salaryEmployee.probationSalaryOptions || [],
      ),
    ]);
  },
  { immediate: true },
);
</script>

<template>
  <template v-if="salaryEmployee.id">
    <Card class="mb-4">
      <Descriptions bordered :column="3">
        <DescriptionsItem label="正式工资">
          {{ formatHrmMoney(salaryEmployee.regularSalary) }}
        </DescriptionsItem>
        <DescriptionsItem label="试用期工资">
          {{ formatHrmMoney(salaryEmployee.probationSalary) }}
        </DescriptionsItem>
        <DescriptionsItem label="生效日期">
          {{ formatHrmDate(salaryEmployee.effectTime) }}
        </DescriptionsItem>
        <DescriptionsItem label="调整原因">
          <DictTag
            v-if="salaryEmployee.changeReason !== null"
            :type="DICT_TYPE.HRM_SALARY_CHANGE_REASON"
            :value="salaryEmployee.changeReason"
          />
          <span v-else>-</span>
        </DescriptionsItem>
        <DescriptionsItem label="档案状态">
          <DictTag
            v-if="salaryEmployee.changeType !== null"
            :type="DICT_TYPE.HRM_SALARY_CHANGE_TYPE"
            :value="salaryEmployee.changeType"
          />
          <span v-else>-</span>
        </DescriptionsItem>
        <DescriptionsItem label="备注">
          {{ salaryEmployee.remark || '-' }}
        </DescriptionsItem>
      </Descriptions>
    </Card>

    <Row :gutter="16">
      <Col :span="12">
        <Card class="mb-4" title="正式工资明细">
          <RegularGrid class="w-full" />
        </Card>
      </Col>
      <Col :span="12">
        <Card class="mb-4" title="试用期工资明细">
          <ProbationGrid class="w-full" />
        </Card>
      </Col>
    </Row>
  </template>

  <Card v-else>
    <Empty description="该员工尚未定薪" />
  </Card>
</template>
