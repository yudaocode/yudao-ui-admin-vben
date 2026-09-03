<script lang="ts" setup>
import type { PmsProjectApi } from '#/api/pms/pm/project';

import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { confirm, Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Button, Dropdown, Menu, message, Tabs } from 'ant-design-vue';

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
const visitedTabs = ref(new Set<ProjectDetailTab>(['task'])); // 已激活过的页签，激活后保留挂载
/** 页签是否已激活过（首次激活后保留挂载，避免重复请求和状态丢失） */
function hasVisited(tab: ProjectDetailTab) {
  if (activeTab.value === tab) {
    visitedTabs.value.add(tab);
  }
  return visitedTabs.value.has(tab);
}
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
  message.success(project.value.favoriteStatus ? '收藏成功' : '已取消收藏');
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
    message.success('已退出项目');
    close();
  } catch {}
}

/** 关闭项目详情 */
function close() {
  push({ name: 'PmsProjectList' });
}

/** 初始化 */
onMounted(() => {
  if (!route.params.id || Number.isNaN(Number(route.params.id))) {
    message.warning('参数错误，项目不能为空！');
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
          <Button shape="circle" @click="close">
            <IconifyIcon icon="lucide:arrow-left" />
          </Button>
          <div class="min-w-0">
            <h2 class="m-0 truncate text-xl font-semibold">
              {{ project.name }}
            </h2>
            <div class="mt-1 text-[13px] text-muted-foreground">
              {{ project.description || '暂无项目描述' }}
            </div>
          </div>
        </div>
        <Dropdown v-if="project.id" trigger="click">
          <Button>
            更多
            <IconifyIcon class="ml-1" icon="lucide:chevron-down" />
          </Button>
          <template #overlay>
            <Menu @click="({ key }: any) => handleProjectCommand(key)">
              <Menu.Item v-if="project.memberStatus" key="favorite">
                {{ project.favoriteStatus ? '取消星标' : '星标项目' }}
              </Menu.Item>
              <Menu.Item v-if="project.adminStatus" key="config">
                项目设置
              </Menu.Item>
              <Menu.Divider v-if="project.exitStatus" />
              <Menu.Item v-if="project.exitStatus" key="exit">
                退出项目
              </Menu.Item>
            </Menu>
          </template>
        </Dropdown>
      </div>

      <Tabs
        v-if="project.id"
        v-model:active-key="activeTab"
        @change="handleTabChange"
      >
        <Tabs.TabPane key="overview" tab="项目概况">
          <ProjectOverview
            v-if="hasVisited('overview')"
            v-show="activeTab === 'overview'"
            :editable="editable"
            :project="project"
          />
        </Tabs.TabPane>
        <Tabs.TabPane v-if="agileProject" key="planning" tab="待规划">
          <PlanningBoard
            v-if="hasVisited('planning')"
            v-show="activeTab === 'planning'"
            :editable="editable"
            :project-id="project.id"
            :project-type="project.type"
          />
        </Tabs.TabPane>
        <Tabs.TabPane v-if="agileProject" key="iteration" tab="迭代">
          <IterationList
            v-if="hasVisited('iteration')"
            v-show="activeTab === 'iteration'"
            :editable="editable"
            :project-id="project.id"
          />
        </Tabs.TabPane>
        <Tabs.TabPane v-if="agileProject" key="all" tab="全部事项">
          <WorkItemAllList
            v-if="hasVisited('all')"
            v-show="activeTab === 'all'"
            :editable="editable"
            :project-id="project.id"
            :project-type="project.type"
          />
        </Tabs.TabPane>
        <Tabs.TabPane v-if="agileProject" key="requirement" tab="需求">
          <WorkItemList
            v-if="hasVisited('requirement')"
            v-show="activeTab === 'requirement'"
            :editable="editable"
            :project-id="project.id"
            :project-type="project.type"
            :type="PmsWorkItemType.REQUIREMENT"
          />
        </Tabs.TabPane>
        <Tabs.TabPane key="task" tab="任务">
          <WorkItemList
            v-if="hasVisited('task')"
            v-show="activeTab === 'task'"
            default-view-mode="board"
            :editable="editable"
            :project-id="project.id"
            :project-type="project.type"
            :type="PmsWorkItemType.TASK"
          />
        </Tabs.TabPane>
        <Tabs.TabPane v-if="agileProject" key="defect" tab="缺陷">
          <WorkItemList
            v-if="hasVisited('defect')"
            v-show="activeTab === 'defect'"
            :editable="editable"
            :project-id="project.id"
            :project-type="project.type"
            :type="PmsWorkItemType.DEFECT"
          />
        </Tabs.TabPane>
        <Tabs.TabPane key="gantt" tab="甘特图">
          <ProjectGantt
            v-if="hasVisited('gantt')"
            v-show="activeTab === 'gantt'"
            :editable="editable"
            :project-id="project.id"
            :project-type="project.type"
          />
        </Tabs.TabPane>
        <Tabs.TabPane v-if="agileProject" key="worklog" tab="工时">
          <ProjectWorkLog
            v-if="hasVisited('worklog')"
            v-show="activeTab === 'worklog'"
            :editable="editable"
            :project-id="project.id"
            :project-type="project.type"
          />
        </Tabs.TabPane>
      </Tabs>
    </div>
  </Page>
</template>
