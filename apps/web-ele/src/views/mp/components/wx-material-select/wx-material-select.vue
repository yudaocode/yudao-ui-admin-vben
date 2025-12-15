<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MpMaterialApi } from '#/api/mp/material';

import { computed, watch } from 'vue';

import { NewsType } from '@vben/constants';
import { IconifyIcon } from '@vben/icons';

import { ElButton, ElPagination, ElRow } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getDraftPage } from '#/api/mp/draft';
import { getFreePublishPage } from '#/api/mp/freePublish';
import { getMaterialPage } from '#/api/mp/material';
import { WxNews, WxVideoPlayer, WxVoicePlayer } from '#/views/mp/components';

/** 微信素材选择 */
defineOptions({ name: 'WxMaterialSelect' });

const props = withDefaults(
  defineProps<{
    accountId: number;
    newsType?: NewsType;
    type: string;
  }>(),
  {
    newsType: NewsType.Published,
  },
);

const emit = defineEmits<{
  (e: 'selectMaterial', item: any): void;
}>();

const voiceGridColumns: VxeTableGridOptions<MpMaterialApi.Material>['columns'] =
  [
    {
      field: 'mediaId',
      title: '编号',
      align: 'center',
      minWidth: 160,
    },
    {
      field: 'name',
      title: '文件名',
      minWidth: 200,
    },
    {
      field: 'voice',
      title: '语音',
      minWidth: 200,
      align: 'center',
      slots: { default: 'voice' },
    },
    {
      field: 'createTime',
      title: '上传时间',
      width: 180,
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      width: 140,
      fixed: 'right',
      align: 'center',
      slots: { default: 'actions' },
    },
  ];

const videoGridColumns: VxeTableGridOptions<MpMaterialApi.Material>['columns'] =
  [
    {
      field: 'mediaId',
      title: '编号',
      minWidth: 160,
    },
    {
      field: 'name',
      title: '文件名',
      minWidth: 200,
    },
    {
      field: 'title',
      title: '标题',
      minWidth: 200,
    },
    {
      field: 'introduction',
      title: '介绍',
      minWidth: 220,
    },
    {
      field: 'video',
      title: '视频',
      minWidth: 220,
      align: 'center',
      slots: { default: 'video' },
    },
    {
      field: 'createTime',
      title: '上传时间',
      width: 180,
      formatter: 'formatDateTime',
    },
    {
      title: '操作',
      width: 140,
      fixed: 'right',
      align: 'center',
      slots: { default: 'actions' },
    },
  ];

// Image Grid
const [ImageGrid, imageGridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: [],
    height: 'auto',
    keepSource: true,
    pagerConfig: {
      enabled: false,
    },
    proxyConfig: {
      ajax: {
        query: async ({ page }, { accountId }) => {
          const finalAccountId = accountId ?? props.accountId;
          if (!finalAccountId) {
            return { list: [], total: 0 };
          }
          return await getMaterialPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            accountId: finalAccountId,
            type: 'image',
          });
        },
      },
      autoLoad: false,
    },
    rowConfig: {
      keyField: 'mediaId',
      isHover: true,
    },
    toolbarConfig: {
      enabled: false,
    },
  } as VxeTableGridOptions<MpMaterialApi.Material>,
});

// News Grid
const [NewsGrid, newsGridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: [],
    height: 'auto',
    keepSource: true,
    pagerConfig: {
      enabled: false,
    },
    proxyConfig: {
      ajax: {
        query: async ({ page }, { accountId }) => {
          const finalAccountId = accountId ?? props.accountId;
          if (!finalAccountId) {
            return { list: [], total: 0 };
          }
          if (props.newsType === NewsType.Published) {
            const data = await getFreePublishPage({
              accountId: finalAccountId,
              pageNo: page.currentPage,
              pageSize: page.pageSize,
            });
            data.list.forEach((item: any) => {
              const articles = item.content.newsItem;
              articles.forEach((article: any) => {
                article.picUrl = article.thumbUrl;
              });
            });
            return data;
          } else {
            const data = await getDraftPage({
              accountId: finalAccountId,
              pageNo: page.currentPage,
              pageSize: page.pageSize,
            });
            data.list.forEach((draft: any) => {
              const articles = draft.content.newsItem;
              articles.forEach((article: any) => {
                article.picUrl = article.thumbUrl;
              });
            });
            return data;
          }
        },
      },
      autoLoad: false,
    },
    rowConfig: {
      keyField: 'mediaId',
      isHover: true,
    },
    toolbarConfig: {
      enabled: false,
    },
  } as VxeTableGridOptions<any>,
});

const [VoiceGrid, voiceGridApi] = useVbenVxeGrid({
  gridOptions: {
    border: true,
    columns: voiceGridColumns,
    height: 'auto',
    keepSource: true,
    pagerConfig: {
      enabled: true,
      pageSize: 10,
    },
    proxyConfig: {
      ajax: {
        query: async ({ page }, { accountId }) => {
          const finalAccountId = accountId ?? props.accountId;
          if (!finalAccountId) {
            return { list: [], total: 0 };
          }
          return await getMaterialPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            accountId: finalAccountId,
            type: 'voice',
          });
        },
      },
    },
    rowConfig: {
      keyField: 'mediaId',
      isHover: true,
    },
    toolbarConfig: {
      refresh: true,
    },
  } as VxeTableGridOptions<MpMaterialApi.Material>,
});

const [VideoGrid, videoGridApi] = useVbenVxeGrid({
  gridOptions: {
    border: true,
    columns: videoGridColumns,
    height: 'auto',
    keepSource: true,
    pagerConfig: {
      enabled: true,
      pageSize: 10,
    },
    proxyConfig: {
      ajax: {
        query: async ({ page }, { accountId }) => {
          const finalAccountId = accountId ?? props.accountId;
          if (finalAccountId === undefined || finalAccountId === null) {
            return { list: [], total: 0 };
          }
          return await getMaterialPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            accountId: finalAccountId,
            type: 'video',
          });
        },
      },
    },
    rowConfig: {
      keyField: 'mediaId',
      isHover: true,
    },
    toolbarConfig: {
      refresh: true,
    },
  } as VxeTableGridOptions<MpMaterialApi.Material>,
});

// 从 Grid 获取数据
const imageList = computed(() => {
  try {
    const tableData = imageGridApi.grid?.getTableData();
    return (tableData?.tableData as MpMaterialApi.Material[]) || [];
  } catch {
    return [];
  }
});

const imageLoading = computed(() => {
  return imageGridApi.grid?.loading || false;
});

const imageTotal = computed(() => {
  try {
    const proxyInfo = imageGridApi.grid?.getProxyInfo();
    return proxyInfo?.pager?.total || 0;
  } catch {
    return 0;
  }
});

const imageCurrentPage = computed({
  get: () => {
    try {
      return imageGridApi.grid?.pagerConfig?.currentPage || 1;
    } catch {
      return 1;
    }
  },
  set: (value: number) => {
    imageGridApi.grid?.commitProxy('page', { currentPage: value });
  },
});

const imagePageSize = computed({
  get: () => {
    try {
      return imageGridApi.grid?.pagerConfig?.pageSize || 10;
    } catch {
      return 10;
    }
  },
  set: (value: number) => {
    imageGridApi.grid?.commitProxy('page', { pageSize: value, currentPage: 1 });
  },
});

const newsList = computed(() => {
  try {
    const tableData = newsGridApi.grid?.getTableData();
    return (tableData?.tableData as any[]) || [];
  } catch {
    return [];
  }
});

const newsLoading = computed(() => {
  return newsGridApi.grid?.loading || false;
});

const newsTotal = computed(() => {
  try {
    const proxyInfo = newsGridApi.grid?.getProxyInfo();
    return proxyInfo?.pager?.total || 0;
  } catch {
    return 0;
  }
});

const newsCurrentPage = computed({
  get: () => {
    try {
      return newsGridApi.grid?.pagerConfig?.currentPage || 1;
    } catch {
      return 1;
    }
  },
  set: (value: number) => {
    newsGridApi.grid?.commitProxy('page', { currentPage: value });
  },
});

const newsPageSize = computed({
  get: () => {
    try {
      return newsGridApi.grid?.pagerConfig?.pageSize || 10;
    } catch {
      return 10;
    }
  },
  set: (value: number) => {
    newsGridApi.grid?.commitProxy('page', { pageSize: value, currentPage: 1 });
  },
});

function selectMaterialFun(item: any) {
  emit('selectMaterial', item);
}

// 监听 accountId 变化
watch(
  () => props.accountId,
  (accountId) => {
    switch (props.type) {
      case 'image': {
        imageGridApi.reload({ accountId });
        break;
      }
      case 'news': {
        newsGridApi.reload({ accountId });
        break;
      }
      case 'video': {
        videoGridApi.reload({ accountId });
        break;
      }
      case 'voice': {
        voiceGridApi.reload({ accountId });
        break;
      }
    }
  },
  { immediate: true },
);

// 监听 type 变化
watch(
  () => props.type,
  () => {
    switch (props.type) {
      case 'image': {
        imageGridApi.reload({ accountId: props.accountId });
        break;
      }
      case 'news': {
        newsGridApi.reload({ accountId: props.accountId });
        break;
      }
      case 'video': {
        videoGridApi.reload({ accountId: props.accountId });
        break;
      }
      case 'voice': {
        voiceGridApi.reload({ accountId: props.accountId });
        break;
      }
    }
  },
);

// 监听 newsType 变化
watch(
  () => props.newsType,
  () => {
    if (props.type === 'news') {
      newsGridApi.reload({ accountId: props.accountId });
    }
  },
);
</script>

<template>
  <div class="pb-30px">
    <!-- 类型：image -->
    <div v-if="props.type === 'image'" class="image-grid-wrapper">
      <ImageGrid>
        <template #default>
          <div
            class="mx-auto w-full columns-1 [column-gap:10px] md:columns-2 lg:columns-3 xl:columns-4 2xl:columns-5"
            v-loading="imageLoading"
          >
            <div
              class="mb-2.5 break-inside-avoid border border-[#eaeaea] p-2.5"
              v-for="item in imageList"
              :key="item.mediaId"
            >
              <img class="w-full" :src="item.url" />
              <p class="truncate text-center text-xs leading-[30px]">
                {{ item.name }}
              </p>
              <ElRow class="flex justify-center pt-2.5">
                <ElButton type="success" @click="selectMaterialFun(item)">
                  选择
                  <IconifyIcon icon="lucide:circle-check" />
                </ElButton>
              </ElRow>
            </div>
          </div>
          <!-- 分页组件 -->
          <ElPagination
            background
            layout="prev, pager, next, sizes, total"
            :total="imageTotal"
            v-model:current-page="imageCurrentPage"
            v-model:page-size="imagePageSize"
            class="mt-4"
          />
        </template>
      </ImageGrid>
    </div>
    <!-- 类型：voice -->
    <div v-else-if="props.type === 'voice'">
      <VoiceGrid>
        <template #voice="{ row }">
          <WxVoicePlayer :url="row.url" />
        </template>
        <template #actions="{ row }">
          <ElButton type="primary" link @click="selectMaterialFun(row)">
            选择
            <IconifyIcon icon="lucide:plus" />
          </ElButton>
        </template>
      </VoiceGrid>
    </div>

    <!-- 类型：video -->
    <div v-else-if="props.type === 'video'">
      <VideoGrid>
        <template #video="{ row }">
          <WxVideoPlayer :url="row.url" />
        </template>
        <template #actions="{ row }">
          <ElButton type="primary" link @click="selectMaterialFun(row)">
            选择
            <IconifyIcon icon="lucide:circle-plus" />
          </ElButton>
        </template>
      </VideoGrid>
    </div>

    <!-- 类型：news -->
    <div v-else-if="props.type === 'news'" class="news-grid-wrapper">
      <NewsGrid>
        <template #default>
          <div
            class="mx-auto w-full columns-1 [column-gap:10px] md:columns-2 lg:columns-3 xl:columns-4 2xl:columns-5"
            v-loading="newsLoading"
          >
            <div
              class="mb-2.5 break-inside-avoid border border-[#eaeaea] p-2.5"
              v-for="item in newsList"
              :key="item.mediaId"
            >
              <div v-if="item.content && item.content.newsItem">
                <WxNews :articles="item.content.newsItem" />
                <ElRow class="flex justify-center pt-2.5">
                  <ElButton type="success" @click="selectMaterialFun(item)">
                    选择
                    <IconifyIcon icon="lucide:circle-check" />
                  </ElButton>
                </ElRow>
              </div>
            </div>
          </div>
          <!-- 分页组件 -->
          <ElPagination
            background
            layout="prev, pager, next, sizes, total"
            :total="newsTotal"
            v-model:current-page="newsCurrentPage"
            v-model:page-size="newsPageSize"
            class="mt-4"
          />
        </template>
      </NewsGrid>
    </div>
  </div>
</template>

<style scoped>
.image-grid-wrapper :deep(.vxe-grid--body-wrapper) {
  display: none;
}

.news-grid-wrapper :deep(.vxe-grid--body-wrapper) {
  display: none;
}
</style>
