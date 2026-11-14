<script lang="ts" setup>
import type { AiOcrApi } from '#/api/ai/ocr';

import { reactive, ref } from 'vue';

import { confirm, useVbenDrawer } from '@vben/common-ui';
import { AiOcrStatusEnum } from '@vben/constants';
import { formatDate } from '@vben/utils';

import {
  Button,
  Empty,
  Image,
  message,
  Pagination,
  Spin,
  Tag,
} from 'antdv-next';

import { deleteOcrMy, getOcrMyPage } from '#/api/ai/ocr';
import { $t } from '#/locales';

/** AI 文字识别：识别记录抽屉 */
defineOptions({ name: 'AiOcrHistoryDrawer' });

defineProps<{
  currentId?: number; // 工作台当前打开的记录编号
}>();

const emit = defineEmits<{
  deleted: [id: number]; // 删除记录
  open: [item: AiOcrApi.Ocr]; // 打开记录：恢复到工作台
}>();

const loading = ref(false); // 列表的加载中
const list = ref<AiOcrApi.Ocr[]>([]); // 列表的数据
const total = ref(0); // 列表的总数
const queryParams = reactive({ pageNo: 1, pageSize: 10 });

/** 查询列表 */
async function getList() {
  loading.value = true;
  try {
    const data = await getOcrMyPage(queryParams);
    list.value = data.list;
    total.value = data.total;
  } finally {
    loading.value = false;
  }
}

/** 删除：图片文件不随记录删除 */
async function handleDelete(item: AiOcrApi.Ocr) {
  try {
    await confirm('确定删除该识别记录吗？');
  } catch {
    return;
  }
  await deleteOcrMy(item.id);
  message.success($t('ui.actionMessage.deleteSuccess', [item.fileName]));
  emit('deleted', item.id);
  await getList();
}

const [Drawer] = useVbenDrawer({
  footer: false,
  onOpenChange(isOpen: boolean) {
    if (isOpen) {
      getList();
    }
  },
});

defineExpose({ getList });
</script>

<template>
  <Drawer title="识别记录" class="w-[460px]">
    <div class="flex h-full flex-col">
      <div class="min-h-0 flex-1 overflow-y-auto pr-1">
        <Spin :spinning="loading">
          <div class="min-h-[200px]">
            <Empty
              v-if="!loading && list.length === 0"
              description="暂无识别记录"
              class="pt-10"
            />
            <div
              v-for="item in list"
              :key="item.id"
              class="mb-2.5 flex gap-3 rounded-lg border border-solid p-2.5"
              :class="
                item.id === currentId
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:shadow-md'
              "
            >
              <Image
                :src="item.imageUrl"
                :width="64"
                :height="64"
                class="flex-shrink-0 rounded-md object-cover"
              />
              <div class="flex min-w-0 flex-1 flex-col gap-1">
                <div class="flex items-center justify-between gap-2">
                  <span class="truncate text-sm font-medium">
                    {{ item.fileName }}
                  </span>
                  <Tag
                    :color="
                      item.status === AiOcrStatusEnum.SUCCESS
                        ? 'success'
                        : 'error'
                    "
                    class="!mr-0 flex-shrink-0"
                  >
                    {{
                      item.status === AiOcrStatusEnum.SUCCESS
                        ? '识别成功'
                        : '识别失败'
                    }}
                  </Tag>
                </div>
                <div class="truncate text-xs text-gray-500">
                  {{ formatDate(item.createTime, 'YYYY-MM-DD HH:mm') }} ·
                  {{ item.modelName }}
                </div>
                <div
                  v-if="item.status === AiOcrStatusEnum.FAIL"
                  class="line-clamp-2 break-all text-xs text-red-500"
                >
                  {{ item.errorMessage }}
                </div>
                <div
                  v-else
                  class="line-clamp-2 whitespace-pre-wrap break-all text-xs"
                >
                  {{ item.originalText || '（无文字）' }}
                </div>
                <div class="flex justify-end gap-2">
                  <Button
                    type="link"
                    size="small"
                    class="!px-0"
                    @click="emit('open', item)"
                  >
                    打开
                  </Button>
                  <Button
                    type="link"
                    size="small"
                    danger
                    class="!px-0"
                    @click="handleDelete(item)"
                  >
                    删除
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Spin>
      </div>
      <div class="flex justify-end pt-3">
        <Pagination
          v-model:current="queryParams.pageNo"
          v-model:page-size="queryParams.pageSize"
          :total="total"
          size="small"
          show-size-changer
          @change="() => getList()"
        />
      </div>
    </div>
  </Drawer>
</template>
