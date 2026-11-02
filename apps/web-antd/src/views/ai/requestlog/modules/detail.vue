<script lang="ts" setup>
import type { AiRequestLogApi } from '#/api/ai/requestlog';

import { computed, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { useClipboard } from '@vueuse/core';
import { Button, Collapse, Empty, message } from 'ant-design-vue';

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
  bordered: true,
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
    message.success('复制成功');
  } catch {
    message.error('复制失败');
  }
}
</script>

<template>
  <Drawer title="请求日志详情" class="w-[720px]">
    <Empty v-if="loadFailed" description="详情加载失败" />
    <template v-else-if="formData">
      <Descriptions :data="formData">
        <template #requestId="{ data }">
          <span class="font-mono">{{ data.requestId }}</span>
          <Button
            type="link"
            size="small"
            class="ml-2 !p-0"
            @click="handleCopy(data.requestId)"
          >
            <IconifyIcon icon="lucide:copy" class="mr-1 inline-block" />
            复制
          </Button>
        </template>
      </Descriptions>

      <Collapse class="mt-4">
        <Collapse.Panel key="responseMetadata" header="响应元数据">
          <pre
            v-if="metadataText"
            v-text="metadataText"
            class="m-0 max-h-[360px] overflow-auto whitespace-pre rounded bg-gray-50 p-3 font-mono text-xs dark:bg-gray-800"
          ></pre>
          <Empty v-else description="未取得响应元数据" />
        </Collapse.Panel>
      </Collapse>
    </template>
  </Drawer>
</template>
