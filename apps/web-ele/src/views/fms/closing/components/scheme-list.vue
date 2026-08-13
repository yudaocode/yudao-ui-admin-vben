<script lang="ts" setup>
import type { CheckboxValueType } from 'element-plus';

import type { FmsClosingSchemeApi } from '#/api/fms/closing/scheme';
import type { FmsClosingTemplateApi } from '#/api/fms/closing/template';
import type { FmsSubjectApi } from '#/api/fms/config/subject';
import type { FmsVoucherWordApi } from '#/api/fms/config/voucher-word';

import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { useAccess } from '@vben/access';
import { confirm, useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import dayjs from 'dayjs';
import { ElButton, ElCard, ElCheckbox, ElMessage } from 'element-plus';

import { getClosingSchemeList } from '#/api/fms/closing/scheme';
import {
  generateClosingSchemeVoucher,
  generateClosingVoucherList,
  generateProfitLossVoucher,
} from '#/api/fms/closing/voucher';
import { getSubjectSimpleList } from '#/api/fms/config/subject';
import { getVoucherWordSimpleList } from '#/api/fms/config/voucher-word';
import { useFmsStore } from '#/views/fms/store/fms';
import { FMS_CLOSING_TYPE } from '#/views/fms/utils/constants';

import ProfitLossSettingsForm from '../modules/profit-loss-settings-form.vue';
import SchemeForm from '../modules/scheme-form.vue';
import SpecialClosingSettingsForm from '../modules/special-closing-settings-form.vue';
import SchemeCard from './scheme-card.vue';
import TemplateSelect from './template-select.vue';

defineOptions({ name: 'FmsClosingSchemeList' });

const props = defineProps<{
  accountSetId: number; // 账套编号
  closed: boolean; // 是否已结账
  currentPeriod: boolean; // 是否当前会计期间
  month: string; // 会计期间
  profitLossBalance: number; // 损益余额
  voucherCount: number; // 凭证数量
}>();

const emit = defineEmits<{ success: [] }>();

const router = useRouter();
const { hasAccessByCodes } = useAccess();
const fmsStore = useFmsStore(); // FMS 状态

const PROFIT_LOSS_SCHEME_ID = -1; // 结转损益方案的页面选择标识
const loading = ref(false); // 方案数据的加载中
const generating = ref(false); // 结转凭证的生成中
const voucherWords = ref<FmsVoucherWordApi.VoucherWord[]>([]); // 凭证字列表
const leafSubjects = ref<FmsSubjectApi.Subject[]>([]); // 末级科目列表
const closingSchemes = ref<FmsClosingSchemeApi.ClosingScheme[]>([]); // 结账方案列表
const selectedSchemeIds = ref<number[]>([]); // 选中的方案编号数组

const monthLabel = computed(() =>
  dayjs(`${props.month}-01`).format('YYYY年MM月'),
); // 会计期间文本
const otherSchemes = computed(() =>
  closingSchemes.value.filter(
    (item) => item.type !== FMS_CLOSING_TYPE.PROFIT_LOSS,
  ),
); // 非结转损益方案列表
const profitLossScheme = computed(() =>
  closingSchemes.value.find(
    (item) => item.type === FMS_CLOSING_TYPE.PROFIT_LOSS,
  ),
); // 结转损益方案
const allSchemeIds = computed(() => [
  PROFIT_LOSS_SCHEME_ID,
  ...otherSchemes.value.map((item) => item.id),
]); // 全部可选择的方案编号数组
const allSchemesChecked = computed(
  () =>
    allSchemeIds.value.length > 0 &&
    allSchemeIds.value.every((id) => selectedSchemeIds.value.includes(id)),
); // 是否选中全部方案
const someSchemesChecked = computed(
  () => selectedSchemeIds.value.length > 0 && !allSchemesChecked.value,
); // 是否只选中部分方案

const [SchemeFormModal, schemeFormModalApi] = useVbenModal({
  connectedComponent: SchemeForm,
  destroyOnClose: true,
});
const [TemplateSelectModal, templateSelectModalApi] = useVbenModal({
  connectedComponent: TemplateSelect,
  destroyOnClose: true,
});
const [ProfitLossSettingsModal, profitLossSettingsModalApi] = useVbenModal({
  connectedComponent: ProfitLossSettingsForm,
  destroyOnClose: true,
});
const [SpecialClosingSettingsModal, specialClosingSettingsModalApi] =
  useVbenModal({
    connectedComponent: SpecialClosingSettingsForm,
    destroyOnClose: true,
  });

watch(() => props.accountSetId, init, { immediate: true });
watch(() => props.month, getSchemeList);

/** 初始化方案数据 */
async function init() {
  if (!props.accountSetId) return;
  const [words, subjectList] = await Promise.all([
    getVoucherWordSimpleList(props.accountSetId),
    getSubjectSimpleList(props.accountSetId),
  ]);
  voucherWords.value = words;
  const parentSubjectIds = new Set(subjectList.map((item) => item.parentId));
  leafSubjects.value = subjectList.filter(
    (item) => !parentSubjectIds.has(item.id),
  );
  await getSchemeList();
}

/** 获得结账方案列表 */
async function getSchemeList() {
  if (!props.accountSetId) return;
  loading.value = true;
  try {
    closingSchemes.value = await getClosingSchemeList({
      accountSetId: props.accountSetId,
      month: props.month,
    });
    selectedSchemeIds.value = selectedSchemeIds.value.filter((id) =>
      [
        PROFIT_LOSS_SCHEME_ID,
        ...closingSchemes.value.map((item) => item.id),
      ].includes(id),
    );
  } finally {
    loading.value = false;
  }
}

/** 刷新方案和结账概况 */
async function refresh() {
  await getSchemeList();
  emit('success');
}

/** 生成结转损益凭证 */
async function generateProfitLoss() {
  if (!props.currentPeriod) {
    ElMessage.warning('只能生成当前会计期间的结转凭证');
    return;
  }
  if (!profitLossScheme.value) {
    ElMessage.warning('请先完成结转损益参数设置');
    openProfitLossSettings();
    return;
  }
  try {
    await confirm(`确认生成 ${monthLabel.value} 的结转损益凭证吗？`);
  } catch {
    return;
  }
  generating.value = true;
  try {
    const voucherId = await generateProfitLossVoucher({
      accountSetId: props.accountSetId,
      month: props.month,
    });
    ElMessage.success('结转损益凭证已生成');
    await refresh();
    openVoucher(voucherId);
  } finally {
    generating.value = false;
  }
}

/** 生成指定结账方案凭证 */
async function generateScheme(scheme: FmsClosingSchemeApi.ClosingScheme) {
  if (!props.currentPeriod) return;
  try {
    await confirm(`确认生成 ${monthLabel.value} 的“${scheme.name}”凭证吗？`);
  } catch {
    return;
  }
  generating.value = true;
  try {
    const voucherId = await generateClosingSchemeVoucher({
      accountSetId: props.accountSetId,
      month: props.month,
      id: scheme.id,
    });
    ElMessage.success('结转凭证已生成');
    await refresh();
    openVoucher(voucherId);
  } finally {
    generating.value = false;
  }
}

/** 批量生成选中的结账方案凭证 */
async function generateSelectedSchemes() {
  if (!props.currentPeriod) return;
  const ids = selectedSchemeIds.value.length
    ? selectedSchemeIds.value
    : allSchemeIds.value;
  const availableIds = ids.filter((id) => {
    if (id === PROFIT_LOSS_SCHEME_ID) {
      return (
        props.profitLossBalance !== 0 ||
        Boolean(profitLossScheme.value?.voucherIds.length)
      );
    }
    const scheme = otherSchemes.value.find((item) => item.id === id);
    return scheme?.balance !== 0 || Boolean(scheme?.voucherIds.length);
  });
  if (!availableIds.length) {
    ElMessage.warning('当前没有需要生成凭证的结账方案');
    return;
  }
  if (availableIds.includes(PROFIT_LOSS_SCHEME_ID) && !profitLossScheme.value) {
    ElMessage.warning('请先完成结转损益参数设置');
    openProfitLossSettings();
    return;
  }
  try {
    await confirm(`确认生成已选择的 ${availableIds.length} 个结账方案凭证吗？`);
  } catch {
    return;
  }
  generating.value = true;
  try {
    const voucherIds = await generateClosingVoucherList({
      accountSetId: props.accountSetId,
      month: props.month,
      ids: availableIds.map((id) =>
        id === PROFIT_LOSS_SCHEME_ID ? profitLossScheme.value!.id : id,
      ),
    });
    const skippedCount = availableIds.length - voucherIds.length;
    ElMessage.success(
      skippedCount
        ? `已生成 ${voucherIds.length} 个结账方案凭证，${skippedCount} 个方案无需生成`
        : `已生成 ${voucherIds.length} 个结账方案凭证`,
    );
    await refresh();
  } finally {
    generating.value = false;
  }
}

/** 处理全部方案选择 */
function changeAllSchemes(checked: CheckboxValueType) {
  selectedSchemeIds.value = checked ? [...allSchemeIds.value] : [];
}

/** 处理单个方案选择 */
function changeSchemeChecked(id: number, checked: CheckboxValueType) {
  if (checked) {
    if (!selectedSchemeIds.value.includes(id)) selectedSchemeIds.value.push(id);
    return;
  }
  selectedSchemeIds.value = selectedSchemeIds.value.filter(
    (item) => item !== id,
  );
}

/** 打开结账方案设置 */
function openSchemeSettings(scheme: FmsClosingSchemeApi.ClosingScheme) {
  if (scheme.type === FMS_CLOSING_TYPE.REGULAR) {
    schemeFormModalApi
      .setData({
        accountSetId: props.accountSetId,
        subjects: leafSubjects.value,
        voucherWords: voucherWords.value,
        scheme,
      })
      .open();
    return;
  }
  specialClosingSettingsModalApi
    .setData({
      accountSetId: props.accountSetId,
      subjects: leafSubjects.value,
      voucherWords: voucherWords.value,
      scheme,
    })
    .open();
}

/** 打开结转损益参数设置 */
function openProfitLossSettings() {
  profitLossSettingsModalApi
    .setData({
      accountSetId: props.accountSetId,
      month: props.month,
      subjects: leafSubjects.value,
      voucherWords: voucherWords.value,
      settings: profitLossScheme.value,
    })
    .open();
}

/** 打开结账模板选择弹窗 */
function openTemplateSelect() {
  templateSelectModalApi
    .setData({
      accountSetId: props.accountSetId,
      subjects: leafSubjects.value,
    })
    .open();
}

/** 从模板新增结账方案 */
function openSchemeFromTemplate(
  template?: FmsClosingTemplateApi.ClosingTemplate,
) {
  schemeFormModalApi
    .setData({
      accountSetId: props.accountSetId,
      subjects: leafSubjects.value,
      voucherWords: voucherWords.value,
      template,
    })
    .open();
}

/** 打开凭证 */
function openVoucher(voucherId: number) {
  router.push({ path: '/fms/voucher/create', query: { id: voucherId } });
}
</script>

<template>
  <ElCard class="mb-4">
    <div class="mb-4 flex items-center justify-between">
      <div>
        <div class="text-[16px] font-semibold">期末结转方案</div>
        <div class="mt-1.5 text-muted-foreground">
          {{ monthLabel }} 共录入凭证 {{ voucherCount || 0 }} 张
        </div>
      </div>
      <div class="flex items-center gap-3">
        <ElCheckbox
          v-if="fmsStore.isAccountSetWritable"
          :indeterminate="someSchemesChecked"
          :model-value="allSchemesChecked"
          @change="changeAllSchemes"
        >
          全选
        </ElCheckbox>
        <ElButton
          v-if="
            fmsStore.isAccountSetWritable &&
            hasAccessByCodes(['fms:closing:profit-loss'])
          "
          :disabled="closed || !currentPeriod"
          :loading="generating"
          type="primary"
          @click="generateSelectedSchemes"
        >
          生成凭证
        </ElButton>
      </div>
    </div>

    <div v-loading="loading">
      <div
        class="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-4"
      >
        <SchemeCard
          name="结转损益"
          :balance="profitLossScheme?.balance ?? profitLossBalance"
          :checked="selectedSchemeIds.includes(PROFIT_LOSS_SCHEME_ID)"
          :generate-disabled="
            closed ||
            !currentPeriod ||
            (profitLossBalance === 0 && !profitLossScheme?.voucherIds.length)
          "
          :voucher-ids="profitLossScheme?.voucherIds || []"
          @generate="generateProfitLoss"
          @open-voucher="openVoucher"
          @settings="openProfitLossSettings"
          @update:checked="changeSchemeChecked(PROFIT_LOSS_SCHEME_ID, $event)"
        />
        <SchemeCard
          v-for="scheme in otherSchemes"
          :key="scheme.id"
          :balance="scheme.balance"
          :checked="selectedSchemeIds.includes(scheme.id)"
          :generate-disabled="
            closed || !currentPeriod || (scheme.balance === 0 && !scheme.voucherIds.length)
          "
          :name="scheme.name"
          :voucher-ids="scheme.voucherIds"
          @generate="generateScheme(scheme)"
          @open-voucher="openVoucher"
          @settings="openSchemeSettings(scheme)"
          @update:checked="changeSchemeChecked(scheme.id, $event)"
        />

        <!-- 新增结账方案 -->
        <button
          v-if="
            fmsStore.isAccountSetWritable &&
            hasAccessByCodes(['fms:closing:update'])
          "
          class="flex min-h-[174px] cursor-pointer flex-col items-center justify-center gap-3 rounded-md border border-dashed bg-transparent text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          type="button"
          @click="openTemplateSelect"
        >
          <IconifyIcon class="text-[34px]" icon="lucide:plus" />
          <span>期末结转凭证方案</span>
        </button>
      </div>
    </div>

    <!-- 方案设置弹窗 -->
    <SchemeFormModal @success="refresh" />
    <TemplateSelectModal @select="openSchemeFromTemplate" />
    <ProfitLossSettingsModal @success="refresh" />
    <SpecialClosingSettingsModal @success="refresh" />
  </ElCard>
</template>
