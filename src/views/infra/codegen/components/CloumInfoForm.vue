<template>
  <div class="step2">
    <div class="step2-table">
      <BasicTable :dataSource="columnsInfo" @register="registerTable" @row-click="handleEdit" />
    </div>
    <Divider />
    <a-button @click="customResetFunc">上一步</a-button>
    <a-button @click="customSubmitFunc">下一步</a-button>
    <h3>说明</h3>
    <h4>转账到支付宝账户</h4>
    <p>
      如果需要，这里可以放一些关于产品的常见问题说明。如果需要，这里可以放一些关于产品的常见问题说明。如果需要，这里可以放一些关于产品的常见问题说明。
    </p>

    <h4>转账到银行卡</h4>
    <p>
      如果需要，这里可以放一些关于产品的常见问题说明。如果需要，这里可以放一些关于产品的常见问题说明。如果需要，这里可以放一些关于产品的常见问题说明。
    </p>
  </div>
</template>
<script lang="ts" setup>
import { BasicTable, EditRecordRow, useTable } from '@/components/Table'
import { columns } from './data'
import { Divider } from 'ant-design-vue'
import { CodegenColumnVO } from '@/api/infra/codegen/types'

const emit = defineEmits(['next', 'prev'])

defineProps({
  columnsInfo: {
    type: Array as PropType<CodegenColumnVO[]>,
    default: () => null
  }
})

const [registerTable, { getDataSource }] = useTable({
  columns,
  maxHeight: 700,
  pagination: false,
  useSearchForm: false,
  showTableSetting: false,
  showIndexColumn: false
})

async function customResetFunc() {
  emit('prev')
}

async function customSubmitFunc() {
  const tableValue = getDataSource()
  emit('next', tableValue)
}

function handleEdit(record: EditRecordRow) {
  record.onEdit?.(true)
}
</script>
<style lang="less" scoped>
.step2 {
  &-table {
    width: 100%;
    margin: 0 auto;
  }

  h3 {
    margin: 0 0 12px;
    font-size: 16px;
    line-height: 32px;
    color: @text-color;
  }

  h4 {
    margin: 0 0 4px;
    font-size: 14px;
    line-height: 22px;
    color: @text-color;
  }

  p {
    color: @text-color;
  }
}

.pay-select {
  width: 20%;
}

.pay-input {
  width: 70%;
}
</style>
