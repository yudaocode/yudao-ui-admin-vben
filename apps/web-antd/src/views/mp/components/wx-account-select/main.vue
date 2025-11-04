<script lang="ts" setup>
import { onMounted, reactive, ref, unref } from 'vue';
import { useRouter } from 'vue-router';

import { message } from 'ant-design-vue';

import * as MpAccountApi from '#/api/mp/account';
import { useTagsViewStore } from '#/store';

defineOptions({ name: 'WxAccountSelect' });

// 定义事件
const emit = defineEmits<{
  (e: 'change', id: number, name: string): void;
}>();
// 消息弹窗
const { delView } = useTagsViewStore();
const { push, currentRoute } = useRouter();

// 当前选中的公众号
const account: MpAccountApi.Account = reactive({
  id: -1,
  name: '',
});

// 公众号列表
const accountList = ref<MpAccountApi.Account[]>([]);

// 查询公众号列表
const handleQuery = async () => {
  accountList.value = await MpAccountApi.getSimpleAccountList();
  if (accountList.value.length === 0) {
    message.error('未配置公众号，请在【公众号管理 -> 账号管理】菜单，进行配置');
    delView(unref(currentRoute));
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
};

// 切换选中公众号
const onChanged = (id?: number) => {
  const found = accountList.value.find((v) => v.id === id);
  if (found) {
    account.name = found.name;
    emit('change', account.id, account.name);
  }
};

// 初始化
onMounted(handleQuery);
</script>

<template>
  <a-select
    v-model:value="account.id"
    placeholder="请选择公众号"
    class="!w-240px"
    @change="onChanged"
  >
    <a-select-option
      v-for="item in accountList"
      :key="item.id"
      :value="item.id"
    >
      {{ item.name }}
    </a-select-option>
  </a-select>
</template>

<style scoped>
.w-240px {
  width: 240px;
}
</style>
