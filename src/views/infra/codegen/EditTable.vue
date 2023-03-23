<template>
  <PageWrapper>
    <div class="m-5 w-200">
      <Steps :current="current">
        <Step title="基本信息" />
        <Step title="生成信息" />
        <Step title="字段信息" />
        <Step title="完成" />
      </Steps>
    </div>

    <div class="m-5">
      <BasicInfoForm @next="handleStep1Next" v-show="current === 0" />
      <GenInfoForm @prev="handleStepPrev" @next="handleStep2Next" v-show="current === 1" v-if="state.initSetp2" />
      <CloumInfoForm v-show="current === 2" @redo="handleRedo" v-if="state.initSetp3" />
      <span v-show="current === 4">1234</span>
    </div>
  </PageWrapper>
</template>
<script lang="ts" setup>
import { ref, reactive } from 'vue'
import { Steps } from 'ant-design-vue'
import { PageWrapper } from '@/components/Page'
import BasicInfoForm from './components/BasicInfoForm.vue'
import CloumInfoForm from './components/CloumInfoForm.vue'
import GenInfoForm from './components/GenInfoForm.vue'

const Step = Steps.Step

const current = ref(0)
const state = reactive({
  initSetp2: false,
  initSetp3: false
})
function handleStep1Next(step1Values: any) {
  current.value++
  state.initSetp2 = true
  console.log(step1Values)
}

function handleStepPrev() {
  current.value--
}

function handleStep2Next(step2Values: any) {
  current.value++
  state.initSetp3 = true
  console.log(step2Values)
}

function handleRedo() {
  current.value = 0
  state.initSetp2 = false
  state.initSetp3 = false
}
</script>
