<!-- IoT 设备选择，使用弹窗展示 -->
<script setup lang="ts">
import type { IotDeviceApi } from '#/api/iot/device/device';
import type { IotDeviceGroupApi } from '#/api/iot/device/group';
import type { IotProductApi } from '#/api/iot/product/product';

import { computed, onMounted, reactive, ref } from 'vue';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';
import { formatDate } from '@vben/utils';

import { message } from 'ant-design-vue';

import { getDevicePage } from '#/api/iot/device/device';
import { getSimpleDeviceGroupList } from '#/api/iot/device/group';
import { getSimpleProductList } from '#/api/iot/product/product';

defineOptions({ name: 'IoTDeviceTableSelect' });

const props = defineProps({
  multiple: {
    type: Boolean,
    default: false,
  },
  productId: {
    type: Number,
    default: null,
  },
});

/** 提交表单 */
const emit = defineEmits(['success']);

// 获取字典选项
const getIntDictOptions = (dictType: string) => {
  return getDictOptions(dictType, 'number');
};

// 日期格式化
const dateFormatter = (_row: any, _column: any, cellValue: any) => {
  return cellValue ? formatDate(cellValue, 'YYYY-MM-DD HH:mm:ss') : '';
};

const dialogVisible = ref(false);
const dialogTitle = ref('设备选择器');
const formLoading = ref(false);
const loading = ref(true); // 列表的加载中
const list = ref<IotDeviceApi.Device[]>([]); // 列表的数据
const total = ref(0); // 列表的总页数
const selectedDevices = ref<IotDeviceApi.Device[]>([]); // 选中的设备列表
const selectedId = ref<number>(); // 单选模式下选中的ID
const products = ref<IotProductApi.Product[]>([]); // 产品列表
const deviceGroups = ref<IotDeviceGroupApi.DeviceGroup[]>([]); // 设备分组列表
const selectedRowKeys = ref<number[]>([]); // 多选模式下选中的keys

const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  deviceName: undefined as string | undefined,
  productId: undefined as number | undefined,
  deviceType: undefined as number | undefined,
  nickname: undefined as string | undefined,
  status: undefined as number | undefined,
  groupId: undefined as number | undefined,
});
const queryFormRef = ref(); // 搜索的表单

// 表格列定义
const columns = computed(() => {
  const baseColumns = [
    {
      title: 'DeviceName',
      dataIndex: 'deviceName',
      key: 'deviceName',
      align: 'center',
    },
    {
      title: '备注名称',
      dataIndex: 'nickname',
      key: 'nickname',
      align: 'center',
    },
    {
      title: '所属产品',
      key: 'productId',
      align: 'center',
    },
    {
      title: '设备类型',
      key: 'deviceType',
      align: 'center',
    },
    {
      title: '所属分组',
      key: 'groupIds',
      align: 'center',
    },
    {
      title: '设备状态',
      key: 'status',
      align: 'center',
    },
    {
      title: '最后上线时间',
      key: 'onlineTime',
      align: 'center',
      width: 180,
    },
  ];

  // 单选模式添加单选列
  if (!props.multiple) {
    baseColumns.unshift({
      title: '',
      key: 'radio',
      width: 55,
      align: 'center',
    } as any);
  }

  return baseColumns;
});

// 多选配置
const rowSelection = computed(() => ({
  selectedRowKeys: selectedRowKeys.value,
  onChange: (keys: number[], rows: IotDeviceApi.Device[]) => {
    selectedRowKeys.value = keys;
    selectedDevices.value = rows;
  },
}));

/** 查询列表 */
const getList = async () => {
  loading.value = true;
  try {
    if (props.productId) {
      queryParams.productId = props.productId;
    }
    const data = await getDevicePage(queryParams);
    list.value = data.list;
    total.value = data.total;
  } finally {
    loading.value = false;
  }
};

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.pageNo = 1;
  getList();
};

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value.resetFields();
  handleQuery();
};

/** 打开弹窗 */
const open = async () => {
  dialogVisible.value = true;
  // 重置选择状态
  selectedDevices.value = [];
  selectedId.value = undefined;
  selectedRowKeys.value = [];
  if (!props.productId) {
    // 获取产品列表
    products.value = await getSimpleProductList();
  }
  // 获取设备列表
  await getList();
};
defineExpose({ open });

/** 处理行点击事件 */
const tableRef = ref();
const handleRowClick = (row: IotDeviceApi.Device) => {
  if (!props.multiple) {
    selectedId.value = row.id;
    selectedDevices.value = [row];
  }
};

/** 处理单选变更事件 */
const handleRadioChange = (row: IotDeviceApi.Device) => {
  selectedId.value = row.id;
  selectedDevices.value = [row];
};

const submitForm = async () => {
  if (selectedDevices.value.length === 0) {
    message.warning({
      content: props.multiple ? '请至少选择一个设备' : '请选择一个设备',
    });
    return;
  }
  emit(
    'success',
    props.multiple ? selectedDevices.value : selectedDevices.value[0],
  );
  dialogVisible.value = false;
};

/** 初始化 */
onMounted(async () => {
  // 获取产品列表
  products.value = await getSimpleProductList();
  // 获取分组列表
  deviceGroups.value = await getSimpleDeviceGroupList();
});
</script>

<template>
  <a-modal
    :title="dialogTitle"
    v-model:open="dialogVisible"
    width="60%"
    :footer="null"
  >
    <ContentWrap>
      <!-- 搜索工作栏 -->
      <a-form
        ref="queryFormRef"
        layout="inline"
        :model="queryParams"
        class="-mb-15px"
      >
        <a-form-item v-if="!props.productId" label="产品" name="productId">
          <a-select
            v-model:value="queryParams.productId"
            placeholder="请选择产品"
            allow-clear
            style="width: 240px"
          >
            <a-select-option
              v-for="product in products"
              :key="product.id"
              :value="product.id"
            >
              {{ product.name }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="DeviceName" name="deviceName">
          <a-input
            v-model:value="queryParams.deviceName"
            placeholder="请输入 DeviceName"
            allow-clear
            @press-enter="handleQuery"
            style="width: 240px"
          />
        </a-form-item>
        <a-form-item label="备注名称" name="nickname">
          <a-input
            v-model:value="queryParams.nickname"
            placeholder="请输入备注名称"
            allow-clear
            @press-enter="handleQuery"
            style="width: 240px"
          />
        </a-form-item>
        <a-form-item label="设备类型" name="deviceType">
          <a-select
            v-model:value="queryParams.deviceType"
            placeholder="请选择设备类型"
            allow-clear
            style="width: 240px"
          >
            <a-select-option
              v-for="dict in getIntDictOptions(
                DICT_TYPE.IOT_PRODUCT_DEVICE_TYPE,
              )"
              :key="dict.value"
              :value="dict.value"
            >
              {{ dict.label }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="设备状态" name="status">
          <a-select
            v-model:value="queryParams.status"
            placeholder="请选择设备状态"
            allow-clear
            style="width: 240px"
          >
            <a-select-option
              v-for="dict in getIntDictOptions(DICT_TYPE.IOT_DEVICE_STATUS)"
              :key="dict.value"
              :value="dict.value"
            >
              {{ dict.label }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="设备分组" name="groupId">
          <a-select
            v-model:value="queryParams.groupId"
            placeholder="请选择设备分组"
            allow-clear
            style="width: 240px"
          >
            <a-select-option
              v-for="group in deviceGroups"
              :key="group.id"
              :value="group.id"
            >
              {{ group.name }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item>
          <a-button @click="handleQuery">
            <Icon class="mr-5px" icon="ep:search" />
            搜索
          </a-button>
          <a-button @click="resetQuery">
            <Icon class="mr-5px" icon="ep:refresh" />
            重置
          </a-button>
        </a-form-item>
      </a-form>
    </ContentWrap>

    <!-- 列表 -->
    <ContentWrap>
      <a-table
        ref="tableRef"
        :loading="loading"
        :data-source="list"
        :columns="columns"
        :pagination="false"
        :row-selection="multiple ? rowSelection : undefined"
        @row-click="handleRowClick"
        :row-key="(record: IotDeviceApi.Device) => record.id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'radio'">
            <a-radio
              :checked="selectedId === record.id"
              @click="() => handleRadioChange(record)"
            />
          </template>
          <template v-else-if="column.key === 'productId'">
            {{ products.find((p) => p.id === record.productId)?.name || '-' }}
          </template>
          <template v-else-if="column.key === 'deviceType'">
            <dict-tag
              :type="DICT_TYPE.IOT_PRODUCT_DEVICE_TYPE"
              :value="record.deviceType"
            />
          </template>
          <template v-else-if="column.key === 'groupIds'">
            <template v-if="record.groupIds?.length">
              <a-tag
                v-for="id in record.groupIds"
                :key="id"
                class="ml-5px"
                size="small"
              >
                {{ deviceGroups.find((g) => g.id === id)?.name }}
              </a-tag>
            </template>
          </template>
          <template v-else-if="column.key === 'status'">
            <dict-tag
              :type="DICT_TYPE.IOT_DEVICE_STATUS"
              :value="record.status"
            />
          </template>
          <template v-else-if="column.key === 'onlineTime'">
            {{ dateFormatter(null, null, record.onlineTime) }}
          </template>
        </template>
      </a-table>

      <!-- 分页 -->
      <Pagination
        v-model:limit="queryParams.pageSize"
        v-model:page="queryParams.pageNo"
        :total="total"
        @pagination="getList"
      />
    </ContentWrap>

    <template #footer>
      <a-button @click="submitForm" type="primary" :disabled="formLoading">
        确 定
      </a-button>
      <a-button @click="dialogVisible = false">取 消</a-button>
    </template>
  </a-modal>
</template>
