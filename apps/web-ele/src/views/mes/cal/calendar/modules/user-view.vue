<script lang="ts" setup>
import type { SystemUserApi } from '#/api/system/user';

import { onMounted, ref } from 'vue';

import { IconifyIcon } from '@vben/icons';

import {
  ElButton,
  ElForm,
  ElFormItem,
  ElOption,
  ElSelect,
} from 'element-plus';

import { getSimpleUserList } from '#/api/system/user';

import { CalendarPanel, useCalendar } from '../components';

const {
  calendarDayMap,
  currentDate,
  fetchCalendar,
  holidaySet,
  loadHolidays,
  loading,
  watchMonth,
} = useCalendar();

const userId = ref<number>();
const userOptions = ref<SystemUserApi.User[]>([]);

/** 查询当前月份的排班日历，按选中人员过滤 */
function doFetch() {
  if (!userId.value) {
    return;
  }
  fetchCalendar({ queryType: 'USER', userId: userId.value });
}

/** 查询按钮 / 下拉选人后刷新日历 */
function onUserQuery() {
  doFetch();
}

/** 监听月份切换，重新加载当月排班 */
watchMonth(() => {
  if (userId.value) {
    doFetch();
  }
});

onMounted(async () => {
  // 假期列表与人员列表并行加载，避免假期接口无权限或异常时阻断人员排班查询
  void loadHolidays();
  userOptions.value = await getSimpleUserList();
});
</script>

<template>
  <div>
    <!-- 顶部：人员选择 -->
    <ElForm :inline="true" class="mb-2.5">
      <ElFormItem label="人员">
        <ElSelect
          v-model="userId"
          clearable
          filterable
          placeholder="请输入人员姓名搜索"
          class="!w-[200px]"
          @change="onUserQuery"
        >
          <ElOption
            v-for="user in userOptions"
            :key="user.id"
            :label="user.nickname"
            :value="user.id!"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem>
        <ElButton type="primary" @click="onUserQuery">
          <IconifyIcon icon="lucide:search" class="mr-1" />
          查询
        </ElButton>
      </ElFormItem>
    </ElForm>

    <!-- 日历 -->
    <CalendarPanel
      v-model:current-date="currentDate"
      :calendar-day-map="calendarDayMap"
      :holiday-set="holidaySet"
      :loading="loading"
    />
  </div>
</template>
