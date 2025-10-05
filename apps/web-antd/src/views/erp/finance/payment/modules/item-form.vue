<script lang="ts" setup>
import type { ErpFinancePaymentApi } from '#/api/erp/finance/payment';
import type { ErpPurchaseInApi } from '#/api/erp/purchase/in';
import type { ErpPurchaseReturnApi } from '#/api/erp/purchase/return';

import { computed, nextTick, ref, watch } from 'vue';

import { ErpBizType } from '@vben/constants';
import { erpPriceInputFormatter } from '@vben/utils';

import { Input, InputNumber, message } from 'ant-design-vue';

import { TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';

import { useFormItemColumns } from '../data';
import PurchaseInSelect from './purchase-in-select.vue';
import SaleReturnSelect from './sale-return-select.vue';

interface Props {
  items?: ErpFinancePaymentApi.FinancePaymentItem[];
  supplierId?: number;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  items: () => [],
  supplierId: undefined,
  disabled: false,
});

const emit = defineEmits(['update:items']);

const tableData = ref<ErpFinancePaymentApi.FinancePaymentItem[]>([]); // 表格数据

/** 获取表格合计数据 */
const summaries = computed(() => {
  return {
    totalPrice: tableData.value.reduce(
      (sum, item) => sum + (item.totalPrice || 0),
      0,
    ),
    paidPrice: tableData.value.reduce(
      (sum, item) => sum + (item.paidPrice || 0),
      0,
    ),
    paymentPrice: tableData.value.reduce(
      (sum, item) => sum + (item.paymentPrice || 0),
      0,
    ),
  };
});

/** 表格配置 */
const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useFormItemColumns(tableData.value),
    data: tableData.value,
    minHeight: 250,
    autoResize: true,
    border: true,
    rowConfig: {
      keyField: 'row_id',
      isHover: true,
    },
    pagerConfig: {
      enabled: false,
    },
    toolbarConfig: {
      enabled: false,
    },
  },
});

/** 监听外部传入的列数据 */
watch(
  () => props.items,
  async (items) => {
    if (!items) {
      return;
    }
    items.forEach((item) => initRow(item));
    tableData.value = [...items];
    await nextTick(); // 特殊：保证 gridApi 已经初始化
    await gridApi.grid.reloadData(tableData.value);
    // 更新表格列配置
    const columns = useFormItemColumns(tableData.value);
    await gridApi.grid.reloadColumn(columns);
  },
  {
    immediate: true,
  },
);

/** 添加采购入库单 */
const purchaseInSelectRef = ref();
const handleOpenPurchaseIn = () => {
  if (!props.supplierId) {
    message.error('请选择供应商');
    return;
  }
  purchaseInSelectRef.value?.open(props.supplierId);
};

const handleAddPurchaseIn = (rows: ErpPurchaseInApi.PurchaseIn[]) => {
  rows.forEach((row) => {
    const newItem: ErpFinancePaymentApi.FinancePaymentItem = {
      bizId: row.id,
      bizType: ErpBizType.PURCHASE_IN,
      bizNo: row.no,
      totalPrice: row.totalPrice,
      paidPrice: row.paymentPrice,
      paymentPrice: row.totalPrice - row.paymentPrice,
      remark: undefined,
    };
    tableData.value.push(newItem);
  });
  emitUpdate();
};

/** 添加采购退货单 */
const saleReturnSelectRef = ref();
const handleOpenSaleReturn = () => {
  if (!props.supplierId) {
    message.error('请选择供应商');
    return;
  }
  saleReturnSelectRef.value?.open(props.supplierId);
};

const handleAddSaleReturn = (rows: ErpPurchaseReturnApi.PurchaseReturn[]) => {
  rows.forEach((row) => {
    const newItem: ErpFinancePaymentApi.FinancePaymentItem = {
      bizId: row.id,
      bizType: ErpBizType.PURCHASE_RETURN,
      bizNo: row.no,
      totalPrice: -row.totalPrice,
      paidPrice: -row.refundPrice,
      paymentPrice: -row.totalPrice + row.refundPrice,
      remark: undefined,
    };
    tableData.value.push(newItem);
  });
  emitUpdate();
};

/** 删除行 */
const handleDelete = async (row: any) => {
  const index = tableData.value.findIndex(
    (item) => item.bizId === row.bizId && item.bizType === row.bizType,
  );
  if (index !== -1) {
    tableData.value.splice(index, 1);
    emitUpdate();
  }
};

/** 发送更新事件 */
const emitUpdate = () => {
  emit('update:items', [...tableData.value]);
};

// TODO @AI：增加一个 handleRowChange 方法；

// TODO @芋艿：待定！
/** 初始化行数据 */
const initRow = (item: any) => {
  if (!item.row_id) {
    item.row_id = Date.now() + Math.random();
  }
};

/** 校验表单 */
// TODO @AI：一条有问题，就直接 throw
const validate = async () => {
  const errors: string[] = [];

  // 检查是否有明细
  if (tableData.value.length === 0) {
    errors.push('请添加付款明细');
    return errors;
  }

  // 检查每行的付款金额
  for (let i = 0; i < tableData.value.length; i++) {
    const item = tableData.value[i];
    if (!item.paymentPrice || item.paymentPrice <= 0) {
      errors.push(`第${i + 1}行的本次付款必须大于0`);
    }
  }

  if (errors.length > 0) {
    throw new Error(errors.join('；'));
  }
};

defineExpose({ validate });
</script>

<template>
  <Grid class="w-full">
    <template #paymentPrice="{ row }">
      <InputNumber
        v-model:value="row.paymentPrice"
        :precision="2"
        :disabled="disabled"
        :formatter="erpPriceInputFormatter"
        placeholder="请输入本次付款"
        @change="emitUpdate"
      />
    </template>
    <template #remark="{ row }">
      <Input
        v-model:value="row.remark"
        :disabled="disabled"
        placeholder="请输入备注"
        @change="emitUpdate"
      />
    </template>
    <template #actions="{ row }">
      <TableAction
        v-if="!disabled"
        :actions="[
          {
            label: '删除',
            type: 'link',
            danger: true,
            popConfirm: {
              title: '确认删除该付款明细吗？',
              confirm: handleDelete.bind(null, row),
            },
          },
        ]"
      />
    </template>

    <template #bottom>
      <div class="border-border bg-muted mt-2 rounded border p-2">
        <div class="text-muted-foreground flex justify-between text-sm">
          <span class="text-foreground font-medium">合计：</span>
          <div class="flex space-x-4">
            <span>
              合计付款：{{ erpPriceInputFormatter(summaries.totalPrice) }}
            </span>
            <span>
              已付金额：{{ erpPriceInputFormatter(summaries.paidPrice) }}
            </span>
            <span>
              本次付款：
              {{ erpPriceInputFormatter(summaries.paymentPrice) }}
            </span>
          </div>
        </div>
      </div>
      <!-- TODO @AI：换成 TableAction -->
      <div v-if="!disabled" class="mt-4 flex justify-center space-x-2">
        <a-button type="primary" @click="handleOpenPurchaseIn">
          + 添加采购入库单
        </a-button>
        <a-button type="primary" @click="handleOpenSaleReturn">
          + 添加采购退货单
        </a-button>
      </div>
    </template>
  </Grid>

  <!-- 采购入库单选择组件 -->
  <PurchaseInSelect ref="purchaseInSelectRef" @success="handleAddPurchaseIn" />
  <!-- 采购退货单选择组件 -->
  <SaleReturnSelect ref="saleReturnSelectRef" @success="handleAddSaleReturn" />
</template>
