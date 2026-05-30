<script lang="ts" setup>
import type { SystemUserApi } from '#/api/system/user';

import { onMounted, ref } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { Button, Form, FormItem, Select } from 'ant-design-vue';

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
    <Form layout="inline" class="mb-2.5">
      <FormItem label="人员">
        <Select
          v-model:value="userId"
          allow-clear
          show-search
          placeholder="请输入人员姓名搜索"
          class="!w-[200px]"
          :options="userOptions"
          :field-names="{ label: 'nickname', value: 'id' }"
          :filter-option="
            (input: string, option: any) =>
              (option?.nickname ?? '').includes(input)
          "
          @change="onUserQuery"
        />
      </FormItem>
      <FormItem>
        <Button type="primary" @click="onUserQuery">
          <template #icon>
            <IconifyIcon icon="lucide:search" />
          </template>
          查询
        </Button>
      </FormItem>
    </Form>

    <!-- 日历 -->
    <CalendarPanel
      v-model:current-date="currentDate"
      :calendar-day-map="calendarDayMap"
      :holiday-set="holidaySet"
      :loading="loading"
    />
  </div>
</template>
