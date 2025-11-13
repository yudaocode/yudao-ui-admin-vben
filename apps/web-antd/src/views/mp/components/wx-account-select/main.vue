<script lang="ts" setup>
import type { SelectValue } from 'ant-design-vue/es/select';

import type { MpAccountApi } from '#/api/mp/account';

import { onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import { message, Select } from 'ant-design-vue';

import { getSimpleAccountList } from '#/api/mp/account';

defineOptions({ name: 'WxAccountSelect' });

// 定义事件
const emit = defineEmits<{
  (e: 'change', id: number, name: string): void;
}>();
// 消息弹窗
const { push } = useRouter();

// 当前选中的公众号
const account: MpAccountApi.Account = reactive({
  id: -1,
  name: '',
});

// 公众号列表
const accountList = ref<MpAccountApi.Account[]>([]);

// 查询公众号列表
async function handleQuery() {
  accountList.value = await getSimpleAccountList();
  if (accountList.value.length === 0) {
    message.error('未配置公众号，请在【公众号管理 -> 账号管理】菜单，进行配置');
    await push({ name: 'MpAccount' });
    return;
  }

  // 默认选中第一个，如无数据则不执行
  const first = accountList.value[0];
  if (first) {
    account.id = first.id;
    account.name = first.name;
    emit('change', account.id, account.name);
  }
}

// 切换选中公众号
function onChanged(id: SelectValue) {
  const found = accountList.value.find((v) => v.id === id);
  if (found) {
    account.name = found.name;
    emit('change', account.id, account.name);
  }
}

// 初始化
onMounted(handleQuery);
</script>

<template>
  <Select
    v-model:value="account.id"
    placeholder="请选择公众号"
    class="!w-[240px]"
    @change="onChanged"
  >
    <Select.Option v-for="item in accountList" :key="item.id" :value="item.id">
      {{ item.name }}
    </Select.Option>
  </Select>
</template>
