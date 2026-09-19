<script lang="ts" setup>
import type { OaSealApplyApi } from '#/api/oa/seal/apply';

import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { BpmProcessInstanceStatus, DICT_TYPE } from '@vben/constants';

import { ElTag } from 'element-plus';

import { getSealApply } from '#/api/oa/seal/apply';
import { useDescription } from '#/components/description';
import { DictTag } from '#/components/dict-tag';
import { FileUpload } from '#/components/upload';

import { useDetailSchema } from '../data';

defineOptions({ name: 'OaSealApplyDetail' });

const props = defineProps<{ id?: number | string }>(); // 用印申请编号，BPM 通过业务编号传入

const route = useRoute();
const detailLoading = ref(false); // 详情的加载中
const detailData = ref<OaSealApplyApi.SealApply>(); // 详情数据

const [Descriptions] = useDescription({
  border: true,
  column: 2,
  schema: useDetailSchema(),
});

/** 查询详情 */
async function getInfo() {
  // 获取弹窗或 BPM 传入的业务编号，兼容路由查询参数
  const id = Number(props.id || route.query.id);
  if (!id) {
    return;
  }
  detailLoading.value = true;
  try {
    detailData.value = await getSealApply(id);
  } finally {
    detailLoading.value = false;
  }
}

/** 初始化及切换申请 */
watch(
  () => props.id,
  () => {
    getInfo();
  },
  { immediate: true },
);
</script>

<template>
  <div v-loading="detailLoading">
    <Descriptions :data="detailData">
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
      <template #fileUrls="{ data }">
        <FileUpload
          :model-value="data?.fileUrls || []"
          disabled
          :show-description="false"
        />
      </template>
    </Descriptions>
  </div>
</template>
