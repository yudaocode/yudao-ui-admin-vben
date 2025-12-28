<script lang="ts" setup>
import { onMounted, ref } from 'vue';

import { DICT_TYPE } from '@vben/constants';
import { IconifyIcon } from '@vben/icons';

import {
  Button,
  Card,
  Col,
  Empty,
  Pagination,
  Popconfirm,
  Row,
  Tooltip,
} from 'ant-design-vue';

import { getDevicePage } from '#/api/iot/device/device';
import { DictTag } from '#/components/dict-tag';

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
              <DictTag
                :type="DICT_TYPE.IOT_DEVICE_STATE"
                :value="item.state"
                class="status-tag"
              />
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
                  <DictTag
                    :type="DICT_TYPE.IOT_PRODUCT_DEVICE_TYPE"
                    :value="item.deviceType"
                    class="info-tag m-0"
                  />
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
      background: linear-gradient(135deg, #40a9ff 0%, #1890ff 100%);
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

    // 状态标签
    .status-tag {
      font-size: 12px;
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
          color: #fa8c16;
          border-color: #fa8c16;

          &:hover {
            color: white;
            background: #fa8c16;
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
