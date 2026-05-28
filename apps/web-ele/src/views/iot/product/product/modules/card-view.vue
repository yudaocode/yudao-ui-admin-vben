<script lang="ts" setup>
import { onMounted, ref } from 'vue';

import { useAccess } from '@vben/access';
import { DICT_TYPE, ProductStatusEnum } from '@vben/constants';
import { IconifyIcon } from '@vben/icons';
import { isHttpUrl } from '@vben/utils';

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

import { getProductPage } from '#/api/iot/product/product';
import defaultPicUrl from '#/assets/imgs/iot/device.png';
import defaultIconUrl from '#/assets/svgs/iot/cube.svg';
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

const { hasAccessByCodes } = useAccess();

const loading = ref(false);
const list = ref<any[]>([]);
const total = ref(0);
const queryParams = ref({
  pageNo: 1,
  pageSize: 12,
});

/** 获取分类名称 */
function getCategoryName(item: any) {
  const category = props.categoryList.find((c: any) => c.id === item.categoryId);
  return item.categoryName || category?.name || '未分类';
}

/** 是否按图片 URL 渲染产品图标 */
function isImageIcon(icon?: string) {
  if (!icon) {
    return true;
  }
  return isHttpUrl(icon);
}

/** 产品图标 fallback */
function getProductIcon(icon?: string) {
  return icon || defaultIconUrl;
}

/** 产品图片 fallback */
function getProductPic(picUrl?: string) {
  return picUrl || defaultPicUrl;
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

/** 处理分页变化 */
function handlePageChange() {
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
  <div>
    <!-- 产品卡片列表 -->
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
                <img
                  v-if="isImageIcon(item.icon)"
                  :src="getProductIcon(item.icon)"
                  alt=""
                  class="size-6 object-contain"
                />
                <IconifyIcon
                  v-else
                  :icon="item.icon"
                  class="text-xl"
                />
              </div>
              <div class="ml-3 min-w-0 flex-1">
                <div
                  class="truncate text-[15px] font-semibold leading-9 dark:text-white/85"
                >
                  {{ item.name }}
                </div>
              </div>
            </div>
            <!-- 内容区域 -->
            <div class="mb-3 flex items-start">
              <div class="flex-1">
                <div class="mb-2 flex items-center text-[13px]">
                  <span class="mr-2 shrink-0 opacity-65 dark:text-white/65">
                    产品分类
                  </span>
                  <span class="truncate font-medium text-foreground">
                    {{ getCategoryName(item) }}
                  </span>
                </div>
                <div class="mb-2 flex items-center text-[13px]">
                  <span class="mr-2 shrink-0 opacity-65 dark:text-white/65">
                    产品类型
                  </span>
                  <DictTag
                    :type="DICT_TYPE.IOT_PRODUCT_DEVICE_TYPE"
                    :value="item.deviceType"
                    class="m-0 text-xs"
                  />
                </div>
                <div class="flex items-center text-[13px]">
                  <span class="mr-2 shrink-0 opacity-65 dark:text-white/65">
                    产品标识
                  </span>
                  <ElTooltip
                    :content="item.productKey || item.id"
                    placement="top"
                  >
                    <span
                      class="inline-block max-w-[150px] cursor-pointer truncate align-middle font-mono text-xs opacity-85 dark:text-white/75"
                    >
                      {{ item.productKey || item.id }}
                    </span>
                  </ElTooltip>
                </div>
              </div>
              <!-- 产品图片 -->
              <div
                class="flex size-20 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#40a9ff15] to-[#1890ff15] text-[#1890ff] dark:from-[#40a9ff25] dark:to-[#1890ff25] dark:text-[#69c0ff]"
              >
                <ElImage
                  :src="getProductPic(item.picUrl)"
                  :preview-src-list="[getProductPic(item.picUrl)]"
                  class="size-full rounded object-cover"
                />
              </div>
            </div>
            <!-- 按钮组 -->
            <div class="mt-auto flex gap-2 border-t border-border pt-3 [&_.el-button+.el-button]:!ml-0">
              <ElButton
                v-if="hasAccessByCodes(['iot:product:update'])"
                size="small"
                class="!h-8 min-w-0 flex-1 rounded-md !border-[#1890ff] !text-[13px] !text-[#1890ff] transition-all duration-200 hover:!bg-[#1890ff] hover:!text-white"
                @click="emit('edit', item)"
              >
                <IconifyIcon icon="lucide:edit" class="mr-1" />
                编辑
              </ElButton>
              <ElButton
                v-if="hasAccessByCodes(['iot:product:query'])"
                size="small"
                class="!h-8 min-w-0 flex-1 rounded-md !border-[#52c41a] !text-[13px] !text-[#52c41a] transition-all duration-200 hover:!bg-[#52c41a] hover:!text-white"
                @click="emit('detail', item.id)"
              >
                <IconifyIcon icon="lucide:eye" class="mr-1" />
                详情
              </ElButton>
              <ElButton
                v-if="hasAccessByCodes(['iot:thing-model:query'])"
                size="small"
                class="!h-8 min-w-0 flex-1 rounded-md !border-[#fa8c16] !text-[13px] !text-[#fa8c16] transition-all duration-200 hover:!bg-[#fa8c16] hover:!text-white"
                @click="emit('thingModel', item.id)"
              >
                <IconifyIcon icon="lucide:git-branch" class="mr-1" />
                物模型
              </ElButton>
              <template v-if="hasAccessByCodes(['iot:product:delete'])">
                <div
                  class="h-5 w-px self-center bg-[#dcdfe6] dark:bg-[#3a3a3a]"
                ></div>
                <ElTooltip
                  v-if="item.status === ProductStatusEnum.PUBLISHED"
                  content="已发布的产品不能删除"
                >
                  <ElButton
                    size="small"
                    type="danger"
                    disabled
                    class="!h-8 rounded-md p-0 text-[13px] transition-all duration-200 !w-8"
                  >
                    <IconifyIcon icon="lucide:trash-2" class="text-sm" />
                  </ElButton>
                </ElTooltip>
                <ElPopconfirm
                  v-else
                  :title="`确认删除产品 ${item.name} 吗?`"
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
              </template>
            </div>
          </ElCard>
        </ElCol>
      </ElRow>
      <!-- 空状态 -->
      <ElEmpty v-else description="暂无产品数据" class="my-20" />
    </div>

    <!-- 分页 -->
    <div v-if="list.length > 0" class="mt-3 flex justify-end">
      <ElPagination
        v-model:current-page="queryParams.pageNo"
        v-model:page-size="queryParams.pageSize"
        :total="total"
        :page-sizes="[12, 24, 36, 48]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handlePageChange"
        @current-change="handlePageChange"
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
