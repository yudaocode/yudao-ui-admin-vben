<script lang="ts" setup>
import type { OaReimbursementApi } from '#/api/oa/reimbursement';

import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { BpmProcessInstanceStatus, DICT_TYPE } from '@vben/constants';
import { getFileNameFromUrl, openWindow } from '@vben/utils';

import { ElButton, ElTag } from 'element-plus';

import { getReimbursement } from '#/api/oa/reimbursement';
import { useDescription } from '#/components/description';
import { DictTag } from '#/components/dict-tag';
import { UserSelect } from '#/views/system/user/components';

import { useDetailSchema } from '../data';
import ItemForm from '../modules/item-form.vue';

defineOptions({ name: 'OaReimbursementDetail' });

const props = defineProps<{ id?: number | string }>(); // 费用报销编号，BPM 通过业务编号传入
const route = useRoute(); // 路由参数
const detailLoading = ref(false); // 详情的加载中
const detailData = ref<OaReimbursementApi.Reimbursement>(); // 详情数据

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
    detailData.value = await getReimbursement(Number(id));
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
      <template #witnessUserId="{ data }">
        <UserSelect :model-value="data?.witnessUserId" disabled />
      </template>
      <template #fileUrls="{ data }">
        <div v-if="data?.fileUrls?.length" class="flex flex-col items-start">
          <ElButton
            v-for="url in data.fileUrls"
            :key="url"
            link
            type="primary"
            class="!h-auto !px-0"
            @click="openWindow(url)"
          >
            {{ getFileNameFromUrl(url) }}
          </ElButton>
        </div>
        <span v-else>-</span>
      </template>
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
    <!-- 报销费用明细 -->
    <ItemForm class="mt-4" :model-value="detailData?.items ?? []" disabled />
    <div class="mt-3 text-right">
      票据合计：{{ detailData?.invoiceCount }} 张；金额合计：{{
        detailData?.totalPrice
      }}
      元
    </div>
  </div>
</template>
