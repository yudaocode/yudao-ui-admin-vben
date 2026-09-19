<script lang="ts" setup>
import type { TableColumnsType } from 'antdv-next';

import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { DICT_TYPE } from '@vben/constants';
import { formatDateTime } from '@vben/utils';

import { Button, Table } from 'antdv-next';

import { getPlanPage } from '#/api/oa/plan';
import { DictTag } from '#/components/dict-tag';

import OaHomePanel from './panel.vue';

defineOptions({ name: 'OaHomePlan' });

type Plan = Awaited<ReturnType<typeof getPlanPage>>['list'][number];

const { push } = useRouter();
const loading = ref(false); // 区块加载中
const loadError = ref(false); // 区块加载失败
const list = ref<Plan[]>([]); // 计划列表

const columns: TableColumnsType = [
  { key: 'type', title: '类型', align: 'center', width: 100 },
  { key: 'title', title: '计划标题', dataIndex: 'title', ellipsis: true },
  { key: 'status', title: '状态', align: 'center', width: 100 },
  { key: 'endTime', title: '结束时间', align: 'center', width: 170 },
];

/** 查询当前区块数据 */
async function getList() {
  if (loading.value) return;
  loading.value = true;
  loadError.value = false;
  try {
    list.value = (await getPlanPage({ pageNo: 1, pageSize: 2 })).list;
  } catch {
    loadError.value = true;
  } finally {
    loading.value = false;
  }
}

/** 初始化 */
onMounted(() => {
  getList();
});
</script>

<template>
  <OaHomePanel title="工作计划">
    <template #actions>
      <Button type="link" @click="push('/oa/plan/list')">更多</Button>
    </template>
    <div v-if="loadError" class="mb-3 text-[13px] text-destructive">
      加载失败，
      <Button type="link" @click="getList">重新加载</Button>
    </div>
    <Table
      :columns="columns"
      :data-source="list"
      :loading="loading"
      :pagination="false"
      row-key="id"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'type'">
          <DictTag :type="DICT_TYPE.OA_PLAN_TYPE" :value="record.type" />
        </template>
        <template v-else-if="column.key === 'title'">
          <Button type="link" @click="push('/oa/plan/list')">
            {{ record.title }}
          </Button>
        </template>
        <template v-else-if="column.key === 'status'">
          <DictTag :type="DICT_TYPE.OA_PLAN_STATUS" :value="record.status" />
        </template>
        <template v-else-if="column.key === 'endTime'">
          {{ formatDateTime(record.endTime) }}
        </template>
      </template>
    </Table>
  </OaHomePanel>
</template>
