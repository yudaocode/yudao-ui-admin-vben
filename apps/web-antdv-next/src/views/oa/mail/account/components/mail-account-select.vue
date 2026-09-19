<script lang="ts" setup>
import type { OaMailAccountApi } from '#/api/oa/mail/account';

import { computed } from 'vue';

import { Select } from 'antdv-next';

/** 邮箱账号选择 */
defineOptions({ name: 'OaMailAccountSelect' });

const props = defineProps<{
  accounts: OaMailAccountApi.MailAccount[];
  disabled?: boolean;
}>();

const emit = defineEmits<{ change: [] }>();

const selectValue = defineModel<number>(); // 当前邮箱账号编号
const options = computed(() =>
  props.accounts.map((account) => ({
    label: account.mail,
    value: account.id!,
  })),
);
</script>

<template>
  <Select
    v-model:value="selectValue"
    :options="options"
    placeholder="请选择邮箱账号"
    :disabled="disabled"
    show-search
    option-filter-prop="label"
    class="w-full"
    @change="emit('change')"
  />
</template>
