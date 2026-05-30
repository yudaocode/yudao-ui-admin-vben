<script lang="ts" setup>
import type { FormType } from '../data';

import type { VxeTableInstance } from '#/adapter/vxe-table';
import type { WmsInventoryApi } from '#/api/wms/inventory';
import type { WmsItemSkuApi } from '#/api/wms/md/item/sku';
import type { WmsWarehouseApi } from '#/api/wms/md/warehouse';
import type { WmsCheckOrderApi } from '#/api/wms/order/check';
import type { WmsCheckOrderDetailApi } from '#/api/wms/order/check/detail';

import { computed, nextTick, ref, watch } from 'vue';

import { confirm, useVbenModal } from '@vben/common-ui';
import {
  OrderStatusEnum,
  OrderUpdateStatusList,
} from '@vben/constants';
import { isEqual } from '@vben/utils';

import { ElInputNumber, ElMessage } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import { TableAction, VxeColumn, VxeTable } from '#/adapter/vxe-table';
import { getInventoryList } from '#/api/wms/inventory';
import {
  cancelCheckOrder,
  completeCheckOrder,
  createCheckOrder,
  getCheckOrder,
  getCheckOrderDetailListByOrderId,
  updateCheckOrder,
} from '#/api/wms/order/check';
import { $t } from '#/locales';
import { WmsItemSkuSelect } from '#/views/wms/md/item/sku/components';
import {
  dividePrice,
  formatPrice,
  formatQuantity,
  getLossClass,
  multiplyPrice,
  PRICE_PRECISION,
  QUANTITY_PRECISION,
  sumPrice,
} from '#/views/wms/utils/format';
import { generateOrderNo } from '#/views/wms/utils/order';

import {
  getCheckDetailFooter,
  getDetailDifferencePrice,
  getDetailDifferenceQuantity,
  useFormSchema,
  useWarehouseFormSchema,
} from '../data';

interface CheckInventoryRow extends WmsInventoryApi.Inventory {
  availableQuantity?: number;
  price?: number;
}

interface DetailRow extends WmsCheckOrderDetailApi.CheckOrderDetail {
  actualPrice?: number;
  differencePrice?: number;
  differenceQuantity?: number;
  seq: number;
}

defineOptions({ name: 'WmsCheckOrderForm' });

const emit = defineEmits<{
  success: [];
}>();

const formData = ref<WmsCheckOrderApi.CheckOrder>({});
const formType = ref<FormType>('create');
const originalSubmitData = ref<WmsCheckOrderApi.CheckOrder>();
const details = ref<DetailRow[]>([]);
const detailTableRef = ref<VxeTableInstance>();
const skuSelectRef = ref<InstanceType<typeof WmsItemSkuSelect>>();
const selectingWarehouse = ref(false);
const warehouseName = ref<string>();
let detailSeq = 0; // 明细行可能还没有后端 id，使用本地序号作为 VXE 行操作的稳定标识

const getTitle = computed(() => {
  return formType.value === 'update'
    ? $t('ui.actionTitle.edit', ['盘库单'])
    : $t('ui.actionTitle.create', ['盘库单']);
});

const modalTitle = computed(() => {
  return selectingWarehouse.value ? '选择盘库仓库' : getTitle.value;
});
const modalClass = computed(() => {
  return selectingWarehouse.value ? 'w-[420px]' : 'w-3/4';
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

/** 表单顶部实际金额来自明细合计，保持和 vue3 的只读汇总字段一致 */
const actualPrice = computed(() =>
  sumPrice(details.value, (detail) => getDetailActualPrice(detail)),
);

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

const [WarehouseForm, warehouseFormApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    labelWidth: 80,
  },
  layout: 'horizontal',
  schema: useWarehouseFormSchema(handleWarehouseSelect),
  showDefaultActions: false,
});

/** 记录新增盘库单前置选择的仓库名称 */
function handleWarehouseSelect(warehouse: unknown) {
  warehouseName.value = (
    warehouse as undefined | WmsWarehouseApi.Warehouse
  )?.name;
}

/** 初始化新增盘库单草稿 */
async function initCreateForm(warehouse: {
  warehouseId?: number;
  warehouseName?: string;
}) {
  formData.value = {
    details: [],
    no: generateOrderNo('PK'),
    status: OrderStatusEnum.PREPARE,
    warehouseId: warehouse.warehouseId,
    warehouseName: warehouse.warehouseName,
  };
  setDetails([]);
  await formApi.resetForm();
  await formApi.setValues(formData.value);
  await nextTick();
  syncActualPriceField();
  originalSubmitData.value = await buildSubmitData();
}

/** 确认前置选择仓库，进入主表单 */
async function handleWarehouseConfirm() {
  const { valid } = await warehouseFormApi.validate();
  if (!valid) {
    return;
  }
  const values = (await warehouseFormApi.getValues()) as {
    warehouseId?: number;
  };
  selectingWarehouse.value = false;
  await nextTick();
  await initCreateForm({
    warehouseId: values.warehouseId,
    warehouseName: warehouseName.value,
  });
}

/** 同步表单顶部只读实际金额 */
function syncActualPriceField() {
  void formApi.setFieldValue(
    'actualPrice',
    formatPrice(actualPrice.value) || '0.00',
  );
}

watch(actualPrice, syncActualPriceField);

/** 计算明细实际金额 */
function getDetailActualPrice(detail: DetailRow) {
  return (
    detail.actualPrice ?? multiplyPrice(detail.checkQuantity, detail.price)
  );
}

/** 刷新明细行的盈亏数据 */
function refreshDetailCalculatedFields(detail: DetailRow) {
  detail.differenceQuantity = getDetailDifferenceQuantity(detail);
  detail.differencePrice = getDetailDifferencePrice(detail);
}

/** 标准化明细行，补齐本地序号和计算字段 */
function normalizeDetail(
  detail: WmsCheckOrderDetailApi.CheckOrderDetail & { actualPrice?: number },
): DetailRow {
  detailSeq += 1;
  const row: DetailRow = {
    ...detail,
    actualPrice:
      detail.actualPrice ?? multiplyPrice(detail.checkQuantity, detail.price),
    seq: detailSeq,
  };
  refreshDetailCalculatedFields(row);
  return row;
}

/** 根据库存构建盘库明细 */
function buildDetail(inventory: CheckInventoryRow): DetailRow {
  return normalizeDetail({
    actualPrice: multiplyPrice(inventory.availableQuantity, inventory.price),
    availableQuantity: inventory.availableQuantity,
    checkQuantity: inventory.availableQuantity,
    id: undefined,
    inventoryId: inventory.id,
    itemCode: inventory.itemCode,
    itemId: inventory.itemId,
    itemName: inventory.itemName,
    price: inventory.price,
    quantity: inventory.availableQuantity,
    skuCode: inventory.skuCode,
    skuId: inventory.skuId,
    skuName: inventory.skuName,
    unit: inventory.unit,
    warehouseId: inventory.warehouseId,
    warehouseName: inventory.warehouseName,
  });
}

/** 构建零库存盘库明细，用于盘点仓库内暂无库存的商品 */
function buildZeroInventoryDetail(sku: WmsItemSkuApi.ItemSku): DetailRow {
  return normalizeDetail({
    actualPrice: 0,
    availableQuantity: 0,
    checkQuantity: 0,
    id: undefined,
    inventoryId: undefined,
    itemCode: sku.itemCode,
    itemId: sku.itemId,
    itemName: sku.itemName,
    price: sku.costPrice,
    quantity: 0,
    skuCode: sku.code,
    skuId: sku.id,
    skuName: sku.name,
    unit: sku.unit,
    warehouseId: formData.value.warehouseId,
    warehouseName: formData.value.warehouseName,
  });
}

/** 设置盘库明细 */
function setDetails(list?: WmsCheckOrderDetailApi.CheckOrderDetail[]) {
  detailSeq = 0;
  details.value = (list || []).map((detail) => normalizeDetail(detail));
  void refreshDetailFooter();
}

/** 刷新明细合计行 */
async function refreshDetailFooter() {
  await nextTick();
  await detailTableRef.value?.updateFooter();
}

/** 导入当前仓库的全部库存余额 */
async function handleImportAllInventory() {
  if (!formData.value.warehouseId) {
    ElMessage.warning('请先选择仓库');
    return;
  }
  if (details.value.length > 0) {
    await confirm('导入仓库库存会覆盖当前盘库明细，是否继续？');
  }
  modalApi.lock();
  try {
    const inventories = await loadWarehouseInventoryList();
    details.value = inventories.map((inventory) =>
      buildDetail({ ...inventory, availableQuantity: inventory.quantity }),
    );
    await refreshDetailFooter();
  } finally {
    modalApi.unlock();
  }
}

/** 打开盘点商品添加弹窗，已导入/已添加 SKU 在选择器内禁选 */
function handleAddSkuInventory() {
  if (!formData.value.warehouseId) {
    ElMessage.warning('请先选择仓库');
    return;
  }
  skuSelectRef.value?.open(getSelectedSkuIds(), {
    multiple: false,
  });
}

/** 选择商品 SKU */
async function handleSelectSku(skus: WmsItemSkuApi.ItemSku[]) {
  if (skus.length === 0) {
    return;
  }
  modalApi.lock();
  try {
    const warehouseInventoryMap = await getWarehouseInventoryMap();
    const selectedSkuIds = new Set(getSelectedSkuIds());
    let changed = false;
    for (const sku of skus) {
      if (!sku.id || selectedSkuIds.has(sku.id)) {
        continue;
      }
      const inventory = warehouseInventoryMap.get(sku.id);
      details.value.push(
        inventory
          ? buildDetail({ ...inventory, availableQuantity: inventory.quantity })
          : buildZeroInventoryDetail(sku),
      );
      selectedSkuIds.add(sku.id);
      changed = true;
    }
    if (changed) {
      await refreshDetailFooter();
    }
  } finally {
    modalApi.unlock();
  }
}

/** 获得已导入/已添加 SKU 编号，避免重复盘点同一规格 */
function getSelectedSkuIds() {
  return details.value
    .map((detail) => detail.skuId)
    .filter((id): id is number => id !== undefined);
}

/** 查询当前仓库全部库存余额 */
async function loadWarehouseInventoryList(): Promise<CheckInventoryRow[]> {
  return (await getInventoryList({
    warehouseId: formData.value.warehouseId!,
  })) as CheckInventoryRow[];
}

/** 获得当前仓库 SKU 对应库存余额，用于添加单个 SKU 时带入账面库存 */
async function getWarehouseInventoryMap(): Promise<
  Map<number, CheckInventoryRow>
> {
  const inventories = await loadWarehouseInventoryList();
  return new Map(
    inventories
      .filter((inventory) => !!inventory.skuId)
      .map((inventory) => [inventory.skuId!, inventory] as const),
  );
}

/** 删除商品明细 */
function handleDeleteDetail(row: DetailRow) {
  const index = details.value.findIndex((detail) => detail.seq === row.seq);
  if (index !== -1) {
    details.value.splice(index, 1);
    void refreshDetailFooter();
  }
}

/** 明细实盘数量变化 */
function handleDetailCheckQuantityChange(detail: DetailRow) {
  if (detail.price !== undefined && detail.price !== null) {
    detail.actualPrice = multiplyPrice(detail.checkQuantity, detail.price);
  } else {
    detail.price = dividePrice(detail.actualPrice, detail.checkQuantity);
  }
  refreshDetailCalculatedFields(detail);
  void refreshDetailFooter();
}

/** 明细单价变化 */
function handleDetailPriceChange(detail: DetailRow) {
  detail.actualPrice = multiplyPrice(detail.checkQuantity, detail.price);
  refreshDetailCalculatedFields(detail);
  void refreshDetailFooter();
}

/** 明细实际金额变化 */
function handleDetailActualPriceChange(detail: DetailRow) {
  detail.price = dividePrice(detail.actualPrice, detail.checkQuantity);
  refreshDetailCalculatedFields(detail);
  void refreshDetailFooter();
}

/** 校验商品明细 */
function validateDetails(required = false) {
  if (details.value.length === 0) {
    if (required) {
      ElMessage.error('至少包含一条盘库明细');
      return false;
    }
    return true;
  }
  for (let index = 0; index < details.value.length; index += 1) {
    const detail = details.value[index]!;
    if (
      detail.checkQuantity === undefined ||
      detail.checkQuantity === null ||
      detail.checkQuantity < 0
    ) {
      ElMessage.error(`第 ${index + 1} 行明细实盘数量不能小于 0`);
      return false;
    }
  }
  return true;
}

/** 构建提交用的明细数据 */
function buildSubmitDetails() {
  return details.value.map((row) => {
    const {
      actualPrice: _actualPrice,
      availableQuantity: _availableQuantity,
      differencePrice: _differencePrice,
      differenceQuantity: _differenceQuantity,
      seq: _seq,
      ...detail
    } = row;
    return detail;
  });
}

/** 构建提交用的单据数据 */
async function buildSubmitData(): Promise<WmsCheckOrderApi.CheckOrder> {
  const values = (await formApi.getValues()) as WmsCheckOrderApi.CheckOrder;
  const {
    actualPrice: _formActualPrice,
    details: _formDetails,
    totalPrice: _formTotalPrice,
    totalQuantity: _formTotalQuantity,
    ...submitValues
  } = values;
  const {
    actualPrice: _actualPrice,
    details: _details,
    totalPrice: _totalPrice,
    totalQuantity: _totalQuantity,
    ...order
  } = formData.value;
  return {
    ...order,
    ...submitValues,
    details: buildSubmitDetails(),
  };
}

/** 完成盘库 */
async function handleFormComplete() {
  const { valid } = await formApi.validate();
  if (!valid || !validateDetails(true) || !formData.value?.id) {
    return;
  }
  await confirm('确认完成盘库？完成后将更新库存。');
  modalApi.lock();
  try {
    const data = await buildSubmitData();
    if (!isEqual(data, originalSubmitData.value)) {
      await updateCheckOrder(data);
    }
    await completeCheckOrder(formData.value.id);
    await modalApi.close();
    emit('success');
    ElMessage.success('盘库成功');
  } finally {
    modalApi.unlock();
  }
}

/** 作废盘库单 */
async function handleFormCancel() {
  if (!formData.value?.id) {
    return;
  }
  await confirm('确认作废该盘库单？作废后不可恢复。');
  modalApi.lock();
  try {
    await cancelCheckOrder(formData.value.id);
    await modalApi.close();
    emit('success');
    ElMessage.success('作废成功');
  } finally {
    modalApi.unlock();
  }
}

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    if (selectingWarehouse.value) {
      await handleWarehouseConfirm();
      return;
    }
    const { valid } = await formApi.validate();
    if (!valid || !validateDetails(false) || !isPrepareOrder.value) {
      return;
    }
    modalApi.lock();
    // 提交表单
    const data = await buildSubmitData();
    try {
      await (formType.value === 'update'
        ? updateCheckOrder(data)
        : createCheckOrder(data));
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
      selectingWarehouse.value = false;
      warehouseName.value = undefined;
      setDetails([]);
      return;
    }
    const data = modalApi.getData<{ formType: FormType; id?: number }>();
    formType.value = data.formType;
    if (data?.id) {
      modalApi.lock();
      try {
        // 加载数据
        const order = await getCheckOrder(data.id);
        const orderDetails =
          order.details || (await getCheckOrderDetailListByOrderId(data.id));
        formData.value = { ...order, details: orderDetails };
        setDetails(orderDetails);
        // 设置到 values
        await formApi.setValues(formData.value);
        await nextTick();
        syncActualPriceField();
        originalSubmitData.value = await buildSubmitData();
      } finally {
        modalApi.unlock();
      }
      return;
    }
    // 新增时先选择盘库仓库，再进入主表单
    selectingWarehouse.value = true;
    warehouseName.value = undefined;
    formData.value = {};
    setDetails([]);
    await warehouseFormApi.resetForm();
  },
});
</script>

<template>
  <Modal
    :title="modalTitle"
    :class="modalClass"
    :show-confirm-button="selectingWarehouse || isPrepareOrder"
  >
    <template v-if="selectingWarehouse" #confirmText>开始盘库</template>
    <WarehouseForm v-if="selectingWarehouse" class="mx-4" />
    <div v-else class="mx-4">
      <Form />
      <div class="mt-4">
        <div class="mb-3 flex items-center justify-between">
          <span class="text-sm font-semibold">盘库明细</span>
          <TableAction
            :actions="[
              {
                label: '导入仓库库存',
                disabled: !formData.warehouseId,
                onClick: handleImportAllInventory,
                type: 'primary',
              },
              {
                label: '添加盘点商品',
                disabled: !formData.warehouseId,
                onClick: handleAddSkuInventory,
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
          :footer-method="getCheckDetailFooter"
          :show-overflow="true"
          show-footer
          size="small"
        >
          <VxeColumn title="商品信息" min-width="210">
            <template #default="{ row }">
              <div>{{ row.itemName || '-' }}</div>
              <div v-if="row.itemCode" class="text-xs text-gray-500">
                商品编号：{{ row.itemCode }}
              </div>
            </template>
          </VxeColumn>
          <VxeColumn title="规格信息" min-width="210">
            <template #default="{ row }">
              <div>{{ row.skuName || '-' }}</div>
              <div v-if="row.skuCode" class="text-xs text-gray-500">
                规格编号：{{ row.skuCode }}
              </div>
            </template>
          </VxeColumn>
          <VxeColumn
            field="quantity"
            title="账面库存"
            align="right"
            width="120"
          >
            <template #default="{ row }">
              {{ formatQuantity(row.quantity) || '-' }}
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
          <VxeColumn field="checkQuantity" title="实际库存" width="150">
            <template #default="{ row }">
              <ElInputNumber
                v-model="row.checkQuantity"
                :controls="false"
                :min="0"
                :precision="QUANTITY_PRECISION"
                class="!w-full"
                placeholder="数量"
                @change="handleDetailCheckQuantityChange(row)"
              />
            </template>
          </VxeColumn>
          <VxeColumn field="actualPrice" title="实际金额(元)" width="150">
            <template #default="{ row }">
              <ElInputNumber
                v-model="row.actualPrice"
                :controls="false"
                :min="0"
                :precision="PRICE_PRECISION"
                class="!w-full"
                placeholder="金额"
                @change="handleDetailActualPriceChange(row)"
              />
            </template>
          </VxeColumn>
          <VxeColumn
            field="differenceQuantity"
            title="盈亏数"
            align="right"
            width="120"
          >
            <template #default="{ row }">
              <span :class="getLossClass(row.differenceQuantity)">
                {{ formatQuantity(row.differenceQuantity) }}
              </span>
            </template>
          </VxeColumn>
          <VxeColumn
            field="differencePrice"
            title="实际盈亏金额(元)"
            align="right"
            width="160"
          >
            <template #default="{ row }">
              <span :class="getLossClass(row.differencePrice)">
                {{ formatPrice(row.differencePrice) || '-' }}
              </span>
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
      <div
        v-if="!selectingWarehouse && isSavedPrepareOrder"
        class="flex flex-auto items-center gap-2"
      >
        <TableAction
          :actions="[
            {
              label: '完成盘库',
              type: 'primary',
              auth: ['wms:check-order:complete'],
              onClick: handleFormComplete,
            },
            {
              label: '作废',
              type: 'danger',
              auth: ['wms:check-order:cancel'],
              onClick: handleFormCancel,
            },
          ]"
        />
      </div>
    </template>
    <WmsItemSkuSelect ref="skuSelectRef" @change="handleSelectSku" />
  </Modal>
</template>
