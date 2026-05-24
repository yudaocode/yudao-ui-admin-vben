<script lang="ts" setup>
import { ref } from 'vue';

import { DocAlert, Page } from '@vben/common-ui';

import { Tabs } from 'ant-design-vue';
import dayjs from 'dayjs';

import TeamView from './modules/team-view.vue';
import TypeView from './modules/type-view.vue';
import UserView from './modules/user-view.vue';

import 'dayjs/locale/zh-cn';

dayjs.locale('zh-cn');

const activeTab = ref<string>('type');
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="【排班】排班计划、排班日历"
        url="https://doc.iocoder.cn/mes/cal/calendar/"
      />
    </template>
    <div class="bg-card rounded-md p-3">
      <Tabs v-model:active-key="activeTab" type="card">
        <Tabs.TabPane key="type" tab="按分类" force-render>
          <TypeView />
        </Tabs.TabPane>
        <Tabs.TabPane key="team" tab="按班组" force-render>
          <TeamView />
        </Tabs.TabPane>
        <Tabs.TabPane key="user" tab="按个人" force-render>
          <UserView />
        </Tabs.TabPane>
      </Tabs>
    </div>
  </Page>
</template>
