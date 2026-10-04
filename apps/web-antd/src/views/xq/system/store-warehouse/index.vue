<script lang="ts" setup>
import type { XqStorePlatformApi } from '#/api/xq/store-platform';
import type { XqStoreWarehouseApi } from '#/api/xq/store-warehouse';

import { computed, onMounted, reactive, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Button,
  Form,
  FormItem,
  Input,
  message,
  Modal,
  Select,
  Spin,
  Switch,
} from 'ant-design-vue';

import { getXqPlatforms, getXqStores } from '#/api/xq/store-platform';
import {
  deleteXqStoreWarehouse,
  getXqStoreWarehouses,
  getXqWarehouses,
  saveXqStoreWarehouse,
  saveXqWarehouse,
} from '#/api/xq/store-warehouse';

defineOptions({ name: 'XqStoreWarehouse' });

const loading = ref(false);
const saving = ref(false);

const platforms = ref<XqStorePlatformApi.Platform[]>([]);
const stores = ref<XqStorePlatformApi.Store[]>([]);
const warehouses = ref<XqStoreWarehouseApi.Warehouse[]>([]);
const rows = ref<XqStoreWarehouseApi.StoreWarehouse[]>([]);

const filterKeyword = ref('');
const filterPlatformId = ref<number | undefined>();
const filterStoreId = ref<number | undefined>();
const queryKeyword = ref('');
const queryPlatformId = ref<number | undefined>();
const queryStoreId = ref<number | undefined>();

/** 当前选中的店铺（左侧点选后右侧展示其仓库） */
const selectedStoreId = ref<number | undefined>();

const dialogOpen = ref(false);
const shippingInput = ref('');
const form = reactive({
  id: undefined as number | undefined,
  storeId: 0,
  warehouseId: undefined as number | undefined,
  warehouseCode: '',
  warehouseName: '',
  physicalCode: '',
  countryCode: 'US',
  priority: 1,
  shippingMethod: '',
  courierAccount: '',
  enabled: true,
  shippingList: [] as string[],
});

const enabledStores = computed(() =>
  stores.value.filter((s) => s.status !== 0),
);

const platformOptions = computed(() =>
  platforms.value
    .filter((p) => p.enabled !== false)
    .map((p) => ({ value: p.id, label: p.name || p.code })),
);

const storeOptions = computed(() => {
  const list = filterPlatformId.value
    ? enabledStores.value.filter((s) => s.platformId === filterPlatformId.value)
    : enabledStores.value;
  return list.map((s) => ({ value: s.id, label: s.name }));
});

const warehouseOptions = computed(() =>
  warehouses.value
    .filter((w) => w.enabled !== false)
    .map((w) => ({
      value: w.id,
      label: formatWarehouseTitle(w.code, w.name),
    })),
);

const priorityOptions = [1, 2, 3, 4, 5].map((n) => ({
  value: n,
  label: `${n}级`,
}));

/** 左侧：全店铺，查询后筛选 */
const leftStores = computed(() => {
  const kw = queryKeyword.value.trim().toLowerCase();
  return enabledStores.value.filter((store) => {
    if (
      queryPlatformId.value !== undefined &&
      store.platformId !== queryPlatformId.value
    ) {
      return false;
    }
    if (queryStoreId.value !== undefined && store.id !== queryStoreId.value) {
      return false;
    }
    if (!kw) return true;
    const hay = [store.name, store.platformName, store.platformCode]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return hay.includes(kw);
  });
});

const selectedStore = computed(() =>
  enabledStores.value.find((s) => s.id === selectedStoreId.value),
);

/** 右侧：当前店的多个发货仓 */
const rightBindings = computed(() => {
  if (selectedStoreId.value === undefined) return [];
  return rows.value.filter((r) => r.storeId === selectedStoreId.value);
});

watch(leftStores, (list) => {
  if (list.length === 0) {
    selectedStoreId.value = undefined;
    return;
  }
  if (
    selectedStoreId.value === undefined ||
    !list.some((s) => s.id === selectedStoreId.value)
  ) {
    selectedStoreId.value = list[0]!.id;
  }
});

function countryLabel(code?: string) {
  if (!code) return '-';
  if (code === 'US' || code === 'USA') return '美国';
  return code;
}

function formatWarehouseTitle(code?: string, name?: string) {
  const c = (code || '').trim();
  const n = (name || '').trim();
  if (c && n) {
    if (n.includes(c) || n.startsWith(`${c}[`)) {
      return n.includes('[') ? n : `${c}[${n}]`;
    }
    return `${c}[${n}]`;
  }
  return c || n || '-';
}

function warehouseDisplayName(row: XqStoreWarehouseApi.StoreWarehouse) {
  return formatWarehouseTitle(
    row.warehouseCode,
    row.warehouseName || row.physicalName,
  );
}

function splitShipping(raw?: string) {
  if (!raw?.trim()) return [];
  return raw
    .split(/[\n|;；]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function joinShipping(list: string[]) {
  return list.filter(Boolean).join('\n');
}

async function loadBase() {
  const [p, s, w] = await Promise.all([
    getXqPlatforms(),
    getXqStores(),
    getXqWarehouses(),
  ]);
  platforms.value = p || [];
  stores.value = s || [];
  warehouses.value = w || [];
}

async function loadRows() {
  rows.value = (await getXqStoreWarehouses()) || [];
}

async function handleQuery() {
  queryKeyword.value = filterKeyword.value;
  queryPlatformId.value = filterPlatformId.value;
  queryStoreId.value = filterStoreId.value;
}

function selectStore(storeId: number) {
  selectedStoreId.value = storeId;
}

function resetForm(storeId?: number) {
  form.id = undefined;
  form.storeId =
    storeId || selectedStoreId.value || enabledStores.value[0]?.id || 0;
  form.warehouseId = undefined;
  form.warehouseCode = '';
  form.warehouseName = '';
  form.physicalCode = '';
  form.countryCode = 'US';
  form.priority = 1;
  form.shippingMethod = '';
  form.courierAccount = '';
  form.enabled = true;
  form.shippingList = [];
  shippingInput.value = '';
}

/** 为当前店 / 指定店新增一个仓库配置 */
function openAddWarehouse(storeId?: number) {
  const sid = storeId ?? selectedStoreId.value;
  if (!sid) {
    message.warning('请先在左侧选择店铺');
    return;
  }
  resetForm(sid);
  dialogOpen.value = true;
}

function openEdit(row: XqStoreWarehouseApi.StoreWarehouse) {
  form.id = row.id;
  form.storeId = row.storeId;
  form.warehouseId = row.warehouseId;
  form.warehouseCode = row.warehouseCode || '';
  form.warehouseName = row.warehouseName || row.physicalName || '';
  form.physicalCode = row.physicalCode || '';
  form.countryCode = row.countryCode || 'US';
  form.priority = row.priority ?? 1;
  form.shippingMethod = row.shippingMethod || '';
  form.courierAccount = row.courierAccount || '';
  form.enabled = row.enabled !== false;
  form.shippingList = splitShipping(row.shippingMethod);
  shippingInput.value = '';
  dialogOpen.value = true;
}

/** 可选：从已有仓库带出编码名称，仍可手改 */
function onWarehousePick(warehouseId?: number) {
  form.warehouseId = warehouseId;
  const wh = warehouses.value.find((w) => w.id === warehouseId);
  if (!wh) return;
  form.warehouseCode = wh.code;
  form.warehouseName = wh.name;
  form.countryCode = wh.countryCode || form.countryCode || 'US';
}

function addShipping() {
  const v = shippingInput.value.trim();
  if (!v) return;
  if (!form.shippingList.includes(v)) form.shippingList.push(v);
  shippingInput.value = '';
}

function removeShipping(idx: number) {
  form.shippingList.splice(idx, 1);
}

async function handleSave() {
  if (!form.storeId) {
    message.warning('请选择店铺');
    return;
  }
  const code = form.warehouseCode.trim();
  const name = form.warehouseName.trim();
  if (!code || !name) {
    message.warning('请填写发货仓库编码和名称');
    return;
  }
  saving.value = true;
  try {
    let warehouseId = form.warehouseId;
    const finalCode = code || name.replaceAll(/\s+/g, '_');
    const finalName = name || code;
    const existed = warehouses.value.find(
      (w) => w.code.toLowerCase() === finalCode.toLowerCase(),
    );
    if (existed) {
      warehouseId = existed.id;
      if (finalName && finalName !== existed.name) {
        await saveXqWarehouse({
          id: existed.id,
          code: existed.code,
          name: finalName,
          countryCode: form.countryCode || 'US',
          enabled: true,
        });
      }
    } else {
      warehouseId = await saveXqWarehouse({
        code: finalCode,
        name: finalName,
        countryCode: form.countryCode || 'US',
        enabled: true,
      });
    }
    await loadBase();
    await saveXqStoreWarehouse({
      id: form.id,
      storeId: form.storeId,
      warehouseId,
      physicalCode: form.physicalCode.trim() || undefined,
      physicalName: finalName,
      countryCode: form.countryCode || 'US',
      priority: form.priority ?? 1,
      shippingMethod: joinShipping(form.shippingList) || undefined,
      courierAccount: form.courierAccount.trim() || undefined,
      enabled: form.enabled !== false,
    });
    message.success('已保存');
    dialogOpen.value = false;
    selectedStoreId.value = form.storeId;
    await loadRows();
  } catch (error: any) {
    message.error(error?.message || '保存失败');
  } finally {
    saving.value = false;
  }
}

async function patchRow(
  row: XqStoreWarehouseApi.StoreWarehouse,
  patch: Partial<XqStoreWarehouseApi.StoreWarehouseSaveReq>,
) {
  try {
    await saveXqStoreWarehouse({
      id: row.id,
      storeId: row.storeId,
      warehouseId: row.warehouseId,
      physicalCode: row.physicalCode,
      physicalName: row.physicalName,
      countryCode: row.countryCode,
      priority: row.priority,
      shippingMethod: row.shippingMethod,
      courierAccount: row.courierAccount,
      enabled: row.enabled,
      remark: row.remark,
      ...patch,
    });
    Object.assign(row, patch);
  } catch (error: any) {
    message.error(error?.message || '更新失败');
    await loadRows();
  }
}

async function removeShippingItem(
  row: XqStoreWarehouseApi.StoreWarehouse,
  idx: number,
) {
  const list = splitShipping(row.shippingMethod);
  list.splice(idx, 1);
  await patchRow(row, { shippingMethod: joinShipping(list) || '' });
  row.shippingMethod = joinShipping(list);
}

async function handleDelete(row: XqStoreWarehouseApi.StoreWarehouse) {
  Modal.confirm({
    title: '删除该发货仓配置？',
    okType: 'danger',
    async onOk() {
      await deleteXqStoreWarehouse(row.id);
      message.success('已删除');
      await loadRows();
    },
  });
}

onMounted(async () => {
  loading.value = true;
  try {
    await loadBase();
    await loadRows();
  } catch (error: any) {
    message.error(error?.message || '加载失败');
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <Page auto-content-height>
    <div class="store-wh-page">
      <div class="toolbar">
        <div class="toolbar-left">
          <Input
            v-model:value="filterKeyword"
            allow-clear
            placeholder="店铺名称"
            class="w-44"
            @press-enter="handleQuery"
          />
          <Select
            v-model:value="filterPlatformId"
            allow-clear
            placeholder="平台"
            class="w-36"
            :options="platformOptions"
          />
          <Select
            v-model:value="filterStoreId"
            allow-clear
            show-search
            option-filter-prop="label"
            placeholder="平台店铺名称"
            class="w-48"
            :options="storeOptions"
          />
          <Button type="primary" @click="handleQuery">查询</Button>
          <span class="warn-text">
            数据发生修改，请核实好订单发货仓库数据，以免配置问题产生异常费用!
          </span>
        </div>
        <Button
          type="primary"
          :disabled="!selectedStoreId"
          @click="openAddWarehouse()"
        >
          配置
        </Button>
      </div>

      <Spin :spinning="loading">
        <div class="split">
          <!-- 左：全店铺，点选 / 查询 -->
          <div class="left-pane">
            <div class="pane-title">店铺信息</div>
            <div v-if="!leftStores.length" class="pane-empty">暂无启用店铺</div>
            <div
              v-for="store in leftStores"
              :key="store.id"
              class="store-item"
              :class="{ active: store.id === selectedStoreId }"
              @click="selectStore(store.id)"
            >
              <div class="store-text">
                <div>
                  <span class="label">平台：</span>{{ store.platformName || store.platformCode || '-' }}
                </div>
                <div><span class="label">店铺：</span>{{ store.name }}</div>
                <div><span class="label">国家/地区：</span>美国</div>
              </div>
              <button
                type="button"
                class="plus-btn"
                title="为该店新增发货仓"
                @click.stop="openAddWarehouse(store.id)"
              >
                +
              </button>
            </div>
          </div>

          <!-- 右：当前店可配多个仓库 -->
          <div class="right-pane">
            <div class="right-head">
              <div class="h-wh">发货仓库</div>
              <div class="h-ship">默认运输方式</div>
              <div class="h-courier">快递账号</div>
              <div class="h-status">状态</div>
              <div class="h-actions">操作</div>
            </div>

            <div v-if="!selectedStore" class="pane-empty">
              请先在左侧选择店铺
            </div>

            <template v-else>
              <div v-if="!rightBindings.length" class="bind-empty">
                <span>「{{ selectedStore.name }}」尚未配置发货仓</span>
                <Button type="link" @click="openAddWarehouse(selectedStore.id)">
                  点击新增
                </Button>
              </div>

              <div
                v-for="record in rightBindings"
                :key="record.id"
                class="bind-row"
              >
                <div class="h-wh">
                  <div class="cell-body">
                    <div>
                      <span class="label">国家/地区：</span>{{ countryLabel(record.countryCode) }}
                    </div>
                    <div>
                      <span class="label">仓库名称：</span>{{ warehouseDisplayName(record) }}
                    </div>
                    <div class="code-line">
                      <span class="label">店铺仓编码：</span>
                      <span>{{ record.physicalCode || '-' }}</span>
                      <Select
                        size="small"
                        class="priority-select"
                        :value="record.priority ?? 1"
                        :options="priorityOptions"
                        @change="
                          (v: number) => patchRow(record, { priority: v })
                        "
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    class="plus-btn"
                    title="再为该店新增一个仓库"
                    @click="openAddWarehouse(selectedStore.id)"
                  >
                    +
                  </button>
                </div>

                <div class="h-ship">
                  <div class="ship-list">
                    <div
                      v-for="(m, idx) in splitShipping(record.shippingMethod)"
                      :key="`${record.id}-${idx}`"
                      class="ship-item"
                    >
                      <span :title="m">{{ m }}</span>
                      <button
                        type="button"
                        class="x-btn"
                        @click="removeShippingItem(record, idx)"
                      >
                        ×
                      </button>
                    </div>
                    <button
                      type="button"
                      class="plus-btn"
                      title="编辑运输方式"
                      @click="openEdit(record)"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div class="h-courier">
                  <div class="courier-body">
                    <span v-if="record.courierAccount">{{
                      record.courierAccount
                    }}</span>
                    <button
                      type="button"
                      class="plus-btn"
                      title="配置快递账号"
                      @click="openEdit(record)"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div class="h-status">
                  <Switch
                    :checked="record.enabled !== false"
                    checked-children="启用"
                    @change="
                      (checked: boolean) =>
                        patchRow(record, { enabled: checked })
                    "
                  />
                </div>

                <div class="h-actions">
                  <Button type="link" size="small" @click="openEdit(record)">
                    编辑
                  </Button>
                  <Button
                    type="link"
                    size="small"
                    danger
                    @click="handleDelete(record)"
                  >
                    删除
                  </Button>
                </div>
              </div>
            </template>
          </div>
        </div>
      </Spin>
    </div>

    <Modal
      v-model:open="dialogOpen"
      :title="form.id ? '编辑发货仓' : '新增发货仓'"
      :confirm-loading="saving"
      width="560px"
      destroy-on-close
      @ok="handleSave"
    >
      <Form layout="vertical" class="mt-2">
        <FormItem label="店铺" required>
          <Input
            :value="
              enabledStores.find((s) => s.id === form.storeId)?.name ||
              String(form.storeId)
            "
            disabled
          />
        </FormItem>

        <FormItem
          v-if="warehouseOptions.length"
          label="从已有仓库选择"
          extra="可选；选中后带出下方编码/名称，仍可修改"
        >
          <Select
            :value="form.warehouseId"
            allow-clear
            show-search
            option-filter-prop="label"
            :options="warehouseOptions"
            placeholder="可选"
            @update:value="onWarehousePick"
          />
        </FormItem>

        <FormItem label="发货仓库编码" required>
          <Input
            v-model:value="form.warehouseCode"
            placeholder="如 USWE-8"
            allow-clear
          />
        </FormItem>
        <FormItem label="发货仓库名称" required>
          <Input
            v-model:value="form.warehouseName"
            placeholder="如 洛杉矶8号仓"
            allow-clear
          />
        </FormItem>
        <FormItem label="店铺仓编码" extra="店铺侧仓码，如 208185">
          <Input
            v-model:value="form.physicalCode"
            placeholder="208185"
            allow-clear
          />
        </FormItem>
        <FormItem label="国家/地区">
          <Input v-model:value="form.countryCode" placeholder="US" />
        </FormItem>
        <FormItem label="优先级">
          <Select
            v-model:value="form.priority"
            :options="priorityOptions"
            class="w-full"
          />
        </FormItem>
        <FormItem label="默认运输方式">
          <div class="mb-2 flex flex-wrap gap-2">
            <span
              v-for="(m, idx) in form.shippingList"
              :key="`${m}-${idx}`"
              class="ship-tag"
            >
              <span class="truncate">{{ m }}</span>
              <button type="button" class="x-btn" @click="removeShipping(idx)">
                ×
              </button>
            </span>
          </div>
          <div class="flex w-full gap-2">
            <Input
              v-model:value="shippingInput"
              placeholder="FedEx/FedEx Ground/WAYFAIR_FEDEX_GROUND"
              @press-enter="addShipping"
            />
            <Button @click="addShipping">添加</Button>
          </div>
        </FormItem>
        <FormItem label="快递账号">
          <Input v-model:value="form.courierAccount" allow-clear />
        </FormItem>
      </Form>
    </Modal>
  </Page>
</template>

<style scoped>
.store-wh-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  min-height: 0;
  padding: 4px;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
}

.toolbar-left {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.warn-text {
  font-size: 13px;
  font-weight: 500;
  color: #ff4d4f;
}

.split {
  display: grid;
  grid-template-columns: 260px 1fr;
  min-height: 520px;
  overflow: hidden;
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
}

.left-pane {
  overflow: auto;
  background: #fafafa;
  border-right: 1px solid #f0f0f0;
}

.pane-title {
  position: sticky;
  top: 0;
  z-index: 1;
  padding: 12px 14px;
  font-weight: 600;
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
}

.pane-empty,
.bind-empty {
  display: flex;
  gap: 4px;
  align-items: center;
  justify-content: center;
  padding: 40px 16px;
  font-size: 13px;
  color: rgb(0 0 0 / 45%);
}

.store-item {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  justify-content: space-between;
  padding: 12px 14px;
  cursor: pointer;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
}

.store-item:hover {
  background: #f5f9ff;
}

.store-item.active {
  background: #e6f4ff;
  box-shadow: inset 3px 0 0 #1677ff;
}

.store-text {
  font-size: 13px;
  line-height: 1.75;
}

.label {
  color: rgb(0 0 0 / 65%);
}

.right-pane {
  min-width: 0;
  overflow: auto;
}

.right-head,
.bind-row {
  display: grid;
  grid-template-columns:
    minmax(260px, 1.3fr) minmax(220px, 1.2fr)
    120px 100px 120px;
  min-width: 900px;
}

.right-head {
  position: sticky;
  top: 0;
  z-index: 1;
  font-weight: 600;
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
}

.right-head > div {
  padding: 12px;
}

.bind-row {
  border-bottom: 1px solid #f5f5f5;
}

.h-wh,
.h-ship,
.h-courier,
.h-status,
.h-actions {
  padding: 12px;
  border-right: 1px solid #f5f5f5;
}

.h-actions {
  border-right: none;
}

.h-wh {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  justify-content: space-between;
}

.cell-body {
  font-size: 13px;
  line-height: 1.8;
}

.code-line {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.priority-select {
  width: 72px;
}

.ship-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-start;
}

.ship-item {
  display: flex;
  gap: 6px;
  align-items: center;
  max-width: 100%;
  font-size: 12px;
  word-break: break-all;
}

.courier-body {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  justify-content: space-between;
  min-height: 24px;
  font-size: 13px;
}

.h-status,
.h-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.plus-btn {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  margin-top: 2px;
  font-size: 14px;
  line-height: 1;
  color: #1677ff;
  cursor: pointer;
  background: #fff;
  border: 1px solid #1677ff;
  border-radius: 999px;
}

.plus-btn:hover {
  background: #e6f4ff;
}

.x-btn {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  font-size: 12px;
  color: #ff4d4f;
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: 999px;
}

.x-btn:hover {
  background: #fff1f0;
}

.ship-tag {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  max-width: 100%;
  padding: 2px 8px;
  font-size: 12px;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
}
</style>
