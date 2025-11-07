<script lang="ts" setup>
import type { MpAccountApi } from '#/api/mp/account';

import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { useTabs } from '@vben/hooks';

import { ElMessage } from 'element-plus';

import { getSimpleAccountList } from '#/api/mp/account';

defineOptions({ name: 'WxAccountSelect' });

const props = defineProps<{
  modelValue?: number;
}>();

const emit = defineEmits<{
  (e: 'change', id: number, name: string): void;
  (e: 'update:modelValue', id: number): void;
}>();

const message = ElMessage; // 消息弹窗
const { closeCurrentTab } = useTabs(); // 视图操作
const { push } = useRouter();

const account: MpAccountApi.AccountSimple = reactive({
  id: -1,
  name: '',
});

const accountList = ref<MpAccountApi.AccountSimple[]>([]);

// 计算当前选中的 ID，优先使用 modelValue（表单绑定），否则使用内部 account.id
const currentId = computed({
  get: () => {
    // 如果外部传入了 modelValue，优先使用外部的值
    if (props.modelValue !== undefined && props.modelValue !== null) {
      return props.modelValue;
    }
    return account.id;
  },
  set: (value: number) => {
    // 更新内部状态
    account.id = value;
    // 同步到外部（表单系统）
    emit('update:modelValue', value);
    // 触发 change 事件（保持向后兼容）
    const found = accountList.value.find(
      (v: MpAccountApi.AccountSimple) => v.id === value,
    );
    if (found) {
      account.name = found.name;
      emit('change', value, found.name);
    }
  },
});

// 监听外部 modelValue 变化，同步到内部状态
watch(
  () => props.modelValue,
  (newValue) => {
    if (
      newValue !== undefined &&
      newValue !== null &&
      newValue !== account.id
    ) {
      account.id = newValue;
      const found = accountList.value.find(
        (v: MpAccountApi.AccountSimple) => v.id === newValue,
      );
      if (found) {
        account.name = found.name;
      }
    }
  },
);

/** 查询公众号列表 */
async function handleQuery() {
  accountList.value = await getSimpleAccountList();
  if (accountList.value.length === 0) {
    message.error('未配置公众号，请在【公众号管理 -> 账号管理】菜单，进行配置');
    await closeCurrentTab();
    await push({ name: 'MpAccount' });
    return;
  }

  // 如果外部没有传入值（modelValue 为空），默认选中第一个
  if (props.modelValue === undefined || props.modelValue === null) {
    const firstAccount = accountList.value[0];
    if (firstAccount) {
      currentId.value = firstAccount.id;
      account.name = firstAccount.name;
      emit('change', firstAccount.id, firstAccount.name);
    }
  } else {
    // 如果外部有值，同步到内部状态
    const found = accountList.value.find(
      (v: MpAccountApi.AccountSimple) => v.id === props.modelValue,
    );
    if (found) {
      account.id = props.modelValue;
      account.name = found.name;
    }
  }
}

/** 公众号变化 */
function onChanged(id?: number) {
  if (id) {
    currentId.value = id;
  }
}

/** 初始化 */
onMounted(() => {
  handleQuery();
});
</script>

<template>
  <el-select
    v-model="currentId"
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
