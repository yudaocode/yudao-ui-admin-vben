<script lang="ts" setup>
import { computed, nextTick, onMounted, ref } from 'vue';

import {
  IotDeviceMessageMethodEnum,
  IoTThingModelTypeEnum,
} from '@vben/constants';
import { IconifyIcon } from '@vben/icons';

import { ElButton, ElMessage, ElOption, ElSelect } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getSimpleDeviceList } from '#/api/iot/device/device';
import { getSimpleProductList } from '#/api/iot/product/product';
import { getThingModelListByProductId } from '#/api/iot/thingmodel';

import { useSourceConfigColumns } from '../data';

const formData = ref<any[]>([]);
const productList = ref<any[]>([]); // 产品列表
const deviceList = ref<any[]>([]); // 设备列表
const thingModelCache = ref<Map<number, any[]>>(new Map()); // 缓存物模型数据，key 为 productId

/** 上行消息方法列表 */
const upstreamMethods = computed(() => {
  return Object.values(IotDeviceMessageMethodEnum).filter(
    (item) => item.upstream,
  );
});

/** 根据产品 ID 过滤设备 */
function getFilteredDevices(productId: number) {
  if (!productId) return [];
  return deviceList.value.filter(
    (device: any) => device.productId === productId,
  );
}

/** 判断是否需要显示标识符选择器 */
function shouldShowIdentifierSelect(row: any) {
  return [
    IotDeviceMessageMethodEnum.EVENT_POST.method,
    IotDeviceMessageMethodEnum.PROPERTY_POST.method,
  ].includes(row.method);
}

/** 获取物模型选项 */
function getThingModelOptions(row: any) {
  if (!row.productId || !shouldShowIdentifierSelect(row)) {
    return [];
  }
  const thingModels: any[] = thingModelCache.value.get(row.productId) || [];
  let filteredModels: any[] = [];
  if (row.method === IotDeviceMessageMethodEnum.EVENT_POST.method) {
    filteredModels = thingModels.filter(
      (item: any) => item.type === IoTThingModelTypeEnum.EVENT,
    );
  } else if (row.method === IotDeviceMessageMethodEnum.PROPERTY_POST.method) {
    filteredModels = thingModels.filter(
      (item: any) => item.type === IoTThingModelTypeEnum.PROPERTY,
    );
  }
  return filteredModels.map((item: any) => ({
    label: `${item.name} (${item.identifier})`,
    value: item.identifier,
  }));
}

/** 加载产品列表 */
async function loadProductList() {
  try {
    productList.value = await getSimpleProductList();
  } catch (error) {
    console.error('加载产品列表失败:', error);
  }
}

/** 加载设备列表 */
async function loadDeviceList() {
  try {
    deviceList.value = await getSimpleDeviceList();
  } catch (error) {
    console.error('加载设备列表失败:', error);
  }
}

/** 加载物模型数据 */
async function loadThingModel(productId: number) {
  if (thingModelCache.value.has(productId)) {
    return;
  }
  try {
    const thingModels = await getThingModelListByProductId(productId);
    thingModelCache.value.set(productId, thingModels);
  } catch (error) {
    console.error('加载物模型失败:', error);
  }
}

/** 产品变化时清空设备 / 消息 / 标识符 */
function handleProductChange(rowIndex: number) {
  const row = formData.value[rowIndex];
  row.deviceId = 0;
  row.method = undefined;
  row.identifier = undefined;
  row.identifierLoading = false;
}

/** 消息方法变化时清空标识符 + 按需加载物模型 */
async function handleMethodChange(rowIndex: number) {
  const row = formData.value[rowIndex];
  row.identifier = undefined;
  if (shouldShowIdentifierSelect(row) && row.productId) {
    row.identifierLoading = true;
    await loadThingModel(row.productId);
    row.identifierLoading = false;
  }
}

/** 表格配置 */
const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useSourceConfigColumns(),
    data: formData.value,
    minHeight: 160,
    border: true,
    showOverflow: false,
    rowConfig: { isHover: true, height: 64 },
    pagerConfig: { enabled: false },
    toolbarConfig: { enabled: false },
  },
});

/** 同步 formData 到 vxe-grid */
async function reloadGrid() {
  await nextTick();
  await gridApi.grid?.reloadData(formData.value);
}

/** 新增一行数据源 */
async function handleAdd() {
  formData.value.push({
    productId: undefined,
    deviceId: undefined,
    method: undefined,
    identifier: undefined,
    identifierLoading: false,
  });
  await reloadGrid();
}

/** 删除一行数据源 */
async function handleDelete(rowIndex: number) {
  formData.value.splice(rowIndex, 1);
  await reloadGrid();
}

/** 校验全部行；返回 Promise，失败时 reject 第一条错误信息 */
function validate() {
  if (formData.value.length === 0) {
    ElMessage.error('请至少添加一条数据源配置');
    return Promise.reject(new Error('数据源配置不能为空'));
  }
  for (let i = 0; i < formData.value.length; i++) {
    const row = formData.value[i];
    if (!row.productId) {
      ElMessage.error(`第 ${i + 1} 行：产品不能为空`);
      return Promise.reject(new Error('产品不能为空'));
    }
    if (row.deviceId === undefined || row.deviceId === null) {
      ElMessage.error(`第 ${i + 1} 行：设备不能为空`);
      return Promise.reject(new Error('设备不能为空'));
    }
    if (!row.method) {
      ElMessage.error(`第 ${i + 1} 行：消息方法不能为空`);
      return Promise.reject(new Error('消息方法不能为空'));
    }
  }
  return Promise.resolve();
}

/** 取当前所有行的值（剔除 identifierLoading 等仅供 UI 使用的临时字段） */
function getData() {
  return formData.value.map(
    ({ identifierLoading: _identifierLoading, ...rest }) => rest,
  );
}

/** 设置初始数据 */
async function setData(data: any[]) {
  formData.value = (data || []).map((item) => ({
    ...item,
    identifierLoading: false,
  }));
  // 为已有数据预加载物模型；并行加载，不阻塞 reloadGrid
  await Promise.all(
    (data || [])
      .filter((item) => item.productId && shouldShowIdentifierSelect(item))
      .map((item) => loadThingModel(item.productId)),
  );
  await reloadGrid();
}

onMounted(async () => {
  await Promise.all([loadProductList(), loadDeviceList()]);
});

defineExpose({ validate, getData, setData });
</script>

<template>
  <div>
    <Grid>
      <template #productId="{ rowIndex }">
        <ElSelect
          v-model="formData[rowIndex].productId"
          placeholder="请选择产品"
          filterable
          clearable
          class="w-full"
          @change="() => handleProductChange(rowIndex)"
        >
          <ElOption
            v-for="p in productList"
            :key="p.id"
            :label="p.name"
            :value="p.id"
          />
        </ElSelect>
      </template>
      <template #deviceId="{ rowIndex }">
        <ElSelect
          v-model="formData[rowIndex].deviceId"
          placeholder="请选择设备"
          filterable
          clearable
          class="w-full"
        >
          <ElOption label="全部设备" :value="0" />
          <ElOption
            v-for="d in getFilteredDevices(formData[rowIndex].productId)"
            :key="d.id"
            :label="d.deviceName"
            :value="d.id"
          />
        </ElSelect>
      </template>
      <template #method="{ rowIndex }">
        <ElSelect
          v-model="formData[rowIndex].method"
          placeholder="请选择消息"
          filterable
          clearable
          class="w-full"
          @change="() => handleMethodChange(rowIndex)"
        >
          <ElOption
            v-for="m in upstreamMethods"
            :key="m.method"
            :label="m.name"
            :value="m.method"
          />
        </ElSelect>
      </template>
      <template #identifier="{ rowIndex }">
        <ElSelect
          v-if="shouldShowIdentifierSelect(formData[rowIndex])"
          v-model="formData[rowIndex].identifier"
          placeholder="请选择标识符"
          filterable
          clearable
          :loading="formData[rowIndex].identifierLoading"
          class="w-full"
        >
          <ElOption
            v-for="option in getThingModelOptions(formData[rowIndex])"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </ElSelect>
        <span v-else class="text-xs text-muted-foreground">-</span>
      </template>
      <template #actions="{ rowIndex }">
        <ElButton type="danger" link @click="handleDelete(rowIndex)">
          删除
        </ElButton>
      </template>
    </Grid>
    <div class="mt-3 text-center">
      <ElButton type="primary" @click="handleAdd">
        <IconifyIcon icon="ant-design:plus-outlined" class="mr-1" />
        添加数据源
      </ElButton>
    </div>
  </div>
</template>
