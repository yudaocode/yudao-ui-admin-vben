<script lang="ts" setup>
import { Select } from 'ant-design-vue'
import { onMounted, reactive, ref } from 'vue'
import type { AccountVO } from '@/api/mp/account'
import { getSimpleAccounts } from '@/api/mp/account'

defineOptions({ name: 'WxAccountSelect' })

const emit = defineEmits(['change'])

const SelectOption = Select.Option

const account = reactive<AccountVO>({
  id: undefined,
  name: '',
})
const accountList = ref<AccountVO[]>([])
async function handleQuery() {
  accountList.value = await getSimpleAccounts()
  // 默认选中第一个
  if (accountList.value.length > 0) {
    account.id = accountList.value[0].id
    if (account.id) {
      account.name = accountList.value[0].name
      emit('change', account.id, account.name)
    }
  }
}

function onChanged(id?: number) {
  const found = accountList.value.find(v => v.id === id)
  if (account.id) {
    account.name = found ? found.name : ''
    emit('change', account.id, account.name)
  }
}

/** 初始化 */
onMounted(() => {
  handleQuery()
})
</script>

<template>
  <Select v-model:value="account.id" placeholder="请选择公众号" class="!w-240px" @change="onChanged">
    <SelectOption v-for="item in accountList" :key="item.id" :label="item.name" :value="item.id" />
  </Select>
</template>
