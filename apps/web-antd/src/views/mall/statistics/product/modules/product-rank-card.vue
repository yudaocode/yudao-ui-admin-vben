<script lang="ts" setup>
import type { Dayjs } from 'dayjs';

import type { MallProductStatisticsApi } from '#/api/mall/statistics/product';

import { onMounted, reactive, ref } from 'vue';

import { formatToFraction } from '@vben/utils';

import { Card, Image, Pagination, Table } from 'ant-design-vue';

import * as ProductStatisticsApi from '#/api/mall/statistics/product';
import ShortcutDateRangePicker from '#/components/shortcut-date-range-picker/shortcut-date-range-picker.vue';

/** 商品排行 */
defineOptions({ name: 'ProductRankCard' });

const loading = ref(false); // 列表的加载中
const total = ref(0); // 列表的总页数
const list = ref<MallProductStatisticsApi.ProductStatistics[]>([]); // 列表的数据
const shortcutDateRangePicker = ref();

// 查询参数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  times: undefined as string[] | undefined,
  sortingFields: [] as any[],
});

/** 格式化：访客-支付转化率 */
const formatConvertRate = (value: number) => {
  return `${value || 0}%`;
};

/** 格式化金额（分转元）*/
const formatPrice = (value: number) => {
  return formatToFraction(value / 100, 2);
};

/** 处理排序变化 */
const handleSortChange = (sorter: any) => {
  queryParams.sortingFields =
    sorter && sorter.field
      ? [
          {
            field: sorter.field,
            order: sorter.order === 'ascend' ? 'ASC' : 'DESC',
          },
        ]
      : [];
  getSpuList();
};

/** 处理日期范围变化 */
const handleDateRangeChange = (times?: [Dayjs, Dayjs]) => {
  queryParams.times = times
    ? [
        times[0].format('YYYY-MM-DD HH:mm:ss'),
        times[1].format('YYYY-MM-DD HH:mm:ss'),
      ]
    : undefined;
  getSpuList();
};

/** 查询商品列表 */
const getSpuList = async () => {
  loading.value = true;
  try {
    const data =
      await ProductStatisticsApi.getProductStatisticsRankPage(queryParams);
    list.value = data.list;
    total.value = data.total;
  } finally {
    loading.value = false;
  }
};

/** 分页变化 */
const handlePaginationChange = (page: number, pageSize: number) => {
  queryParams.pageNo = page;
  queryParams.pageSize = pageSize;
  getSpuList();
};

/** 表格列配置 */
const columns = [
  {
    title: '商品 ID',
    dataIndex: 'spuId',
    key: 'spuId',
    width: 100,
  },
  {
    title: '商品图片',
    dataIndex: 'spuPicUrl',
    key: 'spuPicUrl',
    width: 100,
  },
  {
    title: '商品名称',
    dataIndex: 'spuName',
    key: 'spuName',
    ellipsis: true,
    width: 200,
  },
  {
    title: '浏览量',
    dataIndex: 'browseCount',
    key: 'browseCount',
    sorter: true,
    width: 100,
  },
  {
    title: '访客数',
    dataIndex: 'browseUserCount',
    key: 'browseUserCount',
    sorter: true,
    width: 100,
  },
  {
    title: '加购件数',
    dataIndex: 'cartCount',
    key: 'cartCount',
    sorter: true,
    width: 110,
  },
  {
    title: '下单件数',
    dataIndex: 'orderCount',
    key: 'orderCount',
    sorter: true,
    width: 110,
  },
  {
    title: '支付件数',
    dataIndex: 'orderPayCount',
    key: 'orderPayCount',
    sorter: true,
    width: 110,
  },
  {
    title: '支付金额',
    dataIndex: 'orderPayPrice',
    key: 'orderPayPrice',
    sorter: true,
    width: 110,
  },
  {
    title: '收藏数',
    dataIndex: 'favoriteCount',
    key: 'favoriteCount',
    sorter: true,
    width: 100,
  },
  {
    title: '访客-支付转化率(%)',
    dataIndex: 'browseConvertPercent',
    key: 'browseConvertPercent',
    sorter: true,
    width: 180,
  },
];

/** 初始化 */
onMounted(async () => {
  await getSpuList();
});
</script>

<template>
  <Card :bordered="false" title="商品排行" class="h-full">
    <template #extra>
      <!-- 查询条件 -->
      <ShortcutDateRangePicker
        ref="shortcutDateRangePicker"
        @change="handleDateRangeChange"
      />
    </template>

    <!-- 排行列表 -->
    <Table
      :columns="columns"
      :data-source="list"
      :loading="loading"
      :pagination="false"
      @change="handleSortChange"
      row-key="spuId"
    >
      <template #bodyCell="{ column, record }">
        <!-- 商品图片 -->
        <template v-if="column.key === 'spuPicUrl'">
          <Image
            :src="record.spuPicUrl"
            :width="30"
            :height="30"
            :preview="true"
            fallback="data:image/png;base64,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"
          />
        </template>

        <!-- 商品名称 -->
        <template v-else-if="column.key === 'spuName'">
          <span class="break-words">{{ record.spuName }}</span>
        </template>

        <!-- 支付金额 -->
        <template v-else-if="column.key === 'orderPayPrice'">
          ￥{{ formatPrice(record.orderPayPrice) }}
        </template>

        <!-- 访客-支付转化率 -->
        <template v-else-if="column.key === 'browseConvertPercent'">
          {{ formatConvertRate(record.browseConvertPercent) }}
        </template>
      </template>
    </Table>

    <!-- 分页 -->
    <div class="mt-4 flex justify-center">
      <Pagination
        :current="queryParams.pageNo"
        :page-size="queryParams.pageSize"
        :total="total"
        show-size-changer
        show-quick-jumper
        @change="handlePaginationChange"
      />
    </div>
  </Card>
</template>
