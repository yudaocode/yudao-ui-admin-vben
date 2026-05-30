<script lang="ts" setup>
import type { FormType } from '../data';

import type { VxeTableInstance } from '#/adapter/vxe-table';
import type { WmsItemSkuApi } from '#/api/wms/md/item/sku';
import type { WmsReceiptOrderApi } from '#/api/wms/order/receipt';
import type { WmsReceiptOrderDetailApi } from '#/api/wms/order/receipt/detail';

import { computed, nextTick, ref } from 'vue';

import { confirm, useVbenModal } from '@vben/common-ui';
import {
  OrderStatusEnum,
  OrderUpdateStatusList,
} from '@vben/constants';
import { isEqual } from '@vben/utils';

import { ElInputNumber, ElMessage } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import { TableAction, VxeColumn, VxeTable } from '#/adapter/vxe-table';
import {
  cancelReceiptOrder,
  completeReceiptOrder,
  createReceiptOrder,
  getReceiptOrder,
  getReceiptOrderDetailListByOrderId,
  updateReceiptOrder,
} from '#/api/wms/order/receipt';
import { $t } from '#/locales';
import { WmsItemSkuSelect } from '#/views/wms/md/item/sku/components';
import {
  dividePrice,
  multiplyPrice,
  PRICE_PRECISION,
  QUANTITY_PRECISION,
} from '#/views/wms/utils/format';
import { generateOrderNo } from '#/views/wms/utils/order';

import { getDetailFooter, useFormSchema } from '../data';

interface DetailRow extends WmsReceiptOrderDetailApi.ReceiptOrderDetail {
  seq: number;
}

defineOptions({ name: 'WmsReceiptOrderForm' });

const emit = defineEmits<{
  success: [];
}>();

const formData = ref<WmsReceiptOrderApi.ReceiptOrder>({});
const formType = ref<FormType>('create');
const originalSubmitData = ref<WmsReceiptOrderApi.ReceiptOrder>();
const details = ref<DetailRow[]>([]);
const detailTableRef = ref<VxeTableInstance>();
const skuSelectRef = ref<InstanceType<typeof WmsItemSkuSelect>>();
let detailSeq = 0; // 明细行可能还没有后端 id，使用本地序号作为 VXE 行操作的稳定标识

const getTitle = computed(() => {
  return formType.value === 'update'
    ? $t('ui.actionTitle.edit', ['入库单'])
    : $t('ui.actionTitle.create', ['入库单']);
});

const isPrepareOrder = computed(() => {
  return (
    !formData.value?.id ||
    (formData.value.status !== undefined &&
      OrderUpdateStatusList.includes(formData.value.status))
  );
});
const isSavedPrepareOrder = computed(() => {
  return (
    !!formData.value?.id &&
    formData.value.status !== undefined &&
    OrderUpdateStatusList.includes(formData.value.status)
  );
});

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    labelWidth: 100,
  },
  layout: 'horizontal',
  schema: useFormSchema(),
  showDefaultActions: false,
  wrapperClass: 'grid-cols-3',
});

/** 标准化明细行，补齐本地序号和金额 */
function normalizeDetail(
  detail: WmsReceiptOrderDetailApi.ReceiptOrderDetail,
): DetailRow {
  detailSeq += 1;
  return {
    ...detail,
    seq: detailSeq,
    totalPrice:
      detail.totalPrice ?? multiplyPrice(detail.quantity, detail.price),
  };
}

/** 根据商品 SKU 构建新的入库明细 */
function buildDetail(sku: WmsItemSkuApi.ItemSku): DetailRow {
  return normalizeDetail({
    id: undefined,
    itemCode: sku.itemCode,
    itemId: sku.itemId,
    itemName: sku.itemName,
    price: undefined,
    quantity: undefined,
    skuCode: sku.code,
    skuId: sku.id,
    skuName: sku.name,
    totalPrice: undefined,
    unit: sku.unit,
  });
}

/** 设置入库明细 */
function setDetails(list?: WmsReceiptOrderDetailApi.ReceiptOrderDetail[]) {
  detailSeq = 0;
  details.value = (list || []).map((detail) => normalizeDetail(detail));
  void refreshDetailFooter();
}

/** 刷新明细合计行 */
async function refreshDetailFooter() {
  await nextTick();
  await detailTableRef.value?.updateFooter();
}

/** 获取已选择的 SKU 编号，避免重复选择 */
function getSelectedSkuIds() {
  return details.value
    .map((detail) => detail.skuId)
    .filter((id): id is number => !!id);
}

/** 添加商品明细 */
async function handleAddDetail() {
  const values = (await formApi.getValues()) as WmsReceiptOrderApi.ReceiptOrder;
  if (!values.warehouseId) {
    ElMessage.warning('请先选择仓库');
    return;
  }
  skuSelectRef.value?.open(getSelectedSkuIds());
}

/** 选择商品 SKU */
function handleSelectSku(skus: WmsItemSkuApi.ItemSku[]) {
  if (skus.length === 0) {
    return;
  }
  const selectedSkuIds = new Set(getSelectedSkuIds());
  let changed = false;
  for (const sku of skus) {
    if (!sku.id || selectedSkuIds.has(sku.id)) {
      continue;
    }
    details.value.push(buildDetail(sku));
    selectedSkuIds.add(sku.id);
    changed = true;
  }
  if (changed) {
    void refreshDetailFooter();
  }
}

/** 删除商品明细 */
function handleDeleteDetail(row: DetailRow) {
  const index = details.value.findIndex((detail) => detail.seq === row.seq);
  if (index !== -1) {
    details.value.splice(index, 1);
    void refreshDetailFooter();
  }
}

/** 明细数量变化 */
function handleDetailQuantityChange(detail: DetailRow) {
  if (detail.price !== undefined && detail.price !== null) {
    detail.totalPrice = multiplyPrice(detail.quantity, detail.price);
    void refreshDetailFooter();
    return;
  }
  detail.price = dividePrice(detail.totalPrice, detail.quantity);
  void refreshDetailFooter();
}

/** 明细单价变化 */
function handleDetailPriceChange(detail: DetailRow) {
  detail.totalPrice = multiplyPrice(detail.quantity, detail.price);
  void refreshDetailFooter();
}

/** 明细金额变化 */
function handleDetailTotalPriceChange(detail: DetailRow) {
  detail.price = dividePrice(detail.totalPrice, detail.quantity);
  void refreshDetailFooter();
}

/** 校验商品明细 */
function validateDetails(required = false) {
  if (details.value.length === 0) {
    if (required) {
      ElMessage.error('至少包含一条入库明细');
      return false;
    }
    return true;
  }
  for (let index = 0; index < details.value.length; index += 1) {
    const detail = details.value[index]!;
    if (!detail.skuId) {
      ElMessage.error(`第 ${index + 1} 行明细请选择商品规格`);
      return false;
    }
    if (!detail.quantity || detail.quantity <= 0) {
      ElMessage.error(`第 ${index + 1} 行明细入库数量必须大于 0`);
      return false;
    }
  }
  return true;
}

/** 构建提交用的明细数据 */
function buildSubmitDetails() {
  return details.value.map((row) => {
    const { seq: _seq, ...detail } = row;
    return detail;
  });
}

/** 构建提交用的单据数据 */
async function buildSubmitData(): Promise<WmsReceiptOrderApi.ReceiptOrder> {
  const values = (await formApi.getValues()) as WmsReceiptOrderApi.ReceiptOrder;
  const {
    details: _details,
    totalPrice: _totalPrice,
    totalQuantity: _totalQuantity,
    ...order
  } = formData.value;
  return {
    ...order,
    ...values,
    details: buildSubmitDetails(),
  };
}

/** 完成入库 */
async function handleFormComplete() {
  const { valid } = await formApi.validate();
  if (!valid || !validateDetails(true) || !formData.value?.id) {
    return;
  }
  await confirm('确认完成入库？完成后将更新库存。');
  modalApi.lock();
  try {
    const data = await buildSubmitData();
    if (!isEqual(data, originalSubmitData.value)) {
      await updateReceiptOrder(data);
    }
    await completeReceiptOrder(formData.value.id);
    await modalApi.close();
    emit('success');
    ElMessage.success('入库成功');
  } finally {
    modalApi.unlock();
  }
}

/** 作废入库单 */
async function handleFormCancel() {
  if (!formData.value?.id) {
    return;
  }
  await confirm('确认作废该入库单？作废后不可恢复。');
  modalApi.lock();
  try {
    await cancelReceiptOrder(formData.value.id);
    await modalApi.close();
    emit('success');
    ElMessage.success('作废成功');
  } finally {
    modalApi.unlock();
  }
}

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid || !validateDetails(false) || !isPrepareOrder.value) {
      return;
    }
    modalApi.lock();
    // 提交表单
    const data = await buildSubmitData();
    try {
      await (formType.value === 'update'
        ? updateReceiptOrder(data)
        : createReceiptOrder(data));
      // 关闭并提示
      await modalApi.close();
      emit('success');
      ElMessage.success($t('ui.actionMessage.operationSuccess'));
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      formData.value = {};
      originalSubmitData.value = undefined;
      setDetails([]);
      return;
    }
    const data = modalApi.getData<{ formType: FormType; id?: number }>();
    formType.value = data.formType;
    if (data?.id) {
      modalApi.lock();
      try {
        // 加载数据
        const order = await getReceiptOrder(data.id);
        const orderDetails =
          order.details || (await getReceiptOrderDetailListByOrderId(data.id));
        formData.value = { ...order, details: orderDetails };
        setDetails(orderDetails);
        // 设置到 values
        await formApi.setValues(formData.value);
        await nextTick();
        originalSubmitData.value = await buildSubmitData();
      } finally {
        modalApi.unlock();
      }
      return;
    }
    // 初始化新增表单
    formData.value = {
      details: [],
      no: generateOrderNo('RK'),
      status: OrderStatusEnum.PREPARE,
    };
    setDetails([]);
    await formApi.setValues(formData.value);
    await nextTick();
    originalSubmitData.value = await buildSubmitData();
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-3/4" :show-confirm-button="isPrepareOrder">
    <div class="mx-4">
      <Form />
      <div class="mt-4">
        <div class="mb-3 flex items-center justify-between">
          <span class="text-sm font-semibold">入库明细</span>
          <TableAction
            :actions="[
              {
                label: '添加商品',
                onClick: handleAddDetail,
                type: 'primary',
              },
            ]"
          />
        </div>
        <VxeTable
          ref="detailTableRef"
          :data="details"
          border
          empty-text="暂无商品明细"
          :footer-method="getDetailFooter"
          :show-overflow="true"
          show-footer
          size="small"
        >
          <VxeColumn title="商品信息" min-width="220">
            <template #default="{ row }">
              <div>{{ row.itemName || '-' }}</div>
              <div v-if="row.itemCode" class="text-xs text-gray-500">
                商品编号：{{ row.itemCode }}
              </div>
            </template>
          </VxeColumn>
          <VxeColumn title="规格信息" min-width="220">
            <template #default="{ row }">
              <div>{{ row.skuName || '-' }}</div>
              <div v-if="row.skuCode" class="text-xs text-gray-500">
                规格编号：{{ row.skuCode }}
              </div>
            </template>
          </VxeColumn>
          <VxeColumn field="quantity" title="入库数量" width="150">
            <template #default="{ row }">
              <ElInputNumber
                v-model="row.quantity"
                :controls="false"
                :min="0"
                :precision="QUANTITY_PRECISION"
                class="!w-full"
                placeholder="数量"
                @change="handleDetailQuantityChange(row)"
              />
            </template>
          </VxeColumn>
          <VxeColumn field="price" title="单价(元)" width="150">
            <template #default="{ row }">
              <ElInputNumber
                v-model="row.price"
                :controls="false"
                :min="0"
                :precision="PRICE_PRECISION"
                class="!w-full"
                placeholder="单价"
                @change="handleDetailPriceChange(row)"
              />
            </template>
          </VxeColumn>
          <VxeColumn field="totalPrice" title="金额(元)" width="150">
            <template #default="{ row }">
              <ElInputNumber
                v-model="row.totalPrice"
                :controls="false"
                :min="0"
                :precision="PRICE_PRECISION"
                class="!w-full"
                placeholder="金额"
                @change="handleDetailTotalPriceChange(row)"
              />
            </template>
          </VxeColumn>
          <VxeColumn title="操作" align="center" fixed="right" width="90">
            <template #default="{ row }">
              <TableAction
                :actions="[
                  {
                    label: '删除',
                    type: 'danger',
                    link: true,
                    onClick: handleDeleteDetail.bind(null, row),
                  },
                ]"
              />
            </template>
          </VxeColumn>
        </VxeTable>
      </div>
    </div>
    <template #prepend-footer>
      <div v-if="isSavedPrepareOrder" class="flex flex-auto items-center gap-2">
        <TableAction
          :actions="[
            {
              label: '完成入库',
              type: 'primary',
              auth: ['wms:receipt-order:complete'],
              onClick: handleFormComplete,
            },
            {
              label: '作废',
              type: 'danger',
              auth: ['wms:receipt-order:cancel'],
              onClick: handleFormCancel,
            },
          ]"
        />
      </div>
    </template>
    <WmsItemSkuSelect ref="skuSelectRef" @change="handleSelectSku" />
  </Modal>
</template>
