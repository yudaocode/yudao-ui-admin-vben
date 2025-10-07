<script setup lang="ts">
import { onMounted, ref } from 'vue';

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
import { DICT_TYPE } from '@vben/constants';
import { getDictLabel } from '@vben/hooks';
import { IconifyIcon } from '@vben/icons';

import { getProductPage } from '#/api/iot/product/product';

defineOptions({ name: 'ProductCardView' });

interface Props {
  categoryList: any[];
  searchParams?: {
    name: string;
    productKey: string;
  };
}

const props = defineProps<Props>();

const emit = defineEmits<{
  create: [];
  edit: [row: any];
  delete: [row: any];
  detail: [productId: number];
  thingModel: [productId: number];
}>();

const loading = ref(false);
const list = ref<any[]>([]);
const total = ref(0);
const queryParams = ref({
  pageNo: 1,
  pageSize: 12,
});

// 获取分类名称
const getCategoryName = (categoryId: number) => {
  const category = props.categoryList.find((c: any) => c.id === categoryId);
  return category?.name || '未分类';
};

// 获取产品列表
const getList = async () => {
  loading.value = true;
  try {
    const data = await getProductPage({
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
    1: 'green',
  };
  return colors[deviceType] || 'default';
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
  <div class="product-card-view">
    <!-- 产品卡片列表 -->
    <div v-loading="loading" class="min-h-[400px]">
      <Row v-if="list.length > 0" :gutter="[16, 16]">
        <Col
          v-for="item in list"
          :key="item.id"
          :xs="24"
          :sm="12"
          :md="12"
          :lg="6"
          class="mb-4"
        >
          <Card
            :body-style="{ padding: '20px' }"
            class="product-card h-full"
          >
            <!-- 顶部标题区域 -->
            <div class="flex items-start mb-4">
              <div class="product-icon">
                <IconifyIcon icon="ant-design:inbox-outlined" class="text-[32px]" />
              </div>
              <div class="ml-3 flex-1 min-w-0">
                <div class="product-title">{{ item.name }}</div>
              </div>
            </div>

            <!-- 内容区域 -->
            <div class="flex items-start mb-4">
              <div class="flex-1 info-list">
                <div class="info-item">
                  <span class="info-label">产品分类</span>
                  <span class="info-value text-primary">{{ getCategoryName(item.categoryId) }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">产品类型</span>
                  <Tag :color="getDeviceTypeColor(item.deviceType)" class="m-0 info-tag">
                    {{ getDictLabel(DICT_TYPE.IOT_PRODUCT_DEVICE_TYPE, item.deviceType) }}
                  </Tag>
                </div>
                <div class="info-item">
                  <span class="info-label">产品标识</span>
                  <Tooltip :title="item.productKey || item.id" placement="top">
                    <span class="info-value product-key">{{ item.productKey || item.id }}</span>
                  </Tooltip>
                </div>
              </div>
              <div class="product-3d-icon">
                <IconifyIcon icon="ant-design:box-plot-outlined" class="text-[80px]" />
              </div>
            </div>

            <!-- 按钮组 -->
            <div class="action-buttons">
              <Button
                size="small"
                class="action-btn action-btn-edit"
                @click="emit('edit', item)"
              >
                <IconifyIcon icon="ant-design:edit-outlined" class="mr-1" />
                编辑
              </Button>
              <Button
                size="small"
                class="action-btn action-btn-detail"
                @click="emit('detail', item.id)"
              >
                <IconifyIcon icon="ant-design:eye-outlined" class="mr-1" />
                详情
              </Button>
              <Button
                size="small"
                class="action-btn action-btn-model"
                @click="emit('thingModel', item.id)"
              >
                <IconifyIcon icon="ant-design:apartment-outlined" class="mr-1" />
                物模型
              </Button>
              <Popconfirm
                :title="`确认删除产品 ${item.name} 吗?`"
                @confirm="emit('delete', item)"
              >
                <Button
                  size="small"
                  danger
                  class="action-btn action-btn-delete"
                >
                  <IconifyIcon icon="ant-design:delete-outlined" />
                </Button>
              </Popconfirm>
            </div>
          </Card>
        </Col>
      </Row>

      <!-- 空状态 -->
      <Empty v-else description="暂无产品数据" class="my-20" />
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
.product-card-view {
  .product-card {
    height: 100%;
    transition: all 0.3s ease;
    border: 1px solid #e8e8e8;
    border-radius: 8px;
    overflow: hidden;

    &:hover {
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
      border-color: #d9d9d9;
      transform: translateY(-2px);
    }

    :deep(.ant-card-body) {
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    // 产品图标
    .product-icon {
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 8px;
      color: white;
      flex-shrink: 0;
    }

    // 产品标题
    .product-title {
      font-size: 16px;
      font-weight: 600;
      color: #1f2937;
      line-height: 1.5;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    // 信息列表
    .info-list {
      .info-item {
        display: flex;
        align-items: center;
        margin-bottom: 10px;
        font-size: 13px;

        &:last-child {
          margin-bottom: 0;
        }

        .info-label {
          color: #6b7280;
          margin-right: 8px;
          flex-shrink: 0;
        }

        .info-value {
          color: #1f2937;
          font-weight: 500;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;

          &.text-primary {
            color: #1890ff;
          }
        }

        .product-key {
          font-family: 'Courier New', monospace;
          font-size: 12px;
          color: #374151;
          display: inline-block;
          max-width: 150px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          vertical-align: middle;
          cursor: help;
        }

        .info-tag {
          font-size: 12px;
        }
      }
    }

    // 3D 图标
    .product-3d-icon {
      width: 100px;
      height: 100px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
      border-radius: 8px;
      flex-shrink: 0;
      color: #667eea;
    }

    // 按钮组
    .action-buttons {
      display: flex;
      gap: 8px;
      padding-top: 12px;
      border-top: 1px solid #f0f0f0;
      margin-top: auto;

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
            background: #1890ff;
            color: white;
          }
        }

        &.action-btn-detail {
          color: #52c41a;
          border-color: #52c41a;

          &:hover {
            background: #52c41a;
            color: white;
          }
        }

        &.action-btn-model {
          color: #722ed1;
          border-color: #722ed1;

          &:hover {
            background: #722ed1;
            color: white;
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
</style>

