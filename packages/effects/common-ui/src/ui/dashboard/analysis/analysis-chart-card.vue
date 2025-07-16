<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from '@vben-core/shadcn-ui';

interface Props {
  title: string;
}

defineOptions({
  name: 'AnalysisChartCard',
});

withDefaults(defineProps<Props>(), {});
</script>

<template>
  <Card>
    <CardHeader>
      <div class="my--1.5 flex flex-row items-center justify-between">
        <CardTitle class="text-xl">{{ title }}</CardTitle>
        <slot name="header-suffix"></slot>
      </div>
    </CardHeader>
    <CardContent>
      <slot></slot>
    </CardContent>
  </Card>
</template>
