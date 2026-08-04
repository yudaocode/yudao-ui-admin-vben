<script lang="ts" setup>
import type { HrmSalaryEmployeeInfoApi } from '#/api/hrm/salary/employee-info';

import { DICT_TYPE } from '@vben/constants';

import { Card, Col, Descriptions, Empty, Row, Table } from 'ant-design-vue';

import { DictTag } from '#/components/dict-tag';
import { formatHrmDate, formatHrmMoney } from '#/views/hrm/utils/format';

defineOptions({ name: 'HrmSalaryEmployeeInfoDetails' });

defineProps<{
  salaryEmployee: HrmSalaryEmployeeInfoApi.SalaryEmployeeInfo;
}>();
</script>

<template>
  <template v-if="salaryEmployee.id">
    <Card class="mb-4">
      <Descriptions bordered :column="3">
        <Descriptions.Item label="正式工资">
          {{ formatHrmMoney(salaryEmployee.regularSalary) }}
        </Descriptions.Item>
        <Descriptions.Item label="试用期工资">
          {{ formatHrmMoney(salaryEmployee.probationSalary) }}
        </Descriptions.Item>
        <Descriptions.Item label="生效日期">
          {{ formatHrmDate(salaryEmployee.effectTime) }}
        </Descriptions.Item>
        <Descriptions.Item label="调整原因">
          <DictTag
            v-if="salaryEmployee.changeReason != null"
            :type="DICT_TYPE.HRM_SALARY_CHANGE_REASON"
            :value="salaryEmployee.changeReason"
          />
          <span v-else>-</span>
        </Descriptions.Item>
        <Descriptions.Item label="档案状态">
          <DictTag
            v-if="salaryEmployee.changeType != null"
            :type="DICT_TYPE.HRM_SALARY_CHANGE_TYPE"
            :value="salaryEmployee.changeType"
          />
          <span v-else>-</span>
        </Descriptions.Item>
        <Descriptions.Item label="备注">
          {{ salaryEmployee.remark || '-' }}
        </Descriptions.Item>
      </Descriptions>
    </Card>

    <Row :gutter="16">
      <Col :span="12">
        <Card class="mb-4" title="正式工资明细">
          <Table
            bordered
            size="small"
            :columns="[
              { title: '薪资项', dataIndex: 'name', key: 'name' },
              {
                title: '编码',
                dataIndex: 'code',
                key: 'code',
                align: 'center',
                width: 100,
              },
              { title: '金额', key: 'value', align: 'right', width: 120 },
            ]"
            :data-source="salaryEmployee.salaryOptions || []"
            :pagination="false"
            :row-key="(row) => row.code"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'value'">
                {{ formatHrmMoney(record.value) }}
              </template>
            </template>
          </Table>
        </Card>
      </Col>
      <Col :span="12">
        <Card class="mb-4" title="试用期工资明细">
          <Table
            bordered
            size="small"
            :columns="[
              { title: '薪资项', dataIndex: 'name', key: 'name' },
              {
                title: '编码',
                dataIndex: 'code',
                key: 'code',
                align: 'center',
                width: 100,
              },
              { title: '金额', key: 'value', align: 'right', width: 120 },
            ]"
            :data-source="salaryEmployee.probationSalaryOptions || []"
            :pagination="false"
            :row-key="(row) => row.code"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'value'">
                {{ formatHrmMoney(record.value) }}
              </template>
            </template>
          </Table>
        </Card>
      </Col>
    </Row>
  </template>

  <Card v-else>
    <Empty description="该员工尚未定薪" />
  </Card>
</template>
