<script lang="ts" setup>
import type { OaMailAccountApi } from '#/api/oa/mail/account';

import { computed, onMounted, ref } from 'vue';

import { Select } from 'ant-design-vue';

import { getSimpleMailAccountList } from '#/api/oa/mail/account';

/** 邮箱地址多选，支持输入外部地址 */
defineOptions({ name: 'OaMailAddressSelect' });

const modelValue = defineModel<string[]>(); // 选中的邮箱地址
const loading = ref(false); // 列表加载中
const accounts = ref<OaMailAccountApi.MailAccount[]>([]); // 当前租户邮箱及归属人

// 回复、草稿中的外部地址也需要正常回显
const options = computed(() => {
  const addresses = new Map<string, string>();
  accounts.value.forEach((account) => {
    const label = account.userName
      ? `${account.userName} <${account.mail}>`
      : account.mail;
    addresses.set(
      account.mail,
      addresses.has(account.mail)
        ? `${addresses.get(account.mail)}、${label}`
        : label,
    );
  });
  modelValue.value?.forEach((address) => {
    if (!addresses.has(address)) addresses.set(address, address);
  });
  return Array.from(addresses, ([value, label]) => ({ value, label }));
});

/** 查询公司邮箱地址 */
async function getList() {
  loading.value = true;
  try {
    accounts.value = await getSimpleMailAccountList();
  } finally {
    loading.value = false;
  }
}

/** 初始化 */
onMounted(() => {
  getList();
});
</script>

<template>
  <Select
    v-model:value="modelValue"
    mode="tags"
    :options="options"
    :loading="loading"
    placeholder="请选择或输入邮箱地址"
    class="w-full"
  />
</template>
