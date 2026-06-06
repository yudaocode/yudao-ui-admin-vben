<script lang="ts" setup>
import { ref } from 'vue';

import { DocAlert, Page } from '@vben/common-ui';

import { Tabs } from 'antdv-next';
import dayjs from 'dayjs';

import TeamView from './modules/team-view.vue';
import TypeView from './modules/type-view.vue';
import UserView from './modules/user-view.vue';

import 'dayjs/locale/zh-cn';

dayjs.locale('zh-cn');

const activeTab = ref<string>('type');
const calendarTabItems = [
  { key: 'type', label: '按分类', forceRender: true },
  { key: 'team', label: '按班组', forceRender: true },
  { key: 'user', label: '按个人', forceRender: true },
];
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
      <Tabs v-model:active-key="activeTab" :items="calendarTabItems" type="card">
        <template #contentRender="{ item }">
          <TypeView v-if="item.key === 'type'" />
          <TeamView v-else-if="item.key === 'team'" />
          <UserView v-else-if="item.key === 'user'" />
        </template>
      </Tabs>
    </div>
  </Page>
</template>
