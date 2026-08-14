<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { FmsVoucherStatisticsApi } from '#/api/fms/voucher/statistics';

import { computed, onMounted, ref, toRaw, watch } from 'vue';
import { useRouter } from 'vue-router';

import { useAccess } from '@vben/access';
import { DocAlert, confirm, Page, useVbenModal } from '@vben/common-ui';
import { downloadFileFromBlobPart, formatDate } from '@vben/utils';

import { ElButton, ElMessage } from 'element-plus';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { getVoucherWordSimpleList } from '#/api/fms/config/voucher-word';
import {
  exportVoucherStatistics,
  getVoucherStatisticsList,
} from '#/api/fms/voucher/statistics';
import FmsPrintPreview from '#/views/fms/components/print/fms-print-preview.vue';
import { useFmsStore } from '#/views/fms/store/fms';
import {
  buildPeriodFilename,
  formatPeriodLabel,
} from '#/views/fms/utils/format';
import { buildFmsTablePrintHtml } from '#/views/fms/utils/print';

import { buildFooterMethod, useGridColumns, useGridFormSchema } from './data';

defineOptions({ name: 'FmsVoucherStatistics' });

const router = useRouter();
const { hasAccessByCodes } = useAccess();
const fmsStore = useFmsStore(); // FMS 状态

const accountSetId = computed(() => fmsStore.getAccountSetId); // 当前账套编号

const currentMonth = formatDate(new Date(), 'YYYY-MM'); // 当前月份
const exportLoading = ref(false); // 导出的加载中
const lastQuery = ref<FmsVoucherStatisticsApi.StatisticsReq>(); // 最近一次查询参数

const [PrintModal, printModalApi] = useVbenModal({
  connectedComponent: FmsPrintPreview,
});

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
    /** 重置为当前会计期间和默认科目级次 */
    handleReset: async () => {
      const accountingMonth = fmsStore.getCurrentMonth || currentMonth;
      await gridApi.formApi.setValues({
        monthRange: [accountingMonth, accountingMonth],
        voucherWordId: undefined,
        voucherNumberRange: undefined,
        levelRange: [1, 1],
      });
      const formValues = await gridApi.formApi.getValues();
      gridApi.formApi.setLatestSubmissionValues(toRaw(formValues));
      gridApi.reload(formValues);
    },
  },
  gridOptions: {
    columns: useGridColumns(),
    height: 'auto',
    keepSource: true,
    pagerConfig: { enabled: false },
    proxyConfig: {
      ajax: {
        query: async (_params, formValues) => {
          const [startMonth, endMonth] = formValues?.monthRange || [];
          if (!accountSetId.value || !startMonth || !endMonth) {
            lastQuery.value = undefined;
            return { list: [], total: 0 };
          }
          const queryParams: FmsVoucherStatisticsApi.StatisticsReq = {
            accountSetId: accountSetId.value,
            startMonth,
            endMonth,
            voucherWordId: formValues.voucherWordId,
            minVoucherNumber: formValues.minVoucherNumber,
            maxVoucherNumber: formValues.maxVoucherNumber,
            minLevel: formValues.minLevel,
            maxLevel: formValues.maxLevel,
          };
          lastQuery.value = queryParams;
          const list = await getVoucherStatisticsList(queryParams);
          return { list, total: list.length };
        },
      },
    },
    rowConfig: {
      keyField: 'subjectId',
      isHover: true,
    },
    showFooter: true,
    footerMethod: buildFooterMethod(() => lastQuery.value?.minLevel),
    toolbarConfig: {
      refresh: true,
      search: true,
    },
  } as VxeTableGridOptions<FmsVoucherStatisticsApi.Statistics>,
});

watch(accountSetId, () => init());

/** 初始化凭证汇总页面 */
async function init() {
  if (!accountSetId.value) {
    updateVoucherWordOptions([]);
    lastQuery.value = undefined;
    return;
  }
  const [wordList, accountingMonth] = await Promise.all([
    getVoucherWordSimpleList(accountSetId.value),
    fmsStore.loadCurrentMonth(),
  ]);
  updateVoucherWordOptions(wordList);
  const month = accountingMonth || currentMonth;
  await gridApi.formApi.setValues({
    monthRange: [month, month],
    voucherWordId: undefined,
    voucherNumberRange: undefined,
    levelRange: [1, 1],
  });
  // 与 handleReset 同路径提交最新表单值，避免首屏 grid 自动查询早于期间就绪导致空表
  const formValues = await gridApi.formApi.getValues();
  gridApi.formApi.setLatestSubmissionValues(toRaw(formValues));
  gridApi.reload(formValues);
}

/** 更新凭证字搜索项的选项 */
function updateVoucherWordOptions(
  options: Awaited<ReturnType<typeof getVoucherWordSimpleList>>,
) {
  gridApi.formApi.updateSchema([
    {
      fieldName: 'voucherWordId',
      componentProps: {
        clearable: true,
        options,
        placeholder: '请选择凭证字',
      },
    },
  ]);
}

/** 新增凭证 */
function handleCreate() {
  router.push('/fms/voucher/create');
}

/** 打开科目明细账 */
function openDetail(row: FmsVoucherStatisticsApi.Statistics) {
  if (!hasAccessByCodes(['fms:ledger:detail:query']) || !lastQuery.value) {
    return;
  }
  router.push({
    path: '/fms/ledger/detail',
    query: {
      subjectId: row.subjectId,
      startMonth: lastQuery.value.startMonth,
      endMonth: lastQuery.value.endMonth,
    },
  });
}

/** 导出凭证汇总表 */
async function handleExport() {
  if (!lastQuery.value) return;
  try {
    await confirm('是否确认导出数据项？');
    exportLoading.value = true;
    const data = await exportVoucherStatistics(lastQuery.value);
    downloadFileFromBlobPart({
      fileName: buildPeriodFilename(
        '凭证汇总表',
        lastQuery.value.startMonth,
        lastQuery.value.endMonth,
      ),
      source: data,
    });
  } catch {
  } finally {
    exportLoading.value = false;
  }
}

/** 打印凭证汇总表 */
function handlePrint() {
  const tableElement = gridApi.grid?.getRefMaps?.().refElem?.value;
  if (!tableElement || !lastQuery.value) {
    ElMessage.error('未找到可打印的表格');
    return;
  }
  printModalApi
    .setData({
      title: '凭证汇总表',
      html: buildFmsTablePrintHtml({
        title: '凭证汇总表',
        companyName: fmsStore.getAccountSet?.companyName || '',
        periodLabel: formatPeriodLabel(
          lastQuery.value.startMonth,
          lastQuery.value.endMonth,
        ),
        tableElement,
      }),
    })
    .open();
}

/** 初始化 */
onMounted(() => {
  init();
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="【凭证】凭证管理"
        url="https://doc.iocoder.cn/fms/voucher/"
      />
    </template>
    <PrintModal />

    <Grid>
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: '新增',
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['fms:voucher:create'],
              ifShow: fmsStore.isAccountSetWritable,
              onClick: handleCreate,
            },
            {
              label: '打印',
              type: 'primary',
              icon: 'lucide:printer',
              auth: ['fms:voucher:print'],
              onClick: handlePrint,
            },
            {
              label: '导出',
              type: 'primary',
              icon: ACTION_ICON.DOWNLOAD,
              auth: ['fms:voucher:statistics:export'],
              loading: exportLoading,
              onClick: handleExport,
            },
          ]"
        />
      </template>
      <template #subjectCode="{ row }">
        <ElButton
          v-if="hasAccessByCodes(['fms:ledger:detail:query'])"
          link
          type="primary"
          @click="openDetail(row)"
        >
          {{ row.subjectCode }}
        </ElButton>
        <span v-else>{{ row.subjectCode }}</span>
      </template>
    </Grid>
  </Page>
</template>

<style scoped>
:deep(.vxe-table--footer-wrapper) td {
  font-weight: 600;
}
</style>
