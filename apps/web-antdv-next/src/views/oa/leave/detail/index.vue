<script lang="ts" setup>
import type { OaLeaveApi } from '#/api/oa/leave';

import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { BpmProcessInstanceStatus, DICT_TYPE } from '@vben/constants';

import { Spin, Tag } from 'antdv-next';

import { getLeaveApply } from '#/api/oa/leave';
import { useDescription } from '#/components/description';
import { DictTag } from '#/components/dict-tag';
import { FileUpload } from '#/components/upload';

import { useDetailSchema } from '../data';

defineOptions({ name: 'OaLeaveApplyDetail' });

const props = defineProps<{ id?: number | string }>(); // 请假申请编号，BPM 通过业务编号传入

const route = useRoute(); // 路由参数
const detailLoading = ref(false); // 详情的加载中
const detailData = ref<OaLeaveApi.LeaveApply>(); // 详情数据

const [Descriptions] = useDescription({
  bordered: true,
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
    detailData.value = await getLeaveApply(Number(id));
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
  <Spin :spinning="detailLoading">
    <Descriptions :data="detailData">
      <template #reason="{ data }">
        <span class="whitespace-pre-wrap break-words">
          {{ data?.reason || '-' }}
        </span>
      </template>
      <template #fileUrls="{ data }">
        <FileUpload
          :model-value="data?.fileUrls || []"
          disabled
          :show-description="false"
        />
      </template>
      <template #status="{ data }">
        <Tag v-if="data?.status === BpmProcessInstanceStatus.NOT_START">
          未提交
        </Tag>
        <DictTag
          v-else
          :type="DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS"
          :value="data?.status ?? ''"
        />
      </template>
    </Descriptions>
  </Spin>
</template>
