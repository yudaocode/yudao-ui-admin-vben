<template>
  <PageWrapper>
    <div class="m-0-auto w-200">
      <Steps :current="current">
        <Step title="生成信息" />
        <Step title="字段信息" />
        <Step title="完成" />
      </Steps>
    </div>

    <div class="m-5">
      <BasicInfoForm :basicInfo="basicInfo" @next="handleStep1Next" v-show="current === 0" />
      <CloumInfoForm
        :columnsInfo="columnsInfo"
        @prev="handleStepPrev"
        @next="handleStep2Next"
        v-show="current === 1"
        v-if="state.initSetp2"
      />
      <FinishForm v-show="current === 2" @redo="handleRedo" v-if="state.initSetp3" />
    </div>
  </PageWrapper>
</template>
<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue'
import { Steps } from 'ant-design-vue'
import { PageWrapper } from '@/components/Page'
import BasicInfoForm from './components/BasicInfoForm.vue'
import CloumInfoForm from './components/CloumInfoForm.vue'
import FinishForm from './components/FinishForm.vue'
import { useRoute } from 'vue-router'
import { getCodegenTable } from '@/api/infra/codegen'

const Step = Steps.Step

const { query } = useRoute()

// 表详细信息
const basicInfo = ref<any>()
// 表列信息
const columnsInfo = ref<any[]>([])

const basicInfoValue = ref()

const current = ref(0)
const state = reactive({
  initSetp2: false,
  initSetp3: false
})

function handleStep1Next(step1Values: any) {
  current.value++
  state.initSetp2 = true
  basicInfoValue.value = step1Values
  console.info(step1Values)
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

async function getList() {
  const tableId = query.id as unknown as number
  const res = await getCodegenTable(tableId)
  basicInfo.value = res.table
  columnsInfo.value = res.columns
}

onMounted(async () => {
  await getList()
})
</script>
