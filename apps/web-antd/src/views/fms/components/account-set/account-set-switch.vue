<script lang="ts" setup>
import { computed, nextTick, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { confirm, useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { useTabbarStore } from '@vben/stores';

import { message, Select, Tag } from 'ant-design-vue';

import { updateAccountSetDefaultStatus } from '#/api/fms/config/account-user';
import { useFmsStore } from '#/views/fms/store/fms';

import FmsAccountSetGuide from './account-set-guide.vue';

defineOptions({ name: 'FmsAccountSetSwitch' });

// ==================== 路由与状态 ====================

const FMS_ROUTE_PREFIX = '/fms'; // FMS 路由前缀
const FMS_HOME_PATH = '/fms/home'; // FMS 首页
const FMS_ACCOUNT_SET_PATH = '/fms/config/account-set'; // 账套管理

const route = useRoute();
const router = useRouter();
const tabbarStore = useTabbarStore();
const fmsStore = useFmsStore();

const loading = ref(false); // 账套列表的加载中
const switching = ref(false); // 是否正在切换账套
const accountSetListLoaded = ref(false); // 是否已成功加载账套列表
const accountSetGuideShown = ref(false); // 是否已展示账套开通引导，避免重复弹出
const selectedAccountSetId = ref<number>(); // 选择器当前选中的账套编号

const [GuideModal, guideModalApi] = useVbenModal({
  connectedComponent: FmsAccountSetGuide,
});

const isFmsRoute = computed(() => isFmsRoutePath(route.path));
const accountSetId = computed(() => fmsStore.getAccountSetId);
const accountSetList = computed(() => fmsStore.getAccountSetList);
/** 当前选中账套的公司名称（选中值先于选项加载时回退 Store 中的账套名） */
const selectedAccountSetName = computed(
  () =>
    accountSetList.value.find((item) => item.id === selectedAccountSetId.value)
      ?.companyName ??
    fmsStore.getAccountSet?.companyName ??
    '',
);
/** 账套下拉选项（携带默认/初始化标记供选项渲染） */
const accountSetOptions = computed(() =>
  accountSetList.value.map((item) => ({
    ...item,
    disabled: !item.initialized,
    label: item.companyName,
    value: item.id!,
  })),
);
const currentMonthText = computed(() =>
  formatCurrentMonth(fmsStore.getCurrentMonth),
);

// 同步其他 FMS 页面变更的账套
watch(
  accountSetId,
  (id) => {
    selectedAccountSetId.value = id;
  },
  { immediate: true },
);

// 仅进入 FMS 路由时加载账套，避免影响其他业务模块
watch(
  isFmsRoute,
  async (visible) => {
    if (visible) {
      await loadAccountSetList();
    }
  },
  { immediate: true },
);

// 从账套管理进入其他 FMS 页面时，仍需提示未完成的账套配置
watch(
  () => route.path,
  () => showAccountSetGuide(),
);

// 进入 FMS 或切换账套后加载当前会计期间
watch(
  [isFmsRoute, accountSetId],
  async ([visible, id]) => {
    if (visible && id && !fmsStore.getCurrentMonth) {
      await fmsStore.loadCurrentMonth();
    }
  },
  { immediate: true },
);

// ==================== 账套加载 ====================

/**
 * 加载账套列表
 *
 * 依次选择缓存账套、默认账套、第一条已初始化账套；没有可用账套时展示开通引导。
 */
async function loadAccountSetList(force = false) {
  if (loading.value) return;
  loading.value = true;
  try {
    await fmsStore.loadAccountSetList(force);
    accountSetListLoaded.value = true;
    const accountSet = accountSetList.value.find(
      (item) => item.id === accountSetId.value,
    );
    if (!accountSet) {
      selectedAccountSetId.value = undefined;
      await showAccountSetGuide();
      return;
    }
    accountSetGuideShown.value = false;
    await guideModalApi.close();
    selectedAccountSetId.value = accountSet.id;
    fmsStore.setAccountSet({
      id: accountSet.id!,
      companyName: accountSet.companyName,
      level: accountSet.level!,
    });
  } finally {
    loading.value = false;
  }
}

/** 展示账套开通引导 */
async function showAccountSetGuide() {
  if (
    !accountSetListLoaded.value ||
    accountSetGuideShown.value ||
    !isFmsRoute.value ||
    route.path === FMS_ACCOUNT_SET_PATH ||
    accountSetId.value
  ) {
    return;
  }
  await nextTick();
  accountSetGuideShown.value = true;
  guideModalApi.setData({
    reason: accountSetList.value.length === 0 ? 'empty' : 'uninitialized',
  });
  await guideModalApi.open();
}

/** 展开账套选择器时刷新账套列表 */
async function handleVisibleChange(visible: boolean) {
  if (visible) {
    await loadAccountSetList(true);
  }
}

// ==================== 账套切换 ====================

/** 切换账套，并关闭旧账套对应的 FMS 标签页 */
async function handleChange(value: unknown) {
  const id = Number(value);
  const previousAccountSetId = accountSetId.value;
  if (id === previousAccountSetId) return;
  const accountSet = accountSetList.value.find((item) => item.id === id);
  if (!accountSet?.initialized) {
    selectedAccountSetId.value = previousAccountSetId;
    return;
  }
  try {
    await confirm(
      `切换账套后将关闭所有财务管理标签页，未保存的内容不会保留。确认切换至“${accountSet.companyName}”吗？`,
      '切换账套',
    );
  } catch {
    selectedAccountSetId.value = previousAccountSetId;
    return;
  }

  switching.value = true;
  try {
    await updateAccountSetDefaultStatus(accountSet.id!);
    // 更新账套后关闭旧账套标签，并进入新账套首页
    fmsStore.setAccountSet({
      id: accountSet.id!,
      companyName: accountSet.companyName,
      level: accountSet.level!,
    });
    await closeFmsTabs();
    await router.replace(FMS_HOME_PATH);
    message.success(`已切换至账套“${accountSet.companyName}”`);
  } finally {
    switching.value = false;
  }
}

/** 关闭全部 FMS 标签页 */
async function closeFmsTabs() {
  const fmsTabs = tabbarStore.getTabs.filter(
    (tab) => isFmsRoutePath(tab.path) && !tab.meta?.affixTab,
  );
  for (const tab of fmsTabs) {
    await tabbarStore.closeTab(tab, router);
  }
}

/** 判断路由是否属于 FMS 模块 */
function isFmsRoutePath(path: string) {
  return path === FMS_ROUTE_PREFIX || path.startsWith(`${FMS_ROUTE_PREFIX}/`);
}

/** 将会计期间格式化为顶部展示文案 */
function formatCurrentMonth(currentMonth?: string) {
  const match = currentMonth?.match(/^(\d{4})-(\d{2})$/);
  return match ? `${match[1]} 年第 ${match[2]} 期` : currentMonth || '';
}
</script>

<template>
  <div
    v-if="isFmsRoute"
    class="mr-2 w-[285px] flex-shrink-0 max-xl:w-[190px]"
  >
    <Select
      v-model:value="selectedAccountSetId"
      :disabled="switching"
      :loading="loading"
      :options="accountSetOptions"
      class="w-full"
      option-filter-prop="label"
      placeholder="请选择账套"
      show-search
      @change="handleChange"
      @dropdown-visible-change="handleVisibleChange"
    >
      <template #optionLabel>
        <div class="flex min-w-0 items-center gap-1.5">
          <IconifyIcon icon="ep:office-building" />
          <span class="min-w-0 truncate" :title="selectedAccountSetName">
            {{ selectedAccountSetName }}
          </span>
          <span
            v-if="currentMonthText"
            class="text-muted-foreground border-border flex-shrink-0 border-l pl-2 text-xs max-xl:hidden"
          >
            {{ currentMonthText }}
          </span>
        </div>
      </template>
      <template #option="option">
        <div class="flex items-center justify-between gap-3">
          <span>{{ option.label }}</span>
          <div class="flex flex-shrink-0 gap-1">
            <Tag v-if="option.defaultStatus">默认</Tag>
            <Tag v-if="!option.initialized" color="default">未初始化</Tag>
          </div>
        </div>
      </template>
    </Select>
  </div>
  <GuideModal />
</template>
