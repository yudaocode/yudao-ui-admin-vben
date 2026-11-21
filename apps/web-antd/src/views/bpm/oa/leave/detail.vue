<script lang="ts" setup>
import type { BpmOALeaveApi } from '#/api/bpm/oa/leave';

import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

import { ContentWrap } from '@vben/common-ui';
import { parseId } from '@vben/utils';

import { Button, Spin } from 'ant-design-vue';

import { getLeave } from '#/api/bpm/oa/leave';
import { useDescription } from '#/components/description';
import { router } from '#/router';

import { useDetailFormSchema } from './data';

const props = defineProps<{
  id: string;
}>();

const { query } = useRoute();

const loading = ref(false);
const formData = ref<BpmOALeaveApi.Leave>();
const queryId = computed(() => query.id as string);

const handleUpdate = () => {
  router.push({ name: 'OALeaveCreate', query: { id: props.id || queryId.value, type: 'update' } });
};

const [Descriptions] = useDescription({
  bordered: true,
  column: 1,
  class: 'mx-4',
  schema: useDetailFormSchema(),
});

/** 获取详情数据 */
async function getDetailData() {
  try {
    loading.value = true;
    formData.value = await getLeave(
      parseId(props.id || queryId.value) as number,
    );
  } finally {
    loading.value = false;
  }
}

/** 初始化 */
onMounted(() => {
  getDetailData();
});
</script>

<template>
  <ContentWrap class="m-2">
    <div class="mb-4 flex justify-end">
      <Button type="primary" @click="handleUpdate">编辑</Button>
    </div>
    <Spin :spinning="loading" tip="加载中...">
      <Descriptions :data="formData" />
    </Spin>
  </ContentWrap>
</template>
