<script lang="ts" setup>
import type { PmsProjectApi } from '#/api/pms/pm/project';

import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { message, Tabs } from 'antdv-next';

import { getProject } from '#/api/pms/pm/project';
import { PmsProjectStatus } from '#/views/pms/pm/utils/constants';

import ProjectAnnouncementList from './project-announcement-list.vue';
import ProjectBasicInfo from './project-basic-info.vue';
import ProjectCollaborationConfig from './project-collaboration-config.vue';
import ProjectMemberList from './project-member-list.vue';

defineOptions({ name: 'PmsProjectConfig' });

type ProjectConfigTab = 'announcement' | 'basic' | 'configuration' | 'member';

const route = useRoute(); // 当前路由
const { push, replace } = useRouter(); // 路由操作
const loading = ref(false); // 项目设置加载中
const project = ref<PmsProjectApi.Project>({} as PmsProjectApi.Project); // 项目详情
const activeTab = ref<ProjectConfigTab>('basic'); // 当前配置页签
const projectId = computed(() => Number(route.params.id)); // 当前项目编号
const editable = computed(
  () =>
    project.value.writeStatus &&
    project.value.status === PmsProjectStatus.ACTIVE,
); // 当前项目是否允许编辑

/** 查询项目详情 */
async function getProjectDetail() {
  loading.value = true;
  try {
    project.value = await getProject(projectId.value);
  } finally {
    loading.value = false;
  }
}

/** 切换项目设置页签 */
function handleTabChange(tab: number | string) {
  replace({
    query: {
      ...route.query,
      tabs: String(tab),
    },
  });
}

/** 根据路由初始化项目设置页签 */
function initActiveTab() {
  activeTab.value = String(route.query.tabs || 'basic') as ProjectConfigTab;
}

/** 关闭项目设置 */
function close() {
  push({ name: 'PmsProjectDetail', params: { id: projectId.value } });
}

/** 初始化 */
onMounted(() => {
  if (!projectId.value || Number.isNaN(projectId.value)) {
    message.warning('参数错误，项目不能为空！');
    close();
    return;
  }
  // 初始化路由指定页签
  initActiveTab();
  // 查询项目设置基础数据
  getProjectDetail();
});

/** 同步浏览器前进、后退触发的页签变化 */
watch(
  () => route.query.tabs,
  () => initActiveTab(),
);
</script>

<template>
  <Page auto-content-height>
    <div v-loading="loading" class="p-4">
      <!-- 项目设置标题 -->
      <div class="mb-4 flex items-center gap-3">
        <div
          class="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-solid border-border bg-accent text-primary"
        >
          <IconifyIcon :icon="project.icon || 'lucide:folder'" :size="30" />
        </div>
        <div class="min-w-0">
          <h2 class="m-0 truncate text-xl font-semibold">项目设置</h2>
          <div class="mt-1 text-[13px] text-muted-foreground">
            {{ project.name || '项目' }}
          </div>
        </div>
      </div>

      <!-- 项目设置页签 -->
      <Tabs v-model:active-key="activeTab" @change="handleTabChange">
        <Tabs.TabPane key="basic" tab="基本信息">
          <ProjectBasicInfo
            v-if="project.id"
            :editable="editable"
            :project="project"
            @success="getProjectDetail"
          />
        </Tabs.TabPane>
        <Tabs.TabPane key="member" tab="成员" lazy>
          <ProjectMemberList
            v-if="project.id"
            :editable="editable"
            :project="project"
          />
        </Tabs.TabPane>
        <Tabs.TabPane key="announcement" tab="项目公告" lazy>
          <ProjectAnnouncementList
            v-if="project.id"
            :editable="editable"
            :project-id="project.id"
          />
        </Tabs.TabPane>
        <Tabs.TabPane key="configuration" tab="协作配置">
          <ProjectCollaborationConfig
            v-if="project.id"
            :project-id="project.id"
            :project-type="project.type"
          />
        </Tabs.TabPane>
      </Tabs>
    </div>
  </Page>
</template>
