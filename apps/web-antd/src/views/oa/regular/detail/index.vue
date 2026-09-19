<script lang="ts" setup>
import type { OaRegularApplyApi } from '#/api/oa/regular';

import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { BpmProcessInstanceStatus, DICT_TYPE } from '@vben/constants';

import { Spin, Tag } from 'ant-design-vue';

import { getRegularApply } from '#/api/oa/regular';
import { useDescription } from '#/components/description';
import { DictTag } from '#/components/dict-tag';

import { useDetailSchema } from '../data';

defineOptions({ name: 'OaRegularApplyDetail' });

const props = defineProps<{ id?: number | string }>(); // 转正申请编号，BPM 通过业务编号传入

const route = useRoute(); // 路由参数
const detailLoading = ref(false); // 详情的加载中
const detailData = ref<OaRegularApplyApi.RegularApply>(); // 详情数据

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
    detailData.value = await getRegularApply(Number(id));
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
      <template #experience="{ data }">
        <span class="whitespace-pre-wrap break-words">
          {{ data?.experience }}
        </span>
      </template>
      <template #understanding="{ data }">
        <span class="whitespace-pre-wrap break-words">
          {{ data?.understanding }}
        </span>
      </template>
      <template #growth="{ data }">
        <span class="whitespace-pre-wrap break-words">{{ data?.growth }}</span>
      </template>
      <template #deficiency="{ data }">
        <span class="whitespace-pre-wrap break-words">
          {{ data?.deficiency }}
        </span>
      </template>
      <template #improvement="{ data }">
        <span class="whitespace-pre-wrap break-words">
          {{ data?.improvement }}
        </span>
      </template>
      <template #suggestion="{ data }">
        <span class="whitespace-pre-wrap break-words">
          {{ data?.suggestion }}
        </span>
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
