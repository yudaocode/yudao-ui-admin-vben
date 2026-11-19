<script lang="ts" setup>
import type { AiAsrApi } from '#/api/ai/asr';

import { reactive, ref } from 'vue';

import { confirm, useVbenDrawer } from '@vben/common-ui';
import { AiAsrStatusEnum } from '@vben/constants';
import { formatDate } from '@vben/utils';

import {
  ElButton,
  ElEmpty,
  ElMessage,
  ElPagination,
  ElTag,
} from 'element-plus';

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

let listSeq = 0; // 请求序号：只采用最后一次请求的结果，丢弃过期响应

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
  ElMessage.success($t('ui.actionMessage.deleteSuccess', [item.fileName]));
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
      <div v-loading="loading" class="min-h-0 flex-1 overflow-y-auto pr-1">
        <ElEmpty v-if="list.length === 0" description="暂无识别记录" />
        <div v-else class="flex flex-col gap-2.5">
          <div
            v-for="item in list"
            :key="item.id"
            class="flex flex-col gap-1 rounded-lg border border-solid p-2.5"
            :class="
              item.id === currentId
                ? 'border-[var(--el-color-primary)] bg-[var(--el-color-primary-light-9)]'
                : 'border-[var(--el-border-color-lighter)] hover:shadow-[var(--el-box-shadow-light)]'
            "
          >
            <div class="flex items-center justify-between gap-2">
              <span class="truncate text-sm font-medium">
                {{ item.fileName }}
              </span>
              <ElTag
                :type="
                  item.status === AiAsrStatusEnum.SUCCESS ? 'success' : 'danger'
                "
                size="small"
                class="flex-shrink-0"
              >
                {{
                  item.status === AiAsrStatusEnum.SUCCESS
                    ? '识别成功'
                    : '识别失败'
                }}
              </ElTag>
            </div>
            <div class="truncate text-xs text-[var(--el-text-color-secondary)]">
              {{ formatDate(item.createTime, 'YYYY-MM-DD HH:mm') }} ·
              {{ item.modelName }}
            </div>
            <div
              v-if="item.status === AiAsrStatusEnum.FAIL"
              class="line-clamp-2 break-all text-xs text-[var(--el-color-danger)]"
            >
              {{ item.errorMessage }}
            </div>
            <div
              v-else
              class="line-clamp-2 whitespace-pre-wrap break-all text-xs text-[var(--el-text-color-regular)]"
            >
              {{ item.originalText || '（无文字）' }}
            </div>
            <div class="flex justify-end gap-2">
              <ElButton
                link
                type="primary"
                size="small"
                @click="emit('open', item)"
              >
                打开
              </ElButton>
              <ElButton
                link
                type="danger"
                size="small"
                @click="handleDelete(item)"
              >
                删除
              </ElButton>
            </div>
          </div>
        </div>
      </div>
      <div class="flex justify-end pt-3">
        <ElPagination
          v-model:current-page="queryParams.pageNo"
          v-model:page-size="queryParams.pageSize"
          :total="total"
          layout="total, prev, pager, next"
          size="small"
          @change="getList()"
        />
      </div>
    </div>
  </Drawer>
</template>
