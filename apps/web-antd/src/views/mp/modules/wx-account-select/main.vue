<script lang="ts" setup>
import type { MpAccountApi } from '#/api/mp/account';

import { onMounted, reactive, ref, unref } from 'vue';
import { useRouter } from 'vue-router';

import { useTabs } from '@vben/hooks';

import { message, Select } from 'ant-design-vue';

import { getSimpleAccountList } from '#/api/mp/account';

defineOptions({ name: 'WxAccountSelect' });

const emit = defineEmits<{
  (e: 'change', id: number, name: string): void;
}>();

// 消息弹窗
const { closeCurrentTab } = useTabs(); // 视图操作
const { push, currentRoute } = useRouter();

const account: MpAccountApi.AccountSimple = reactive({
  id: -1,
  name: '',
});

const accountList = ref<MpAccountApi.AccountSimple[]>([]);

/** 查询公众号列表 */
async function handleQuery() {
  accountList.value = await getSimpleAccountList();
  if (accountList.value.length === 0) {
    message.error('未配置公众号，请在【公众号管理 -> 账号管理】菜单，进行配置');
    await closeCurrentTab(unref(currentRoute));
    await push({ name: 'MpAccount' });
    return;
  }
  // 默认选中第一个
  const firstAccount = accountList.value[0];
  if (firstAccount) {
    account.id = firstAccount.id;
    if (account.id) {
      account.name = firstAccount.name;
      emit('change', account.id, account.name);
    }
  }
}

/** 公众号变化 */
function onChanged(value: any) {
  if (value === undefined || Array.isArray(value)) return;
  const id = typeof value === 'number' ? value : Number(value);
  account.id = id;
  const found = accountList.value.find(
    (v: MpAccountApi.AccountSimple) => v.id === id,
  );
  if (account.id && found) {
    account.name = found.name;
    emit('change', account.id, account.name);
  }
}

/** 初始化 */
onMounted(() => {
  handleQuery();
});
</script>

<template>
  <Select
    v-model:value="account.id"
    placeholder="请选择公众号"
    class="!w-240px"
    @change="onChanged"
  >
    <Select.Option
      v-for="item in accountList"
      :key="item.id"
      :label="item.name"
      :value="item.id"
    >
      {{ item.name }}
    </Select.Option>
  </Select>
</template>
<style lang="scss" scoped>
:deep(.ant-select-selector) {
  width: 240px !important;
}
</style>
