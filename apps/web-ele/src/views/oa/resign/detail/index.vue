<script lang="ts" setup>
import type { OaResignApplyApi } from '#/api/oa/resign';

import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { BpmProcessInstanceStatus, DICT_TYPE } from '@vben/constants';

import { ElTag } from 'element-plus';

import { getResignApply } from '#/api/oa/resign';
import { useDescription } from '#/components/description';
import { DictTag } from '#/components/dict-tag';
import { UserSelect } from '#/views/system/user/components';

import { useDetailSchema } from '../data';

defineOptions({ name: 'OaResignApplyDetail' });

const props = defineProps<{ id?: number | string }>(); // 离职申请编号，BPM 通过业务编号传入

const route = useRoute(); // 路由参数
const detailLoading = ref(false); // 详情的加载中
const detailData = ref<OaResignApplyApi.ResignApply>(); // 详情数据

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
    detailData.value = await getResignApply(Number(id));
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
      <template #handoverUserId="{ data }">
        <UserSelect :model-value="data?.handoverUserId" disabled />
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
          :value="data?.status"
        />
      </template>
    </Descriptions>
  </div>
</template>
