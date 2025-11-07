<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue';

import { IconifyIcon } from '@vben/icons';
import { formatTime } from '@vben/utils';

import { Button, Pagination, Row, Spin, Table } from 'ant-design-vue';

import * as MpDraftApi from '#/api/mp/draft';
import * as MpFreePublishApi from '#/api/mp/freePublish';
import * as MpMaterialApi from '#/api/mp/material';
import { WxNews } from '#/views/mp/modules/wx-news';
import { WxVideoPlayer } from '#/views/mp/modules/wx-video-play';
import { WxVoicePlayer } from '#/views/mp/modules/wx-voice-play';

import { NewsType } from './types';

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

const emit = defineEmits(['selectMaterial']);

// 遮罩层
const loading = ref(false);
// 总条数
const total = ref(0);
// 数据列表
const list = ref<any[]>([]);
// 查询参数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  accountId: props.accountId,
});

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
  const data = await MpMaterialApi.getMaterialPage({
    ...queryParams,
    type: props.type,
  });
  list.value = data.list;
  total.value = data.total;
}

/** 获取已发布图文分页 */
async function getFreePublishPageFun() {
  const data = await MpFreePublishApi.getFreePublishPage(queryParams);
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
  const data = await MpDraftApi.getDraftPage(queryParams);
  data.list.forEach((draft: any) => {
    const articles = draft.content.newsItem;
    articles.forEach((article: any) => {
      article.picUrl = article.thumbUrl;
    });
  });
  list.value = data.list;
  total.value = data.total;
}

onMounted(async () => {
  getPage();
});
</script>

<template>
  <div class="pb-30px">
    <!-- 类型：image -->
    <div v-if="props.type === 'image'">
      <Spin :spinning="loading">
        <div class="waterfall">
          <div class="waterfall-item" v-for="item in list" :key="item.mediaId">
            <img class="material-img" :src="item.url" />
            <p class="item-name">{{ item.name }}</p>
            <Row class="ope-row">
              <Button type="primary" @click="selectMaterialFun(item)">
                选择
                <IconifyIcon icon="lucide:circle-check" />
              </Button>
            </Row>
          </div>
        </div>
      </Spin>
      <!-- 分页组件 -->
      <Pagination
        :total="total"
        v-model:current="queryParams.pageNo"
        v-model:page-size="queryParams.pageSize"
        @change="getMaterialPageFun"
      />
    </div>
    <!-- 类型：voice -->
    <div v-else-if="props.type === 'voice'">
      <!-- 列表 -->
      <Spin :spinning="loading">
        <Table :data-source="list">
          <Table.Column title="编号" data-index="mediaId" align="center" />
          <Table.Column title="文件名" data-index="name" align="center" />
          <Table.Column title="语音" align="center">
            <template #default="{ record }">
              <WxVoicePlayer :url="record.url" />
            </template>
          </Table.Column>
          <Table.Column title="上传时间" align="center" width="180">
            <template #default="{ record }">
              {{ formatTime(record.createTime, 'YYYY-MM-DD HH:mm:ss') }}
            </template>
          </Table.Column>
          <Table.Column title="操作" align="center" fixed="right">
            <template #default="{ record }">
              <Button type="link" @click="selectMaterialFun(record)">
                选择
                <IconifyIcon icon="lucide:plus" />
              </Button>
            </template>
          </Table.Column>
        </Table>
      </Spin>
      <!-- 分页组件 -->
      <Pagination
        :total="total"
        v-model:current="queryParams.pageNo"
        v-model:page-size="queryParams.pageSize"
        @change="getPage"
      />
    </div>
    <!-- 类型：video -->
    <div v-else-if="props.type === 'video'">
      <!-- 列表 -->
      <Spin :spinning="loading">
        <Table :data-source="list">
          <Table.Column title="编号" data-index="mediaId" align="center" />
          <Table.Column title="文件名" data-index="name" align="center" />
          <Table.Column title="标题" data-index="title" align="center" />
          <Table.Column title="介绍" data-index="introduction" align="center" />
          <Table.Column title="视频" align="center">
            <template #default="{ record }">
              <WxVideoPlayer :url="record.url" />
            </template>
          </Table.Column>
          <Table.Column title="上传时间" align="center" width="180">
            <template #default="{ record }">
              {{ formatTime(record.createTime, 'YYYY-MM-DD HH:mm:ss') }}
            </template>
          </Table.Column>
          <Table.Column title="操作" align="center" fixed="right">
            <template #default="{ record }">
              <Button type="link" @click="selectMaterialFun(record)">
                选择
                <IconifyIcon icon="lucide:circle-plus" />
              </Button>
            </template>
          </Table.Column>
        </Table>
      </Spin>
      <!-- 分页组件 -->
      <Pagination
        :total="total"
        v-model:current="queryParams.pageNo"
        v-model:page-size="queryParams.pageSize"
        @change="getMaterialPageFun"
      />
    </div>
    <!-- 类型：news -->
    <div v-else-if="props.type === 'news'">
      <Spin :spinning="loading">
        <div class="waterfall">
          <div class="waterfall-item" v-for="item in list" :key="item.mediaId">
            <div v-if="item.content && item.content.newsItem">
              <WxNews :articles="item.content.newsItem" />
              <Row class="ope-row">
                <Button type="primary" @click="selectMaterialFun(item)">
                  选择
                  <IconifyIcon icon="lucide:circle-check" />
                </Button>
              </Row>
            </div>
          </div>
        </div>
      </Spin>
      <!-- 分页组件 -->
      <Pagination
        :total="total"
        v-model:current="queryParams.pageNo"
        v-model:page-size="queryParams.pageSize"
        @change="getMaterialPageFun"
      />
    </div>
  </div>
</template>
<style lang="scss" scoped>
@media (width >= 992px) and (width <= 1300px) {
  .waterfall {
    column-count: 3;
  }

  p {
    color: red;
  }
}

@media (width >= 768px) and (width <= 991px) {
  .waterfall {
    column-count: 2;
  }

  p {
    color: orange;
  }
}

@media (width <= 767px) {
  .waterfall {
    column-count: 1;
  }
}

.waterfall {
  column-gap: 10px;
  width: 100%;
  margin: 0 auto;
  column-count: 5;
}

.waterfall-item {
  padding: 10px;
  margin-bottom: 10px;
  border: 1px solid #eaeaea;
  break-inside: avoid;
}

.material-img {
  width: 100%;
}

p {
  line-height: 30px;
}
</style>
