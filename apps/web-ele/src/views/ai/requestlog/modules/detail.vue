<script lang="ts" setup>
import type { AiRequestLogApi } from '#/api/ai/requestlog';

import { computed, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { useClipboard } from '@vueuse/core';
import {
  ElButton,
  ElCollapse,
  ElCollapseItem,
  ElEmpty,
  ElMessage,
} from 'element-plus';

import { getRequestLog } from '#/api/ai/requestlog';
import { useDescription } from '#/components/description';

import { useDetailSchema } from '../data';

const formData = ref<AiRequestLogApi.RequestLog>(); // 详情数据
const loadFailed = ref(false); // 详情是否加载失败

/** 格式化的响应元数据 */
const metadataText = computed(() => {
  const metadata = formData.value?.responseMetadata;
  return metadata ? JSON.stringify(metadata, null, 2) : '';
});

const [Descriptions] = useDescription({
  border: true,
  column: 2,
  schema: useDetailSchema(),
});

const [Drawer, drawerApi] = useVbenDrawer({
  footer: false,
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      formData.value = undefined;
      loadFailed.value = false;
      return;
    }
    // 加载数据
    const data = drawerApi.getData() as { id: number };
    if (!data?.id) {
      return;
    }
    drawerApi.lock();
    try {
      formData.value = await getRequestLog(data.id);
    } catch {
      loadFailed.value = true;
    } finally {
      drawerApi.unlock();
    }
  },
});

/** 复制请求编号 */
const { copy } = useClipboard({ legacy: true });
async function handleCopy(text: string) {
  try {
    await copy(text);
    ElMessage.success('复制成功');
  } catch {
    ElMessage.error('复制失败');
  }
}
</script>

<template>
  <Drawer title="请求日志详情" class="w-[720px]">
    <ElEmpty v-if="loadFailed" description="详情加载失败" />
    <template v-else-if="formData">
      <Descriptions :data="formData">
        <template #requestId="{ data }">
          <span class="font-mono">{{ data.requestId }}</span>
          <ElButton
            link
            type="primary"
            size="small"
            class="ml-2"
            @click="handleCopy(data.requestId)"
          >
            <IconifyIcon icon="lucide:copy" class="mr-1" />
            复制
          </ElButton>
        </template>
      </Descriptions>

      <ElCollapse class="mt-4">
        <ElCollapseItem name="responseMetadata" title="响应元数据">
          <pre
            v-if="metadataText"
            v-text="metadataText"
            class="m-0 max-h-[360px] overflow-auto whitespace-pre rounded bg-gray-50 p-3 font-mono text-xs dark:bg-gray-800"
          ></pre>
          <ElEmpty v-else description="未取得响应元数据" />
        </ElCollapseItem>
      </ElCollapse>
    </template>
  </Drawer>
</template>
