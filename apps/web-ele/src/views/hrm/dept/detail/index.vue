<script lang="ts" setup>
import type { SystemDeptApi } from '#/api/system/dept';

import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { useTabs } from '@vben/hooks';

import { ElCard, ElMessage, ElTabPane, ElTabs } from 'element-plus';

import { getEmployeeDeptStatistics } from '#/api/hrm/employee';
import { getDept, getSimpleDeptList } from '#/api/system/dept';
import { getSimpleUserList } from '#/api/system/user';
import { ACTION_ICON, TableAction } from '#/components/table-action';

import EmployeeList from './modules/employee-list.vue';
import Header from './modules/header.vue';
import Info from './modules/info.vue';

defineOptions({ name: 'HrmDeptDetail' });

const route = useRoute();
const router = useRouter();
const tabs = useTabs();

const deptId = Number(route.params.id);
const loading = ref(true);
const dept = ref<SystemDeptApi.Dept>({} as SystemDeptApi.Dept);
const parentDeptName = ref<string>();
const leaderUserName = ref<string>();
const statistics = ref({
  activeCount: 0,
  fullTimeCount: 0,
  nonFullTimeCount: 0,
});
const activeTab = ref('details');

/** 关闭详情 */
function close() {
  tabs.closeCurrentTab();
  router.push({ name: 'HrmDept' });
}

/** 加载数据 */
async function getData() {
  loading.value = true;
  try {
    const [deptData, deptList, userList, statisticsList] = await Promise.all([
      getDept(deptId),
      getSimpleDeptList(),
      getSimpleUserList(),
      getEmployeeDeptStatistics(),
    ]);
    if (!deptData) {
      ElMessage.warning('部门不存在');
      close();
      return;
    }
    dept.value = deptData;
    parentDeptName.value = deptList.find(
      (item) => item.id === deptData.parentId,
    )?.name;
    leaderUserName.value = userList.find(
      (item) => item.id === deptData.leaderUserId,
    )?.nickname;
    const found = statisticsList.find((item) => item.deptId === deptId);
    statistics.value = found
      ? {
          activeCount: found.activeCount,
          fullTimeCount: found.fullTimeCount,
          nonFullTimeCount: found.nonFullTimeCount,
        }
      : {
          activeCount: 0,
          fullTimeCount: 0,
          nonFullTimeCount: 0,
        };
  } finally {
    loading.value = false;
  }
}

/** 前往部门管理 */
function openDeptManagement() {
  router.push('/system/dept');
}

/** 初始化 */
onMounted(() => {
  if (!Number.isSafeInteger(deptId) || deptId <= 0) {
    ElMessage.warning('参数错误，部门不能为空！');
    close();
    return;
  }
  getData();
});
</script>

<template>
  <Page :loading="loading">
    <Header
      :dept="dept"
      :leader-user-name="leaderUserName"
      :loading="loading"
      :parent-dept-name="parentDeptName"
      :statistics="statistics"
    >
      <TableAction
        :actions="[
          {
            label: '编辑',
            type: 'primary',
            icon: ACTION_ICON.EDIT,
            auth: ['system:dept:update'],
            disabled: !dept.id,
            onClick: openDeptManagement,
          },
          {
            label: '删除',
            type: 'danger',
            icon: ACTION_ICON.DELETE,
            auth: ['system:dept:delete'],
            disabled: !dept.id,
            onClick: openDeptManagement,
          },
        ]"
      />
    </Header>
    <ElCard class="mt-4">
      <ElTabs v-model="activeTab">
        <ElTabPane label="详细资料" name="details">
          <Info
            :dept="dept"
            :leader-user-name="leaderUserName"
            :parent-dept-name="parentDeptName"
          />
        </ElTabPane>
        <ElTabPane label="员工列表" name="employees" lazy>
          <EmployeeList v-if="dept.id" :dept-id="dept.id" />
        </ElTabPane>
      </ElTabs>
    </ElCard>
  </Page>
</template>
