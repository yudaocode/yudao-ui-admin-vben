<script lang="ts" setup>
import type { EchartsUIType } from '@vben/plugins/echarts';

import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { CrmStatisticsProductApi } from '#/api/crm/statistics/product';

import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { ContentWrap, Page } from '@vben/common-ui';
import { EchartsUI, useEcharts } from '@vben/plugins/echarts';
import { useUserStore } from '@vben/stores';
import {
  beginOfDay,
  endOfDay,
  formatDateTime,
  handleTree,
} from '@vben/utils';

import { ElButton, ElTabPane, ElTabs } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getProductSimpleList } from '#/api/crm/product';
import { getProductCategoryList } from '#/api/crm/product/category';
import {
  getProductCategorySummary,
  getProductSalesList,
} from '#/api/crm/statistics/product';
import { getSimpleDeptList } from '#/api/system/dept';
import { getSimpleUserList } from '#/api/system/user';
import { getRangePickerDefaultProps } from '#/utils';
import { $t } from '#/locales';

const userStore = useUserStore();
const { push } = useRouter();
const activeTabName = ref('productSalesList');
const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);

enum ProductSalesRowTypeEnum {
  CATEGORY_SUMMARY = 'categorySummary',
  DETAIL = 'detail',
  PRODUCT_SUMMARY = 'productSummary',
}

type ProductSalesRow =
  Partial<CrmStatisticsProductApi.ProductSalesRespVO> & {
    categoryRowspan?: number;
    index?: number;
    productRowspan?: number;
    rowKey?: string;
    rowType: ProductSalesRowTypeEnum;
    summaryLabel?: string;
  };

const SUMMARY_LABEL_COLUMN_INDEX = 0;
const CATEGORY_COLUMN_INDEX = 1;
const PRODUCT_COLUMN_INDEX = 2;
const CONTRACT_NO_COLUMN_INDEX = 3;
const CUSTOMER_COLUMN_INDEX = 6;
const SUMMARY_VALUE_COLUMN_INDEX = 8;
const LINK_COLUMN_INDEXES = [
  PRODUCT_COLUMN_INDEX,
  CONTRACT_NO_COLUMN_INDEX,
  CUSTOMER_COLUMN_INDEX,
];

/** 搜索表单 */
function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'times',
      label: '时间范围',
      component: 'RangePicker',
      componentProps: {
        ...getRangePickerDefaultProps(),
        clearable: false,
      },
      defaultValue: [
        formatDateTime(beginOfDay(new Date(Date.now() - 3600 * 1000 * 24 * 30))),
        formatDateTime(endOfDay(new Date(Date.now() - 3600 * 1000 * 24))),
      ],
    },
    {
      fieldName: 'deptId',
      label: '归属部门',
      component: 'ApiTreeSelect',
      componentProps: {
        api: async () => handleTree(await getSimpleDeptList()),
        labelField: 'name',
        valueField: 'id',
        childrenField: 'children',
        defaultExpandAll: true,
        placeholder: '请选择归属部门',
      },
      defaultValue: userStore.userInfo?.deptId,
    },
    {
      fieldName: 'userId',
      label: '员工',
      component: 'ApiSelect',
      componentProps: {
        api: getSimpleUserList,
        allowClear: true,
        labelField: 'nickname',
        valueField: 'id',
        placeholder: '请选择员工',
      },
    },
    {
      fieldName: 'categoryId',
      label: '产品分类',
      component: 'ApiTreeSelect',
      componentProps: {
        api: async () => handleTree(await getProductCategoryList()),
        labelField: 'name',
        valueField: 'id',
        childrenField: 'children',
        defaultExpandAll: true,
        placeholder: '请选择产品分类',
        clearable: true,
      },
    },
    {
      fieldName: 'productId',
      label: '产品',
      component: 'ApiSelect',
      componentProps: {
        api: getProductSimpleList,
        allowClear: true,
        filterable: true,
        labelField: 'name',
        valueField: 'id',
        placeholder: '请选择产品',
      },
    },
  ];
}

const [QueryForm, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
  },
  schema: useGridFormSchema(),
  showCollapseButton: true,
  submitButtonOptions: {
    content: $t('common.query'),
  },
  wrapperClass: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3',
  handleSubmit: async () => {
    await loadData();
  },
});

const [ProductSalesGrid, productSalesGridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: [
      { field: 'index', title: '序号', width: 90, slots: { default: 'index' } },
      { field: 'categoryName', title: '产品分类', minWidth: 140 },
      {
        field: 'productName',
        title: '产品名称',
        minWidth: 180,
        slots: { default: 'productName' },
      },
      {
        field: 'contractNo',
        title: '合同编号',
        minWidth: 160,
        slots: { default: 'contractNo' },
      },
      { field: 'contractName', title: '合同名称', minWidth: 180 },
      { field: 'ownerUserName', title: '负责人', minWidth: 120 },
      {
        field: 'customerName',
        title: '客户名称',
        minWidth: 180,
        slots: { default: 'customerName' },
      },
      {
        field: 'productPrice',
        title: '销售单价（元）',
        formatter: 'formatAmount2',
        minWidth: 140,
      },
      { field: 'productCount', title: '数量', minWidth: 120 },
      {
        field: 'productTotalPrice',
        title: '订单产品小计（元）',
        formatter: 'formatAmount2',
        minWidth: 160,
      },
    ],
    cellClassName: ({ columnIndex, row }: any) =>
      row.rowType === ProductSalesRowTypeEnum.DETAIL &&
      LINK_COLUMN_INDEXES.includes(columnIndex)
        ? 'is-link-cell'
        : '',
    height: 'auto',
    keepSource: true,
    pagerConfig: {
      enabled: false,
    },
    proxyConfig: {
      enabled: false,
    },
    rowClassName: ({ row }: any) => {
      if (row.rowType === ProductSalesRowTypeEnum.PRODUCT_SUMMARY) {
        return 'product-summary-row';
      }
      if (row.rowType === ProductSalesRowTypeEnum.CATEGORY_SUMMARY) {
        return 'category-summary-row';
      }
      return '';
    },
    rowConfig: {
      keyField: 'rowKey',
      isHover: true,
    },
    spanMethod,
    toolbarConfig: {
      enabled: false,
    },
  } as VxeTableGridOptions<ProductSalesRow>,
});

const [ProductCategoryGrid, productCategoryGridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: [
      { type: 'seq', title: '序号', width: 80 },
      { field: 'categoryName', title: '产品分类', minWidth: 180 },
      { field: 'contractCount', title: '合同数量', minWidth: 120 },
      { field: 'productCount', title: '销售数量', minWidth: 120 },
      {
        field: 'productTotalPrice',
        title: '销售金额（元）',
        formatter: 'formatAmount2',
        minWidth: 160,
      },
    ],
    height: 'auto',
    keepSource: true,
    pagerConfig: {
      enabled: false,
    },
    proxyConfig: {
      enabled: false,
    },
    rowConfig: {
      keyField: 'categoryId',
      isHover: true,
    },
    toolbarConfig: {
      enabled: false,
    },
  } as VxeTableGridOptions<CrmStatisticsProductApi.ProductCategoryRespVO>,
});

/** 转换为数值 */
function getNumber(value?: number) {
  return Number(value || 0);
}

/** 获得分类分组 Key */
function getCategoryKey(item: CrmStatisticsProductApi.ProductSalesRespVO) {
  return item.categoryId || `category-${item.categoryName}`;
}

/** 获得产品分组 Key */
function getProductKey(item: CrmStatisticsProductApi.ProductSalesRespVO) {
  return item.productId;
}

/** 构建产品小计行 */
function buildProductSummaryRow(
  rows: CrmStatisticsProductApi.ProductSalesRespVO[],
): ProductSalesRow {
  return {
    rowType: ProductSalesRowTypeEnum.PRODUCT_SUMMARY,
    rowKey: `product-summary-${rows[0]?.productId || rows[0]?.productName}`,
    summaryLabel: `${rows[0]?.productName || '产品'} 小计`,
    productCount: rows.reduce((sum, item) => sum + getNumber(item.productCount), 0),
    productTotalPrice: rows.reduce(
      (sum, item) => sum + getNumber(item.productTotalPrice),
      0,
    ),
  };
}

/** 构建分类小计行 */
function buildCategorySummaryRow(
  rows: CrmStatisticsProductApi.ProductSalesRespVO[],
): ProductSalesRow {
  return {
    rowType: ProductSalesRowTypeEnum.CATEGORY_SUMMARY,
    rowKey: `category-summary-${rows[0]?.categoryId || rows[0]?.categoryName}`,
    summaryLabel: `${rows[0]?.categoryName || '未分类'} 小计`,
    productCount: rows.reduce((sum, item) => sum + getNumber(item.productCount), 0),
    productTotalPrice: rows.reduce(
      (sum, item) => sum + getNumber(item.productTotalPrice),
      0,
    ),
  };
}

/** 按产品分组 */
function buildProductGroups(rows: CrmStatisticsProductApi.ProductSalesRespVO[]) {
  const result: CrmStatisticsProductApi.ProductSalesRespVO[][] = [];
  let index = 0;
  while (index < rows.length) {
    const productKey = getProductKey(rows[index]!);
    const productRows: CrmStatisticsProductApi.ProductSalesRespVO[] = [];
    while (index < rows.length && getProductKey(rows[index]!) === productKey) {
      productRows.push(rows[index]!);
      index++;
    }
    result.push(productRows);
  }
  return result;
}

/** 构建列表展示数据 */
function buildList(
  data: CrmStatisticsProductApi.ProductSalesRespVO[],
): ProductSalesRow[] {
  const result: ProductSalesRow[] = [];
  let index = 0;
  let rowIndex = 1;
  while (index < data.length) {
    const categoryStartIndex = result.length;
    const categoryKey = getCategoryKey(data[index]!);
    const categoryRows: CrmStatisticsProductApi.ProductSalesRespVO[] = [];

    while (index < data.length && getCategoryKey(data[index]!) === categoryKey) {
      categoryRows.push(data[index]!);
      index++;
    }

    const productGroups = buildProductGroups(categoryRows);
    const productSummaryRows: ProductSalesRow[] = [];
    productGroups.forEach((productRows) => {
      const productStartIndex = result.length;
      productRows.forEach((row) => {
        const detailIndex = rowIndex++;
        result.push({
          ...row,
          rowType: ProductSalesRowTypeEnum.DETAIL,
          index: detailIndex,
          rowKey: `detail-${detailIndex}`,
        });
      });
      result[productStartIndex]!.productRowspan = productRows.length;
      if (productGroups.length > 1 && productRows.length > 1) {
        productSummaryRows.push(buildProductSummaryRow(productRows));
      }
    });

    if (result.length > categoryStartIndex) {
      result[categoryStartIndex]!.categoryRowspan = categoryRows.length;
    }
    result.push(...productSummaryRows);
    result.push(buildCategorySummaryRow(categoryRows));
  }
  return result;
}

/** 合并产品分类、产品名称单元格 */
function spanMethod({ columnIndex, row }: any) {
  if (
    row.rowType === ProductSalesRowTypeEnum.PRODUCT_SUMMARY ||
    row.rowType === ProductSalesRowTypeEnum.CATEGORY_SUMMARY
  ) {
    if (columnIndex === SUMMARY_LABEL_COLUMN_INDEX) {
      return { rowspan: 1, colspan: SUMMARY_VALUE_COLUMN_INDEX };
    }
    if (
      columnIndex > SUMMARY_LABEL_COLUMN_INDEX &&
      columnIndex < SUMMARY_VALUE_COLUMN_INDEX
    ) {
      return { rowspan: 0, colspan: 0 };
    }
  }
  if (columnIndex === CATEGORY_COLUMN_INDEX) {
    if (row.rowType !== ProductSalesRowTypeEnum.DETAIL) {
      return { rowspan: 0, colspan: 0 };
    }
    return row.categoryRowspan
      ? { rowspan: row.categoryRowspan, colspan: 1 }
      : { rowspan: 0, colspan: 0 };
  }
  if (columnIndex === PRODUCT_COLUMN_INDEX) {
    if (row.rowType !== ProductSalesRowTypeEnum.DETAIL) {
      return undefined;
    }
    return row.productRowspan
      ? { rowspan: row.productRowspan, colspan: 1 }
      : { rowspan: 0, colspan: 0 };
  }
}

/** 获得产品分类销售分析图表 */
function getProductCategoryChartOptions(
  data: CrmStatisticsProductApi.ProductCategoryRespVO[],
) {
  return {
    title: {
      text: '产品分类销量占比',
      left: 'center',
      bottom: 10,
    },
    legend: {
      type: 'scroll',
      orient: 'vertical',
      left: 10,
      top: 20,
      bottom: 20,
      data: data.map((item) => item.categoryName),
    },
    tooltip: {
      trigger: 'item',
      formatter: '{b}<br/>销售数量：{c}',
    },
    series: [
      {
        name: '销售数量',
        type: 'pie',
        radius: ['50%', '70%'],
        center: ['55%', '48%'],
        data: data.map((item) => ({
          name: item.categoryName,
          value: item.productCount,
        })),
      },
    ],
    toolbox: {
      feature: {
        saveAsImage: { show: true, name: '产品分类销量占比' },
      },
    },
  };
}

/** 加载产品销售情况统计 */
async function loadProductSalesList() {
  const params = await formApi.getValues();
  const data = await getProductSalesList(params);
  await productSalesGridApi.grid.reloadData(buildList(data));
}

/** 加载产品分类销售分析 */
async function loadProductCategorySummary() {
  const params = await formApi.getValues();
  const data = await getProductCategorySummary(params);
  await renderEcharts(getProductCategoryChartOptions(data), true);
  await productCategoryGridApi.grid.reloadData(data);
}

/** 查询按钮操作 */
async function loadData() {
  if (activeTabName.value === 'productSalesList') {
    await loadProductSalesList();
    return;
  }
  await loadProductCategorySummary();
}

/** tab 切换 */
async function handleTabChange(key: any) {
  activeTabName.value = key;
  await loadData();
}

/** 打开合同详情 */
function openContract(id?: number) {
  if (!id) {
    return;
  }
  push({ name: 'CrmContractDetail', params: { id } });
}

/** 打开客户详情 */
function openCustomer(id?: number) {
  if (!id) {
    return;
  }
  push({ name: 'CrmCustomerDetail', params: { id } });
}

/** 打开产品详情 */
function openProduct(id?: number) {
  if (!id) {
    return;
  }
  push({ name: 'CrmProductDetail', params: { id } });
}

/** 初始化 */
onMounted(() => {
  loadData();
});
</script>

<template>
  <Page auto-content-height>
    <ContentWrap>
      <QueryForm />
      <ElTabs
        v-model="activeTabName"
        class="w-full"
        @tab-change="handleTabChange"
      >
        <ElTabPane label="产品销售情况统计" name="productSalesList" />
        <ElTabPane label="产品分类销售分析" name="productCategorySummary" />
      </ElTabs>

      <ProductSalesGrid v-show="activeTabName === 'productSalesList'">
        <template #index="{ row }">
          <span v-if="row.rowType === ProductSalesRowTypeEnum.DETAIL">
            {{ row.index }}
          </span>
          <span v-else>{{ row.summaryLabel }}</span>
        </template>
        <template #productName="{ row }">
          <ElButton
            v-if="row.rowType === ProductSalesRowTypeEnum.DETAIL"
            link
            type="primary"
            @click="openProduct(row.productId)"
          >
            {{ row.productName }}
          </ElButton>
          <span v-else>{{ row.summaryLabel }}</span>
        </template>
        <template #contractNo="{ row }">
          <ElButton
            v-if="row.rowType === ProductSalesRowTypeEnum.DETAIL"
            link
            type="primary"
            @click="openContract(row.contractId)"
          >
            {{ row.contractNo }}
          </ElButton>
        </template>
        <template #customerName="{ row }">
          <ElButton
            v-if="
              row.rowType === ProductSalesRowTypeEnum.DETAIL && row.customerId
            "
            link
            type="primary"
            @click="openCustomer(row.customerId)"
          >
            {{ row.customerName }}
          </ElButton>
          <span v-else-if="row.rowType === ProductSalesRowTypeEnum.DETAIL">
            {{ row.customerName }}
          </span>
        </template>
      </ProductSalesGrid>

      <div v-show="activeTabName === 'productCategorySummary'">
        <EchartsUI class="mb-5 h-[500px] w-full" ref="chartRef" />
        <ProductCategoryGrid />
      </div>
    </ContentWrap>
  </Page>
</template>

<style scoped>
:deep(.product-summary-row > td) {
  background-color: #fff9f2 !important;
  font-weight: 600;
}

:deep(.category-summary-row > td) {
  background-color: #fff3e8 !important;
  font-weight: 600;
}

:deep(.is-link-cell) {
  color: var(--el-color-primary);
  cursor: pointer;
}
</style>
