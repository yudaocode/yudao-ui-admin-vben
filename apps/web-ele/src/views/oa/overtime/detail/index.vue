<script lang="ts" setup>
import type { OaOvertimeApi } from '#/api/oa/overtime';

import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { BpmProcessInstanceStatus, DICT_TYPE } from '@vben/constants';

import { ElTag } from 'element-plus';

import { getOvertimeApply } from '#/api/oa/overtime';
import { useDescription } from '#/components/description';
import { DictTag } from '#/components/dict-tag';

import { useDetailSchema } from '../data';

defineOptions({ name: 'OaOvertimeApplyDetail' });

const props = defineProps<{ id?: number | string }>(); // 加班申请编号，BPM 通过业务编号传入
const route = useRoute(); // 路由参数
const detailLoading = ref(false); // 详情的加载中
const detailData = ref<OaOvertimeApi.OvertimeApply>(); // 详情数据

const [Descriptions] = useDescription({
  border: true,
  column: 2,
  schema: useDetailSchema(),
});

/** 查询详情 */
async function getInfo() {
  const id = props.id || route.params.id || route.query.id;
  if (!id) {
    return;
  }
  detailLoading.value = true;
  try {
    detailData.value = await getOvertimeApply(Number(id));
  } finally {
    detailLoading.value = false;
  }
}

/** 初始化及切换申请 */
watch(
  () => props.id || route.params.id || route.query.id,
  () => {
    getInfo();
  },
  { immediate: true },
);
</script>

<template>
  <div v-loading="detailLoading">
    <Descriptions :data="detailData">
      <template #reason="{ data }">
        <span class="whitespace-pre-wrap break-words">{{ data?.reason }}</span>
      </template>
      <template #status="{ data }">
        <ElTag
          v-if="data?.status === BpmProcessInstanceStatus.NOT_START"
          type="info"
        >
          未提交
        </ElTag>
        <DictTag
          v-else
          :type="DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS"
          :value="data?.status ?? ''"
        />
      </template>
    </Descriptions>
  </div>
</template>
