<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { ErpPurchaseInApi } from '#/api/erp/purchase/in';

import { ref } from 'vue';

import { message, Modal } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getPurchaseInPage } from '#/api/erp/purchase/in';

const emit = defineEmits<{
  success: [rows: ErpPurchaseInApi.PurchaseIn[]];
}>();

const supplierId = ref<number>(); // 供应商ID
const open = ref<boolean>(false); // 弹窗是否打开
const selectedRows = ref<ErpPurchaseInApi.PurchaseIn[]>([]); // 选中的行

/** 表格配置 */
const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: [
      {
        fieldName: 'no',
        label: '入库单号',
        component: 'Input',
        componentProps: {
          placeholder: '请输入入库单号',
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
        fieldName: 'paymentStatus',
        label: '付款状态',
        component: 'Select',
        componentProps: {
          options: [
            { label: '未付款', value: 0 },
            { label: '部分付款', value: 1 },
            { label: '全部付款', value: 2 },
          ],
          placeholder: '请选择付款状态',
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
        title: '入库单号',
        width: 200,
        fixed: 'left',
      },
      {
        field: 'supplierName',
        title: '供应商',
        minWidth: 120,
      },
      {
        field: 'inTime',
        title: '入库时间',
        width: 160,
        formatter: 'formatDate',
      },
      {
        field: 'totalPrice',
        title: '应付金额',
        formatter: 'formatAmount2',
        minWidth: 120,
      },
      {
        field: 'paymentPrice',
        title: '已付金额',
        formatter: 'formatAmount2',
        minWidth: 120,
      },
      {
        field: 'unPaymentPrice',
        title: '未付金额',
        formatter: ({ row }) => {
          const unPaymentPrice = row.totalPrice - row.paymentPrice;
          return `${unPaymentPrice?.toFixed(2) || '0.00'}元`;
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
          return await getPurchaseInPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            supplierId: supplierId.value,
            paymentEnable: true, // 只查询可付款的
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
  } as VxeTableGridOptions<ErpPurchaseInApi.PurchaseIn>,
  gridEvents: {
    checkboxChange: ({
      records,
    }: {
      records: ErpPurchaseInApi.PurchaseIn[];
    }) => {
      selectedRows.value = records;
    },
    checkboxAll: ({ records }: { records: ErpPurchaseInApi.PurchaseIn[] }) => {
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
    message.warning('请选择要添加的采购入库单');
    return;
  }

  // 过滤已全部付款的单据
  const validRows = selectedRows.value.filter((row) => {
    const unPaymentPrice = row.totalPrice - row.paymentPrice;
    return unPaymentPrice > 0;
  });

  if (validRows.length === 0) {
    message.warning('所选的入库单已全部付款，无需再付款');
    return;
  }

  if (validRows.length < selectedRows.value.length) {
    message.warning(
      `已过滤${selectedRows.value.length - validRows.length}个已全部付款的入库单`,
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
    title="选择采购入库单"
    @ok="handleOk"
    :width="1000"
  >
    <Grid
      class="max-h-[500px]"
      table-title="采购入库单列表(仅展示可付款的单据)"
    />
  </Modal>
</template>
