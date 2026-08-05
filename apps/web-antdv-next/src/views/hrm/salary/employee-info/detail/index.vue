<script lang="ts" setup>
import type { HrmEmployeeApi } from '#/api/hrm/employee';
import type { HrmSalaryChangeRecordApi } from '#/api/hrm/salary/change-record';
import type { HrmSalaryEmployeeInfoApi } from '#/api/hrm/salary/employee-info';

import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { useTabs } from '@vben/hooks';

import { Button, message, Spin, TabPane, Tabs } from 'antdv-next';

import { getEmployee } from '#/api/hrm/employee';
import { getSalaryEmployeeInfo } from '#/api/hrm/salary/employee-info';
import Header from '#/views/hrm/employee/detail/modules/header.vue';

import Form from '../modules/form.vue';
import ChangeRecordList from './modules/change-record-list.vue';
import InfoDetails from './modules/info-details.vue';

defineOptions({ name: 'HrmSalaryEmployeeInfoDetail' });

const route = useRoute();
const router = useRouter();
const tabs = useTabs();

const employeeId = Number(route.params.id);
const loading = ref(false);
const activeTab = ref('salaryEmployee');
const employee = ref({} as HrmEmployeeApi.Employee);
const salaryEmployee = ref<HrmSalaryEmployeeInfoApi.SalaryEmployeeInfo>({});
const changeRecordListRef = ref<InstanceType<typeof ChangeRecordList>>();
const employeeInfoFormRef = ref<InstanceType<typeof Form>>();

function close() {
  tabs.closeCurrentTab();
  router.push({ name: 'HrmSalaryEmployeeInfo' });
}

async function getData() {
  loading.value = true;
  try {
    const [employeeData, salaryEmployeeData] = await Promise.all([
      getEmployee(employeeId),
      getSalaryEmployeeInfo(employeeId),
    ]);
    if (!employeeData) {
      message.warning('员工档案不存在');
      close();
      return;
    }
    employee.value = employeeData;
    salaryEmployee.value = salaryEmployeeData || {};
  } finally {
    loading.value = false;
  }
}

function openSetSalary(record?: HrmSalaryChangeRecordApi.SalaryChangeRecord) {
  employeeInfoFormRef.value?.open(employeeId, record?.id);
}

async function handleSalaryUpdated() {
  await getData();
  await changeRecordListRef.value?.getList();
}

async function init() {
  if (!Number.isSafeInteger(employeeId) || employeeId <= 0) {
    message.warning('参数错误，员工不能为空！');
    close();
    return;
  }
  await getData();
}

onMounted(() => {
  init();
});
</script>

<template>
  <Page auto-content-height>
    <Form ref="employeeInfoFormRef" @success="handleSalaryUpdated" />

    <div class="mb-4 flex items-center justify-between">
      <Button type="link" @click="close">返回薪资档案</Button>
      <span class="text-lg font-medium">薪资档案详情</span>
    </div>

    <Header :employee="employee" :loading="loading">
      <Button
        v-access:code="['hrm:salary:employee-info:update']"
        :disabled="!employee.id"
        type="primary"
        @click="openSetSalary()"
      >
        {{ salaryEmployee.id ? '调薪' : '定薪' }}
      </Button>
    </Header>

    <Spin :spinning="loading">
      <Tabs v-model:active-key="activeTab" class="mt-4">
        <TabPane key="salaryEmployee" tab="薪资档案">
          <InfoDetails :salary-employee="salaryEmployee" />
        </TabPane>
        <TabPane key="records" tab="调薪记录">
          <ChangeRecordList
            ref="changeRecordListRef"
            :employee-id="employeeId"
            @change="getData"
            @edit="openSetSalary"
          />
        </TabPane>
      </Tabs>
    </Spin>
  </Page>
</template>
