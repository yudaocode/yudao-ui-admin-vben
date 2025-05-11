<script lang="ts" setup>
import type { InfraRedisApi } from '#/api/infra/redis';

import { NDescriptions, NDescriptionsItem } from 'naive-ui';

defineProps<{
  redisData?: InfraRedisApi.RedisMonitorInfo;
}>();
</script>

<template>
  <NDescriptions
    :column="6"
    bordered
    size="middle"
    :label-style="{ width: '138px' }"
  >
    <NDescriptionsItem label="Redis 版本">
      {{ redisData?.info?.redis_version }}
    </NDescriptionsItem>
    <NDescriptionsItem label="运行模式">
      {{ redisData?.info?.redis_mode === 'standalone' ? '单机' : '集群' }}
    </NDescriptionsItem>
    <NDescriptionsItem label="端口">
      {{ redisData?.info?.tcp_port }}
    </NDescriptionsItem>
    <NDescriptionsItem label="客户端数">
      {{ redisData?.info?.connected_clients }}
    </NDescriptionsItem>
    <NDescriptionsItem label="运行时间(天)">
      {{ redisData?.info?.uptime_in_days }}
    </NDescriptionsItem>
    <NDescriptionsItem label="使用内存">
      {{ redisData?.info?.used_memory_human }}
    </NDescriptionsItem>
    <NDescriptionsItem label="使用 CPU">
      {{
        redisData?.info
          ? parseFloat(redisData?.info?.used_cpu_user_children).toFixed(2)
          : ''
      }}
    </NDescriptionsItem>
    <NDescriptionsItem label="内存配置">
      {{ redisData?.info?.maxmemory_human }}
    </NDescriptionsItem>
    <NDescriptionsItem label="AOF 是否开启">
      {{ redisData?.info?.aof_enabled === '0' ? '否' : '是' }}
    </NDescriptionsItem>
    <NDescriptionsItem label="RDB 是否成功">
      {{ redisData?.info?.rdb_last_bgsave_status }}
    </NDescriptionsItem>
    <NDescriptionsItem label="Key 数量">
      {{ redisData?.dbSize }}
    </NDescriptionsItem>
    <NDescriptionsItem label="网络入口/出口">
      {{ redisData?.info?.instantaneous_input_kbps }}kps /
      {{ redisData?.info?.instantaneous_output_kbps }}kps
    </NDescriptionsItem>
  </NDescriptions>
</template>
