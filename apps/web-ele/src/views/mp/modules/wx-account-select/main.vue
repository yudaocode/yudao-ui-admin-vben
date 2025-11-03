<script lang="ts" setup>
import type { MpAccountApi } from '#/api/mp/account';

import { onMounted, reactive, ref, unref } from 'vue';
import { useRouter } from 'vue-router';

import { ElMessage } from 'element-plus';

import { getSimpleAccountList } from '#/api/mp/account';
import { useTagsViewStore } from '#/store/tagsView';

defineOptions({ name: 'WxAccountSelect' });

const emit = defineEmits<{
  (e: 'change', id: number, name: string): void;
}>();

const message = ElMessage; // 消息弹窗
const { delView } = useTagsViewStore(); // 视图操作
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
    delView(unref(currentRoute));
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
function onChanged(id?: number) {
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
  <el-select
    v-model="account.id"
    placeholder="请选择公众号"
    class="!w-240px"
    @change="onChanged"
  >
    <el-option
      v-for="item in accountList"
      :key="item.id"
      :label="item.name"
      :value="item.id"
    />
  </el-select>
</template>
<style lang="scss" scoped>
:deep(.el-select__wrapper) {
  width: 240px !important;
}
</style>
