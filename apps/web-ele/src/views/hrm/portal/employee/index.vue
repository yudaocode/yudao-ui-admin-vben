<script lang="ts" setup>
import type { HrmEmployeeConfigApi } from '#/api/hrm/employee/config';
import type { HrmPortalEmployeeApi } from '#/api/hrm/portal/employee';

import { onActivated, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { ElButton, ElCard, ElTabPane, ElTabs } from 'element-plus';

import { getEmployee } from '#/api/hrm/portal/employee';
import { getEmployeeFieldConfigList } from '#/api/hrm/portal/employee/field-config';
import { checkHrmPortalAccess } from '#/views/hrm/utils/employee';

import EmployeeBaseInfo from './EmployeeBaseInfo.vue';
import EmployeeForm from './EmployeeForm.vue';
import EmployeePostInfo from './EmployeePostInfo.vue';

defineOptions({ name: 'HrmPortalEmployee' });

const router = useRouter();
const accessible = ref(false);
const loading = ref(false);
const activeTab = ref('base');
const employee = ref<HrmPortalEmployeeApi.PortalEmployee>(
  {} as HrmPortalEmployeeApi.PortalEmployee,
);
const fieldConfigList = ref<HrmEmployeeConfigApi.FieldConfig[]>([]);
const baseInfoRef = ref<InstanceType<typeof EmployeeBaseInfo>>();
const postInfoRef = ref<InstanceType<typeof EmployeePostInfo>>();
const employeeFormRef = ref<InstanceType<typeof EmployeeForm>>();

/** 获得当前员工档案和字段配置 */
async function loadEmployee() {
  loading.value = true;
  try {
    const [employeeData, fields] = await Promise.all([
      getEmployee(),
      getEmployeeFieldConfigList(),
    ]);
    employee.value = employeeData;
    fieldConfigList.value = fields;
  } finally {
    loading.value = false;
  }
}

/** 刷新当前员工档案页面 */
async function refreshEmployee() {
  await loadEmployee();
  await (activeTab.value === 'base'
    ? baseInfoRef.value?.getList()
    : postInfoRef.value?.getQuitInfo());
}

/** 打开员工档案编辑表单 */
function openEmployeeForm() {
  employeeFormRef.value?.open(employee.value, fieldConfigList.value);
}

/** 页面激活时刷新员工档案 */
onActivated(async () => {
  accessible.value = await checkHrmPortalAccess(router);
  if (!accessible.value) {
    return;
  }
  await loadEmployee();
});
</script>

<template>
  <Page v-if="accessible">
    <ElCard shadow="never" :style="{ marginBottom: '15px' }">
      <div class="flex items-center justify-between">
        <span class="text-lg font-semibold">我的档案</span>
        <ElButton @click="refreshEmployee">
          <IconifyIcon icon="lucide:refresh-cw" class="mr-1" />
          刷新
        </ElButton>
      </div>
    </ElCard>

    <div v-loading="loading">
      <ElTabs v-model="activeTab">
        <ElTabPane label="基本信息" name="base">
          <EmployeeBaseInfo
            ref="baseInfoRef"
            :employee="employee"
            :field-config-list="fieldConfigList"
            @edit="openEmployeeForm"
          />
        </ElTabPane>
        <ElTabPane label="岗位信息" lazy name="post">
          <EmployeePostInfo ref="postInfoRef" :employee="employee" />
        </ElTabPane>
      </ElTabs>
    </div>

    <EmployeeForm ref="employeeFormRef" @success="loadEmployee" />
  </Page>
</template>
