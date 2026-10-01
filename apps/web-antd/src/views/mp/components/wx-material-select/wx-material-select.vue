<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MpMaterialApi } from '#/api/mp/material';

import { ref, watch } from 'vue';

import { Page } from '@vben/common-ui';
import { NewsType } from '@vben/constants';
import { IconifyIcon } from '@vben/icons';

import { Button, Pagination, Row, Spin } from 'ant-design-vue';

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

const imageList = ref<MpMaterialApi.Material[]>([]);
const imageLoading = ref(false);
const imageTotal = ref(0);
const imageCurrentPage = ref(1);
const imagePageSize = ref(10);

/** 加载图片素材 */
async function loadImageList() {
  if (!props.accountId) {
    imageList.value = [];
    imageTotal.value = 0;
    return;
  }
  imageLoading.value = true;
  try {
    const data = await getMaterialPage({
      pageNo: imageCurrentPage.value,
      pageSize: imagePageSize.value,
      accountId: props.accountId,
      type: 'image',
    });
    imageList.value = data.list ?? [];
    imageTotal.value = data.total ?? 0;
  } finally {
    imageLoading.value = false;
  }
}

/** 重新加载图片素材 */
function reloadImageList() {
  if (imageCurrentPage.value === 1) {
    loadImageList();
  } else {
    imageCurrentPage.value = 1;
  }
}

watch([imageCurrentPage, imagePageSize], () => loadImageList());

const newsList = ref<any[]>([]);
const newsLoading = ref(false);
const newsTotal = ref(0);
const newsCurrentPage = ref(1);
const newsPageSize = ref(10);

/** 加载图文素材 */
async function loadNewsList() {
  if (!props.accountId) {
    newsList.value = [];
    newsTotal.value = 0;
    return;
  }
  newsLoading.value = true;
  try {
    const params = {
      accountId: props.accountId,
      pageNo: newsCurrentPage.value,
      pageSize: newsPageSize.value,
    };
    const data =
      props.newsType === NewsType.Published
        ? await getFreePublishPage(params)
        : await getDraftPage(params);
    data.list?.forEach((item: any) => {
      item.content?.newsItem?.forEach((article: any) => {
        article.picUrl = article.thumbUrl;
      });
    });
    newsList.value = data.list ?? [];
    newsTotal.value = data.total ?? 0;
  } finally {
    newsLoading.value = false;
  }
}

/** 重新加载图文素材 */
function reloadNewsList() {
  if (newsCurrentPage.value === 1) {
    loadNewsList();
  } else {
    newsCurrentPage.value = 1;
  }
}

watch([newsCurrentPage, newsPageSize], () => loadNewsList());

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

function selectMaterialFun(item: any) {
  emit('selectMaterial', item);
}

// 监听 accountId 变化
watch(
  () => props.accountId,
  (accountId) => {
    switch (props.type) {
      case 'image': {
        reloadImageList();
        break;
      }
      case 'news': {
        reloadNewsList();
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
        reloadImageList();
        break;
      }
      case 'news': {
        reloadNewsList();
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
      reloadNewsList();
    }
  },
);
</script>

<template>
  <Page :bordered="false" class="pb-8">
    <!-- 类型：image -->
    <template v-if="props.type === 'image'">
      <div class="image-grid-wrapper">
        <div>
          <Spin :spinning="imageLoading">
            <div
              class="mx-auto w-full columns-1 [column-gap:10px] md:columns-2 lg:columns-3 xl:columns-4 2xl:columns-5"
            >
              <div
                v-for="item in imageList"
                :key="item.mediaId"
                class="mb-2.5 h-72 break-inside-avoid border border-[#eaeaea] p-2.5"
              >
                <img
                  class="h-48 w-full object-contain"
                  :src="item.url"
                  alt="素材图片"
                />
                <p class="truncate text-center text-xs leading-[30px]">
                  {{ item.name }}
                </p>
                <Row class="flex justify-center pt-2.5">
                  <Button type="primary" @click="selectMaterialFun(item)">
                    选择
                    <template #icon>
                      <IconifyIcon icon="lucide:circle-check" />
                    </template>
                  </Button>
                </Row>
              </div>
            </div>
          </Spin>
          <Pagination
            v-model:current="imageCurrentPage"
            v-model:page-size="imagePageSize"
            :total="imageTotal"
            class="mt-4"
            show-size-changer
          />
        </div>
      </div>
    </template>

    <!-- 类型：voice -->
    <template v-else-if="props.type === 'voice'">
      <VoiceGrid>
        <template #voice="{ row }">
          <WxVoicePlayer :url="row.url" />
        </template>
        <template #actions="{ row }">
          <Button type="link" @click="selectMaterialFun(row)">
            选择
            <template #icon>
              <IconifyIcon icon="lucide:plus" />
            </template>
          </Button>
        </template>
      </VoiceGrid>
    </template>

    <!-- 类型：video -->
    <template v-else-if="props.type === 'video'">
      <VideoGrid>
        <template #video="{ row }">
          <WxVideoPlayer :url="row.url" />
        </template>
        <template #actions="{ row }">
          <Button type="link" @click="selectMaterialFun(row)">
            选择
            <template #icon>
              <IconifyIcon icon="lucide:circle-plus" />
            </template>
          </Button>
        </template>
      </VideoGrid>
    </template>

    <!-- 类型：news -->
    <template v-else-if="props.type === 'news'">
      <div class="news-grid-wrapper">
        <div>
          <Spin :spinning="newsLoading">
            <div
              class="mx-auto w-full columns-1 [column-gap:10px] md:columns-2 lg:columns-3 xl:columns-4 2xl:columns-5"
            >
              <div
                v-for="item in newsList"
                :key="item.mediaId"
                class="mb-2.5 break-inside-avoid border border-[#eaeaea] p-2.5"
              >
                <div v-if="item.content && item.content.newsItem">
                  <WxNews :articles="item.content.newsItem" />
                  <Row class="flex justify-center pt-2.5">
                    <Button type="primary" @click="selectMaterialFun(item)">
                      选择
                      <template #icon>
                        <IconifyIcon icon="lucide:circle-check" />
                      </template>
                    </Button>
                  </Row>
                </div>
              </div>
            </div>
          </Spin>
          <Pagination
            v-model:current="newsCurrentPage"
            v-model:page-size="newsPageSize"
            :total="newsTotal"
            class="mt-4"
            show-size-changer
          />
        </div>
      </div>
    </template>
  </Page>
</template>

<style scoped>
.image-grid-wrapper :deep(.vxe-grid--body-wrapper) {
  display: none;
}

.news-grid-wrapper :deep(.vxe-grid--body-wrapper) {
  display: none;
}
</style>
