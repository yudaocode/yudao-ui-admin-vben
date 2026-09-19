<script lang="ts" setup>
import type { OaMailAccountApi } from '#/api/oa/mail/account';

import { ElOption, ElSelect } from 'element-plus';

/** 邮箱账号选择 */
defineOptions({ name: 'OaMailAccountSelect' });

defineProps<{
  accounts: OaMailAccountApi.MailAccount[];
  disabled?: boolean;
}>();

const emit = defineEmits<{ change: [] }>();

const selectValue = defineModel<number>(); // 当前邮箱账号编号
</script>

<template>
  <ElSelect
    v-model="selectValue"
    placeholder="请选择邮箱账号"
    :disabled="disabled"
    filterable
    class="w-full"
    @change="emit('change')"
  >
    <ElOption
      v-for="account in accounts"
      :key="account.id"
      :label="account.mail"
      :value="account.id!"
    />
  </ElSelect>
</template>
