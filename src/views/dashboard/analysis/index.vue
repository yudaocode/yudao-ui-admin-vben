<script lang="ts" setup>
import { ref } from 'vue'
import GrowCard from './components/GrowCard.vue'
import SiteAnalysis from './components/SiteAnalysis.vue'
import VisitSource from './components/VisitSource.vue'
import VisitRadar from './components/VisitRadar.vue'
import SalesProductPie from './components/SalesProductPie.vue'

const loading = ref(true)

setTimeout(() => {
  loading.value = false
}, 500)
</script>

<template>
  <div class="p-4">
    <GrowCard :loading="loading" class="enter-y" />
    <SiteAnalysis class="enter-y !my-4" :loading="loading" />
    <div class="enter-y md:flex">
      <VisitRadar class="w-full md:w-1/3" :loading="loading" />
      <VisitSource class="w-full !my-4 md:w-1/3 !md:mx-4 !md:my-0" :loading="loading" />
      <SalesProductPie class="w-full md:w-1/3" :loading="loading" />
    </div>
  </div>
</template>
