<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { computed, onMounted, reactive, ref } from 'vue';

import { IconifyIcon } from '@vben/icons';
import { formatTime } from '@vben/utils';

import { Button, Pagination, Spin } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getDraftPage } from '#/api/mp/draft';
import { getFreePublishPage } from '#/api/mp/freePublish';
import { getMaterialPage } from '#/api/mp/material';
import { News, VideoPlayer, VoicePlayer } from '#/views/mp/modules/index';

import { NewsType } from './types';

defineOptions({ name: 'MaterialSelect' });

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

const emit = defineEmits(['selectMaterial']);

const loading = ref(false); // 遮罩层
const total = ref(0); // 总条数
const list = ref<any[]>([]); // 数据列表
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  accountId: props.accountId,
}); // 查询参数

/** 选择素材 */
function selectMaterialFun(item: any) {
  emit('selectMaterial', item);
}

/** 获取分页数据 */
async function getPage() {
  loading.value = true;
  try {
    if (props.type === 'news' && props.newsType === NewsType.Published) {
      // 【图文】+ 【已发布】
      await getFreePublishPageFun();
    } else if (props.type === 'news' && props.newsType === NewsType.Draft) {
      // 【图文】+ 【草稿】
      await getDraftPageFun();
    } else {
      // 【素材】
      await getMaterialPageFun();
    }
  } finally {
    loading.value = false;
  }
}

/** 获取素材分页 */
async function getMaterialPageFun() {
  const data = await getMaterialPage({
    ...queryParams,
    type: props.type,
  });
  list.value = data.list;
  total.value = data.total;
}

/** 获取已发布图文分页 */
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

/** 获取草稿图文分页 */
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

// 音频素材表格列
const voiceColumns = computed(() => [
  { field: 'mediaId', title: '编号', align: 'center' },
  { field: 'name', title: '文件名', align: 'center' },
  {
    field: 'url',
    title: '语音',
    align: 'center',
    slots: { default: 'voice' },
  },
  {
    field: 'createTime',
    title: '上传时间',
    align: 'center',
    width: 180,
    formatter: ({ cellValue }: any) =>
      formatTime(cellValue, 'YYYY-MM-DD HH:mm:ss'),
  },
  {
    field: 'actions',
    title: '操作',
    align: 'center',
    fixed: 'right',
    slots: { default: 'actions' },
  },
]);

// 视频素材表格列
const videoColumns = computed(() => [
  { field: 'mediaId', title: '编号', align: 'center' },
  { field: 'name', title: '文件名', align: 'center' },
  { field: 'title', title: '标题', align: 'center' },
  { field: 'introduction', title: '介绍', align: 'center' },
  {
    field: 'url',
    title: '视频',
    align: 'center',
    slots: { default: 'video' },
  },
  {
    field: 'createTime',
    title: '上传时间',
    align: 'center',
    width: 180,
    formatter: ({ cellValue }: any) =>
      formatTime(cellValue, 'YYYY-MM-DD HH:mm:ss'),
  },
  {
    field: 'actions',
    title: '操作',
    align: 'center',
    fixed: 'right',
    slots: { default: 'actions' },
  },
]);

// 语音表格
const [VoiceGrid] = useVbenVxeGrid({
  gridOptions: {
    columns: voiceColumns.value,
    border: true,
    pagerConfig: {
      enabled: true,
      currentPage: 1,
      pageSize: 10,
    },
    proxyConfig: {
      ajax: {
        query: async ({ page }) => {
          const data = await getMaterialPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            accountId: props.accountId,
            type: 'voice',
          });
          return data;
        },
      },
    },
    toolbarConfig: {
      refresh: true,
    },
  } as VxeTableGridOptions<any>,
});

// 视频表格
const [VideoGrid] = useVbenVxeGrid({
  gridOptions: {
    columns: videoColumns.value,
    border: true,
    pagerConfig: {
      enabled: true,
      currentPage: 1,
      pageSize: 10,
    },
    proxyConfig: {
      ajax: {
        query: async ({ page }) => {
          const data = await getMaterialPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            accountId: props.accountId,
            type: 'video',
          });
          return data;
        },
      },
    },
    toolbarConfig: {
      refresh: true,
    },
  } as VxeTableGridOptions<any>,
});

// 对于 image 和 news 类型，需要手动加载数据
onMounted(() => {
  if (props.type === 'image' || props.type === 'news') {
    getPage();
  }
});
</script>

<template>
  <div class="pb-8">
    <!-- 类型：image -->
    <div v-if="props.type === 'image'">
      <Spin :spinning="loading">
        <div
          class="columns-1 gap-2.5 md:columns-2 lg:columns-3 xl:columns-4 2xl:columns-5"
        >
          <div
            v-for="item in list"
            :key="item.mediaId"
            class="mb-2.5 break-inside-avoid rounded border border-gray-200 p-2.5 transition-shadow hover:shadow-md"
          >
            <img :src="item.url" :alt="item.name" class="w-full rounded" />
            <p class="my-2 truncate text-sm">{{ item.name }}</p>
            <div class="flex justify-center">
              <Button type="primary" @click="selectMaterialFun(item)">
                选择
                <IconifyIcon icon="lucide:circle-check" />
              </Button>
            </div>
          </div>
        </div>
      </Spin>
      <!-- 分页组件 -->
      <div class="mt-4 flex justify-end">
        <Pagination
          :total="total"
          v-model:current="queryParams.pageNo"
          v-model:page-size="queryParams.pageSize"
          @change="getMaterialPageFun"
        />
      </div>
    </div>

    <!-- 类型：voice -->
    <div v-else-if="props.type === 'voice'">
      <VoiceGrid>
        <template #voice="{ row }">
          <VoicePlayer :url="row.url" />
        </template>
        <template #actions="{ row }">
          <Button type="link" @click="selectMaterialFun(row)">
            选择
            <IconifyIcon icon="lucide:circle-check" />
          </Button>
        </template>
      </VoiceGrid>
    </div>

    <!-- 类型：video -->
    <div v-else-if="props.type === 'video'">
      <VideoGrid>
        <template #video="{ row }">
          <VideoPlayer :url="row.url" />
        </template>
        <template #actions="{ row }">
          <Button type="link" @click="selectMaterialFun(row)">
            选择
            <IconifyIcon icon="lucide:circle-check" />
          </Button>
        </template>
      </VideoGrid>
    </div>

    <!-- 类型：news -->
    <div v-else-if="props.type === 'news'">
      <Spin :spinning="loading">
        <div
          class="columns-1 gap-2.5 md:columns-2 lg:columns-3 xl:columns-4 2xl:columns-5"
        >
          <div
            v-for="item in list"
            :key="item.mediaId"
            class="mb-2.5 break-inside-avoid"
          >
            <div v-if="item.content && item.content.newsItem">
              <News :articles="item.content.newsItem" />
              <div class="mt-2 flex justify-center">
                <Button type="primary" @click="selectMaterialFun(item)">
                  选择
                  <IconifyIcon icon="lucide:circle-check" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Spin>
      <!-- 分页组件 -->
      <div class="mt-4 flex justify-end">
        <Pagination
          :total="total"
          v-model:current="queryParams.pageNo"
          v-model:page-size="queryParams.pageSize"
          @change="getMaterialPageFun"
        />
      </div>
    </div>
  </div>
</template>
