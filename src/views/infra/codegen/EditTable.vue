<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue'
import { Steps } from 'ant-design-vue'
import { useRoute } from 'vue-router'
import BasicInfoForm from './components/BasicInfoForm.vue'
import CloumInfoForm from './components/CloumInfoForm.vue'
import FinishForm from './components/FinishForm.vue'
import { PageWrapper } from '@/components/Page'
import { getCodegenTable, updateCodegenTable } from '@/api/infra/codegen'

const Step = Steps.Step

const { query } = useRoute()

// 表详细信息
const basicInfo = ref<any>()
// 表列信息
const columnsInfo = ref<any[]>([])

const basicInfoValue = ref()

const columnsInfoValue = ref()

const current = ref(0)
const state = reactive({
  initSetp2: false,
  initSetp3: false,
})

function handleStep1Next(step1Values: any) {
  current.value++
  basicInfoValue.value = step1Values
  state.initSetp2 = true
}

function handleStepPrev() {
  current.value--
}

async function handleStep2Next(step2Values: any) {
  current.value++
  columnsInfoValue.value = step2Values
  await handleSubmit()
  state.initSetp3 = true
}

async function handleSubmit() {
  basicInfoValue.value.id = query.id as unknown as number
  const genTable = {
    table: basicInfoValue.value,
    columns: columnsInfoValue.value,
  }
  await updateCodegenTable(genTable)
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

<template>
  <PageWrapper>
    <div class="step-form-form">
      <Steps :current="current">
        <Step title="生成信息" />
        <Step title="字段信息" />
        <Step title="完成" />
      </Steps>
    </div>

    <div class="m-5">
      <BasicInfoForm v-show="current === 0" :basic-info="basicInfo" @next="handleStep1Next" />
      <CloumInfoForm
        v-show="current === 1"
        v-if="state.initSetp2"
        :columns-info="columnsInfo"
        @prev="handleStepPrev"
        @next="handleStep2Next"
      />
      <FinishForm v-show="current === 2" v-if="state.initSetp3" @redo="handleRedo" />
    </div>
  </PageWrapper>
</template>

<style lang="less" scoped>
.step-form-form {
  width: 750px;
  margin: 0 auto;
  margin-top: 10px;
}
</style>
