<script lang="ts" setup>
import type { FmsSubjectApi } from '#/api/fms/config/subject';
import type { FmsLedgerApi } from '#/api/fms/ledger';

import { computed, reactive, ref, watch } from 'vue';

import { useAccess } from '@vben/access';
import { IconifyIcon } from '@vben/icons';
import { formatDate, traverseTreeValues } from '@vben/utils';

import { Button, InputNumber, Popover } from 'ant-design-vue';

import FmsSubjectSelect from '#/views/fms/config/subject/components/subject-select.vue';
import FmsLedgerMonthRangePicker from '#/views/fms/ledger/components/ledger-month-range-picker.vue';
import FmsLedgerPrintButton from '#/views/fms/ledger/components/ledger-print-button.vue';
import { useFmsStore } from '#/views/fms/store/fms';
import { FMS_SUBJECT_LEVEL_MAX } from '#/views/fms/utils/constants';

defineOptions({ name: 'FmsLedgerSearchBar' });

const props = withDefaults(
  defineProps<{
    autoQuery?: boolean;
    beforePrint?: () => Promise<void> | void;
    endMonth?: string;
    exportLoading?: boolean;
    maxLevel?: number;
    minLevel?: number;
    permissionPrefix?: string;
    printTarget?: string;
    printTitle?: string;
    showExport?: boolean;
    showPrint?: boolean;
    showSubject?: boolean;
    startMonth?: string;
    subjectId?: number;
    subjects?: FmsSubjectApi.Subject[];
  }>(),
  {
    permissionPrefix: 'fms:ledger:general',
    showSubject: false,
    subjectId: undefined,
    startMonth: undefined,
    endMonth: undefined,
    minLevel: 1,
    maxLevel: 1,
    printTarget: '',
    printTitle: '',
    showExport: true,
    showPrint: true,
    exportLoading: false,
    autoQuery: false,
    subjects: undefined,
    beforePrint: undefined,
  },
);
const emit = defineEmits<{
  export: [];
  search: [value: Omit<FmsLedgerApi.ListReq, 'accountSetId'>];
}>();

const { hasAccessByCodes } = useAccess();
const fmsStore = useFmsStore(); // FMS 状态
const currentMonth = formatDate(new Date(), 'YYYY-MM'); // 当前月份
const monthRange = ref<string[]>([
  props.startMonth || currentMonth,
  props.endMonth || currentMonth,
]); // 会计期间范围
const query = reactive<Partial<FmsLedgerApi.ListReq>>({
  subjectId: props.subjectId,
  minLevel: props.minLevel,
  maxLevel: props.maxLevel,
});
const printCenterText = computed(() => {
  const subject = traverseTreeValues(
    props.subjects || [],
    (item) => item,
  ).find((item) => item.id === query.subjectId);
  return subject ? `科目：${subject.code} ${subject.name}` : '';
}); // 打印科目文本

watch(
  () => props.subjectId,
  (value) => (query.subjectId = value),
);
watch(
  () => [props.startMonth, props.endMonth],
  ([startMonth, endMonth]) => {
    if (startMonth && endMonth) {
      monthRange.value = [startMonth, endMonth];
    }
  },
);

/** 搜索按钮操作 */
function handleQuery() {
  if (monthRange.value.length !== 2) return;
  emit('search', {
    startMonth: monthRange.value[0]!,
    endMonth: monthRange.value[1]!,
    subjectId: query.subjectId,
    startSubjectId: query.startSubjectId,
    endSubjectId: query.endSubjectId,
    minLevel: query.minLevel,
    maxLevel: query.maxLevel,
  });
}

/** 按条件变化自动查询，供需要即时刷新的账簿页面启用 */
function handleAutoQuery() {
  if (props.autoQuery) handleQuery();
}

/** 重置更多查询条件 */
function resetAdvanced() {
  query.startSubjectId = undefined;
  query.endSubjectId = undefined;
  query.minLevel = props.minLevel;
  query.maxLevel = props.maxLevel;
}

/** 重置按钮操作 */
async function resetQuery() {
  const accountingMonth = await fmsStore.loadCurrentMonth();
  monthRange.value = [
    accountingMonth || currentMonth,
    accountingMonth || currentMonth,
  ];
  query.subjectId = props.showSubject ? props.subjects?.[0]?.id : undefined;
  resetAdvanced();
  handleQuery();
}
</script>

<template>
  <!-- 搜索 -->
  <div class="flex flex-wrap items-center gap-3">
    <div class="flex items-center gap-2">
      <span>会计期间</span>
      <FmsLedgerMonthRangePicker
        v-model="monthRange"
        @change="handleAutoQuery"
      />
    </div>
    <div v-if="showSubject" class="flex items-center gap-2">
      <span>科目</span>
      <FmsSubjectSelect
        v-model="query.subjectId"
        :options="subjects"
        placeholder="请选择科目"
        class="w-60"
        @change="handleAutoQuery"
      />
    </div>
    <Popover
      v-if="!showSubject"
      placement="bottomLeft"
      trigger="click"
      :overlay-style="{ width: '360px' }"
    >
      <template #content>
        <div class="flex flex-col gap-3">
          <div>
            <div class="mb-1">起始科目</div>
            <FmsSubjectSelect
              v-model="query.startSubjectId"
              :options="subjects"
              clearable
            />
          </div>
          <div>
            <div class="mb-1">结束科目</div>
            <FmsSubjectSelect
              v-model="query.endSubjectId"
              :options="subjects"
              clearable
            />
          </div>
          <div>
            <div class="mb-1">科目级次</div>
            <div class="flex items-center gap-2">
              <InputNumber
                v-model:value="query.minLevel"
                :controls="false"
                :min="1"
                :max="FMS_SUBJECT_LEVEL_MAX"
                class="flex-1"
              />
              <span>至</span>
              <InputNumber
                v-model:value="query.maxLevel"
                :controls="false"
                :min="1"
                :max="FMS_SUBJECT_LEVEL_MAX"
                class="flex-1"
              />
            </div>
          </div>
          <div class="flex items-center justify-end gap-2">
            <Button @click="resetAdvanced">重置</Button>
            <Button type="primary" @click="handleQuery">查询</Button>
          </div>
        </div>
      </template>
      <Button>
        <template #icon>
          <IconifyIcon icon="lucide:filter" />
        </template>
        更多条件
      </Button>
    </Popover>
    <Button @click="handleQuery">
      <template #icon>
        <IconifyIcon icon="lucide:search" />
      </template>
      搜索
    </Button>
    <Button @click="resetQuery">
      <template #icon>
        <IconifyIcon icon="lucide:refresh-cw" />
      </template>
      重置
    </Button>
    <FmsLedgerPrintButton
      v-if="showPrint && printTarget"
      :before-print="beforePrint"
      :center-text="printCenterText"
      :end-month="monthRange[1]!"
      :permission-prefix="permissionPrefix"
      :start-month="monthRange[0]!"
      :target="printTarget"
      :title="printTitle"
    />
    <Button
      v-if="showExport && hasAccessByCodes([`${permissionPrefix}:export`])"
      :loading="exportLoading"
      @click="emit('export')"
    >
      <template #icon>
        <IconifyIcon icon="lucide:download" />
      </template>
      导出
    </Button>
    <slot name="actions"></slot>
  </div>
</template>
