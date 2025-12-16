<script lang="ts" setup>
// TODO @haohao：product 的 card-view 的意见，这里看看要不要也改改下。
import { onMounted, ref } from 'vue';

import { DeviceStateEnum, DICT_TYPE } from '@vben/constants';
import { getDictLabel, getDictObj } from '@vben/hooks';
import { IconifyIcon } from '@vben/icons';
import { isValidColor, TinyColor } from '@vben/utils';

import {
  Button,
  Card,
  Col,
  Empty,
  Pagination,
  Popconfirm,
  Row,
  Tag,
  Tooltip,
} from 'ant-design-vue';

import { getDevicePage } from '#/api/iot/device/device';

interface Props {
  products: any[];
  deviceGroups: any[];
  searchParams?: {
    deviceName: string;
    deviceType?: number;
    groupId?: number;
    nickname: string;
    productId?: number;
    status?: number;
  };
}

const props = defineProps<Props>();

const emit = defineEmits<{
  create: [];
  delete: [row: any];
  detail: [id: number];
  edit: [row: any];
  model: [id: number];
  productDetail: [productId: number];
}>();

const loading = ref(false);
const list = ref<any[]>([]);
const total = ref(0);
const queryParams = ref({
  pageNo: 1,
  pageSize: 12,
});

/** 默认状态映射 */
const DEFAULT_STATUS_MAP: Record<
  'default' | number,
  { bgColor: string; borderColor: string; color: string; text: string }
> = {
  [DeviceStateEnum.ONLINE]: {
    text: '在线',
    color: '#52c41a',
    bgColor: '#f6ffed',
    borderColor: '#b7eb8f',
  },
  [DeviceStateEnum.OFFLINE]: {
    text: '离线',
    color: '#faad14',
    bgColor: '#fffbe6',
    borderColor: '#ffe58f',
  },
  [DeviceStateEnum.INACTIVE]: {
    text: '未激活',
    color: '#ff4d4f',
    bgColor: '#fff1f0',
    borderColor: '#ffccc7',
  },
  default: {
    text: '未知状态',
    color: '#595959',
    bgColor: '#fafafa',
    borderColor: '#d9d9d9',
  },
};

/** 颜色类型预设 */
const COLOR_TYPE_PRESETS: Record<
  string,
  { bgColor: string; borderColor: string; color: string }
> = {
  success: {
    color: '#52c41a',
    bgColor: '#f6ffed',
    borderColor: '#b7eb8f',
  },
  processing: {
    color: '#1890ff',
    bgColor: '#e6f7ff',
    borderColor: '#91d5ff',
  },
  warning: {
    color: '#faad14',
    bgColor: '#fffbe6',
    borderColor: '#ffe58f',
  },
  error: {
    color: '#ff4d4f',
    bgColor: '#fff1f0',
    borderColor: '#ffccc7',
  },
  default: {
    color: '#595959',
    bgColor: '#fafafa',
    borderColor: '#d9d9d9',
  },
};

/** 规范化颜色类型 */
function normalizeColorType(colorType?: string) {
  switch (colorType) {
    case 'danger': {
      return 'error';
    }
    case 'default':
    case 'error':
    case 'processing':
    case 'success':
    case 'warning': {
      return colorType;
    }
    case 'info': {
      return 'default';
    }
    case 'primary': {
      return 'processing';
    }
    default: {
      return 'default';
    }
  }
}

/** 获取产品名称 */
function getProductName(productId: number) {
  const product = props.products.find((p: any) => p.id === productId);
  return product?.name || '-';
}

/** 获取设备列表 */
async function getList() {
  loading.value = true;
  try {
    const data = await getDevicePage({
      ...queryParams.value,
      ...props.searchParams,
    });
    list.value = data.list || [];
    total.value = data.total || 0;
  } finally {
    loading.value = false;
  }
}

/** 处理页码变化 */
function handlePageChange(page: number, pageSize: number) {
  queryParams.value.pageNo = page;
  queryParams.value.pageSize = pageSize;
  getList();
}

/** 获取设备类型颜色 */
function getDeviceTypeColor(deviceType: number) {
  const colors: Record<number, string> = {
    0: 'blue',
    1: 'cyan',
  };
  return colors[deviceType] || 'default';
}

/** 获取设备状态信息 */
// TODO @haohao：这里可以简化下么？体感看着有点复杂哈；
function getStatusInfo(state: null | number | string | undefined) {
  const parsedState = Number(state);
  const hasNumericState = Number.isFinite(parsedState);
  const fallback = hasNumericState
    ? DEFAULT_STATUS_MAP[parsedState] || DEFAULT_STATUS_MAP.default
    : DEFAULT_STATUS_MAP.default;
  const dict = getDictObj(
    DICT_TYPE.IOT_DEVICE_STATE,
    hasNumericState ? parsedState : state,
  );
  if (dict) {
    if (!dict.colorType && !dict.cssClass) {
      return {
        ...fallback,
        text: dict.label || fallback.text,
      };
    }
    const presetKey = normalizeColorType(dict.colorType);
    if (isValidColor(dict.cssClass)) {
      const baseColor = new TinyColor(dict.cssClass);
      return {
        text: dict.label || fallback.text,
        color: baseColor.toHexString(),
        bgColor: baseColor.clone().setAlpha(0.15).toRgbString(),
        borderColor: baseColor.clone().lighten(30).toHexString(),
      };
    }
    const preset = COLOR_TYPE_PRESETS[presetKey] || COLOR_TYPE_PRESETS.default;
    return {
      text: dict.label || fallback.text,
      ...preset,
    };
  }

  return fallback;
}

defineExpose({
  reload: getList,
  search: () => {
    queryParams.value.pageNo = 1;
    getList();
  },
  query: () => {
    queryParams.value.pageNo = 1;
    getList();
  },
});

/** 初始化 */
onMounted(() => {
  getList();
});
</script>

<template>
  <div class="device-card-view">
    <!-- 设备卡片列表 -->
    <div v-loading="loading" class="min-h-96">
      <Row v-if="list.length > 0" :gutter="[16, 16]">
        <Col
          v-for="item in list"
          :key="item.id"
          :xs="24"
          :sm="12"
          :md="12"
          :lg="6"
        >
          <Card
            :body-style="{ padding: '16px' }"
            class="device-card h-full rounded-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
          >
            <!-- 顶部标题区域 -->
            <div class="mb-3 flex items-center">
              <div class="device-icon">
                <IconifyIcon icon="mdi:chip" class="text-xl" />
              </div>
              <div class="ml-3 min-w-0 flex-1">
                <div class="device-title">{{ item.deviceName }}</div>
              </div>
              <div
                class="status-badge"
                :style="{
                  color: getStatusInfo(item.state).color,
                  backgroundColor: getStatusInfo(item.state).bgColor,
                  borderColor: getStatusInfo(item.state).borderColor,
                }"
              >
                <span class="status-dot"></span>
                {{ getStatusInfo(item.state).text }}
              </div>
            </div>
            <!-- 内容区域 -->
            <div class="mb-3">
              <div class="info-list">
                <div class="info-item">
                  <span class="info-label">所属产品</span>
                  <a
                    class="info-value cursor-pointer text-primary"
                    @click="
                      (e) => {
                        e.stopPropagation();
                        emit('productDetail', item.productId);
                      }
                    "
                  >
                    {{ getProductName(item.productId) }}
                  </a>
                </div>
                <div class="info-item">
                  <span class="info-label">设备类型</span>
                  <Tag
                    :color="getDeviceTypeColor(item.deviceType)"
                    class="info-tag m-0"
                  >
                    {{
                      getDictLabel(
                        DICT_TYPE.IOT_PRODUCT_DEVICE_TYPE,
                        item.deviceType,
                      )
                    }}
                  </Tag>
                </div>
                <div class="info-item">
                  <span class="info-label">Deviceid</span>
                  <Tooltip :title="item.Deviceid || item.id" placement="top">
                    <span class="info-value device-id cursor-pointer">
                      {{ item.Deviceid || item.id }}
                    </span>
                  </Tooltip>
                </div>
              </div>
            </div>
            <!-- 按钮组 -->
            <div class="action-buttons">
              <Button
                size="small"
                class="action-btn action-btn-edit"
                @click="emit('edit', item)"
              >
                <IconifyIcon icon="lucide:edit" class="mr-1" />
                编辑
              </Button>
              <Button
                size="small"
                class="action-btn action-btn-detail"
                @click="emit('detail', item.id)"
              >
                <IconifyIcon icon="lucide:eye" class="mr-1" />
                详情
              </Button>
              <Button
                size="small"
                class="action-btn action-btn-data"
                @click="emit('model', item.id)"
              >
                <IconifyIcon icon="lucide:database" class="mr-1" />
                数据
              </Button>
              <Popconfirm
                :title="`确认删除设备 ${item.deviceName} 吗?`"
                @confirm="emit('delete', item)"
              >
                <Button
                  size="small"
                  danger
                  class="action-btn action-btn-delete !w-8"
                >
                  <IconifyIcon icon="lucide:trash-2" class="text-sm" />
                </Button>
              </Popconfirm>
            </div>
          </Card>
        </Col>
      </Row>
      <!-- 空状态 -->
      <Empty v-else description="暂无设备数据" class="my-20" />
    </div>

    <!-- 分页 -->
    <div v-if="list.length > 0" class="mt-3 flex justify-end">
      <Pagination
        v-model:current="queryParams.pageNo"
        v-model:page-size="queryParams.pageSize"
        :total="total"
        :show-total="(total) => `共 ${total} 条`"
        show-quick-jumper
        show-size-changer
        :page-size-options="['12', '24', '36', '48']"
        @change="handlePageChange"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.device-card-view {
  .device-card {
    overflow: hidden;

    :deep(.ant-card-body) {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    // 设备图标
    .device-icon {
      display: flex;
      flex-shrink: 0;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      color: white;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 8px;
    }

    // 设备标题
    .device-title {
      overflow: hidden;
      text-overflow: ellipsis;
      font-size: 15px;
      font-weight: 600;
      line-height: 36px;
      white-space: nowrap;
    }

    // 状态徽章
    .status-badge {
      display: flex;
      gap: 4px;
      align-items: center;
      padding: 2px 10px;
      font-size: 12px;
      font-weight: 500;
      line-height: 18px;
      border: 1px solid;
      border-radius: 12px;

      .status-dot {
        width: 6px;
        height: 6px;
        background: currentcolor;
        border-radius: 50%;
      }
    }

    // 信息列表
    .info-list {
      .info-item {
        display: flex;
        align-items: center;
        margin-bottom: 8px;
        font-size: 13px;

        &:last-child {
          margin-bottom: 0;
        }

        .info-label {
          flex-shrink: 0;
          margin-right: 8px;
          opacity: 0.65;
        }

        .info-value {
          overflow: hidden;
          text-overflow: ellipsis;
          font-weight: 500;
          white-space: nowrap;

          &.text-primary {
            color: #1890ff;
          }
        }

        .device-id {
          display: inline-block;
          max-width: 150px;
          overflow: hidden;
          text-overflow: ellipsis;
          font-family: 'Courier New', monospace;
          font-size: 12px;
          vertical-align: middle;
          white-space: nowrap;
          opacity: 0.85;
        }

        .info-tag {
          font-size: 12px;
        }
      }
    }

    // 按钮组
    .action-buttons {
      display: flex;
      gap: 8px;
      padding-top: 12px;
      margin-top: auto;
      border-top: 1px solid var(--ant-color-split);

      .action-btn {
        flex: 1;
        height: 32px;
        font-size: 13px;
        border-radius: 6px;
        transition: all 0.2s;

        &.action-btn-edit {
          color: #1890ff;
          border-color: #1890ff;

          &:hover {
            color: white;
            background: #1890ff;
          }
        }

        &.action-btn-detail {
          color: #52c41a;
          border-color: #52c41a;

          &:hover {
            color: white;
            background: #52c41a;
          }
        }

        &.action-btn-data {
          color: #722ed1;
          border-color: #722ed1;

          &:hover {
            color: white;
            background: #722ed1;
          }
        }

        &.action-btn-delete {
          flex: 0 0 32px;
          padding: 0;
        }
      }
    }
  }
}

// 夜间模式适配
html.dark {
  .device-card-view {
    .device-card {
      .device-title {
        color: rgb(255 255 255 / 85%);
      }

      .info-list {
        .info-label {
          color: rgb(255 255 255 / 65%);
        }

        .info-value {
          color: rgb(255 255 255 / 85%);
        }

        .device-id {
          color: rgb(255 255 255 / 75%);
        }
      }
    }
  }
}
</style>
