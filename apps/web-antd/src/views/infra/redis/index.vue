<script lang="ts" setup>
import type { InfraRedisApi } from '#/api/infra/redis';

import { Card } from 'ant-design-vue';
import { Page } from '@vben/common-ui';
import Memory from './modules/memory.vue';
import Commands from './modules/commands.vue';
import Info from './modules/info.vue';
import { DocAlert } from '#/components/doc-alert';

import { onMounted, ref } from 'vue';
import { getRedisMonitorInfo } from '#/api/infra/redis';

const redisData = ref<InfraRedisApi.InfraRedisMonitorInfo>();

/** 统一加载 Redis 数据 */
const loadRedisData = async () => {
  try {
    redisData.value = await getRedisMonitorInfo();
  } catch (error) {
    console.error('加载 Redis 数据失败', error);
  }
};

onMounted(() => {
  loadRedisData();
});
</script>

<template>
  <Page auto-content-height>
    <DocAlert title="Redis 缓存" url="https://doc.iocoder.cn/redis-cache/" />
    <DocAlert title="本地缓存" url="https://doc.iocoder.cn/local-cache/" />

    <Card class="mt-5" title="Redis 概览">
      <Info :redis-data="redisData" />
    </Card>

    <div class="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card title="内存使用">
        <Memory :redis-data="redisData" />
      </Card>

      <Card title="命令统计">
        <Commands :redis-data="redisData" />
      </Card>
    </div>
  </Page>
</template>
