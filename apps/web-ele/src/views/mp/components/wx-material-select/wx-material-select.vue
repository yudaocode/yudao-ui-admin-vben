<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MpMaterialApi } from '#/api/mp/material';

import { reactive, ref, watch } from 'vue';

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

const loading = ref(false); // 遮罩层
const total = ref(0); // 总条数
const list = ref<any[]>([]); // 数据列表
const queryParams = reactive({
  accountId: props.accountId,
  pageNo: 1,
  pageSize: 10,
}); // 查询参数

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
          const finalAccountId = accountId ?? queryParams.accountId;
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
          const finalAccountId = accountId ?? queryParams.accountId;
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

function selectMaterialFun(item: any) {
  emit('selectMaterial', item);
}

async function getMaterialPageFun() {
  const data = await getMaterialPage({
    ...queryParams,
    type: props.type,
  });
  list.value = data.list;
  total.value = data.total;
}

async function getFreePublishPageFun() {
  const data = await getFreePublishPage(queryParams);
  data.list.forEach((item: any) => {
    const articles = item.content.newsItem;
    articles.forEach((article: any) => {
      article.picUrl = article.thumbUrl;
    });
  });
  list.value = data.list;
  total.value = data.total;
}

async function getDraftPageFun() {
  const data = await getDraftPage(queryParams);
  data.list.forEach((draft: any) => {
    const articles = draft.content.newsItem;
    articles.forEach((article: any) => {
      article.picUrl = article.thumbUrl;
    });
  });
  list.value = data.list;
  total.value = data.total;
}

async function getPage() {
  if (props.type === 'voice') {
    await voiceGridApi.reload({ accountId: queryParams.accountId });
    return;
  }
  if (props.type === 'video') {
    await videoGridApi.reload({ accountId: queryParams.accountId });
    return;
  }

  loading.value = true;
  try {
    if (props.type === 'news' && props.newsType === NewsType.Published) {
      await getFreePublishPageFun();
    } else if (props.type === 'news' && props.newsType === NewsType.Draft) {
      await getDraftPageFun();
    } else {
      await getMaterialPageFun();
    }
  } finally {
    loading.value = false;
  }
}

watch(
  () => props.accountId,
  (accountId) => {
    queryParams.accountId = accountId;
    queryParams.pageNo = 1;
    getPage();
  },
  { immediate: true },
);

watch(
  () => props.type,
  () => {
    queryParams.pageNo = 1;
    getPage();
  },
);

watch(
  () => props.newsType,
  () => {
    if (props.type === 'news') {
      queryParams.pageNo = 1;
      getPage();
    }
  },
);
</script>

<template>
  <div class="pb-30px">
    <!-- 类型：image -->
    <div v-if="props.type === 'image'">
      <div
        class="mx-auto w-full columns-1 [column-gap:10px] md:columns-2 lg:columns-3 xl:columns-4 2xl:columns-5"
        v-loading="loading"
      >
        <div
          class="mb-2.5 break-inside-avoid border border-[#eaeaea] p-2.5"
          v-for="item in list"
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
        :total="total"
        v-model:current-page="queryParams.pageNo"
        v-model:page-size="queryParams.pageSize"
        @current-change="getMaterialPageFun"
        @size-change="getMaterialPageFun"
      />
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
    <div v-else-if="props.type === 'news'">
      <div
        class="mx-auto w-full columns-1 [column-gap:10px] md:columns-2 lg:columns-3 xl:columns-4 2xl:columns-5"
        v-loading="loading"
      >
        <div
          class="mb-2.5 break-inside-avoid border border-[#eaeaea] p-2.5"
          v-for="item in list"
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
        :total="total"
        v-model:current-page="queryParams.pageNo"
        v-model:page-size="queryParams.pageSize"
        @current-change="getMaterialPageFun"
        @size-change="getMaterialPageFun"
      />
    </div>
  </div>
</template>
