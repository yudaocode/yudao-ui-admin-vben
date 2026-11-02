<script lang="ts" setup>
import type { AiRequestLogApi } from '#/api/ai/requestlog';

import { ref } from 'vue';

import { Spin } from 'ant-design-vue';

import { getRequestLogStatistics } from '#/api/ai/requestlog';
import { formatTokenCount } from '#/views/ai/utils/format';

/** AI 请求日志的统计：全部匹配筛选条件的记录 */
defineOptions({ name: 'AiRequestLogStatistics' });

const loading = ref(false); // 统计的加载中
const statistics = ref<AiRequestLogApi.RequestLogStatistics>(); // 统计数据
let statisticsRequestId = 0; // 统计请求序号：筛选快速切换时，只采用最后一次请求的结果

/** 查询统计 */
async function getStatistics(params: Record<string, any>) {
  const requestId = ++statisticsRequestId;
  loading.value = true;
  statistics.value = undefined;
  try {
    const data = await getRequestLogStatistics(params);
    if (requestId === statisticsRequestId) {
      statistics.value = data;
    }
  } catch {
    // 错误提示由请求拦截器处理，不影响列表
  } finally {
    if (requestId === statisticsRequestId) {
      loading.value = false;
    }
  }
}

defineExpose({ getStatistics });
</script>

<template>
  <Spin :spinning="loading" class="mb-2 shrink-0">
    <div class="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4">
      <div class="rounded-md bg-card px-4 py-3">
        <div class="text-sm text-muted-foreground">请求总数</div>
        <div class="my-1 text-xl font-semibold">
          {{ statistics?.requestCount.toLocaleString() }}
        </div>
        <div class="text-xs text-muted-foreground">
          成功 {{ statistics?.successCount.toLocaleString() }} / 失败
          {{ statistics?.failCount.toLocaleString() }} / 取消
          {{ statistics?.cancelCount.toLocaleString() }}
        </div>
      </div>
      <div class="rounded-md bg-card px-4 py-3">
        <div class="text-sm text-muted-foreground">已知输入 Token 合计</div>
        <div class="my-1 text-xl font-semibold">
          {{ statistics ? formatTokenCount(statistics.inputTokens) : '' }}
        </div>
        <div class="text-xs text-muted-foreground">
          仅累加已返回输入用量的请求
        </div>
      </div>
      <div class="rounded-md bg-card px-4 py-3">
        <div class="text-sm text-muted-foreground">已知输出 Token 合计</div>
        <div class="my-1 text-xl font-semibold">
          {{ statistics ? formatTokenCount(statistics.outputTokens) : '' }}
        </div>
        <div class="text-xs text-muted-foreground">
          仅累加已返回输出用量的请求
        </div>
      </div>
      <div class="rounded-md bg-card px-4 py-3">
        <div class="text-sm text-muted-foreground">完整用量合计 Token</div>
        <div class="my-1 text-xl font-semibold">
          {{ statistics ? formatTokenCount(statistics.totalTokens) : '' }}
        </div>
        <div class="text-xs text-muted-foreground">
          完整用量 {{ statistics?.knownUsageCount.toLocaleString() }} 条，
          用量未知 {{ statistics?.unknownUsageCount.toLocaleString() }} 条
        </div>
      </div>
    </div>
  </Spin>
</template>
