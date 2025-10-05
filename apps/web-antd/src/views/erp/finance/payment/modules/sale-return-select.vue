<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { ErpPurchaseReturnApi } from '#/api/erp/purchase/return';

import { ref } from 'vue';

import { message, Modal } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getPurchaseReturnPage } from '#/api/erp/purchase/return';

const emit = defineEmits<{
  success: [rows: ErpPurchaseReturnApi.PurchaseReturn[]];
}>();

const supplierId = ref<number>(); // 供应商ID
const open = ref<boolean>(false); // 弹窗是否打开
const selectedRows = ref<ErpPurchaseReturnApi.PurchaseReturn[]>([]); // 选中的行

/** 表格配置 */
const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: [
      {
        fieldName: 'no',
        label: '退货单号',
        component: 'Input',
        componentProps: {
          placeholder: '请输入退货单号',
          allowClear: true,
        },
      },
      {
        fieldName: 'supplierId',
        label: '供应商',
        component: 'Input',
        componentProps: {
          disabled: true,
          placeholder: '已自动选择供应商',
        },
      },
      {
        fieldName: 'refundStatus',
        label: '退款状态',
        component: 'Select',
        componentProps: {
          options: [
            { label: '未退款', value: 0 },
            { label: '部分退款', value: 1 },
            { label: '全部退款', value: 2 },
          ],
          placeholder: '请选择退款状态',
          allowClear: true,
        },
      },
    ],
  },
  gridOptions: {
    columns: [
      {
        type: 'checkbox',
        width: 50,
        fixed: 'left',
      },
      {
        field: 'no',
        title: '退货单号',
        width: 200,
        fixed: 'left',
      },
      {
        field: 'supplierName',
        title: '供应商',
        minWidth: 120,
      },
      {
        field: 'returnTime',
        title: '退货时间',
        width: 160,
        formatter: 'formatDate',
      },
      {
        field: 'totalPrice',
        title: '应退金额',
        formatter: 'formatAmount2',
        minWidth: 120,
      },
      {
        field: 'refundPrice',
        title: '已退金额',
        formatter: 'formatAmount2',
        minWidth: 120,
      },
      {
        field: 'unRefundPrice',
        title: '未退金额',
        formatter: ({ row }) => {
          const unRefundPrice = row.totalPrice - row.refundPrice;
          return `${unRefundPrice?.toFixed(2) || '0.00'}元`;
        },
        minWidth: 120,
      },
      {
        field: 'status',
        title: '状态',
        minWidth: 100,
        cellRender: {
          name: 'CellDict',
          props: { type: 'ERP_AUDIT_STATUS' },
        },
      },
    ],
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getPurchaseReturnPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            supplierId: supplierId.value,
            refundEnable: true, // 只查询可退款的
            ...formValues,
          });
        },
      },
    },
    rowConfig: {
      keyField: 'id',
      isHover: true,
    },
    checkboxConfig: {
      highlight: true,
      range: true,
    },
    toolbarConfig: {
      refresh: true,
      search: true,
    },
  } as VxeTableGridOptions<ErpPurchaseReturnApi.PurchaseReturn>,
  gridEvents: {
    checkboxChange: ({
      records,
    }: {
      records: ErpPurchaseReturnApi.PurchaseReturn[];
    }) => {
      selectedRows.value = records;
    },
    checkboxAll: ({
      records,
    }: {
      records: ErpPurchaseReturnApi.PurchaseReturn[];
    }) => {
      selectedRows.value = records;
    },
  },
});

/** 打开弹窗 */
const openModal = (id: number) => {
  supplierId.value = id;
  open.value = true;
  selectedRows.value = [];
  // 重置表单并设置供应商ID
  gridApi.formApi?.resetForm();
  gridApi.formApi?.setValues({ supplierId: id });
  // 延迟查询，确保表单值已设置
  setTimeout(() => {
    gridApi.query();
  }, 100);
};

/** 确认选择 */
const handleOk = () => {
  if (selectedRows.value.length === 0) {
    message.warning('请选择要添加的采购退货单');
    return;
  }

  // 过滤已全部退款的单据
  const validRows = selectedRows.value.filter((row) => {
    const unRefundPrice = row.totalPrice - row.refundPrice;
    return unRefundPrice > 0;
  });

  if (validRows.length === 0) {
    message.warning('所选的退货单已全部退款，无需再付款');
    return;
  }

  if (validRows.length < selectedRows.value.length) {
    message.warning(
      `已过滤${selectedRows.value.length - validRows.length}个已全部退款的退货单`,
    );
  }

  emit('success', validRows);
  open.value = false;
};

defineExpose({ open: openModal });
</script>

<template>
  <Modal
    class="!w-[70vw]"
    v-model:open="open"
    title="选择采购退货单"
    @ok="handleOk"
    :width="1000"
  >
    <Grid
      class="max-h-[500px]"
      table-title="采购退货单列表(仅展示需退款的单据)"
    />
  </Modal>
</template>
