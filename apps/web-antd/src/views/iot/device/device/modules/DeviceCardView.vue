<script setup lang="ts">
import { onMounted, ref } from 'vue';

import { DICT_TYPE } from '@vben/constants';
import { getDictLabel } from '@vben/hooks';
import { IconifyIcon } from '@vben/icons';

import {
  Button,
  Card,
  Col,
  Empty,
  Pagination,
  Popconfirm,
  Row,
  Tag,
} from 'ant-design-vue';

import { DeviceStateEnum, getDevicePage } from '#/api/iot/device/device';

defineOptions({ name: 'DeviceCardView' });

const props = defineProps<Props>();

const emit = defineEmits<{
  create: [];
  delete: [row: any];
  detail: [id: number];
  edit: [row: any];
  model: [id: number];
  productDetail: [productId: number];
}>();

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

const loading = ref(false);
const list = ref<any[]>([]);
const total = ref(0);
const queryParams = ref({
  pageNo: 1,
  pageSize: 12,
});

// 获取产品名称
const getProductName = (productId: number) => {
  const product = props.products.find((p: any) => p.id === productId);
  return product?.name || '-';
};

// 获取设备列表
const getList = async () => {
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
};

// 处理页码变化
const handlePageChange = (page: number, pageSize: number) => {
  queryParams.value.pageNo = page;
  queryParams.value.pageSize = pageSize;
  getList();
};

// 获取设备类型颜色
const getDeviceTypeColor = (deviceType: number) => {
  const colors: Record<number, string> = {
    0: 'blue',
    1: 'cyan',
  };
  return colors[deviceType] || 'default';
};

// 获取设备状态信息
const getStatusInfo = (state: number) => {
  if (state === DeviceStateEnum.ONLINE) {
    return {
      text: '在线',
      color: '#52c41a',
      bgColor: '#f6ffed',
      borderColor: '#b7eb8f',
    };
  }
  return {
    text: '未激活',
    color: '#ff4d4f',
    bgColor: '#fff1f0',
    borderColor: '#ffccc7',
  };
};

onMounted(() => {
  getList();
});

// 暴露方法供父组件调用
defineExpose({
  reload: getList,
  search: () => {
    queryParams.value.pageNo = 1;
    getList();
  },
});
</script>

<template>
  <div class="device-card-view">
    <!-- 设备卡片列表 -->
    <div v-loading="loading" class="min-h-[400px]">
      <Row v-if="list.length > 0" :gutter="[16, 16]">
        <Col
          v-for="item in list"
          :key="item.id"
          :xs="24"
          :sm="12"
          :md="8"
          :lg="6"
        >
          <Card
            :body-style="{ padding: 0 }"
            class="device-card"
            :bordered="false"
          >
            <!-- 卡片内容 -->
            <div class="card-content">
              <!-- 头部：图标和状态 -->
              <div class="card-header">
                <div class="device-icon">
                  <IconifyIcon icon="mdi:chip" />
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

              <!-- 设备名称 -->
              <div class="device-name" :title="item.deviceName">
                {{ item.deviceName }}
              </div>

              <!-- 信息区域 -->
              <div class="info-section">
                <div class="info-item">
                  <span class="label">所属产品</span>
                  <a
                    class="value link"
                    @click="
                      (e: MouseEvent) => {
                        e.stopPropagation();
                        emit('productDetail', item.productId);
                      }
                    "
                  >
                    {{ getProductName(item.productId) }}
                  </a>
                </div>
                <div class="info-item">
                  <span class="label">设备类型</span>
                  <Tag
                    :color="getDeviceTypeColor(item.deviceType)"
                    size="small"
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
                  <span class="label">Deviceid</span>
                  <span class="value code" :title="item.Deviceid || item.id">
                    {{ item.Deviceid || item.id }}
                  </span>
                </div>
              </div>

              <!-- 操作按钮 -->
              <div class="action-bar">
                <Button
                  type="default"
                  size="small"
                  class="action-btn btn-edit"
                  @click="
                    (e: MouseEvent) => {
                      e.stopPropagation();
                      emit('edit', item);
                    }
                  "
                >
                  <IconifyIcon icon="ph:note-pencil" />
                  编辑
                </Button>
                <Button
                  type="default"
                  size="small"
                  class="action-btn btn-view"
                  @click="
                    (e: MouseEvent) => {
                      e.stopPropagation();
                      emit('detail', item.id);
                    }
                  "
                >
                  <IconifyIcon icon="ph:eye" />
                  详情
                </Button>
                <Button
                  type="default"
                  size="small"
                  class="action-btn btn-data"
                  @click="
                    (e: MouseEvent) => {
                      e.stopPropagation();
                      emit('model', item.id);
                    }
                  "
                >
                  <IconifyIcon icon="ph:database" />
                  数据
                </Button>
                <Popconfirm
                  title="确认删除该设备吗?"
                  @confirm="() => emit('delete', item)"
                >
                  <Button
                    type="default"
                    size="small"
                    class="action-btn btn-delete"
                    @click="(e: MouseEvent) => e.stopPropagation()"
                  >
                    <IconifyIcon icon="ph:trash" />
                  </Button>
                </Popconfirm>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <!-- 空状态 -->
      <Empty v-else description="暂无设备数据" class="my-20" />
    </div>

    <!-- 分页 -->
    <div v-if="list.length > 0" class="mt-6 flex justify-center">
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
    height: 100%;
    border-radius: 8px;
    overflow: hidden;
    box-shadow:
      0 1px 2px 0 rgba(0, 0, 0, 0.03),
      0 1px 6px -1px rgba(0, 0, 0, 0.02),
      0 2px 4px 0 rgba(0, 0, 0, 0.02);
    transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
    border: 1px solid #f0f0f0;
    background: #fff;

    &:hover {
      box-shadow:
        0 1px 2px -2px rgba(0, 0, 0, 0.16),
        0 3px 6px 0 rgba(0, 0, 0, 0.12),
        0 5px 12px 4px rgba(0, 0, 0, 0.09);
      transform: translateY(-4px);
      border-color: #e6e6e6;
    }

    :deep(.ant-card-body) {
      padding: 0;
    }

    .card-content {
      padding: 16px;
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    // 头部区域
    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;

      .device-icon {
        width: 32px;
        height: 32px;
        border-radius: 6px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        font-size: 18px;
        box-shadow: 0 2px 8px rgba(102, 126, 234, 0.25);
      }

      .status-badge {
        padding: 2px 10px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 4px;
        border: 1px solid;
        line-height: 18px;

        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: currentColor;
        }
      }
    }

    // 设备名称
    .device-name {
      font-size: 16px;
      font-weight: 600;
      color: #262626;
      margin-bottom: 16px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      line-height: 24px;
    }

    // 信息区域
    .info-section {
      flex: 1;
      margin-bottom: 16px;

      .info-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
        gap: 8px;

        &:last-child {
          margin-bottom: 0;
        }

        .label {
          font-size: 13px;
          color: #8c8c8c;
          flex-shrink: 0;
        }

        .value {
          font-size: 13px;
          color: #262626;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          text-align: right;
          flex: 1;
          min-width: 0;

          &.link {
            color: #1890ff;
            cursor: pointer;
            transition: color 0.2s;

            &:hover {
              color: #40a9ff;
            }
          }

          &.code {
            font-family:
              'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', 'Consolas',
              monospace;
            font-size: 12px;
            color: #595959;
            font-weight: 500;
          }
        }
      }
    }

    // 操作按钮栏
    .action-bar {
      display: flex;
      gap: 8px;
      padding-top: 12px;
      border-top: 1px solid #f5f5f5;
      position: relative;
      z-index: 1;

      .action-btn {
        flex: 1;
        height: 32px;
        padding: 4px 8px;
        border-radius: 6px;
        font-size: 13px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
        transition: all 0.2s;
        font-weight: 400;
        border: 1px solid;
        cursor: pointer;
        pointer-events: auto;

        :deep(.anticon) {
          font-size: 16px;
        }

        &.btn-edit {
          color: #1890ff;
          background: #e6f7ff;
          border-color: #91d5ff;

          &:hover {
            color: #fff;
            background: #1890ff;
            border-color: #1890ff;
          }
        }

        &.btn-view {
          color: #faad14;
          background: #fffbe6;
          border-color: #ffe58f;

          &:hover {
            color: #fff;
            background: #faad14;
            border-color: #faad14;
          }
        }

        &.btn-data {
          color: #722ed1;
          background: #f9f0ff;
          border-color: #d3adf7;

          &:hover {
            color: #fff;
            background: #722ed1;
            border-color: #722ed1;
          }
        }

        &.btn-delete {
          flex: 0 0 32px;
          padding: 4px;
          color: #ff4d4f;
          background: #fff1f0;
          border-color: #ffa39e;

          &:hover {
            color: #fff;
            background: #ff4d4f;
            border-color: #ff4d4f;
          }
        }
      }
    }
  }
}
</style>
