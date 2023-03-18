<template>
  <PageWrapper title="水印示例">
    <CollapseContainer class="w-full h-32 bg-white rounded-md" title="Global WaterMark">
      <a-button type="primary" class="mr-2" @click="setWatermark('WaterMark Info')"> Create </a-button>
      <a-button color="error" class="mr-2" @click="clear"> Clear </a-button>
      <a-button color="warning" class="mr-2" @click="setWatermark('WaterMark Info New')"> Reset </a-button>
    </CollapseContainer>
  </PageWrapper>
</template>
<script lang="ts" setup>
import { CollapseContainer } from '@/components/Container'
import { useWatermark } from '@/hooks/web/useWatermark'
import { PageWrapper } from '@/components/Page'

const { setWatermark, clear } = useWatermark()
</script>
