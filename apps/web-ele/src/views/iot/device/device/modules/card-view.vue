<script lang="ts" setup>
import type { PageParam } from '@vben/request';

import type { IotDeviceApi } from '#/api/iot/device/device';

import { onMounted, ref } from 'vue';

import { useAccess } from '@vben/access';
import { DICT_TYPE } from '@vben/constants';
import { IconifyIcon } from '@vben/icons';

import {
  ElButton,
  ElCard,
  ElCol,
  ElEmpty,
  ElImage,
  ElPagination,
  ElPopconfirm,
  ElRow,
  ElTooltip,
} from 'element-plus';

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
      <ElRow v-if="list.length > 0" :gutter="16">
        <ElCol
          v-for="item in list"
          :key="item.id"
          :xs="24"
          :sm="12"
          :md="12"
          :lg="6"
          class="mb-4"
        >
          <ElCard
            body-class="!p-4 !flex !flex-col !h-full"
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
                    class="cursor-pointer truncate font-medium text-[var(--el-color-primary)]"
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
                  <ElTooltip
                    :content="item.nickname || item.deviceName"
                    placement="top"
                  >
                    <span
                      class="inline-block max-w-[150px] cursor-pointer truncate align-middle text-xs opacity-85 dark:text-white/75"
                    >
                      {{ item.nickname || item.deviceName }}
                    </span>
                  </ElTooltip>
                </div>
              </div>
              <!-- 设备图片 -->
              <div
                class="flex size-20 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#40a9ff15] to-[#1890ff15] text-[#1890ff] dark:from-[#40a9ff25] dark:to-[#1890ff25] dark:text-[#69c0ff]"
              >
                <ElImage
                  v-if="item.picUrl"
                  :src="item.picUrl"
                  :preview-src-list="[item.picUrl]"
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
            <div class="mt-auto flex gap-2 border-t border-border pt-3 [&_.el-button+.el-button]:!ml-0">
              <ElButton
                v-if="hasAccessByCodes(['iot:device:update'])"
                size="small"
                class="!h-8 min-w-0 flex-1 rounded-md !border-[#1890ff] !text-[13px] !text-[#1890ff] transition-all duration-200 hover:!bg-[#1890ff] hover:!text-white"
                @click="emit('edit', item)"
              >
                <IconifyIcon icon="lucide:edit" class="mr-1" />
                编辑
              </ElButton>
              <ElButton
                v-if="hasAccessByCodes(['iot:device:query'])"
                size="small"
                class="!h-8 min-w-0 flex-1 rounded-md !border-[#52c41a] !text-[13px] !text-[#52c41a] transition-all duration-200 hover:!bg-[#52c41a] hover:!text-white"
                @click="emit('detail', item.id!)"
              >
                <IconifyIcon icon="lucide:eye" class="mr-1" />
                详情
              </ElButton>
              <ElButton
                v-if="hasAccessByCodes(['iot:device:query'])"
                size="small"
                class="!h-8 min-w-0 flex-1 rounded-md !border-[#fa8c16] !text-[13px] !text-[#fa8c16] transition-all duration-200 hover:!bg-[#fa8c16] hover:!text-white"
                @click="emit('model', item.id!)"
              >
                <IconifyIcon icon="lucide:database" class="mr-1" />
                数据
              </ElButton>
              <ElPopconfirm
                v-if="hasAccessByCodes(['iot:device:delete'])"
                :title="`确认删除设备 ${item.deviceName} 吗?`"
                @confirm="emit('delete', item)"
              >
                <template #reference>
                  <ElButton
                    size="small"
                    type="danger"
                    class="!h-8 rounded-md p-0 text-[13px] transition-all duration-200 !w-8"
                  >
                    <IconifyIcon icon="lucide:trash-2" class="text-sm" />
                  </ElButton>
                </template>
              </ElPopconfirm>
            </div>
          </ElCard>
        </ElCol>
      </ElRow>
      <!-- 空状态 -->
      <ElEmpty v-else description="暂无设备数据" class="my-20" />
    </div>

    <!-- 分页 -->
    <div v-if="list.length > 0" class="mt-3 flex justify-end">
      <ElPagination
        v-model:current-page="queryParams.pageNo"
        v-model:page-size="queryParams.pageSize"
        :total="total"
        :page-sizes="[12, 24, 36, 48]"
        layout="total, sizes, prev, pager, next, jumper"
        @current-change="
          (page: number) => handlePageChange(page, queryParams.pageSize!)
        "
        @size-change="
          (size: number) => handlePageChange(queryParams.pageNo!, size)
        "
      />
    </div>
  </div>
</template>

<style scoped>
/* Element Plus 默认会在相邻按钮之间加 margin-left:12px，与父容器的 gap-2 叠加导致按钮间距过大，这里清掉 */
.card-action-group :deep(.el-button + .el-button) {
  margin-left: 0;
}
</style>

<style scoped>
/* Element Plus 默认会在相邻按钮之间加 margin-left:12px，与父容器的 gap-2 叠加导致按钮间距过大，这里清掉 */
.card-action-group :deep(.el-button + .el-button) {
  margin-left: 0;
}
</style>
