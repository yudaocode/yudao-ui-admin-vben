<script lang="ts" setup>
import type { FormType } from '../data';

import type { VxeTableInstance } from '#/adapter/vxe-table';
import type { WmsWarehouseApi } from '#/api/wms/md/warehouse';
import type { WmsShipmentOrderApi } from '#/api/wms/order/shipment';
import type { WmsShipmentOrderDetailApi } from '#/api/wms/order/shipment/detail';
import type { InventorySelectRow } from '#/views/wms/inventory/components';

import { computed, nextTick, ref } from 'vue';

import { confirm, useVbenModal } from '@vben/common-ui';
import {
  OrderStatusEnum,
  OrderUpdateStatusList,
} from '@vben/constants';
import { isEqual } from '@vben/utils';

import { InputNumber, message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { TableAction, VxeColumn, VxeTable } from '#/adapter/vxe-table';
import {
  cancelShipmentOrder,
  completeShipmentOrder,
  createShipmentOrder,
  getShipmentOrder,
  getShipmentOrderDetailListByOrderId,
  updateShipmentOrder,
} from '#/api/wms/order/shipment';
import { $t } from '#/locales';
import { WmsInventorySelect } from '#/views/wms/inventory/components';
import {
  dividePrice,
  formatQuantity,
  multiplyPrice,
  PRICE_PRECISION,
  QUANTITY_PRECISION,
} from '#/views/wms/utils/format';
import { generateOrderNo } from '#/views/wms/utils/order';

import { getDetailFooter, useFormSchema } from '../data';

interface DetailRow extends WmsShipmentOrderDetailApi.ShipmentOrderDetail {
  seq: number;
}

defineOptions({ name: 'WmsShipmentOrderForm' });

const emit = defineEmits<{
  success: [];
}>();

const formData = ref<WmsShipmentOrderApi.ShipmentOrder>({});
const formType = ref<FormType>('create');
const originalSubmitData = ref<WmsShipmentOrderApi.ShipmentOrder>();
const details = ref<DetailRow[]>([]);
const detailTableRef = ref<VxeTableInstance>();
const inventorySelectRef = ref<InstanceType<typeof WmsInventorySelect>>();
const currentWarehouseId = ref<number>();
const initializing = ref(false);
let detailSeq = 0; // 明细行可能还没有后端 id，使用本地序号作为 VXE 行操作的稳定标识

const getTitle = computed(() => {
  return formType.value === 'update'
    ? $t('ui.actionTitle.edit', ['出库单'])
    : $t('ui.actionTitle.create', ['出库单']);
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
  schema: useFormSchema({ onWarehouseChange: handleWarehouseChange }),
  showDefaultActions: false,
  wrapperClass: 'grid-cols-3',
});

/** 标准化明细行，补齐本地序号和金额 */
function normalizeDetail(
  detail: WmsShipmentOrderDetailApi.ShipmentOrderDetail,
): DetailRow {
  detailSeq += 1;
  return {
    ...detail,
    seq: detailSeq,
    totalPrice:
      detail.totalPrice ?? multiplyPrice(detail.quantity, detail.price),
  };
}

/** 根据库存构建新的出库明细 */
function buildDetail(inventory: InventorySelectRow): DetailRow {
  return normalizeDetail({
    availableQuantity: inventory.availableQuantity,
    id: undefined,
    itemCode: inventory.itemCode,
    itemId: inventory.itemId,
    itemName: inventory.itemName,
    price: undefined,
    quantity: undefined,
    skuCode: inventory.skuCode,
    skuId: inventory.skuId,
    skuName: inventory.skuName,
    totalPrice: undefined,
    unit: inventory.unit,
    warehouseId: inventory.warehouseId,
    warehouseName: inventory.warehouseName,
  });
}

/** 设置出库明细 */
function setDetails(list?: WmsShipmentOrderDetailApi.ShipmentOrderDetail[]) {
  detailSeq = 0;
  details.value = (list || []).map((detail) => normalizeDetail(detail));
  void refreshDetailFooter();
}

/** 刷新明细合计行 */
async function refreshDetailFooter() {
  await nextTick();
  await detailTableRef.value?.updateFooter();
}

/** 添加商品明细 */
async function handleAddDetail() {
  const values =
    (await formApi.getValues()) as WmsShipmentOrderApi.ShipmentOrder;
  if (!values.warehouseId) {
    message.warning('请先选择仓库');
    return;
  }
  currentWarehouseId.value = values.warehouseId;
  await nextTick();
  inventorySelectRef.value?.open(getSelectedInventoryKeys());
}

/** 选择库存 */
function handleSelectInventory(inventories: InventorySelectRow[]) {
  if (inventories.length === 0) {
    return;
  }
  let changed = false;
  for (const inventory of inventories) {
    if (!inventory.skuId || isInventorySelected(inventory)) {
      continue;
    }
    details.value.push(buildDetail(inventory));
    changed = true;
  }
  if (changed) {
    void refreshDetailFooter();
  }
}

/** 判断库存是否已选择 */
function isInventorySelected(inventory: InventorySelectRow) {
  return details.value.some((detail) => {
    return (
      detail.skuId === inventory.skuId &&
      detail.warehouseId === inventory.warehouseId
    );
  });
}

/** 获得已选择的库存标识 */
function getSelectedInventoryKeys() {
  return details.value
    .map((detail) =>
      detail.skuId && detail.warehouseId
        ? `${detail.skuId}-${detail.warehouseId}`
        : undefined,
    )
    .filter((key): key is string => !!key);
}

/** 删除商品明细 */
function handleDeleteDetail(row: DetailRow) {
  const index = details.value.findIndex((detail) => detail.seq === row.seq);
  if (index !== -1) {
    details.value.splice(index, 1);
    void refreshDetailFooter();
  }
}

/** 仓库变化时清空出库明细 */
function handleWarehouseChange(warehouse?: WmsWarehouseApi.Warehouse) {
  if (initializing.value) {
    return;
  }
  formData.value.warehouseId = warehouse?.id;
  formData.value.warehouseName = warehouse?.name;
  currentWarehouseId.value = warehouse?.id;
  setDetails([]);
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
      message.error('至少包含一条出库明细');
      return false;
    }
    return true;
  }
  for (let index = 0; index < details.value.length; index += 1) {
    const detail = details.value[index]!;
    if (!detail.skuId) {
      message.error(`第 ${index + 1} 行明细请选择商品规格`);
      return false;
    }
    if (!detail.quantity || detail.quantity <= 0) {
      message.error(`第 ${index + 1} 行明细出库数量必须大于 0`);
      return false;
    }
    if (
      detail.availableQuantity !== undefined &&
      detail.quantity > detail.availableQuantity
    ) {
      message.error(`第 ${index + 1} 行明细出库数量不能大于可用库存`);
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
async function buildSubmitData(): Promise<WmsShipmentOrderApi.ShipmentOrder> {
  const values =
    (await formApi.getValues()) as WmsShipmentOrderApi.ShipmentOrder;
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

/** 完成出库 */
async function handleFormComplete() {
  const { valid } = await formApi.validate();
  if (!valid || !validateDetails(true) || !formData.value?.id) {
    return;
  }
  await confirm('确认完成出库？完成后将更新库存。');
  modalApi.lock();
  try {
    const data = await buildSubmitData();
    if (!isEqual(data, originalSubmitData.value)) {
      await updateShipmentOrder(data);
    }
    await completeShipmentOrder(formData.value.id);
    await modalApi.close();
    emit('success');
    message.success('出库成功');
  } finally {
    modalApi.unlock();
  }
}

/** 作废出库单 */
async function handleFormCancel() {
  if (!formData.value?.id) {
    return;
  }
  await confirm('确认作废该出库单？作废后不可恢复。');
  modalApi.lock();
  try {
    await cancelShipmentOrder(formData.value.id);
    await modalApi.close();
    emit('success');
    message.success('作废成功');
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
        ? updateShipmentOrder(data)
        : createShipmentOrder(data));
      // 关闭并提示
      await modalApi.close();
      emit('success');
      message.success($t('ui.actionMessage.operationSuccess'));
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      formData.value = {};
      originalSubmitData.value = undefined;
      currentWarehouseId.value = undefined;
      setDetails([]);
      return;
    }
    initializing.value = true;
    const data = modalApi.getData<{ formType: FormType; id?: number }>();
    formType.value = data.formType;
    if (data?.id) {
      modalApi.lock();
      try {
        // 加载数据
        const order = await getShipmentOrder(data.id);
        const orderDetails =
          order.details || (await getShipmentOrderDetailListByOrderId(data.id));
        formData.value = { ...order, details: orderDetails };
        currentWarehouseId.value = order.warehouseId;
        setDetails(orderDetails);
        // 设置到 values
        await formApi.setValues(formData.value);
        await nextTick();
        originalSubmitData.value = await buildSubmitData();
      } finally {
        initializing.value = false;
        modalApi.unlock();
      }
      return;
    }
    // 初始化新增表单
    formData.value = {
      details: [],
      no: generateOrderNo('CK'),
      status: OrderStatusEnum.PREPARE,
    };
    currentWarehouseId.value = undefined;
    setDetails([]);
    await formApi.setValues(formData.value);
    await nextTick();
    originalSubmitData.value = await buildSubmitData();
    initializing.value = false;
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-3/4" :show-confirm-button="isPrepareOrder">
    <div class="mx-4">
      <Form />
      <div class="mt-4">
        <div class="mb-3 flex items-center justify-between">
          <span class="text-sm font-semibold">出库明细</span>
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
          <VxeColumn
            field="availableQuantity"
            title="可用库存"
            align="right"
            width="120"
          >
            <template #default="{ row }">
              {{ formatQuantity(row.availableQuantity) || '-' }}
            </template>
          </VxeColumn>
          <VxeColumn field="quantity" title="出库数量" width="150">
            <template #default="{ row }">
              <InputNumber
                v-model:value="row.quantity"
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
              <InputNumber
                v-model:value="row.price"
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
              <InputNumber
                v-model:value="row.totalPrice"
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
                    type: 'link',
                    danger: true,
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
              label: '完成出库',
              type: 'primary',
              auth: ['wms:shipment-order:complete'],
              onClick: handleFormComplete,
            },
            {
              label: '作废',
              type: 'primary',
              danger: true,
              auth: ['wms:shipment-order:cancel'],
              onClick: handleFormCancel,
            },
          ]"
        />
      </div>
    </template>
    <WmsInventorySelect
      ref="inventorySelectRef"
      :warehouse-id="currentWarehouseId"
      @change="handleSelectInventory"
    />
  </Modal>
</template>
