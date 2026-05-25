<script lang="ts" setup>
import type { PageParam } from '@vben/request';

import type { IotDeviceApi } from '#/api/iot/device/device';

import { onMounted, ref } from 'vue';

import { useAccess } from '@vben/access';
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

const { hasAccessByCodes } = useAccess();

const loading = ref(false);
const list = ref<IotDeviceApi.Device[]>([]);
const total = ref(0);
const queryParams = ref<Partial<PageParam>>({
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
    } as PageParam);
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
  <div>
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
            :body-style="{
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
            }"
            class="h-full overflow-hidden rounded-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
          >
            <!-- 顶部标题区域 -->
            <div class="mb-3 flex items-center">
              <div
                class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#40a9ff] to-[#1890ff] text-white"
              >
                <IconifyIcon icon="mdi:chip" class="text-xl" />
              </div>
              <div class="ml-3 min-w-0 flex-1">
                <div
                  class="truncate text-[15px] font-semibold leading-9 dark:text-white/85"
                >
                  {{ item.deviceName }}
                </div>
              </div>
              <DictTag
                :type="DICT_TYPE.IOT_DEVICE_STATE"
                :value="item.state"
                class="text-xs"
              />
            </div>
            <!-- 内容区域 -->
            <div class="mb-3 flex items-start">
              <div class="flex-1">
                <div class="mb-2 flex items-center text-[13px]">
                  <span class="mr-2 shrink-0 opacity-65 dark:text-white/65">
                    所属产品
                  </span>
                  <a
                    class="cursor-pointer truncate font-medium text-primary"
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
                <div class="mb-2 flex items-center text-[13px]">
                  <span class="mr-2 shrink-0 opacity-65 dark:text-white/65">
                    设备类型
                  </span>
                  <DictTag
                    :type="DICT_TYPE.IOT_PRODUCT_DEVICE_TYPE"
                    :value="item.deviceType"
                    class="m-0 text-xs"
                  />
                </div>
                <div class="flex items-center text-[13px]">
                  <span class="mr-2 shrink-0 opacity-65 dark:text-white/65">
                    备注名称
                  </span>
                  <Tooltip
                    :title="item.nickname || item.deviceName"
                    placement="top"
                  >
                    <span
                      class="inline-block max-w-[150px] cursor-pointer truncate align-middle text-xs opacity-85 dark:text-white/75"
                    >
                      {{ item.nickname || item.deviceName }}
                    </span>
                  </Tooltip>
                </div>
              </div>
              <!-- 设备图片 -->
              <div
                class="flex size-20 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#40a9ff15] to-[#1890ff15] text-[#1890ff] dark:from-[#40a9ff25] dark:to-[#1890ff25] dark:text-[#69c0ff]"
              >
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
            <div class="mt-auto flex gap-2 border-t border-border pt-3">
              <Button
                v-if="hasAccessByCodes(['iot:device:update'])"
                size="small"
                class="!h-8 min-w-0 flex-1 rounded-md !border-[#1890ff] !text-[13px] !text-[#1890ff] transition-all duration-200 hover:!bg-[#1890ff] hover:!text-white"
                @click="emit('edit', item)"
              >
                <IconifyIcon icon="lucide:edit" class="mr-1" />
                编辑
              </Button>
              <Button
                v-if="hasAccessByCodes(['iot:device:query'])"
                size="small"
                class="!h-8 min-w-0 flex-1 rounded-md !border-[#52c41a] !text-[13px] !text-[#52c41a] transition-all duration-200 hover:!bg-[#52c41a] hover:!text-white"
                @click="emit('detail', item.id!)"
              >
                <IconifyIcon icon="lucide:eye" class="mr-1" />
                详情
              </Button>
              <Button
                v-if="hasAccessByCodes(['iot:device:query'])"
                size="small"
                class="!h-8 min-w-0 flex-1 rounded-md !border-[#fa8c16] !text-[13px] !text-[#fa8c16] transition-all duration-200 hover:!bg-[#fa8c16] hover:!text-white"
                @click="emit('model', item.id!)"
              >
                <IconifyIcon icon="lucide:database" class="mr-1" />
                数据
              </Button>
              <template v-if="hasAccessByCodes(['iot:device:delete'])">
                <div
                  class="h-5 w-px self-center bg-[#dcdfe6] dark:bg-[#3a3a3a]"
                ></div>
                <Popconfirm
                  :title="`确认删除设备 ${item.deviceName} 吗?`"
                  @confirm="emit('delete', item)"
                >
                  <Button
                    size="small"
                    danger
                    class="!h-8 rounded-md p-0 text-[13px] transition-all duration-200 !w-8"
                  >
                    <IconifyIcon icon="lucide:trash-2" class="text-sm" />
                  </Button>
                </Popconfirm>
              </template>
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
