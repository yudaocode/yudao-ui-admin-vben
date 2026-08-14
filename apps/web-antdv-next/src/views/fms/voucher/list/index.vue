<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { FmsVoucherWordApi } from '#/api/fms/config/voucher-word';
import type { FmsVoucherApi } from '#/api/fms/voucher';

import { computed, onMounted, ref, toRaw, watch } from 'vue';
import { useRouter } from 'vue-router';

import { useAccess } from '@vben/access';
import { DocAlert, confirm, Page, useVbenModal } from '@vben/common-ui';
import { downloadFileFromBlobPart } from '@vben/utils';

import {
  Button,
  Dropdown,
  Menu,
  message,
  Tag,
} from 'antdv-next';
import dayjs from 'dayjs';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { getVoucherWordSimpleList } from '#/api/fms/config/voucher-word';
import {
  deleteVoucherList,
  exportVoucher,
  getVoucherPage,
  getVoucherPrintList,
  updateVoucherReviewStatus,
} from '#/api/fms/voucher';
import { useFmsStore } from '#/views/fms/store/fms';
import {
  FMS_VOUCHER_STATUS,
} from '#/views/fms/utils/constants';
import { formatMoney } from '#/views/fms/utils/format';

import { buildVoucherListPrintHtml } from '../components/print';
import FmsVoucherPrintForm from '../components/voucher-print-form.vue';
import { useGridColumns, useGridFormSchema } from './data';
import FmsVoucherAttachmentForm from './modules/attachment-form.vue';
import FmsVoucherImportForm from './modules/import-form.vue';
import FmsVoucherMoveForm from './modules/move-form.vue';
import FmsVoucherTidyForm from './modules/tidy-form.vue';

defineOptions({ name: 'FmsVoucherList' });

const router = useRouter();
const { hasAccessByCodes } = useAccess();
const fmsStore = useFmsStore(); // FMS 状态

const accountSetId = computed(() => fmsStore.getAccountSetId); // 当前账套编号
const list = ref<FmsVoucherApi.Voucher[]>([]); // 凭证列表
const selectedRows = ref<FmsVoucherApi.Voucher[]>([]); // 选中的凭证列表
const voucherWords = ref<FmsVoucherWordApi.VoucherWord[]>([]); // 凭证字列表
const lastQuery = ref<FmsVoucherApi.PageReq>(); // 最近一次查询参数
const lastMonthRange = ref<string[]>([]); // 最近一次查询的会计期间范围
const exportLoading = ref(false); // 导出的加载中

const attachmentFormRef =
  ref<InstanceType<typeof FmsVoucherAttachmentForm>>(); // 凭证附件表单 Ref
const importFormRef = ref<InstanceType<typeof FmsVoucherImportForm>>(); // 凭证导入表单 Ref
const printFormRef = ref<InstanceType<typeof FmsVoucherPrintForm>>(); // 凭证打印表单 Ref

const [TidyFormModal, tidyFormModalApi] = useVbenModal({
  connectedComponent: FmsVoucherTidyForm,
  destroyOnClose: true,
});
const [MoveFormModal, moveFormModalApi] = useVbenModal({
  connectedComponent: FmsVoucherMoveForm,
  destroyOnClose: true,
});

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
    /** 重置为当前会计期间 */
    handleReset: async () => {
      const accountingMonth =
        fmsStore.getCurrentMonth || dayjs().format('YYYY-MM');
      await gridApi.formApi.setValues({
        monthRange: [accountingMonth, accountingMonth],
        voucherWordId: undefined,
        voucherNumber: undefined,
        digest: undefined,
        subjectId: undefined,
        amountRange: undefined,
        creatorUserId: undefined,
        status: undefined,
      });
      const formValues = await gridApi.formApi.getValues();
      gridApi.formApi.setLatestSubmissionValues(toRaw(formValues));
      gridApi.reload(formValues);
    },
  },
  gridOptions: {
    columns: useGridColumns(fmsStore.isAccountSetWritable),
    height: 'auto',
    keepSource: true,
    checkboxConfig: {
      checkMethod: ({ row }: { row: FmsVoucherApi.Voucher }) =>
        !row.closingGenerated,
    },
    pagerConfig: {
      pageSize: 10,
    },
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          selectedRows.value = [];
          const queryParams = buildQueryParams(formValues, page);
          if (!queryParams) {
            lastQuery.value = undefined;
            return { list: [], total: 0 };
          }
          lastQuery.value = queryParams;
          const data = await getVoucherPage(queryParams);
          list.value = data.list;
          return { list: data.list, total: data.total };
        },
      },
    },
    rowConfig: {
      keyField: 'id',
      isHover: true,
    },
    toolbarConfig: {
      refresh: true,
      search: true,
    },
  } as VxeTableGridOptions<FmsVoucherApi.Voucher>,
  gridEvents: {
    checkboxChange: handleSelectionChange,
    checkboxAll: handleSelectionChange,
  },
});

watch(accountSetId, () => init());
watch(
  () => fmsStore.isAccountSetWritable,
  (writable) => {
    // 只读账套隐藏选择列，对齐源项目
    gridApi.grid?.reloadColumn(useGridColumns(writable) || []);
  },
);

/** 初始化凭证列表页面 */
async function init() {
  if (!accountSetId.value) {
    list.value = [];
    voucherWords.value = [];
    updateVoucherWordOptions([]);
    lastQuery.value = undefined;
    return;
  }
  const [wordList, accountingMonth] = await Promise.all([
    getVoucherWordSimpleList(accountSetId.value),
    fmsStore.loadCurrentMonth(),
  ]);
  voucherWords.value = wordList;
  updateVoucherWordOptions(wordList);
  const month = accountingMonth || dayjs().format('YYYY-MM');
  await gridApi.formApi.setValues({
    monthRange: [month, month],
  });
  // 与 handleReset 同路径提交最新表单值，避免首屏 grid 自动查询早于期间就绪导致空表
  const formValues = await gridApi.formApi.getValues();
  gridApi.formApi.setLatestSubmissionValues(toRaw(formValues));
  gridApi.reload(formValues);
}

/** 更新凭证字搜索项的选项 */
function updateVoucherWordOptions(options: FmsVoucherWordApi.VoucherWord[]) {
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

/** 构建凭证查询参数 */
function buildQueryParams(
  formValues: Record<string, any>,
  page: { currentPage: number; pageSize: number },
  ids?: number[],
): FmsVoucherApi.PageReq | undefined {
  if (!accountSetId.value) return undefined;
  const [startMonth, endMonth] = formValues?.monthRange || [];
  if (!startMonth || !endMonth) return undefined;
  lastMonthRange.value = [startMonth, endMonth];
  const queryParams: FmsVoucherApi.PageReq = {
    accountSetId: accountSetId.value,
    pageNo: page.currentPage,
    pageSize: page.pageSize,
    voucherWordId: formValues.voucherWordId,
    voucherNumber: formValues.voucherNumber,
    digest: formValues.digest,
    subjectId: formValues.subjectId,
    minAmount: formValues.minAmount,
    maxAmount: formValues.maxAmount,
    creatorUserId: formValues.creatorUserId,
    status: formValues.status,
    voucherTime: [
      dayjs(`${startMonth}-01`).startOf('month').format('YYYY-MM-DD HH:mm:ss'),
      dayjs(`${endMonth}-01`).endOf('month').format('YYYY-MM-DD HH:mm:ss'),
    ],
  };
  if (ids?.length) {
    queryParams.ids = ids;
  }
  return queryParams;
}

/** 处理更多操作 */
async function handleMoreCommand(
  command: 'export' | 'import' | 'move' | 'print' | 'printList' | 'tidy',
) {
  if (!accountSetId.value) return;
  switch (command) {
    case 'export': {
      await handleExport();
      return;
    }
    case 'import': {
      importFormRef.value?.open(accountSetId.value);
      return;
    }
    case 'print': {
      await handlePrintVoucher();
      return;
    }
    case 'printList': {
      await handlePrintList();
      return;
    }
  }
  if (!voucherWords.value.length) {
    message.warning('请先设置凭证字');
    return;
  }
  const defaultMonth =
    lastMonthRange.value[1] ||
    fmsStore.getCurrentMonth ||
    dayjs().format('YYYY-MM');
  const modalApi = command === 'move' ? moveFormModalApi : tidyFormModalApi;
  modalApi
    .setData({
      accountSetId: accountSetId.value,
      defaultMonth,
      voucherWords: voucherWords.value,
    })
    .open();
}

/** 打印凭证 */
async function handlePrintVoucher(row?: FmsVoucherApi.Voucher) {
  if (!accountSetId.value) return;
  let vouchers = row ? [row] : selectedRows.value;
  if (!vouchers.length) {
    vouchers = await getAllVoucherList();
  }
  if (!vouchers.length) {
    message.warning('暂无可打印的凭证');
    return;
  }
  printFormRef.value?.open(
    accountSetId.value,
    fmsStore.getAccountSet?.companyName || '',
    vouchers,
  );
}

/** 打印凭证列表 */
async function handlePrintList() {
  const vouchers = await getAllVoucherList();
  if (!vouchers.length) {
    message.warning('暂无可打印的凭证');
    return;
  }
  const startPeriod = dayjs(`${lastMonthRange.value[0]}-01`).format(
    'YYYY年第MM期',
  );
  const endPeriod = dayjs(`${lastMonthRange.value[1]}-01`).format(
    'YYYY年第MM期',
  );
  printFormRef.value?.previewHtml(
    buildVoucherListPrintHtml(
      fmsStore.getAccountSet?.companyName || '',
      startPeriod === endPeriod ? startPeriod : `${startPeriod} 至 ${endPeriod}`,
      vouchers,
    ),
  );
}

/** 导出凭证 */
async function handleExport() {
  if (!lastQuery.value) return;
  try {
    await confirm('是否确认导出凭证列表的数据项？');
    exportLoading.value = true;
    const ids = selectedRows.value.length
      ? selectedRows.value.map((row) => row.id)
      : undefined;
    const data = await exportVoucher({ ...lastQuery.value, ids });
    downloadFileFromBlobPart({ fileName: '凭证列表.xls', source: data });
  } catch {
  } finally {
    exportLoading.value = false;
  }
}

/** 查询全部凭证 */
async function getAllVoucherList() {
  if (!lastQuery.value) return [];
  return await getVoucherPrintList(lastQuery.value);
}

/** 打开凭证详情 */
function openVoucher(row: FmsVoucherApi.Voucher) {
  router.push({
    path: '/fms/voucher/create',
    query: {
      id: row.id,
      ids: list.value.map((item) => item.id).join(','),
    },
  });
}

/** 打开凭证附件弹窗 */
function openAttachmentDialog(row: FmsVoucherApi.Voucher) {
  if (!accountSetId.value) return;
  attachmentFormRef.value?.open(accountSetId.value, row);
}

/** 判断凭证附件是否可编辑 */
function canEditVoucherAttachments(row: FmsVoucherApi.Voucher) {
  return (
    fmsStore.isAccountSetWritable &&
    row.status === FMS_VOUCHER_STATUS.PENDING_REVIEW &&
    !row.closingGenerated &&
    hasAccessByCodes(['fms:voucher:update'])
  );
}

/** 审核或反审核凭证 */
async function handleReview(row: FmsVoucherApi.Voucher, status: number) {
  if (!accountSetId.value) return;
  try {
    await confirm(
      status === FMS_VOUCHER_STATUS.APPROVED
        ? '确认审核该凭证吗？'
        : '确认反审核该凭证吗？',
    );
    await updateVoucherReviewStatus(accountSetId.value, [row.id], status);
    message.success('操作成功');
    gridApi.query();
  } catch {}
}

/** 批量审核或反审核凭证 */
async function handleBatchReview(status: number) {
  if (!accountSetId.value || !selectedRows.value.length) return;
  const rows = selectedRows.value.filter((row) =>
    status === FMS_VOUCHER_STATUS.APPROVED
      ? row.status === FMS_VOUCHER_STATUS.PENDING_REVIEW
      : row.status === FMS_VOUCHER_STATUS.APPROVED,
  );
  if (!rows.length) {
    message.warning('所选凭证不符合当前审核操作');
    return;
  }
  try {
    await confirm(
      status === FMS_VOUCHER_STATUS.APPROVED
        ? `确认审核选中的 ${rows.length} 张凭证吗？`
        : `确认反审核选中的 ${rows.length} 张凭证吗？`,
    );
    await updateVoucherReviewStatus(
      accountSetId.value,
      rows.map((row) => row.id),
      status,
    );
    message.success('操作成功');
    gridApi.query();
  } catch {}
}

/** 删除凭证 */
async function handleDelete(row: FmsVoucherApi.Voucher) {
  if (!accountSetId.value) return;
  try {
    await confirm(
      `确认删除凭证“${row.voucherWordName}-${row.voucherNumber}”吗？删除后会产生断号`,
    );
    await deleteVoucherList(accountSetId.value, [row.id]);
    message.success('删除成功');
    gridApi.query();
  } catch {}
}

/** 批量删除凭证 */
async function handleBatchDelete() {
  if (!accountSetId.value) return;
  const rows = selectedRows.value;
  if (rows.some((row) => row.status === FMS_VOUCHER_STATUS.APPROVED)) {
    message.warning('批量删除不能包含已审核凭证');
    return;
  }
  try {
    await confirm(`确认删除选中的 ${rows.length} 张凭证吗？删除后会产生断号`);
    await deleteVoucherList(
      accountSetId.value,
      rows.map((row) => row.id),
    );
    message.success('删除成功');
    gridApi.query();
  } catch {}
}

/** 处理凭证选择变化 */
function handleSelectionChange() {
  selectedRows.value = gridApi.grid?.getCheckboxRecords() || [];
}

/** 新增凭证 */
function handleCreate() {
  router.push('/fms/voucher/create');
}

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
    <div
      v-if="selectedRows.length && fmsStore.isAccountSetWritable"
      class="border-primary/30 bg-primary/5 text-primary mb-3 flex min-h-[44px] items-center gap-2.5 rounded-md border border-solid px-3.5"
    >
      <span>已选择 {{ selectedRows.length }} 张凭证</span>
      <TableAction
        :actions="[
          {
            label: '批量审核',
            type: 'link',
            auth: ['fms:voucher:review'],
            onClick: handleBatchReview.bind(null, FMS_VOUCHER_STATUS.APPROVED),
          },
          {
            label: '批量反审核',
            type: 'link',
            auth: ['fms:voucher:review'],
            onClick: handleBatchReview.bind(
              null,
              FMS_VOUCHER_STATUS.PENDING_REVIEW,
            ),
          },
          {
            label: '批量删除',
            type: 'link',
            danger: true,
            auth: ['fms:voucher:delete'],
            onClick: handleBatchDelete,
          },
        ]"
      />
    </div>

    <Grid class="fms-voucher-list-grid">
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
          ]"
        />
        <Dropdown
          v-if="
            hasAccessByCodes([
              'fms:voucher:print',
              'fms:voucher:export',
              'fms:voucher:import',
              'fms:voucher:move',
              'fms:voucher:tidy',
            ])
          "
          :trigger="['click']"
        >
          <Button class="ml-3">
            更多<span class="icon-[ep--arrow-down] ml-1"></span>
          </Button>
          <template #popupRender>
            <Menu>
              <Menu.Item
                v-if="hasAccessByCodes(['fms:voucher:print'])"
                key="print"
                @click="handleMoreCommand('print')"
              >
                打印凭证
              </Menu.Item>
              <Menu.Item
                v-if="hasAccessByCodes(['fms:voucher:print'])"
                key="printList"
                @click="handleMoreCommand('printList')"
              >
                打印列表
              </Menu.Item>
              <Menu.Item
                v-if="hasAccessByCodes(['fms:voucher:export'])"
                key="export"
                @click="handleMoreCommand('export')"
              >
                导出
              </Menu.Item>
              <Menu.Item
                v-if="
                  fmsStore.isAccountSetWritable &&
                  hasAccessByCodes(['fms:voucher:import'])
                "
                key="import"
                @click="handleMoreCommand('import')"
              >
                导入凭证
              </Menu.Item>
              <Menu.Item
                v-if="
                  fmsStore.isAccountSetWritable &&
                  hasAccessByCodes(['fms:voucher:move'])
                "
                key="move"
                @click="handleMoreCommand('move')"
              >
                移动凭证
              </Menu.Item>
              <Menu.Item
                v-if="
                  fmsStore.isAccountSetWritable &&
                  hasAccessByCodes(['fms:voucher:tidy'])
                "
                key="tidy"
                @click="handleMoreCommand('tidy')"
              >
                整理凭证
              </Menu.Item>
            </Menu>
          </template>
        </Dropdown>
      </template>

      <template #voucherWord="{ row }">
        <Button type="link" class="!p-0" @click="openVoucher(row)">
          {{ row.voucherWordName }}-{{ row.voucherNumber }}
        </Button>
      </template>
      <template #attachment="{ row }">
        <Button
          v-if="row.attachmentUrls?.length || canEditVoucherAttachments(row)"
          type="link"
          class="!p-0"
          @click="openAttachmentDialog(row)"
        >
          <span class="icon-[ep--paperclip]"></span>
          {{ row.attachmentUrls?.length || 0 }}
        </Button>
        <span v-else>
          <span class="icon-[ep--paperclip]"></span>
          {{ row.attachmentUrls?.length || 0 }}
        </span>
      </template>
      <template #digest="{ row }">
        <div
          class="[&>div]:border-border [&>div]:min-h-[28px] [&>div]:overflow-hidden [&>div]:text-ellipsis [&>div]:whitespace-nowrap [&>div]:border-0 [&>div]:border-b [&>div]:border-dashed [&>div]:leading-[28px] [&>div:last-child]:border-b-0"
        >
          <div v-for="entry in row.entries" :key="entry.id" :title="entry.digest">
            {{ entry.digest }}
          </div>
        </div>
      </template>
      <template #subject="{ row }">
        <div
          class="[&>div]:border-border [&>div]:min-h-[28px] [&>div]:overflow-hidden [&>div]:text-ellipsis [&>div]:whitespace-nowrap [&>div]:border-0 [&>div]:border-b [&>div]:border-dashed [&>div]:leading-[28px] [&>div:last-child]:border-b-0"
        >
          <div
            v-for="entry in row.entries"
            :key="entry.id"
            :title="entry.subjectName"
          >
            {{ entry.subjectCode }} {{ entry.subjectName }}
            <span v-if="entry.auxiliaries?.length" class="text-muted-foreground">
              / {{ entry.auxiliaries.map((item: any) => item.name).join('、') }}
            </span>
          </div>
        </div>
      </template>
      <template #debit="{ row }">
        <div
          class="[font-family:Arial,sans-serif] [font-variant-numeric:tabular-nums] [&>div]:border-border [&>div]:min-h-[28px] [&>div]:overflow-hidden [&>div]:text-ellipsis [&>div]:whitespace-nowrap [&>div]:border-0 [&>div]:border-b [&>div]:border-dashed [&>div]:leading-[28px] [&>div:last-child]:border-b-0"
        >
          <div v-for="entry in row.entries" :key="entry.id">
            {{ Number(entry.debitAmount) ? formatMoney(entry.debitAmount) : '' }}
          </div>
        </div>
      </template>
      <template #credit="{ row }">
        <div
          class="[font-family:Arial,sans-serif] [font-variant-numeric:tabular-nums] [&>div]:border-border [&>div]:min-h-[28px] [&>div]:overflow-hidden [&>div]:text-ellipsis [&>div]:whitespace-nowrap [&>div]:border-0 [&>div]:border-b [&>div]:border-dashed [&>div]:leading-[28px] [&>div:last-child]:border-b-0"
        >
          <div v-for="entry in row.entries" :key="entry.id">
            {{ Number(entry.creditAmount) ? formatMoney(entry.creditAmount) : '' }}
          </div>
        </div>
      </template>
      <template #status="{ row }">
        <Tag v-if="row.closingGenerated">结账生成</Tag>
        <Tag
          v-else
          :color="
            row.status === FMS_VOUCHER_STATUS.APPROVED ? 'success' : 'warning'
          "
        >
          {{ row.status === FMS_VOUCHER_STATUS.APPROVED ? '已审核' : '待审核' }}
        </Tag>
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label:
                row.closingGenerated || !fmsStore.isAccountSetWritable
                  ? '查看'
                  : '编辑',
              type: 'link',
              onClick: openVoucher.bind(null, row),
            },
            {
              label: '审核',
              type: 'link',
              auth: ['fms:voucher:review'],
              ifShow:
                fmsStore.isAccountSetWritable &&
                !row.closingGenerated &&
                row.status === FMS_VOUCHER_STATUS.PENDING_REVIEW,
              onClick: handleReview.bind(null, row, FMS_VOUCHER_STATUS.APPROVED),
            },
            {
              label: '反审核',
              type: 'link',
              auth: ['fms:voucher:review'],
              ifShow:
                fmsStore.isAccountSetWritable &&
                !row.closingGenerated &&
                row.status === FMS_VOUCHER_STATUS.APPROVED,
              onClick: handleReview.bind(
                null,
                row,
                FMS_VOUCHER_STATUS.PENDING_REVIEW,
              ),
            },
            {
              label: '打印',
              type: 'link',
              auth: ['fms:voucher:print'],
              onClick: handlePrintVoucher.bind(null, row),
            },
            {
              label: '删除',
              type: 'link',
              danger: true,
              auth: ['fms:voucher:delete'],
              ifShow:
                fmsStore.isAccountSetWritable &&
                !row.closingGenerated &&
                row.status !== FMS_VOUCHER_STATUS.APPROVED,
              onClick: handleDelete.bind(null, row),
            },
          ]"
        />
      </template>
    </Grid>

    <!-- 移动、导入、打印、整理和附件弹窗 -->
    <MoveFormModal @success="gridApi.query()" />
    <TidyFormModal @success="gridApi.query()" />
    <FmsVoucherImportForm ref="importFormRef" @success="gridApi.query()" />
    <FmsVoucherPrintForm ref="printFormRef" />
    <FmsVoucherAttachmentForm ref="attachmentFormRef" @success="gridApi.query()" />
  </Page>
</template>

<style scoped>
/* 多分录凭证按分录折行展示，行高跟随内容，覆盖 VXE size--small 的固定行高裁剪 */
.fms-voucher-list-grid :deep(.vxe-table--body .vxe-cell) {
  height: auto !important;
  max-height: none !important;
  overflow: visible !important;
}
</style>
