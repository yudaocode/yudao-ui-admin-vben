<script lang="ts" setup>
import type { AiDramaProjectApi } from '#/api/ai/drama/project';

import { onMounted, reactive, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import {
  ElCard,
  ElEmpty,
  ElInput,
  ElOption,
  ElPagination,
  ElSelect,
} from 'element-plus';

import { getDramaProjectPublicPage } from '#/api/ai/drama/project';
import {
  DRAMA_ASPECT_RATIOS,
  DRAMA_DURATION_TYPES,
  formatDramaDuration,
} from '#/views/ai/utils/drama';

import PublicDetail from './public-detail.vue';

/** AI 短剧：公开广场，展示管理员公开的成片 */
defineOptions({ name: 'AiDramaPublicList' });

const [DetailModal, detailModalApi] = useVbenModal({
  connectedComponent: PublicDetail,
  destroyOnClose: true,
});

const loading = ref(false); // 列表的加载中
const list = ref<AiDramaProjectApi.Public[]>([]); // 列表的数据
const total = ref(0); // 列表的总数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 12,
  keyword: undefined as string | undefined,
  aspectRatio: undefined as string | undefined,
  durationType: undefined as number | undefined,
});

/** 查询列表 */
async function getList() {
  loading.value = true;
  try {
    const data = await getDramaProjectPublicPage(queryParams);
    list.value = data.list;
    total.value = data.total;
  } finally {
    loading.value = false;
  }
}
defineExpose({ getList });

/** 搜索：回到第一页 */
function handleQuery() {
  queryParams.pageNo = 1;
  getList();
}

/** 查看详情 */
function handleDetail(item: AiDramaProjectApi.Public) {
  detailModalApi.setData({ id: item.id }).open();
}

/** 初始化 */
onMounted(() => {
  getList();
});
</script>

<template>
  <div class="bg-card flex h-full flex-col rounded-md p-4">
    <DetailModal />
    <div class="mb-3.5 flex flex-wrap items-center gap-2">
      <ElInput
        v-model="queryParams.keyword"
        placeholder="搜索名称、画风"
        clearable
        class="!w-[200px]"
        @keyup.enter="handleQuery"
        @clear="handleQuery"
      >
        <template #prefix>
          <IconifyIcon icon="lucide:search" />
        </template>
      </ElInput>
      <ElSelect
        v-model="queryParams.aspectRatio"
        placeholder="全部画幅"
        clearable
        class="!w-[130px]"
        @change="handleQuery"
      >
        <ElOption
          v-for="item in DRAMA_ASPECT_RATIOS"
          :key="item"
          :label="item"
          :value="item"
        />
      </ElSelect>
      <ElSelect
        v-model="queryParams.durationType"
        placeholder="全部时长"
        clearable
        class="!w-[130px]"
        @change="handleQuery"
      >
        <ElOption
          v-for="item in DRAMA_DURATION_TYPES"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </ElSelect>
    </div>
    <div class="min-h-0 flex-1 overflow-auto">
      <div v-loading="loading" class="min-h-[200px]">
        <div>
          <ElEmpty
            v-if="!loading && list.length === 0"
            description="暂无公开的短剧"
            class="pt-10"
          />
          <div
            class="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4"
          >
            <ElCard
              v-for="item in list"
              :key="item.id"
              shadow="hover"
              :body-style="{ padding: 0 }"
              class="cursor-pointer"
              @click="handleDetail(item)"
            >
              <div class="relative aspect-[3/4] overflow-hidden bg-black">
                <video
                  :src="item.composeFileUrl"
                  preload="metadata"
                  muted
                  class="size-full object-contain"
                ></video>
                <span
                  class="absolute bottom-1.5 right-1.5 rounded bg-black/60 px-1.5 text-xs text-white"
                >
                  {{ formatDramaDuration(item.composeDuration) }}
                </span>
              </div>
              <div class="p-2.5">
                <div class="truncate font-medium">{{ item.name }}</div>
                <div class="mt-1 flex justify-between text-xs text-gray-500">
                  <span class="truncate">{{ item.userNickname || '-' }}</span>
                  <span v-if="item.aspectRatio">{{ item.aspectRatio }}</span>
                </div>
              </div>
            </ElCard>
          </div>
        </div>
      </div>
    </div>
    <div class="flex flex-shrink-0 justify-end pt-3">
      <ElPagination
        v-model:current-page="queryParams.pageNo"
        v-model:page-size="queryParams.pageSize"
        :page-sizes="[12, 24, 48]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="getList"
        @current-change="getList"
      />
    </div>
  </div>
</template>
