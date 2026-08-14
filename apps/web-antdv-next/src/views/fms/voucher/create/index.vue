<script lang="ts" setup>
import type { Dayjs } from 'dayjs';

import type { FmsAuxiliaryItemApi } from '#/api/fms/config/auxiliary/item';
import type { FmsAuxiliaryTypeApi } from '#/api/fms/config/auxiliary/type';
import type { FmsSubjectApi } from '#/api/fms/config/subject';
import type { FmsVoucherTemplateApi } from '#/api/fms/config/voucher-template';
import type { FmsVoucherWordApi } from '#/api/fms/config/voucher-word';
import type { FmsVoucherApi } from '#/api/fms/voucher';

import {
  computed,
  nextTick,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  reactive,
  ref,
  watch,
} from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { useAccess } from '@vben/access';
import { confirm, Page, useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';
import { useUserStore } from '@vben/stores';
import { formatDate, handleTree } from '@vben/utils';

import {
  Button,
  DatePicker,
  Dropdown,
  Input,
  InputNumber,
  Menu,
  message,
  Select,
  Spin,
  Tag,
} from 'antdv-next';
import dayjs from 'dayjs';

import { FmsAccountUserLevelEnum } from '#/api/fms/config/account-user';
import { getAuxiliaryItemSimpleList } from '#/api/fms/config/auxiliary/item';
import { getAuxiliaryTypeSimpleList } from '#/api/fms/config/auxiliary/type';
import { getSubjectSimpleList } from '#/api/fms/config/subject';
import { getVoucherWordSimpleList } from '#/api/fms/config/voucher-word';
import {
  createVoucher,
  deleteVoucherList,
  getNextVoucherNumber,
  getVoucher,
  getVoucherAuxiliaryBalance,
  getVoucherSubjectBalanceList,
  updateVoucher,
  updateVoucherReviewStatus,
} from '#/api/fms/voucher';
import ItemForm from '#/views/fms/config/auxiliary/modules/item-form.vue';
import FmsDigestLibrary from '#/views/fms/config/digest/components/digest-library.vue';
import SubjectForm from '#/views/fms/config/subject/modules/form.vue';
import FmsVoucherTemplateSaveForm from '#/views/fms/config/voucher-template/components/template-save-form.vue';
import FmsVoucherTemplateSelect from '#/views/fms/config/voucher-template/components/template-select.vue';
import FmsVoucherWordSelect from '#/views/fms/config/voucher-word/components/voucher-word-select.vue';
import { useFmsStore } from '#/views/fms/store/fms';
import {
  FMS_DEBIT_CREDIT_DIRECTION,
  FMS_SUBJECT_STATUS,
  FMS_VOUCHER_MONEY_UNITS,
  FMS_VOUCHER_STATUS,
} from '#/views/fms/utils/constants';

import {
  formatPeriodLabel,
  formatSubjectBalance as formatSubjectBalanceText,
  formatSubjectDisplay,
  formatUppercaseMoney,
} from '#/views/fms/utils/format';

import FmsVoucherPrintForm from '../components/voucher-print-form.vue';
import FmsVoucherShortcutHelp from './shortcut-help.vue';

defineOptions({ name: 'FmsVoucherCreate' });
const subjectTypeOptions = getDictOptions(DICT_TYPE.FMS_SUBJECT_TYPE, 'number');

interface VoucherEntryForm extends Omit<
  FmsVoucherApi.VoucherEntry,
  'auxiliaries' | 'subjectId'
> {
  rowKey: symbol;
  subjectId?: number;
  auxiliaries: Array<
    Omit<FmsVoucherApi.VoucherAuxiliaryItem, 'itemId'> & {
      itemId?: number;
    }
  >;
}

const route = useRoute();
const router = useRouter();
const { hasAccessByCodes } = useAccess();
const fmsStore = useFmsStore(); // FMS 状态
const userStore = useUserStore();

const loading = ref(false); // 页面的加载中
const accountSetId = computed(() => fmsStore.getAccountSetId); // 当前账套编号
const voucherWords = ref<FmsVoucherWordApi.VoucherWord[]>([]); // 凭证字列表
const subjects = ref<FmsSubjectApi.Subject[]>([]); // 会计科目树
const auxiliaryTypes = ref<FmsAuxiliaryTypeApi.AuxiliaryTypeOption[]>([]); // 辅助核算类别列表
const currentMonth = ref(''); // 当前会计期间
const auxiliaryOptions = reactive<
  Record<number, FmsAuxiliaryItemApi.AuxiliaryItemOption[]>
>({}); // 辅助核算项目选项
const subjectBalances = ref<FmsVoucherApi.SubjectBalance[]>([]); // 科目余额列表
const auxiliaryBalances = reactive(
  new Map<symbol, FmsVoucherApi.SubjectBalance>(),
); // 分录辅助核算余额 Map
const detail = ref<FmsVoucherApi.Voucher>(); // 凭证详情
const formData = reactive({
  id: undefined as number | undefined,
  voucherWordId: undefined as number | undefined,
  voucherNumber: undefined as number | undefined,
  voucherTime: dayjs().startOf('day').valueOf(),
  attachmentCount: 0,
}); // 凭证表单数据
const entries = ref<VoucherEntryForm[]>([]); // 凭证分录列表
const templateSaveFormRef =
  ref<InstanceType<typeof FmsVoucherTemplateSaveForm>>(); // 凭证模板保存表单 Ref
const templateSelectRef = ref<InstanceType<typeof FmsVoucherTemplateSelect>>(); // 凭证模板选择器 Ref
const digestLibraryRef = ref<InstanceType<typeof FmsDigestLibrary>>(); // 常用摘要库 Ref
const digestEntryIndex = ref<number>(); // 当前摘要分录索引
const entryTableWrapRef = ref<HTMLElement>(); // 凭证分录表格 Ref
const printFormRef = ref<InstanceType<typeof FmsVoucherPrintForm>>(); // 凭证打印表单 Ref
const creatingAuxiliaryTypeId = ref<number>(); // 正在新增项目的辅助核算类别编号

const [SubjectFormModal, subjectFormModalApi] = useVbenModal({
  connectedComponent: SubjectForm,
  destroyOnClose: true,
});
const [ItemFormModal, itemFormModalApi] = useVbenModal({
  connectedComponent: ItemForm,
  destroyOnClose: true,
});

const flatSubjects = computed(() => flattenSubjects(subjects.value)); // 平铺会计科目列表
const leafSubjects = computed(() =>
  flatSubjects.value.filter(
    (subject) =>
      !subject.children?.length &&
      subject.status === FMS_SUBJECT_STATUS.ENABLED,
  ),
); // 可选末级会计科目列表
const auxiliaryTypeMap = computed(
  () => new Map(auxiliaryTypes.value.map((item) => [item.id, item])),
); // 辅助核算类别 Map
const subjectBalanceMap = computed(
  () => new Map(subjectBalances.value.map((item) => [item.subjectId, item])),
); // 科目余额 Map
const isApproved = computed(
  () => detail.value?.status === FMS_VOUCHER_STATUS.APPROVED,
); // 凭证是否已审核
const isClosingGenerated = computed(() =>
  Boolean(detail.value?.closingGenerated),
); // 是否为结账生成凭证
const currentAccountWritable = computed(
  () =>
    fmsStore.getAccountSet?.level === FmsAccountUserLevelEnum.OWNER ||
    fmsStore.getAccountSet?.level === FmsAccountUserLevelEnum.WRITE,
); // 当前账套是否可写
const savePermission = computed(() =>
  formData.id ? 'fms:voucher:update' : 'fms:voucher:create',
); // 当前保存权限
const readOnly = computed(
  () =>
    isApproved.value ||
    isClosingGenerated.value ||
    !currentAccountWritable.value ||
    !hasAccessByCodes([savePermission.value]),
); // 是否只读
const canSave = computed(() => !readOnly.value); // 是否可以保存
const canSaveAndCreate = computed(
  () => canSave.value && hasAccessByCodes(['fms:voucher:create']),
); // 是否可以保存并新增
const voucherIds = computed(() =>
  String(route.query.ids || '')
    .split(',')
    .map(Number)
    .filter((id) => id > 0),
); // 当前列表凭证编号数组
const currentVoucherIndex = computed(() =>
  voucherIds.value.indexOf(Number(route.query.id || 0)),
); // 当前凭证索引
const previousVoucherId = computed(() =>
  currentVoucherIndex.value > 0
    ? voucherIds.value[currentVoucherIndex.value - 1]
    : undefined,
); // 上一张凭证编号
const nextVoucherId = computed(() =>
  currentVoucherIndex.value >= 0 &&
  currentVoucherIndex.value < voucherIds.value.length - 1
    ? voucherIds.value[currentVoucherIndex.value + 1]
    : undefined,
); // 下一张凭证编号
const debitTotal = computed(() => sumAmount('debitAmount')); // 借方合计金额
const creditTotal = computed(() => sumAmount('creditAmount')); // 贷方合计金额
const balanced = computed(() => debitTotal.value === creditTotal.value); // 借贷金额是否平衡
const amountInWords = computed(() =>
  balanced.value ? formatUppercaseMoney(debitTotal.value) : '',
); // 合计金额大写
const voucherPeriod = computed(() => {
  const month = formatDate(formData.voucherTime, 'YYYY-MM');
  return month ? formatPeriodLabel(month, month) : '';
}); // 凭证所属会计期间
const showQuantityColumn = computed(() =>
  entries.value.some((entry) =>
    Boolean(getSubject(entry.subjectId)?.quantityAccounting),
  ),
); // 是否显示数量列
const creatorUserName = computed(
  () => detail.value?.creatorUserName || userStore.userInfo?.nickname || '',
); // 制单人名称

watch(accountSetId, () => init());
watch(
  () => [route.query.id, route.query.copyFrom],
  () => init(),
);

/** 初始化录凭证页面 */
async function init() {
  const currentAccountSetId = accountSetId.value;
  if (!currentAccountSetId) return;
  auxiliaryBalances.clear();
  loading.value = true;
  try {
    // 加载凭证录入依赖的基础数据
    const [wordList, subjectList, auxiliaryTypeList, accountingMonth] =
      await Promise.all([
        getVoucherWordSimpleList(currentAccountSetId),
        getSubjectSimpleList(currentAccountSetId),
        getAuxiliaryTypeSimpleList(currentAccountSetId),
        fmsStore.loadCurrentMonth(),
      ]);
    voucherWords.value = wordList;
    subjects.value = handleTree(subjectList);
    auxiliaryTypes.value = auxiliaryTypeList;
    Object.keys(auxiliaryOptions).forEach(
      (key) => delete auxiliaryOptions[Number(key)],
    );
    currentMonth.value = accountingMonth || dayjs().format('YYYY-MM');
    // 等待选项渲染完成，避免选中值先于选项解析导致下拉回显为原始值
    await nextTick();

    // 根据路由加载详情、复制来源或空白凭证
    const voucherId = Number(route.query.id || 0);
    if (voucherId) {
      await loadDetail(voucherId);
    } else if (Number(route.query.copyFrom || 0)) {
      await initializeCopiedVoucher(Number(route.query.copyFrom));
    } else {
      await resetForm(false);
    }
  } finally {
    loading.value = false;
  }
}

/** 加载凭证详情 */
async function loadDetail(id: number) {
  const currentAccountSetId = accountSetId.value;
  if (!currentAccountSetId) return;
  const data = await getVoucher(currentAccountSetId, id);
  detail.value = data;
  Object.assign(formData, {
    id: data.id,
    voucherWordId: data.voucherWordId,
    voucherNumber: data.voucherNumber,
    voucherTime: dayjs(data.voucherTime).startOf('day').valueOf(),
    attachmentCount: data.attachmentCount,
  });
  entries.value = data.entries.map((entry) => ({
    ...entry,
    rowKey: Symbol(),
    auxiliaries: entry.auxiliaries.map((item) => ({ ...item })),
  }));
  padEntries();
  await Promise.all([
    loadSubjectBalances(dayjs(data.voucherTime).format('YYYY-MM')),
    ...entries.value.map((entry) => loadEntryAuxiliaryOptions(entry)),
  ]);
}

/** 初始化复制的凭证 */
async function initializeCopiedVoucher(id: number) {
  await loadDetail(id);
  const copiedEntries = entries.value.map((entry) => ({
    ...entry,
    id: undefined,
    rowKey: Symbol(),
    auxiliaries: entry.auxiliaries.map((item) => ({ ...item })),
  }));
  await resetForm(false);
  entries.value = copiedEntries;
  padEntries();
  await Promise.all(
    entries.value.map((entry) => loadEntryAuxiliaryOptions(entry)),
  );
  message.success('已复制凭证内容，请确认后保存');
}

/** 重置凭证表单 */
async function resetForm(updateRoute = true) {
  const currentAccountSetId = accountSetId.value;
  if (!currentAccountSetId) return;
  if (updateRoute && (route.query.id || route.query.copyFrom)) {
    await router.replace('/fms/voucher/create');
    return;
  }
  detail.value = undefined;
  auxiliaryBalances.clear();
  Object.assign(formData, {
    id: undefined,
    voucherWordId:
      voucherWords.value.find((item) => item.defaultStatus)?.id ||
      voucherWords.value[0]?.id,
    voucherNumber: undefined,
    voucherTime: getDefaultVoucherTime(),
    attachmentCount: 0,
  });
  entries.value = Array.from({ length: 4 }, () => createEmptyEntry());
  await Promise.all([
    refreshVoucherNumber(),
    loadSubjectBalances(dayjs(formData.voucherTime).format('YYYY-MM')),
  ]);
}

/** 刷新凭证号 */
async function refreshVoucherNumber() {
  const currentAccountSetId = accountSetId.value;
  const voucherWordId = formData.voucherWordId;
  const voucherTime = formData.voucherTime;
  if (formData.id || !currentAccountSetId || !voucherWordId || !voucherTime) {
    return;
  }
  formData.voucherNumber = await getNextVoucherNumber(
    currentAccountSetId,
    voucherWordId,
    formatDate(voucherTime, 'YYYY-MM-DD HH:mm:ss'),
  );
}

/** 处理凭证日期变更 */
async function handleVoucherDateChange() {
  await Promise.all([
    refreshVoucherNumber(),
    loadSubjectBalances(dayjs(formData.voucherTime).format('YYYY-MM')),
    ...entries.value.map((entry) => loadEntryAuxiliaryBalance(entry)),
  ]);
}

/** 处理凭证日期控件变更 */
function handleVoucherTimeChange(value: Dayjs | Dayjs[] | null) {
  if (!value || Array.isArray(value)) return;
  formData.voucherTime = value.startOf('day').valueOf();
  handleVoucherDateChange();
}

/** 加载科目余额 */
async function loadSubjectBalances(month: string) {
  const currentAccountSetId = accountSetId.value;
  if (!currentAccountSetId || !month) return;
  subjectBalances.value = await getVoucherSubjectBalanceList(
    currentAccountSetId,
    month,
  );
}

/** 获得默认凭证日期 */
function getDefaultVoucherTime() {
  if (!currentMonth.value || dayjs().format('YYYY-MM') === currentMonth.value) {
    return dayjs().startOf('day').valueOf();
  }
  return dayjs(`${currentMonth.value}-01`)
    .endOf('month')
    .startOf('day')
    .valueOf();
}

/** 禁用当前会计期间前的日期 */
function disableVoucherDate(date: Dayjs) {
  return (
    Boolean(currentMonth.value) &&
    date.isBefore(dayjs(`${currentMonth.value}-01`), 'day')
  );
}

/** 创建空白凭证分录 */
function createEmptyEntry(): VoucherEntryForm {
  return { rowKey: Symbol(), digest: '', auxiliaries: [] };
}

/** 空摘要沿用上一条分录 */
function fillDigest(index: number) {
  if (index > 0 && !entries.value[index]?.digest?.trim()) {
    entries.value[index]!.digest = entries.value[index - 1]!.digest;
  }
}

/** 提交前依次补齐空摘要，兼容未逐行聚焦的快速录入 */
function fillEntryDigests(entryList: VoucherEntryForm[]) {
  entryList.forEach((entry, index) => {
    if (index > 0 && !entry.digest?.trim()) {
      entry.digest = entryList[index - 1]!.digest;
    }
  });
}

/** 新增凭证分录 */
function addEntry(index: number) {
  entries.value.splice(index, 0, createEmptyEntry());
}

/** 在当前分录上方或下方插入行 */
function handleInsertEntry(command: string, index: number) {
  addEntry(command === 'before' ? index : index + 1);
}

/** 删除凭证分录 */
function deleteEntry(index: number) {
  auxiliaryBalances.delete(entries.value[index]!.rowKey);
  entries.value.splice(index, 1);
}

/** 打开常用摘要库 */
function openDigestLibrary(index: number) {
  if (!accountSetId.value) return;
  digestEntryIndex.value = index;
  digestLibraryRef.value?.open(accountSetId.value);
}

/** 应用常用摘要 */
function applyDigest(digest: string) {
  if (digestEntryIndex.value === undefined) return;
  entries.value[digestEntryIndex.value]!.digest = digest;
  digestEntryIndex.value = undefined;
}

/** 补足默认分录行 */
function padEntries() {
  while (entries.value.length < 4) entries.value.push(createEmptyEntry());
}

/** 处理会计科目变更 */
async function handleSubjectChange(entry: VoucherEntryForm) {
  auxiliaryBalances.delete(entry.rowKey);
  entry.quantity = undefined;
  entry.unitPrice = undefined;
  const subject = getSubject(entry.subjectId);
  entry.auxiliaries = (subject?.auxiliaryTypeIds || []).map(
    (auxiliaryTypeId) => ({
      type: auxiliaryTypeMap.value.get(auxiliaryTypeId)?.type,
      typeId: auxiliaryTypeId,
    }),
  );
  await loadEntryAuxiliaryOptions(entry);
}

/** 加载分录的辅助核算选项 */
async function loadEntryAuxiliaryOptions(entry: VoucherEntryForm) {
  const subject = getSubject(entry.subjectId);
  const currentAccountSetId = accountSetId.value;
  if (!subject?.auxiliaryTypeIds?.length || !currentAccountSetId) return;
  await Promise.all(
    subject.auxiliaryTypeIds.map(async (auxiliaryTypeId) => {
      if (auxiliaryOptions[auxiliaryTypeId]) return;
      const items = await getAuxiliaryItemSimpleList(
        currentAccountSetId,
        auxiliaryTypeId,
      );
      if (currentAccountSetId === accountSetId.value) {
        auxiliaryOptions[auxiliaryTypeId] = items;
      }
    }),
  );
  await loadEntryAuxiliaryBalance(entry);
}

/** 加载分录辅助核算组合余额 */
async function loadEntryAuxiliaryBalance(entry: VoucherEntryForm) {
  const currentAccountSetId = accountSetId.value;
  const subject = getSubject(entry.subjectId);
  const auxiliaryTypeIds = subject?.auxiliaryTypeIds || [];
  const auxiliaryItemIds = auxiliaryTypeIds.map(
    (typeId) =>
      entry.auxiliaries.find((item) => item.typeId === typeId)?.itemId,
  );
  if (
    !currentAccountSetId ||
    !subject ||
    auxiliaryTypeIds.length === 0 ||
    auxiliaryItemIds.some((itemId) => !itemId)
  ) {
    auxiliaryBalances.delete(entry.rowKey);
    return;
  }
  const month = dayjs(formData.voucherTime).format('YYYY-MM');
  const subjectId = subject.id!;
  const itemIds = auxiliaryItemIds as number[];
  const balance = await getVoucherAuxiliaryBalance(
    currentAccountSetId,
    month,
    subjectId,
    itemIds,
  );
  if (
    currentAccountSetId === accountSetId.value &&
    month === dayjs(formData.voucherTime).format('YYYY-MM') &&
    subjectId === entry.subjectId &&
    itemIds.every(
      (itemId, index) =>
        entry.auxiliaries.find(
          (item) => item.typeId === auxiliaryTypeIds[index],
        )?.itemId === itemId,
    )
  ) {
    auxiliaryBalances.set(entry.rowKey, balance);
  }
}

/** 打开新增科目表单 */
function openSubjectForm(subjectType: number) {
  subjectFormModalApi.setData({ type: 'create', subjectType }).open();
}

/** 刷新会计科目选项 */
async function refreshSubjectOptions() {
  const currentAccountSetId = accountSetId.value;
  if (!currentAccountSetId) return;
  subjects.value = handleTree(await getSubjectSimpleList(currentAccountSetId));
}

/** 打开新增辅助核算项目表单 */
function openAuxiliaryItemForm(auxiliaryTypeId: number) {
  const auxiliaryType = auxiliaryTypeMap.value.get(auxiliaryTypeId);
  if (!auxiliaryType) return;
  creatingAuxiliaryTypeId.value = auxiliaryTypeId;
  itemFormModalApi.setData({ auxiliaryType }).open();
}

/** 刷新当前辅助核算类别的项目选项 */
async function refreshAuxiliaryItemOptions() {
  const currentAccountSetId = accountSetId.value;
  const auxiliaryTypeId = creatingAuxiliaryTypeId.value;
  if (!currentAccountSetId || !auxiliaryTypeId) return;
  auxiliaryOptions[auxiliaryTypeId] = await getAuxiliaryItemSimpleList(
    currentAccountSetId,
    auxiliaryTypeId,
  );
  creatingAuxiliaryTypeId.value = undefined;
}

/** 获得分录的辅助核算项 */
function getEntryAuxiliary(entry: VoucherEntryForm, auxiliaryTypeId: number) {
  let auxiliary = entry.auxiliaries.find(
    (item) => item.typeId === auxiliaryTypeId,
  );
  if (!auxiliary) {
    auxiliary = {
      type: auxiliaryTypeMap.value.get(auxiliaryTypeId)?.type,
      typeId: auxiliaryTypeId,
    };
    entry.auxiliaries.push(auxiliary);
  }
  return auxiliary;
}

/** 获得会计科目 */
function getSubject(subjectId?: number) {
  return flatSubjects.value.find((subject) => subject.id === subjectId);
}

/** 获得分录可选会计科目，并保留当前已选的停用科目用于回显 */
function getEntrySubjectOptions(entry: VoucherEntryForm) {
  const currentSubject = getSubject(entry.subjectId);
  if (
    !currentSubject ||
    leafSubjects.value.some((subject) => subject.id === currentSubject.id)
  ) {
    return leafSubjects.value;
  }
  return [...leafSubjects.value, currentSubject];
}

/** 构建分录科目下拉选项（options 形式，选中态才能稳定回显） */
function getEntrySubjectSelectOptions(entry: VoucherEntryForm) {
  return getEntrySubjectOptions(entry).map((subject) => ({
    disabled:
      subject.status !== FMS_SUBJECT_STATUS.ENABLED ||
      Boolean(subject.children?.length),
    label: `${subject.code} ${subject.name}`,
    value: subject.id!,
  }));
}

/** 构建辅助核算项目下拉选项 */
function getAuxiliaryItemSelectOptions(auxiliaryTypeId: number) {
  return (auxiliaryOptions[auxiliaryTypeId] || []).map((item) => ({
    label: `${item.code} ${item.name}`,
    value: item.id,
  }));
}

/** 格式化分录余额 */
function formatEntryBalance(entry: VoucherEntryForm) {
  const subject = getSubject(entry.subjectId);
  const balance = subject?.auxiliaryTypeIds?.length
    ? auxiliaryBalances.get(entry.rowKey)
    : subjectBalanceMap.value.get(entry.subjectId!);
  return formatSubjectBalanceText(balance?.balance, balance?.balanceDirection);
}

/** 格式化分录科目 */
function formatEntrySubject(entry: VoucherEntryForm) {
  const subject = getSubject(entry.subjectId);
  const subjectCode = readOnly.value
    ? entry.subjectCode || subject?.code
    : subject?.code;
  const subjectName = readOnly.value
    ? entry.subjectName || subject?.name
    : subject?.name;
  return formatSubjectDisplay(
    subjectCode,
    subjectName,
    entry.auxiliaries.map((item) => item.name),
  );
}

/** 根据数量和单价计算分录金额 */
function calculateEntryAmount(entry: VoucherEntryForm) {
  if (!entry.quantity || !entry.unitPrice) return;
  const amount = Math.floor(entry.quantity * entry.unitPrice * 100) / 100;
  if (
    getSubject(entry.subjectId)?.balanceDirection ===
    FMS_DEBIT_CREDIT_DIRECTION.CREDIT
  ) {
    entry.debitAmount = undefined;
    entry.creditAmount = amount;
  } else {
    entry.debitAmount = amount;
    entry.creditAmount = undefined;
  }
}

/** 处理借贷金额互斥 */
function handleEntryAmountChange(
  entry: VoucherEntryForm,
  direction: 'credit' | 'debit',
) {
  if (direction === 'debit' && entry.debitAmount !== undefined) {
    entry.creditAmount = undefined;
  } else if (direction === 'credit' && entry.creditAmount !== undefined) {
    entry.debitAmount = undefined;
  }
}

/** 汇总借方或贷方金额 */
function sumAmount(field: 'creditAmount' | 'debitAmount') {
  return Number(
    entries.value
      .reduce((total, entry) => total + Number(entry[field] || 0), 0)
      .toFixed(2),
  );
}

/** 将金额转换为金额位数格内容 */
function getMoneyDigits(value?: number, showZero = false) {
  if (!showZero && !value) return [];
  return [...String(Math.round(Math.abs(Number(value) || 0) * 100))];
}

/** 处理分录表格快捷键 */
function handleEntryTableKeydown(event: KeyboardEvent) {
  if (readOnly.value || loading.value || event.isComposing) return;
  const target = event.target as HTMLInputElement;
  if (!(target instanceof HTMLInputElement)) return;
  const entryRow = target.closest<HTMLTableRowElement>('tr[data-entry-index]');
  if (!entryRow) return;
  const entryIndex = Number(entryRow.dataset.entryIndex);
  if (event.key === '=' && target.closest('[data-entry-money]')) {
    event.preventDefault();
    const direction = target.closest<HTMLElement>('[data-entry-direction]')
      ?.dataset.entryDirection as 'credit' | 'debit' | undefined;
    balanceEntry(entries.value[entryIndex]!, direction || 'debit');
    return;
  }
  if (
    ['ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowUp'].includes(event.key) &&
    target.getAttribute('aria-expanded') !== 'true'
  ) {
    event.preventDefault();
    focusEntryInputByArrow(target, entryRow, event.key);
    return;
  }
  if (
    event.key !== 'Enter' ||
    target.getAttribute('aria-expanded') === 'true'
  ) {
    return;
  }
  event.preventDefault();
  focusNextEntryInput(target);
}

/** 使用方向键切换分录输入框 */
function focusEntryInputByArrow(
  target: HTMLInputElement,
  entryRow: HTMLTableRowElement,
  key: string,
) {
  if (key === 'ArrowLeft' || key === 'ArrowRight') {
    const entryInputs = getEntryInputs();
    const currentIndex = entryInputs.indexOf(target);
    entryInputs[currentIndex + (key === 'ArrowLeft' ? -1 : 1)]?.focus();
    return;
  }
  const rows = [
    ...(entryTableWrapRef.value?.querySelectorAll<HTMLTableRowElement>(
      'tbody tr[data-entry-index]',
    ) || []),
  ];
  const rowIndex = rows.indexOf(entryRow);
  const targetRow = rows[rowIndex + (key === 'ArrowUp' ? -1 : 1)];
  if (!targetRow) return;
  const rowInputs = [
    ...entryRow.querySelectorAll<HTMLInputElement>('input:not([disabled])'),
  ];
  const targetInputs = [
    ...targetRow.querySelectorAll<HTMLInputElement>('input:not([disabled])'),
  ];
  targetInputs[
    Math.min(rowInputs.indexOf(target), targetInputs.length - 1)
  ]?.focus();
}

/** 自动补平当前分录金额 */
function balanceEntry(entry: VoucherEntryForm, direction: 'credit' | 'debit') {
  const debitAmount = Number(entry.debitAmount || 0);
  const creditAmount = Number(entry.creditAmount || 0);
  const debitAmountWithoutEntry = Number(
    (debitTotal.value - debitAmount).toFixed(2),
  );
  const creditAmountWithoutEntry = Number(
    (creditTotal.value - creditAmount).toFixed(2),
  );
  const difference = creditAmountWithoutEntry - debitAmountWithoutEntry;
  if (!difference) return;
  if (direction === 'credit') {
    entry.creditAmount = Number((-difference).toFixed(2));
    entry.debitAmount = undefined;
  } else {
    entry.debitAmount = Number(difference.toFixed(2));
    entry.creditAmount = undefined;
  }
}

/** 聚焦下一项分录输入框 */
async function focusNextEntryInput(target: HTMLInputElement) {
  let entryInputs = getEntryInputs();
  const currentIndex = entryInputs.indexOf(target);
  if (currentIndex === -1) return;
  if (currentIndex === entryInputs.length - 1) {
    addEntry(entries.value.length);
    await nextTick();
    entryInputs = getEntryInputs();
  }
  entryInputs[currentIndex + 1]?.focus();
}

/** 获得分录输入框 */
function getEntryInputs() {
  return [
    ...(entryTableWrapRef.value?.querySelectorAll<HTMLInputElement>(
      'tbody input:not([disabled])',
    ) || []),
  ];
}

/** 构建凭证保存参数 */
function buildPayload(): FmsVoucherApi.SaveReq | undefined {
  const currentAccountSetId = accountSetId.value;
  const voucherWordId = formData.voucherWordId;
  const voucherNumber = formData.voucherNumber;
  if (
    !currentAccountSetId ||
    !voucherWordId ||
    voucherNumber === undefined ||
    !formData.voucherTime
  ) {
    message.warning('请完整填写凭证字、凭证号和凭证日期');
    return;
  }
  if (!Number.isInteger(voucherNumber) || voucherNumber <= 0) {
    message.warning('凭证号必须为正整数');
    return;
  }
  if (
    !Number.isInteger(formData.attachmentCount) ||
    formData.attachmentCount < 0
  ) {
    message.warning('附单据张数必须为非负整数');
    return;
  }
  const filledEntries = entries.value.filter((entry) => !isEntryEmpty(entry));
  if (filledEntries.length < 2) {
    message.warning('凭证至少需要两条有效分录');
    return;
  }
  fillEntryDigests(filledEntries);
  if (filledEntries.some((entry) => !validateEntry(entry, true))) {
    return;
  }
  if (!balanced.value) {
    message.warning('凭证借贷金额不平衡');
    return;
  }
  return {
    ...formData,
    accountSetId: currentAccountSetId,
    voucherWordId,
    voucherNumber,
    entries: filledEntries.map(buildVoucherEntry),
  };
}

/** 构建凭证模板分录参数 */
function buildTemplateEntries(): FmsVoucherApi.VoucherEntry[] | undefined {
  const filledEntries = entries.value.filter((entry) => !isEntryEmpty(entry));
  if (filledEntries.length < 2) {
    message.warning('凭证模板至少需要两条有效分录');
    return;
  }
  fillEntryDigests(filledEntries);
  if (filledEntries.some((entry) => !validateEntry(entry, true))) {
    return;
  }
  if (!balanced.value) {
    message.warning('凭证模板借贷金额不平衡');
    return;
  }
  return filledEntries.map(buildVoucherEntry);
}

/** 构建凭证业务分录 */
function buildVoucherEntry(
  entry: VoucherEntryForm,
): FmsVoucherApi.VoucherEntry {
  return {
    ...entry,
    subjectId: entry.subjectId!,
    auxiliaries: buildEntryAuxiliaries(entry),
  };
}

/** 判断分录是否完全空白 */
function isEntryEmpty(entry: VoucherEntryForm) {
  return !(
    entry.digest ||
    entry.subjectId ||
    entry.quantity ||
    entry.unitPrice ||
    entry.debitAmount ||
    entry.creditAmount ||
    entry.auxiliaries.some((item) => item.itemId)
  );
}

/** 校验凭证或模板分录 */
function validateEntry(entry: VoucherEntryForm, amountRequired: boolean) {
  const subject = getSubject(entry.subjectId);
  if (!subject) {
    message.warning('请选择每条分录的会计科目');
    return false;
  }
  if (
    subject.status !== FMS_SUBJECT_STATUS.ENABLED ||
    subject.children?.length
  ) {
    message.warning(
      `会计科目“${subject.name}”已停用或不是末级科目，请重新选择`,
    );
    return false;
  }
  if (!entry.digest) {
    message.warning('请填写每条分录的摘要');
    return false;
  }
  const debitAmount = Number(entry.debitAmount || 0);
  const creditAmount = Number(entry.creditAmount || 0);
  if (debitAmount !== 0 && creditAmount !== 0) {
    message.warning('同一条分录不能同时填写借方和贷方金额');
    return false;
  }
  if (amountRequired && debitAmount === 0 && creditAmount === 0) {
    message.warning('请填写每条分录的借方或贷方金额');
    return false;
  }
  const auxiliaryTypeIds = subject.auxiliaryTypeIds || [];
  if (
    auxiliaryTypeIds.some(
      (typeId) =>
        !entry.auxiliaries.find((item) => item.typeId === typeId)?.itemId,
    )
  ) {
    message.warning(`请完整选择“${subject.name}”的辅助核算项目`);
    return false;
  }
  return true;
}

/** 构建当前科目要求的辅助核算项目 */
function buildEntryAuxiliaries(entry: VoucherEntryForm) {
  return (getSubject(entry.subjectId)?.auxiliaryTypeIds || []).map(
    (typeId) => ({
      typeId,
      itemId: entry.auxiliaries.find((item) => item.typeId === typeId)!.itemId!,
    }),
  );
}

/** 处理更多操作 */
function handleMoreCommand(command: string) {
  handleTemplateCommand(command === 'saveTemplate' ? 'save' : 'apply');
}

/** 处理凭证模板操作 */
function handleTemplateCommand(command: 'apply' | 'save') {
  if (!accountSetId.value) return;
  if (command === 'apply') {
    templateSelectRef.value?.open(accountSetId.value);
    return;
  }
  const templateEntries = buildTemplateEntries();
  if (!templateEntries) return;
  templateSaveFormRef.value?.open(accountSetId.value, templateEntries);
}

/** 套用凭证模板 */
async function applyTemplate(template: FmsVoucherTemplateApi.VoucherTemplate) {
  const unavailableSubject = template.entries.find((entry) => {
    const subject = getSubject(entry.subjectId);
    return (
      !subject ||
      subject.status !== FMS_SUBJECT_STATUS.ENABLED ||
      subject.children?.length
    );
  });
  if (unavailableSubject) {
    message.error('模板包含当前账套不可用的会计科目，暂不能套用');
    return;
  }
  entries.value = template.entries.map((entry) => ({
    ...entry,
    rowKey: Symbol(),
    auxiliaries: entry.auxiliaries.map((item) => ({ ...item })),
  }));
  padEntries();
  await Promise.all(
    entries.value.map((entry) => loadEntryAuxiliaryOptions(entry)),
  );
  message.success(`已套用凭证模板“${template.name}”`);
}

/** 提交凭证表单 */
async function submitForm(saveAndCreate: boolean) {
  // 校验并构建凭证保存参数
  const payload = buildPayload();
  if (!payload) return;
  loading.value = true;
  try {
    // 根据凭证编号创建或更新凭证
    const voucherId = payload.id
      ? (await updateVoucher(payload), payload.id)
      : await createVoucher(payload);
    message.success('保存成功');

    // 根据保存方式进入空白凭证或回显当前凭证
    if (saveAndCreate) {
      await resetForm();
    } else if (Number(route.query.id) === voucherId) {
      await loadDetail(voucherId);
    } else {
      await router.replace({
        path: '/fms/voucher/create',
        query: { id: voucherId },
      });
    }
  } finally {
    loading.value = false;
  }
}

/** 审核或反审核凭证 */
async function handleReview(status: number) {
  if (!accountSetId.value || !formData.id) return;
  try {
    await confirm(
      status === FMS_VOUCHER_STATUS.APPROVED
        ? '确认审核该凭证吗？'
        : '确认反审核该凭证吗？',
    );
    await updateVoucherReviewStatus(accountSetId.value, [formData.id], status);
    message.success('操作成功');
    await loadDetail(formData.id);
  } catch {}
}

/** 删除凭证 */
async function handleDelete() {
  if (!accountSetId.value || !formData.id) return;
  try {
    await confirm('确认删除该凭证吗？删除后会产生凭证断号');
    await deleteVoucherList(accountSetId.value, [formData.id]);
    message.success('删除成功');
    await resetForm();
  } catch {}
}

/** 复制凭证 */
async function copyVoucher() {
  if (!detail.value) return;
  await router.replace({
    path: '/fms/voucher/create',
    query: { copyFrom: detail.value.id },
  });
}

/** 打印凭证 */
function printVoucher() {
  if (!accountSetId.value || !detail.value) return;
  printFormRef.value?.open(
    accountSetId.value,
    fmsStore.getAccountSet?.companyName || '',
    [detail.value],
  );
}

/** 跳转到相邻凭证 */
function navigateVoucher(voucherId?: number) {
  if (!voucherId) return;
  router.push({
    path: '/fms/voucher/create',
    query: { ...route.query, id: voucherId },
  });
}

/** 处理页面快捷键 */
function handlePageShortcut(event: KeyboardEvent) {
  if (
    event.isComposing ||
    event.repeat ||
    loading.value ||
    (event.target as HTMLElement | null)?.closest('.ant-modal')
  ) {
    return;
  }
  const key = event.key.toLowerCase();
  if ((event.ctrlKey || event.metaKey) && key === 's') {
    event.preventDefault();
    if (!canSave.value) return;
    submitForm(false);
  } else if (event.key === 'F12') {
    event.preventDefault();
    if (!canSaveAndCreate.value) return;
    submitForm(true);
  } else if (event.altKey && key === 'n') {
    event.preventDefault();
    if (
      !currentAccountWritable.value ||
      !hasAccessByCodes(['fms:voucher:create'])
    ) {
      return;
    }
    resetForm();
  }
}

/** 注册页面快捷键 */
function addPageShortcutListener() {
  window.addEventListener('keydown', handlePageShortcut);
}

/** 移除页面快捷键 */
function removePageShortcutListener() {
  window.removeEventListener('keydown', handlePageShortcut);
}

/** 平铺会计科目树 */
function flattenSubjects(
  tree: FmsSubjectApi.Subject[],
): FmsSubjectApi.Subject[] {
  const result: FmsSubjectApi.Subject[] = [];
  const walk = (nodes: FmsSubjectApi.Subject[]) => {
    for (const node of nodes) {
      result.push(node);
      if (node.children?.length) walk(node.children);
    }
  };
  walk(tree);
  return result;
}

onMounted(() => {
  init();
  addPageShortcutListener();
});
onActivated(addPageShortcutListener);
onDeactivated(removePageShortcutListener);
onBeforeUnmount(removePageShortcutListener);
</script>

<template>
  <Page>
    <!-- 凭证操作 -->
    <div class="mb-4 flex items-center justify-between rounded-md bg-card p-4">
      <div class="flex items-center gap-2">
        <Button
          v-if="
            formData.id &&
            currentAccountWritable &&
            hasAccessByCodes(['fms:voucher:create'])
          "
          type="primary"
          @click="resetForm()"
        >
          新增
        </Button>
        <Button
          v-if="canSaveAndCreate"
          type="primary"
          @click="submitForm(true)"
        >
          保存并新增
        </Button>
        <Button v-if="canSave" @click="submitForm(false)">保存</Button>
        <Button
          v-if="
            formData.id &&
            currentAccountWritable &&
            !isApproved &&
            !isClosingGenerated &&
            hasAccessByCodes(['fms:voucher:review'])
          "
          @click="handleReview(FMS_VOUCHER_STATUS.APPROVED)"
        >
          审核
        </Button>
        <Button
          v-if="
            formData.id &&
            currentAccountWritable &&
            isApproved &&
            !isClosingGenerated &&
            hasAccessByCodes(['fms:voucher:review'])
          "
          @click="handleReview(FMS_VOUCHER_STATUS.PENDING_REVIEW)"
        >
          反审核
        </Button>
        <Button
          v-if="
            formData.id &&
            currentAccountWritable &&
            !isApproved &&
            !isClosingGenerated &&
            hasAccessByCodes(['fms:voucher:delete'])
          "
          danger
          @click="handleDelete"
        >
          删除
        </Button>
        <Button
          v-if="
            formData.id &&
            currentAccountWritable &&
            hasAccessByCodes(['fms:voucher:create'])
          "
          @click="copyVoucher"
        >
          复制
        </Button>
        <Button
          v-if="formData.id && hasAccessByCodes(['fms:voucher:print'])"
          @click="printVoucher"
        >
          打印
        </Button>
        <Dropdown v-if="!formData.id && !readOnly" :trigger="['click']">
          <Button>
            更多<span class="icon-[ep--arrow-down] ml-1"></span>
          </Button>
          <template #popupRender>
            <Menu>
              <Menu.Item
                v-if="hasAccessByCodes(['fms:config:voucher-template:create'])"
                key="saveTemplate"
                @click="handleMoreCommand('saveTemplate')"
              >
                保存为模板
              </Menu.Item>
              <Menu.Item
                key="applyTemplate"
                @click="handleMoreCommand('applyTemplate')"
              >
                使用模板
              </Menu.Item>
            </Menu>
          </template>
        </Dropdown>
      </div>
      <div class="flex items-center gap-2">
        <FmsVoucherShortcutHelp />
        <Button
          :disabled="!previousVoucherId"
          shape="circle"
          title="上一张"
          @click="navigateVoucher(previousVoucherId)"
        >
          <template #icon><span class="icon-[ep--arrow-left]"></span></template>
        </Button>
        <Button
          :disabled="!nextVoucherId"
          shape="circle"
          title="下一张"
          @click="navigateVoucher(nextVoucherId)"
        >
          <template #icon>
            <span class="icon-[ep--arrow-right]"></span>
          </template>
        </Button>
      </div>
    </div>

    <!-- 凭证表单 -->
    <div class="rounded-md bg-card p-4">
      <Spin :spinning="loading">
        <div
          class="voucher-sheet relative border border-[var(--el-border-color)] border-solid border-t-4 border-t-[var(--el-color-primary)] bg-[var(--el-fill-color-lighter)] pb-[18px] pl-0 pr-[28px] pt-[26px] shadow-[var(--el-box-shadow-light)]"
        >
          <div
            class="mb-[4px] ml-[28px] text-center text-[24px] font-600 tracking-[6px] [font-family:STKaiti,KaiTi,serif]"
          >
            记账凭证
          </div>
          <div
            class="absolute right-[28px] top-[34px] font-600 text-[var(--el-text-color-secondary)]"
          >
            {{ voucherPeriod }}
          </div>
          <div
            class="box-border flex min-h-[60px] items-center justify-between pl-[24px]"
          >
            <div class="flex items-center gap-[8px]">
              <div class="flex items-center gap-[8px]">
                <span
                  class="whitespace-nowrap font-600 text-[var(--el-text-color-regular)]"
                >
                  凭证字
                </span>
                <FmsVoucherWordSelect
                  v-model="formData.voucherWordId"
                  :options="voucherWords"
                  :disabled="readOnly"
                  class="!w-[90px]"
                  placeholder="请选择凭证字"
                  @update:model-value="refreshVoucherNumber"
                />
                <div class="flex items-center">
                  <InputNumber
                    v-model:value="formData.voucherNumber"
                    :disabled="readOnly"
                    :min="1"
                    class="!w-[110px]"
                  />
                  <span class="ml-[4px]">号</span>
                </div>
              </div>
              <DatePicker
                :allow-clear="false"
                :disabled="readOnly"
                :disabled-date="disableVoucherDate"
                :value="
                  formData.voucherTime ? dayjs(formData.voucherTime) : undefined
                "
                class="!w-[150px]"
                @change="handleVoucherTimeChange"
              />
            </div>
            <div class="flex items-center gap-[8px] whitespace-nowrap">
              <span>附单据</span>
              <InputNumber
                v-model:value="formData.attachmentCount"
                :disabled="readOnly"
                :min="0"
                class="!w-[110px]"
              />
              <span>张</span>
            </div>
          </div>

          <div
            ref="entryTableWrapRef"
            class="overflow-x-auto"
            @keydown="handleEntryTableKeydown"
          >
            <table
              class="entry-table w-full min-w-[960px] table-fixed border-collapse border-spacing-0 bg-[var(--el-bg-color)] [&_td]:border [&_td]:border-[var(--el-border-color)] [&_td]:border-solid [&_td]:align-middle [&_th]:h-48px [&_th]:border [&_th]:border-[var(--el-border-color)] [&_th]:border-solid [&_th]:bg-[var(--el-bg-color)] [&_th]:px-8px [&_th]:text-[var(--el-text-color-primary)] [&_th]:align-middle [&_tbody_td]:h-60px [&_tbody_td]:overflow-hidden [&_tbody_td]:px-8px [&_tfoot_td]:h-60px [&_tfoot_td]:overflow-hidden [&_tfoot_td]:px-8px"
            >
              <colgroup>
                <col class="w-[26px]" />
                <col class="w-[18.5%]" />
                <col class="entry-subject-column" />
                <col v-if="showQuantityColumn" class="w-[13.9%]" />
                <col class="w-[20.4%]" />
                <col class="w-[20.4%]" />
              </colgroup>
              <thead>
                <tr>
                  <th
                    class="!border-r-[var(--el-border-color)] !border-r-solid !border-[var(--el-fill-color-lighter)] !bg-[var(--el-fill-color-lighter)] !p-0 text-center"
                  ></th>
                  <th class="entry-digest relative !px-10px">摘要</th>
                  <th class="entry-subject relative !px-10px">会计科目</th>
                  <th v-if="showQuantityColumn" class="!px-4px text-center">
                    数量
                  </th>
                  <th class="entry-money entry-money-header relative !p-0">
                    <strong class="block h-[25px] leading-[25px]">借方金额</strong>
                    <div
                      class="flex h-[22px] border-t border-[var(--el-border-color)] border-t-solid !bg-[var(--el-bg-color)] leading-[22px] [&>span:last-child]:border-r-0 [&>span:nth-child(4)]:border-r-[var(--el-color-primary-light-5)] [&>span:nth-child(8)]:border-r-[var(--el-color-primary-light-5)] [&>span:nth-child(9)]:border-r-[var(--el-color-danger-light-5)] [&>span]:box-border [&>span]:inline-flex [&>span]:h-full [&>span]:w-[calc(100%/11)] [&>span]:items-center [&>span]:justify-center [&>span]:border-r [&>span]:border-[var(--el-border-color-lighter)] [&>span]:border-r-solid [&>span]:text-12px [&>span]:font-400 [&>span]:text-[var(--el-text-color-secondary)]"
                    >
                      <span
                        v-for="(unit, index) in FMS_VOUCHER_MONEY_UNITS"
                        :key="`debit-${index}`"
                      >
                        {{ unit }}
                      </span>
                    </div>
                  </th>
                  <th class="entry-money entry-money-header relative !p-0">
                    <strong class="block h-[25px] leading-[25px]">贷方金额</strong>
                    <div
                      class="flex h-[22px] border-t border-[var(--el-border-color)] border-t-solid !bg-[var(--el-bg-color)] leading-[22px] [&>span:last-child]:border-r-0 [&>span:nth-child(4)]:border-r-[var(--el-color-primary-light-5)] [&>span:nth-child(8)]:border-r-[var(--el-color-primary-light-5)] [&>span:nth-child(9)]:border-r-[var(--el-color-danger-light-5)] [&>span]:box-border [&>span]:inline-flex [&>span]:h-full [&>span]:w-[calc(100%/11)] [&>span]:items-center [&>span]:justify-center [&>span]:border-r [&>span]:border-[var(--el-border-color-lighter)] [&>span]:border-r-solid [&>span]:text-12px [&>span]:font-400 [&>span]:text-[var(--el-text-color-secondary)]"
                    >
                      <span
                        v-for="(unit, index) in FMS_VOUCHER_MONEY_UNITS"
                        :key="`credit-${index}`"
                      >
                        {{ unit }}
                      </span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(entry, index) in entries"
                  :key="entry.rowKey"
                  :data-entry-index="index"
                  class="group"
                >
                  <td
                    class="!border-r-[var(--el-border-color)] !border-r-solid !border-[var(--el-fill-color-lighter)] !bg-[var(--el-fill-color-lighter)] !p-0 text-center"
                  >
                    <div
                      v-if="!readOnly"
                      class="flex h-full flex-col items-center justify-center opacity-0 transition-opacity duration-150 group-focus-within:opacity-100 group-hover:opacity-100"
                    >
                      <Dropdown placement="bottomLeft" :trigger="['hover']">
                        <Button size="small" title="插入分录" type="text">
                          <template #icon>
                            <span class="icon-[ep--circle-plus]"></span>
                          </template>
                        </Button>
                        <template #popupRender>
                          <Menu>
                            <Menu.Item
                              key="before"
                              @click="handleInsertEntry('before', index)"
                            >
                              从上方插入行
                            </Menu.Item>
                            <Menu.Item
                              key="after"
                              @click="handleInsertEntry('after', index)"
                            >
                              从下方插入行
                            </Menu.Item>
                          </Menu>
                        </template>
                      </Dropdown>
                      <Button
                        :disabled="entries.length <= 2"
                        size="small"
                        title="删除分录"
                        type="text"
                        @click="deleteEntry(index)"
                      >
                        <template #icon>
                          <span class="icon-[ep--remove]"></span>
                        </template>
                      </Button>
                    </div>
                  </td>
                  <td class="entry-digest relative !px-10px">
                    <div
                      v-if="readOnly"
                      class="flex min-h-[60px] items-center px-[2px] leading-[20px]"
                    >
                      {{ entry.digest }}
                    </div>
                    <div
                      v-else
                      class="digest-editor relative flex h-full items-center justify-center"
                    >
                      <Input
                        v-model:value="entry.digest"
                        :maxlength="500"
                        placeholder=""
                        @focus="fillDigest(index)"
                      />
                      <Button
                        size="small"
                        type="link"
                        @click="openDigestLibrary(index)"
                      >
                        摘要库
                      </Button>
                    </div>
                  </td>
                  <td class="entry-subject relative !px-10px">
                    <div
                      v-if="readOnly"
                      class="flex min-h-[60px] items-center px-[2px] leading-[20px]"
                    >
                      {{ formatEntrySubject(entry) }}
                    </div>
                    <template v-else>
                      <Select
                        v-model:value="entry.subjectId"
                        :options="getEntrySubjectSelectOptions(entry)"
                        placeholder=""
                        class="w-full"
                        option-filter-prop="label"
                        show-search
                        @change="handleSubjectChange(entry)"
                      >
                        <template
                          v-if="
                            hasAccessByCodes(['fms:config:subject:create']) &&
                            fmsStore.isAccountSetWritable
                          "
                          #popupRender="menuNode"
                        >
                          <component :is="menuNode" />
                          <Dropdown
                            v-if="fmsStore.isAccountSetWritable"
                            placement="bottomLeft"
                            :trigger="['click']"
                          >
                            <Button class="m-[4px]" size="small" type="link">
                              <span class="icon-[ep--plus]"></span> 新增科目
                            </Button>
                            <template #popupRender>
                              <Menu>
                                <Menu.Item
                                  v-for="subjectType in subjectTypeOptions"
                                  :key="subjectType.value"
                                  @click="openSubjectForm(subjectType.value)"
                                >
                                  {{ subjectType.label }}类科目
                                </Menu.Item>
                              </Menu>
                            </template>
                          </Dropdown>
                        </template>
                      </Select>
                      <div
                        v-if="
                          getSubject(entry.subjectId)?.auxiliaryTypeIds?.length
                        "
                        class="mt-[4px] flex flex-wrap gap-[4px]"
                      >
                        <Select
                          v-for="auxiliaryTypeId in getSubject(entry.subjectId)
                            ?.auxiliaryTypeIds"
                          :key="auxiliaryTypeId"
                          v-model:value="
                            getEntryAuxiliary(entry, auxiliaryTypeId).itemId
                          "
                          :options="
                            getAuxiliaryItemSelectOptions(auxiliaryTypeId)
                          "
                          :placeholder="
                            auxiliaryTypeMap.get(auxiliaryTypeId)?.name
                          "
                          class="!w-[calc(50%-2px)]"
                          option-filter-prop="label"
                          show-search
                          @change="loadEntryAuxiliaryBalance(entry)"
                        >
                          <template
                            v-if="
                              hasAccessByCodes([
                                'fms:config:auxiliary:create',
                              ]) && fmsStore.isAccountSetWritable
                            "
                            #popupRender="menuNode"
                          >
                            <component :is="menuNode" />
                            <Button
                              class="m-[4px]"
                              size="small"
                              type="link"
                              @click.stop="
                                openAuxiliaryItemForm(auxiliaryTypeId)
                              "
                            >
                              <span class="icon-[ep--plus]"></span>
                              新增{{
                                auxiliaryTypeMap.get(auxiliaryTypeId)?.name
                              }}
                            </Button>
                          </template>
                        </Select>
                      </div>
                    </template>
                    <div
                      v-if="entry.subjectId"
                      class="subject-balance pointer-events-none absolute bottom-[1px] left-[10px] hidden text-[12px] text-[var(--el-text-color-placeholder)]"
                    >
                      余额：{{ formatEntryBalance(entry) }}
                    </div>
                  </td>
                  <td v-if="showQuantityColumn" class="!px-4px text-center">
                    <template
                      v-if="getSubject(entry.subjectId)?.quantityAccounting"
                    >
                      <div
                        class="my-[2px] flex items-center justify-center gap-[4px] whitespace-nowrap text-[12px] [&_.ant-input-number]:!w-64px"
                      >
                        <span>数量</span>
                        <InputNumber
                          v-model:value="entry.quantity"
                          :disabled="readOnly"
                          :keyboard="false"
                          :min="0"
                          :precision="4"
                          @change="calculateEntryAmount(entry)"
                        />
                        <span>{{
                          getSubject(entry.subjectId)?.quantityUnit
                        }}</span>
                      </div>
                      <div
                        class="my-[2px] flex items-center justify-center gap-[4px] whitespace-nowrap text-[12px] [&_.ant-input-number]:!w-64px"
                      >
                        <span>单价</span>
                        <InputNumber
                          v-model:value="entry.unitPrice"
                          :disabled="readOnly"
                          :keyboard="false"
                          :min="0"
                          :precision="6"
                          @change="calculateEntryAmount(entry)"
                        />
                      </div>
                    </template>
                    <span
                      v-else
                      class="text-[var(--el-text-color-placeholder)]"
                    >
                      -
                    </span>
                  </td>
                  <td
                    class="entry-money relative !p-0"
                    data-entry-money
                    data-entry-direction="debit"
                  >
                    <div class="money-editor relative h-[60px]">
                      <InputNumber
                        v-model:value="entry.debitAmount"
                        :disabled="readOnly"
                        :keyboard="false"
                        :precision="2"
                        @change="handleEntryAmountChange(entry, 'debit')"
                      />
                      <div
                        :class="{
                          'text-[var(--el-color-danger)]':
                            Number(entry.debitAmount) < 0,
                        }"
                        class="money-cell-value pointer-events-none absolute inset-0 flex items-center justify-end"
                      >
                        <span
                          v-for="(digit, digitIndex) in getMoneyDigits(
                            entry.debitAmount,
                          )"
                          :key="digitIndex"
                        >
                          {{ digit }}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td
                    class="entry-money relative !p-0"
                    data-entry-money
                    data-entry-direction="credit"
                  >
                    <div class="money-editor relative h-[60px]">
                      <InputNumber
                        v-model:value="entry.creditAmount"
                        :disabled="readOnly"
                        :keyboard="false"
                        :precision="2"
                        @change="handleEntryAmountChange(entry, 'credit')"
                      />
                      <div
                        :class="{
                          'text-[var(--el-color-danger)]':
                            Number(entry.creditAmount) < 0,
                        }"
                        class="money-cell-value pointer-events-none absolute inset-0 flex items-center justify-end"
                      >
                        <span
                          v-for="(digit, digitIndex) in getMoneyDigits(
                            entry.creditAmount,
                          )"
                          :key="digitIndex"
                        >
                          {{ digit }}
                        </span>
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td class="entry-operation"></td>
                  <td :colspan="showQuantityColumn ? 3 : 2" class="font-600">
                    合计：{{ amountInWords }}
                    <span
                      v-if="!balanced"
                      class="ml-[16px] text-[var(--el-color-danger)]"
                    >
                      借贷不平衡
                    </span>
                  </td>
                  <td class="entry-money relative !p-0">
                    <div
                      :class="{
                        'text-[var(--el-color-danger)]': debitTotal < 0,
                      }"
                      class="money-cell-value pointer-events-none absolute inset-0 flex h-[60px] items-center justify-end"
                    >
                      <span
                        v-for="(digit, index) in getMoneyDigits(
                          debitTotal,
                          true,
                        )"
                        :key="index"
                      >
                        {{ digit }}
                      </span>
                    </div>
                  </td>
                  <td class="entry-money relative !p-0">
                    <div
                      :class="{
                        'text-[var(--el-color-danger)]': creditTotal < 0,
                      }"
                      class="money-cell-value pointer-events-none absolute inset-0 flex h-[60px] items-center justify-end"
                    >
                      <span
                        v-for="(digit, index) in getMoneyDigits(
                          creditTotal,
                          true,
                        )"
                        :key="index"
                      >
                        {{ digit }}
                      </span>
                    </div>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div
            class="flex items-center justify-start gap-[36px] pb-0 pl-[28px] pr-0 pt-[16px] text-[var(--el-text-color-regular)]"
          >
            <span>制单人：{{ creatorUserName }}</span>
            <template v-if="formData.id">
              <span>审核人：{{ detail?.reviewerUserName || '-' }}</span>
              <Tag :color="isApproved ? 'success' : 'warning'">
                {{ isApproved ? '已审核' : '待审核' }}
              </Tag>
              <Tag v-if="isClosingGenerated">结账生成凭证</Tag>
            </template>
          </div>
          <div
            v-if="isApproved"
            class="pointer-events-none absolute right-[25%] top-[12px] z-3 rotate-[-12deg] rounded-[50%] border-3 border-[var(--el-color-danger)] border-double px-[14px] py-[10px] text-[20px] font-700 tracking-[4px] text-[var(--el-color-danger)] opacity-72"
          >
            审核通过
          </div>
        </div>
      </Spin>
      <div v-if="canSave" class="mt-[16px] flex justify-end gap-[8px]">
        <Button
          v-if="canSaveAndCreate"
          type="primary"
          @click="submitForm(true)"
        >
          保存并新增
        </Button>
        <Button @click="submitForm(false)">保存</Button>
      </div>
    </div>

    <!-- 凭证操作弹窗 -->
    <FmsVoucherTemplateSaveForm ref="templateSaveFormRef" />
    <FmsVoucherTemplateSelect ref="templateSelectRef" @select="applyTemplate" />
    <FmsDigestLibrary ref="digestLibraryRef" @select="applyDigest" />
    <FmsVoucherPrintForm ref="printFormRef" />
    <SubjectFormModal @success="refreshSubjectOptions" />
    <ItemFormModal @success="refreshAuxiliaryItemOptions" />
  </Page>
</template>

<style lang="scss" scoped>
/* 凭证纸张使用 Element 变量名承接源项目样式，这里映射到 Vben 主题变量 */
.voucher-sheet {
  --el-border-color: hsl(var(--border));
  --el-border-color-lighter: hsl(var(--border));
  --el-fill-color-lighter: hsl(var(--muted));
  --el-bg-color: hsl(var(--card));
  --el-color-primary: hsl(var(--primary));
  --el-color-primary-light-5: hsl(var(--primary) / 50%);
  --el-color-danger: hsl(var(--destructive));
  --el-color-danger-light-5: hsl(var(--destructive) / 50%);
  --el-text-color-primary: hsl(var(--foreground));
  --el-text-color-regular: hsl(var(--foreground));
  --el-text-color-secondary: hsl(var(--muted-foreground));
  --el-text-color-placeholder: hsl(var(--input-placeholder));
  --el-box-shadow-light: 0 2px 12px rgb(0 0 0 / 12%);
}

.digest-editor :deep(.ant-btn-link) {
  position: absolute;
  right: 0;
  bottom: 2px;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.entry-digest:hover .digest-editor :deep(.ant-btn-link),
.entry-digest:focus-within .digest-editor :deep(.ant-btn-link) {
  opacity: 1;
}

.entry-subject:hover .subject-balance,
.entry-subject:focus-within .subject-balance {
  display: block;
}

.entry-subject :deep(.ant-select-arrow) {
  opacity: 0;
  transition: opacity 0.15s ease;
}

.entry-subject:hover :deep(.ant-select-arrow),
.entry-subject:focus-within :deep(.ant-select-arrow) {
  opacity: 1;
}

.entry-money :deep(.ant-input-number),
.entry-digest :deep(.ant-input),
.entry-subject :deep(.ant-select-selector) {
  background: transparent;
  border-color: transparent;
  box-shadow: none;
}

.entry-table tbody .entry-money,
.entry-table tfoot .entry-money {
  background-image:
    linear-gradient(
      to right,
      transparent calc(36.36% - 1px),
      var(--el-color-primary-light-5) calc(36.36% - 1px),
      var(--el-color-primary-light-5) 36.36%,
      transparent 36.36%
    ),
    linear-gradient(
      to right,
      transparent calc(72.73% - 1px),
      var(--el-color-primary-light-5) calc(72.73% - 1px),
      var(--el-color-primary-light-5) 72.73%,
      transparent 72.73%
    ),
    linear-gradient(
      to right,
      transparent calc(81.82% - 1px),
      var(--el-color-danger-light-5) calc(81.82% - 1px),
      var(--el-color-danger-light-5) 81.82%,
      transparent 81.82%
    ),
    repeating-linear-gradient(
      to right,
      transparent 0,
      transparent calc(100% / 11 - 1px),
      var(--el-border-color-lighter) calc(100% / 11 - 1px),
      var(--el-border-color-lighter) calc(100% / 11)
    );
}

.money-editor :deep(.ant-input-number) {
  position: absolute;
  inset: 0;
  z-index: 2;
  width: 100%;
  height: 100%;
  opacity: 0;
}

.money-editor:focus-within :deep(.ant-input-number) {
  background: var(--el-bg-color);
  opacity: 1;
}

.money-editor:focus-within .money-cell-value {
  opacity: 0;
}

.entry-money :deep(.ant-input-number-input) {
  height: 60px;
  padding: 0 8px;
  font-family: Arial, sans-serif;
  font-size: 16px;
  font-weight: 600;
  text-align: right;
}

.money-cell-value span {
  flex: 0 0 calc(100% / 11);
  font-family: Tahoma, Arial, sans-serif;
  font-size: 14px;
  font-weight: 600;
  text-align: center;
}
</style>
