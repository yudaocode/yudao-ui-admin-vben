<script lang="ts" setup>
import { onMounted, ref } from 'vue';

import { DICT_TYPE } from '@vben/constants';
import { IconifyIcon } from '@vben/icons';

import {
  Button,
  Card,
  Col,
  Empty,
  Image,
  Pagination,
  Popconfirm,
  Row,
  Tooltip,
} from 'ant-design-vue';

import { getProductPage } from '#/api/iot/product/product';
import { DictTag } from '#/components/dict-tag';

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
  delete: [row: any];
  detail: [productId: number];
  edit: [row: any];
  thingModel: [productId: number];
}>();

const loading = ref(false);
const list = ref<any[]>([]);
const total = ref(0);
const queryParams = ref({
  pageNo: 1,
  pageSize: 12,
});

/** 获取分类名称 */
function getCategoryName(categoryId: number) {
  const category = props.categoryList.find((c: any) => c.id === categoryId);
  return category?.name || '未分类';
}

/** 获取产品列表 */
async function getList() {
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
}

/** 处理页码变化 */
function handlePageChange(page: number, pageSize: number) {
  queryParams.value.pageNo = page;
  queryParams.value.pageSize = pageSize;
  getList();
}

defineExpose({
  reload: getList,
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
  <div class="product-card-view">
    <!-- 产品卡片列表 -->
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
            class="product-card h-full rounded-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
          >
            <!-- 顶部标题区域 -->
            <div class="mb-3 flex items-center">
              <div class="product-icon">
                <IconifyIcon
                  :icon="item.icon || 'lucide:box'"
                  class="text-xl"
                />
              </div>
              <div class="ml-3 min-w-0 flex-1">
                <div class="product-title">{{ item.name }}</div>
              </div>
            </div>
            <!-- 内容区域 -->
            <div class="mb-3 flex items-start">
              <div class="info-list flex-1">
                <div class="info-item">
                  <span class="info-label">产品分类</span>
                  <span class="info-value text-primary">
                    {{ getCategoryName(item.categoryId) }}
                  </span>
                </div>
                <div class="info-item">
                  <span class="info-label">产品类型</span>
                  <DictTag
                    :type="DICT_TYPE.IOT_PRODUCT_DEVICE_TYPE"
                    :value="item.deviceType"
                    class="info-tag m-0"
                  />
                </div>
                <div class="info-item">
                  <span class="info-label">产品标识</span>
                  <Tooltip :title="item.productKey || item.id" placement="top">
                    <span class="info-value product-key cursor-pointer">
                      {{ item.productKey || item.id }}
                    </span>
                  </Tooltip>
                </div>
              </div>
              <!-- 产品图片 -->
              <div class="product-image">
                <Image
                  v-if="item.picUrl"
                  :src="item.picUrl"
                  :preview="true"
                  class="size-full rounded object-cover"
                />
                <IconifyIcon
                  v-else
                  icon="lucide:image"
                  class="text-2xl opacity-50"
                />
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
                class="action-btn action-btn-model"
                @click="emit('thingModel', item.id)"
              >
                <IconifyIcon icon="lucide:git-branch" class="mr-1" />
                物模型
              </Button>
              <Tooltip v-if="item.status === 1" title="已发布的产品不能删除">
                <Button
                  size="small"
                  danger
                  disabled
                  class="action-btn action-btn-delete !w-8"
                >
                  <IconifyIcon icon="lucide:trash-2" class="text-sm" />
                </Button>
              </Tooltip>
              <Popconfirm
                v-else
                :title="`确认删除产品 ${item.name} 吗?`"
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
      <Empty v-else description="暂无产品数据" class="my-20" />
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
.product-card-view {
  .product-card {
    overflow: hidden;

    :deep(.ant-card-body) {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    // 产品图标
    .product-icon {
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

    // 产品标题
    .product-title {
      overflow: hidden;
      text-overflow: ellipsis;
      font-size: 15px;
      font-weight: 600;
      line-height: 36px;
      white-space: nowrap;
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

        .product-key {
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

    // 产品图片
    .product-image {
      display: flex;
      flex-shrink: 0;
      align-items: center;
      justify-content: center;
      width: 80px;
      height: 80px;
      color: #1890ff;
      background: linear-gradient(135deg, #40a9ff15 0%, #1890ff15 100%);
      border-radius: 8px;
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

        &.action-btn-model {
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
  .product-card-view {
    .product-card {
      .product-title {
        color: rgb(255 255 255 / 85%);
      }

      .info-list {
        .info-label {
          color: rgb(255 255 255 / 65%);
        }

        .info-value {
          color: rgb(255 255 255 / 85%);
        }

        .product-key {
          color: rgb(255 255 255 / 75%);
        }
      }

      .product-image {
        color: #69c0ff;
        background: linear-gradient(135deg, #40a9ff25 0%, #1890ff25 100%);
      }
    }
  }
}
</style>
