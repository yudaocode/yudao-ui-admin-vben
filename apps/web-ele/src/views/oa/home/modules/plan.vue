<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { DICT_TYPE } from '@vben/constants';
import { formatDateTime } from '@vben/utils';

import { ElButton, ElTable, ElTableColumn } from 'element-plus';

import { getPlanPage } from '#/api/oa/plan';
import { DictTag } from '#/components/dict-tag';

import OaHomePanel from './panel.vue';

defineOptions({ name: 'OaHomePlan' });

type Plan = Awaited<ReturnType<typeof getPlanPage>>['list'][number];

const { push } = useRouter(); // 路由跳转
const loading = ref(false); // 区块加载中
const loadError = ref(false); // 区块加载失败
const list = ref<Plan[]>([]); // 计划列表

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
  <OaHomePanel v-loading="loading" title="工作计划">
    <template #actions>
      <ElButton link type="primary" @click="push('/oa/plan/list')">
        更多
      </ElButton>
    </template>
    <div v-if="loadError" class="mb-3 text-[13px] text-destructive">
      加载失败，
      <ElButton link type="primary" @click="getList">重新加载</ElButton>
    </div>
    <ElTable :data="list" :show-overflow-tooltip="true">
      <ElTableColumn align="center" label="类型" width="100">
        <template #default="{ row }">
          <DictTag :type="DICT_TYPE.OA_PLAN_TYPE" :value="row.type" />
        </template>
      </ElTableColumn>
      <ElTableColumn label="计划标题" min-width="260">
        <template #default="{ row }">
          <ElButton link type="primary" @click="push('/oa/plan/list')">
            {{ row.title }}
          </ElButton>
        </template>
      </ElTableColumn>
      <ElTableColumn align="center" label="状态" width="100">
        <template #default="{ row }">
          <DictTag :type="DICT_TYPE.OA_PLAN_STATUS" :value="row.status" />
        </template>
      </ElTableColumn>
      <ElTableColumn align="center" label="结束时间" width="170">
        <template #default="{ row }">
          {{ formatDateTime(row.endTime) }}
        </template>
      </ElTableColumn>
    </ElTable>
  </OaHomePanel>
</template>
