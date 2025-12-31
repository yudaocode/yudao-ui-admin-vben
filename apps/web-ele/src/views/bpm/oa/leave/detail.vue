<script lang="ts" setup>
import type { BpmOALeaveApi } from '#/api/bpm/oa/leave';

import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

import { ContentWrap } from '@vben/common-ui';

import { getLeave } from '#/api/bpm/oa/leave';
import { useDescription } from '#/components/description';

import { useDetailFormSchema } from './data';

const props = defineProps<{
  id: string;
}>();

const { query } = useRoute();

const loading = ref(false);
const formData = ref<BpmOALeaveApi.Leave>();
const queryId = computed(() => query.id as string);

const [Descriptions] = useDescription({
  border: true,
  column: 1,
  schema: useDetailFormSchema(),
});

/** 获取详情数据 */
async function getDetailData() {
  try {
    loading.value = true;
    formData.value = await getLeave(Number(props.id || queryId.value));
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
  <ContentWrap class="m-2" v-loading="loading" element-loading-text="加载中...">
    <Descriptions :data="formData" class="mx-4" />
  </ContentWrap>
</template>
