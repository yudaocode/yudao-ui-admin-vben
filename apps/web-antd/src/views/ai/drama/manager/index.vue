<script lang="ts" setup>
import { ref } from 'vue';

import { DocAlert, Page } from '@vben/common-ui';

import { TabPane, Tabs } from 'ant-design-vue';

import ProjectList from './modules/project-list.vue';
import TaskList from './modules/task-list.vue';

/** AI 短剧制作管理：项目、生成任务 */
defineOptions({ name: 'AiDramaManager' });

const activeTab = ref('project'); // 当前页签
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert title="AI 短剧制作" url="https://doc.iocoder.cn/ai/drama/" />
    </template>
    <div class="flex h-full flex-col">
      <Tabs v-model:active-key="activeTab" class="bg-card rounded-md px-4">
        <TabPane key="project" tab="项目管理" />
        <TabPane key="task" tab="生成任务" />
      </Tabs>
      <div class="mt-2 min-h-0 flex-1">
        <ProjectList v-if="activeTab === 'project'" />
        <TaskList v-else />
      </div>
    </div>
  </Page>
</template>
