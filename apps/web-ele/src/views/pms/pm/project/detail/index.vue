<script lang="ts" setup>
import type { PmsProjectApi } from '#/api/pms/pm/project';

import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { confirm, Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import {
  ElButton,
  ElDropdown,
  ElDropdownItem,
  ElDropdownMenu,
  ElMessage,
  ElTabPane,
  ElTabs,
} from 'element-plus';

import { getProject } from '#/api/pms/pm/project';
import {
  createProjectFavorite,
  deleteProjectFavorite,
} from '#/api/pms/pm/project/favorite';
import { exitProject } from '#/api/pms/pm/project/member';
import IterationList from '#/views/pms/pm/iteration/list/iteration-list.vue';
import {
  PmsProjectStatus,
  PmsProjectType,
  PmsWorkItemType,
} from '#/views/pms/pm/utils/constants';
import WorkItemAllList from '#/views/pms/pm/workitem/list/work-item-all-list.vue';
import WorkItemList from '#/views/pms/pm/workitem/list/work-item-list.vue';

import PlanningBoard from './planning-board.vue';
import ProjectGantt from './project-gantt.vue';
import ProjectOverview from './project-overview.vue';
import ProjectWorkLog from './project-work-log.vue';

defineOptions({ name: 'PmsProjectDetail' });

// TODO @AI：antd/antdv-next 不要用 v-loading。三端详情页结构差一截，对齐页签、权限按钮和空态。

type ProjectDetailTab =
  | 'all'
  | 'defect'
  | 'gantt'
  | 'iteration'
  | 'overview'
  | 'planning'
  | 'requirement'
  | 'task'
  | 'worklog';

const { push, replace } = useRouter(); // 路由操作
const route = useRoute(); // 当前路由
const loading = ref(true); // 项目详情加载中
const project = ref<PmsProjectApi.Project>({} as PmsProjectApi.Project); // 项目详情
const activeTab = ref<ProjectDetailTab>('task'); // 当前项目详情页签
const agileProject = computed(
  () => project.value.type === PmsProjectType.AGILE,
); // 是否为敏捷项目
const editable = computed(
  () =>
    project.value.writeStatus &&
    project.value.status === PmsProjectStatus.ACTIVE,
); // 当前用户是否可以编辑项目业务数据
const agileTabs: ProjectDetailTab[] = [
  'overview',
  'planning',
  'iteration',
  'all',
  'requirement',
  'task',
  'defect',
  'gantt',
  'worklog',
]; // 敏捷项目页签
const generalTabs: ProjectDetailTab[] = ['overview', 'task', 'gantt']; // 普通项目页签

/** 查询项目详情 */
async function getProjectDetail() {
  loading.value = true;
  try {
    // 1. 查询项目详情
    project.value = await getProject(Number(route.params.id));
    // 2. 初始化当前业务页签
    initActiveTab();
  } finally {
    loading.value = false;
  }
}

/** 初始化当前业务页签 */
function initActiveTab() {
  const availableTabs = agileProject.value ? agileTabs : generalTabs;
  const requestedTab =
    typeof route.query.tabs === 'string'
      ? (route.query.tabs as ProjectDetailTab)
      : undefined;
  activeTab.value =
    requestedTab && availableTabs.includes(requestedTab)
      ? requestedTab
      : 'task';
}

/** 切换项目详情页签 */
function handleTabChange(tab: number | string) {
  replace({
    query: {
      ...route.query,
      tabs: String(tab),
    },
  });
}

/** 切换项目关注状态 */
async function handleCollect() {
  if (project.value.favoriteStatus) {
    await deleteProjectFavorite(project.value.id);
  } else {
    await createProjectFavorite(project.value.id);
  }
  // 更新当前页面的关注状态
  project.value.favoriteStatus = !project.value.favoriteStatus;
  ElMessage.success(project.value.favoriteStatus ? '收藏成功' : '已取消收藏');
}

/** 处理项目更多操作 */
function handleProjectCommand(command: string) {
  if (command === 'favorite') {
    handleCollect();
  } else if (command === 'config') {
    openProjectConfig();
  } else if (command === 'exit') {
    handleExit();
  }
}

/** 打开项目配置 */
function openProjectConfig() {
  push({
    name: 'PmsProjectConfig',
    params: {
      id: project.value.id,
    },
  });
}

/** 主动退出项目 */
async function handleExit() {
  try {
    // 1. 退出的二次确认
    await confirm(
      `确认退出项目“${project.value.name}”吗？退出后将不能访问该项目，需要项目管理员重新邀请才能加入。`,
    );
    // 2. 发起退出
    await exitProject(project.value.id);
    ElMessage.success('已退出项目');
    close();
  } catch {
  }
}

/** 关闭项目详情 */
function close() {
  push({ name: 'PmsProjectList' });
}

/** 初始化 */
onMounted(() => {
  if (!route.params.id || Number.isNaN(Number(route.params.id))) {
    ElMessage.warning('参数错误，项目不能为空！');
    close();
    return;
  }
  getProjectDetail();
});

/** 同步浏览器前进、后退触发的页签变化 */
watch(
  () => route.query.tabs,
  () => {
    if (project.value.id) {
      initActiveTab();
    }
  },
);
</script>

<template>
  <Page auto-content-height>
    <div v-loading="loading" class="p-4">
      <!-- 项目工作区标题 -->
      <div class="flex items-center justify-between gap-4 pb-4">
        <div class="flex min-w-0 items-center gap-3">
          <ElButton circle @click="close">
            <IconifyIcon icon="ep:arrow-left" />
          </ElButton>
          <div class="min-w-0">
            <h2 class="m-0 truncate text-xl font-semibold">
              {{ project.name }}
            </h2>
            <div class="mt-1 text-[13px] text-[var(--el-text-color-secondary)]">
              {{ project.description || '暂无项目描述' }}
            </div>
          </div>
        </div>
        <ElDropdown
          v-if="project.id"
          trigger="click"
          @command="handleProjectCommand"
        >
          <ElButton>
            更多
            <IconifyIcon class="ml-1" icon="ep:arrow-down" />
          </ElButton>
          <template #dropdown>
            <ElDropdownMenu>
              <ElDropdownItem v-if="project.memberStatus" command="favorite">
                {{ project.favoriteStatus ? '取消星标' : '星标项目' }}
              </ElDropdownItem>
              <ElDropdownItem v-if="project.adminStatus" command="config">
                项目设置
              </ElDropdownItem>
              <ElDropdownItem v-if="project.exitStatus" command="exit" divided>
                退出项目
              </ElDropdownItem>
            </ElDropdownMenu>
          </template>
        </ElDropdown>
      </div>

      <ElTabs
        v-if="project.id"
        v-model="activeTab"
        class="[&_.el-tabs__header]:!mb-5"
        @tab-change="handleTabChange"
      >
        <ElTabPane label="项目概况" lazy name="overview">
          <ProjectOverview
            v-if="activeTab === 'overview'"
            :editable="editable"
            :project="project"
          />
        </ElTabPane>
        <ElTabPane v-if="agileProject" label="待规划" lazy name="planning">
          <PlanningBoard
            :editable="editable"
            :project-id="project.id"
            :project-type="project.type"
          />
        </ElTabPane>
        <ElTabPane v-if="agileProject" label="迭代" lazy name="iteration">
          <IterationList :editable="editable" :project-id="project.id" />
        </ElTabPane>
        <ElTabPane v-if="agileProject" label="全部事项" lazy name="all">
          <WorkItemAllList
            :editable="editable"
            :project-id="project.id"
            :project-type="project.type"
          />
        </ElTabPane>
        <ElTabPane v-if="agileProject" label="需求" lazy name="requirement">
          <WorkItemList
            :editable="editable"
            :project-id="project.id"
            :project-type="project.type"
            :type="PmsWorkItemType.REQUIREMENT"
          />
        </ElTabPane>
        <ElTabPane label="任务" lazy name="task">
          <WorkItemList
            default-view-mode="board"
            :editable="editable"
            :project-id="project.id"
            :project-type="project.type"
            :type="PmsWorkItemType.TASK"
          />
        </ElTabPane>
        <ElTabPane v-if="agileProject" label="缺陷" lazy name="defect">
          <WorkItemList
            :editable="editable"
            :project-id="project.id"
            :project-type="project.type"
            :type="PmsWorkItemType.DEFECT"
          />
        </ElTabPane>
        <ElTabPane label="甘特图" lazy name="gantt">
          <ProjectGantt
            :editable="editable"
            :project-id="project.id"
            :project-type="project.type"
          />
        </ElTabPane>
        <ElTabPane v-if="agileProject" label="工时" lazy name="worklog">
          <ProjectWorkLog
            :editable="editable"
            :project-id="project.id"
            :project-type="project.type"
          />
        </ElTabPane>
      </ElTabs>
    </div>
  </Page>
</template>
