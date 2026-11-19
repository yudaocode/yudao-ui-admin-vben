<script lang="ts" setup>
import type { AiAsrApi } from '#/api/ai/asr';

import { reactive, ref } from 'vue';

import { confirm, useVbenDrawer } from '@vben/common-ui';
import { AiAsrStatusEnum } from '@vben/constants';
import { formatDate } from '@vben/utils';

import { Button, Empty, message, Pagination, Spin, Tag } from 'ant-design-vue';

import { deleteAsrMy, getAsrMyPage } from '#/api/ai/asr';
import { $t } from '#/locales';

/** AI 语音识别：识别记录抽屉 */
defineOptions({ name: 'AiAsrHistoryDrawer' });

defineProps<{
  currentId?: number; // 工作台当前打开的记录编号
}>();

const emit = defineEmits<{
  deleted: [id: number]; // 删除记录
  open: [item: AiAsrApi.Asr]; // 打开记录：恢复到工作台
}>();

const loading = ref(false); // 列表的加载中
const list = ref<AiAsrApi.Asr[]>([]); // 列表的数据
const total = ref(0); // 列表的总数
const queryParams = reactive({ pageNo: 1, pageSize: 10 });

let listSeq = 0; // 列表请求序号：只采用最后一次请求的结果，避免旧响应覆盖新数据

/** 查询列表 */
async function getList() {
  const seq = ++listSeq;
  loading.value = true;
  try {
    const data = await getAsrMyPage(queryParams);
    if (seq !== listSeq) {
      return;
    }
    list.value = data.list;
    total.value = data.total;
  } finally {
    if (seq === listSeq) {
      loading.value = false;
    }
  }
}

/** 删除：音频文件不随记录删除 */
async function handleDelete(item: AiAsrApi.Asr) {
  try {
    await confirm('确定删除该识别记录吗？');
  } catch {
    return;
  }
  await deleteAsrMy(item.id);
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
              class="mb-2.5 flex flex-col gap-1 rounded-lg border border-solid p-2.5"
              :class="
                item.id === currentId
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:shadow-md'
              "
            >
              <div class="flex items-center justify-between gap-2">
                <span class="truncate text-sm font-medium">
                  {{ item.fileName }}
                </span>
                <Tag
                  :color="
                    item.status === AiAsrStatusEnum.SUCCESS
                      ? 'success'
                      : 'error'
                  "
                  class="!mr-0 flex-shrink-0"
                >
                  {{
                    item.status === AiAsrStatusEnum.SUCCESS
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
                v-if="item.status === AiAsrStatusEnum.FAIL"
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
