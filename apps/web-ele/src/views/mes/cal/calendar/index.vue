<script lang="ts" setup>
import { ref } from 'vue';

import { DocAlert, Page } from '@vben/common-ui';

import dayjs from 'dayjs';
import { ElTabPane, ElTabs } from 'element-plus';

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
      <ElTabs v-model="activeTab" type="border-card">
        <ElTabPane label="按分类" name="type" :force-render="true">
          <TypeView />
        </ElTabPane>
        <ElTabPane label="按班组" name="team" :force-render="true">
          <TeamView />
        </ElTabPane>
        <ElTabPane label="按个人" name="user" :force-render="true">
          <UserView />
        </ElTabPane>
      </ElTabs>
    </div>
  </Page>
</template>
