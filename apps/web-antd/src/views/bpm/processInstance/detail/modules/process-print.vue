<script setup lang="ts">
import type { BpmProcessInstanceApi } from '#/api/bpm/processInstance';
import type { SystemAreaApi } from '#/api/system/area';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { getDictLabel, getDictOptions } from '@vben/hooks';
import { useUserStore } from '@vben/stores';
import { formatDate } from '@vben/utils';

import { Button } from 'ant-design-vue';
// @ts-expect-error - 安装 vue3-print-nb 局部指令 v-print
import vPrint from 'vue3-print-nb';

import { getProcessInstancePrintData } from '#/api/bpm/processInstance';
import { getAreaTree } from '#/api/system/area';
import { getSimpleDeptList } from '#/api/system/dept';
import { getSimpleUserList } from '#/api/system/user';
import { decodeFields } from '#/components/form-create';

const userStore = useUserStore();

interface FormFieldItem {
  html: string;
  id: string;
  name: string;
}

interface FormFieldOption {
  label?: string;
  value?: unknown;
}

type FormFieldRule = Record<string, unknown> & {
  field?: string;
  options?: FormFieldOption[];
  props?: Record<string, unknown>;
  title?: string;
  type?: string;
};

type PrintableRecord = Record<string, unknown>;

interface PrintLookupMaps {
  areaMap: Map<string, string>;
  deptMap: Map<string, string>;
  userMap: Map<string, string>;
}

const printData = ref<BpmProcessInstanceApi.ProcessPrintDataRespVO>();
const userName = computed(() => userStore.userInfo?.nickname ?? '');
const printTime = ref(formatDate(new Date(), 'YYYY-MM-DD HH:mm'));
const formFields = ref<FormFieldItem[]>([]);
const printDataMap = ref<Record<string, string>>({});

/** 打印配置 */
const printObj = ref({
  id: 'printDivTag',
  popTitle: '&nbsp;',
  extraCss: '/print.css',
  extraHead: '',
  zIndex: 20_003,
});

const [Modal, modalApi] = useVbenModal({
  closable: true,
  footer: false,
  title: '打印流程',
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      return;
    }

    modalApi.lock();
    try {
      const { processInstanceId } = modalApi.getData<{
        processInstanceId: string;
      }>();
      if (processInstanceId) {
        await fetchPrintData(processInstanceId);
      }
    } finally {
      modalApi.unlock();
    }
  },
});

/** 获取打印数据 */
async function fetchPrintData(id: string) {
  printData.value = await getProcessInstancePrintData(id);
  printTime.value = formatDate(new Date(), 'YYYY-MM-DD HH:mm');
  initPrintDataMap();
  await parseFormFields();
}

/** 解析表单字段 */
async function parseFormFields() {
  if (!printData.value) return;

  const formFieldsObj = decodeFields(
    printData.value.processInstance.processDefinition?.formFields || [],
  ) as unknown as FormFieldRule[];
  const processVariables = printData.value.processInstance.formVariables ?? {};
  const lookupMaps = await loadPrintLookupMaps(formFieldsObj);
  const res: FormFieldItem[] = [];

  for (const item of formFieldsObj) {
    const fieldKey = String(item.field ?? '');
    const id = fieldKey;
    const name = String(item.title ?? fieldKey);
    const variable = processVariables[fieldKey];
    const html = formatPrintField(item, variable, lookupMaps);

    printDataMap.value[fieldKey] = html;
    res.push({ id, name, html });
  }

  formFields.value = res;
}

function getRuleProp(rule: FormFieldRule, key: string) {
  return rule?.[key] ?? rule?.props?.[key];
}

function isPrintableRecord(value: unknown): value is PrintableRecord {
  return typeof value === 'object' && value !== null;
}

function getRecordValue(record: PrintableRecord, key: string) {
  return record[key];
}

function isNotEmptyString(value: string) {
  return value.length > 0;
}

function isEmptyValue(value: unknown) {
  return value === undefined || value === null || value === '';
}

function toValueArray(value: unknown) {
  if (Array.isArray(value)) {
    return value;
  }
  if (isEmptyValue(value)) {
    return [];
  }
  return [value];
}

function tryFormatDate(value: unknown) {
  if (isEmptyValue(value)) {
    return '';
  }
  const formatted = formatDate(value as Date | number | string);
  return formatted === 'Invalid Date' ? escapeHtml(value) : formatted;
}

function formatDateValue(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => tryFormatDate(item)).join(' ~ ');
  }
  return tryFormatDate(value);
}

function escapeHtml(value: unknown) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatPrimitiveValue(value: unknown): string {
  if (isEmptyValue(value)) {
    return '';
  }
  if (Array.isArray(value)) {
    return value
      .map((item) => formatPrimitiveValue(item))
      .filter((s) => isNotEmptyString(s))
      .join(', ');
  }
  if (typeof value === 'boolean') {
    return value ? '是' : '否';
  }
  if (isPrintableRecord(value)) {
    const record = value;
    const displayValue =
      getRecordValue(record, 'label') ??
      getRecordValue(record, 'name') ??
      getRecordValue(record, 'url') ??
      getRecordValue(record, 'value') ??
      JSON.stringify(value);
    return escapeHtml(displayValue);
  }
  return escapeHtml(value);
}

function createImageHtml(url: string) {
  const imgEl = document.createElement('img');
  imgEl.setAttribute('src', url);
  imgEl.setAttribute('style', 'max-width: 600px; max-height: 300px;');
  return imgEl.outerHTML;
}

function renderImageListHtml(value: unknown) {
  return toValueArray(value)
    .map((item) => {
      let url: string | undefined;
      if (typeof item === 'string') {
        url = item;
      } else if (isPrintableRecord(item)) {
        const recordUrl = getRecordValue(item, 'url');
        url = recordUrl ? String(recordUrl) : undefined;
      }
      return url ? createImageHtml(String(url)) : '';
    })
    .filter((s) => isNotEmptyString(s))
    .join('<br/>');
}

function createFileLinkHtml(file: unknown) {
  const record = isPrintableRecord(file) ? file : undefined;
  const recordUrl = record ? getRecordValue(record, 'url') : undefined;
  const url = typeof file === 'string' ? file : String(recordUrl ?? '');
  if (!url) {
    return '';
  }
  const linkEl = document.createElement('a');
  linkEl.setAttribute('href', String(url));
  linkEl.setAttribute('target', '_blank');
  linkEl.setAttribute('rel', 'noopener noreferrer');
  const fallbackName = String(url).slice(Math.max(0, String(url).lastIndexOf('/') + 1)) || String(url);
  const recordName = record ? getRecordValue(record, 'name') : undefined;
  linkEl.textContent = recordName ? String(recordName) : fallbackName;
  return linkEl.outerHTML;
}

function renderFileListHtml(value: unknown) {
  return toValueArray(value)
    .map((item) => createFileLinkHtml(item))
    .filter((s) => isNotEmptyString(s))
    .join('<br/>');
}

function mapValuesWithOptions(
  value: unknown,
  options: FormFieldOption[] = [],
) {
  const values = toValueArray(value);
  const labels = values
    .map((item) => {
      const matched = options.find(
        (option) =>
          option?.value === item || String(option?.value ?? '') === String(item),
      );
      return escapeHtml(matched?.label ?? String(item));
    })
    .filter((s) => isNotEmptyString(s));
  return labels.join(', ');
}

function flattenAreaTree(
  list: Array<SystemAreaApi.Area & { children?: SystemAreaApi.Area[] }> = [],
  map: Map<string, string> = new Map(),
) {
  list.forEach((item) => {
    if (item.id !== undefined) {
      map.set(String(item.id), item.name);
    }
    if (Array.isArray(item.children) && item.children.length > 0) {
      flattenAreaTree(item.children, map);
    }
  });
  return map;
}

function mapValueWithLabelMap(
  value: unknown,
  labelMap: Map<string, string>,
  separator = ', ',
) {
  const values = toValueArray(value);
  const labels = values
    .map((item) => escapeHtml(labelMap.get(String(item)) ?? String(item)))
    .filter((s) => isNotEmptyString(s));
  return labels.length > 0
    ? labels.join(escapeHtml(separator))
    : formatPrimitiveValue(values);
}

/**
 * 按当前表单字段类型按需加载打印所需的关联数据，并构建查找映射表。
 *
 * @param formFieldsObj - 已解码的表单字段规则列表
 * @returns 打印展示时使用的区域、部门、用户名称映射
 */
async function loadPrintLookupMaps(formFieldsObj: FormFieldRule[]) {
  const hasAreaSelect = formFieldsObj.some((item) => item.type === 'AreaSelect');
  const hasUserSelect = formFieldsObj.some((item) => item.type === 'UserSelect');
  const hasDeptSelect = formFieldsObj.some((item) => item.type === 'DeptSelect');

  const [areaList, userList, deptList] = await Promise.all([
    hasAreaSelect ? getAreaTree() : Promise.resolve([]),
    hasUserSelect ? getSimpleUserList() : Promise.resolve([]),
    hasDeptSelect ? getSimpleDeptList() : Promise.resolve([]),
  ]);

  return {
    areaMap: flattenAreaTree(areaList as Array<SystemAreaApi.Area>),
    deptMap: new Map(
      (deptList ?? []).map((item) => [String(item.id), item.name] as const),
    ),
    userMap: new Map(
      (userList ?? []).map(
        (item) => [String(item.id), item.nickname ?? item.username] as const,
      ),
    ),
  } satisfies PrintLookupMaps;
}

/**
 * 根据表单字段规则和字段值，格式化为适合打印展示的 HTML 字符串。
 *
 * @param rule - 表单字段规则，包含字段类型、选项、props 等配置信息
 * @param value - 该字段在流程实例中的实际值
 * @param lookupMaps - 预加载的查找映射表，包含区域、部门、用户的 id→name 映射
 * @returns 格式化后的 HTML 字符串（纯文本或富文本，取决于字段类型）
 */
function formatPrintField(
  rule: FormFieldRule,
  value: unknown,
  lookupMaps: PrintLookupMaps,
){
  const type = String(rule.type ?? '');

  switch (type) {
    case 'AreaSelect': {
      const separator = String(getRuleProp(rule, 'separator') || '/');
      return mapValueWithLabelMap(value, lookupMaps.areaMap, separator);
    }
    case 'cascader':
    case 'checkbox':
    case 'radio':
    case 'select':
    case 'treeSelect': {
      const options = getRuleProp(rule, 'options');
      return Array.isArray(options) && options.length > 0
        ? mapValuesWithOptions(value, options as FormFieldOption[])
        : formatPrimitiveValue(value);
    }
    case 'date':
    case 'DatePicker':
    case 'datePicker':
    case 'daterange':
    case 'datetime':
    case 'datetimerange':
    case 'month':
    case 'monthrange':
    case 'RangePicker':
    case 'rangePicker':
    case 'TimePicker':
    case 'timePicker':
    case 'TimeRangePicker':
    case 'timeRangePicker': {
      return formatDateValue(value);
    }
    case 'DeptSelect': {
      if (String(getRuleProp(rule, 'returnType')) === 'name') {
        return formatPrimitiveValue(value);
      }
      return mapValueWithLabelMap(value, lookupMaps.deptMap);
    }
    case 'DictSelect': {
      const dictType = getRuleProp(rule, 'dictType');
      if (typeof dictType !== 'string' || !dictType) {
        return formatPrimitiveValue(value);
      }
      const valueTypeMap = {
        bool: 'boolean',
        int: 'number',
        str: 'string',
      } as const;
      const rawValueType = String(getRuleProp(rule, 'valueType') ?? '');
      const valueType =
        (valueTypeMap as Record<string, 'boolean' | 'number' | 'string'>)[rawValueType] ??
        'string';
      const options = getDictOptions(dictType, valueType);
      return mapValuesWithOptions(value, options);
    }
    case 'Editor':
    case 'Tinymce': {
      return isEmptyValue(value) ? '' : String(value);
    }
    case 'FileUpload':
    case 'UploadFile': {
      return renderFileListHtml(value);
    }
    case 'IframeComponent': {
      const propsObj = rule.props;
      const propsUrl =
        isPrintableRecord(propsObj)
          ? String(getRecordValue(propsObj, 'url') ?? '')
          : '';
      const iframeUrl = isEmptyValue(value) ? propsUrl : String(value ?? '');
      return iframeUrl ? createFileLinkHtml(iframeUrl) : '';
    }
    case 'ImagesUpload':
    case 'ImageUpload':
    case 'UploadImg':
    case 'UploadImgs': {
      return renderImageListHtml(value);
    }
    case 'switch': {
      if (isEmptyValue(value)) return '否';
      const checkedVal =
        getRuleProp(rule, 'checkedValue') ?? getRuleProp(rule, 'activeValue');
      const isChecked =
        checkedVal !== undefined && checkedVal !== null
          ? value === checkedVal
          : Boolean(value);
      return isChecked ? '是' : '否';
    }
    case 'UserSelect': {
      if (String(getRuleProp(rule, 'returnType')) === 'name') {
        return formatPrimitiveValue(value);
      }
      return mapValueWithLabelMap(value, lookupMaps.userMap);
    }
    default: {
      return formatPrimitiveValue(value);
    }
  }
}

/** 初始化打印数据映射 */
function initPrintDataMap() {
  if (!printData.value) return;

  printDataMap.value.startUser =
    printData.value.processInstance.startUser?.nickname || '';
  printDataMap.value.startUserDept =
    printData.value.processInstance.startUser?.deptName || '';
  printDataMap.value.processName = printData.value.processInstance.name;
  printDataMap.value.processNum = String(printData.value.processInstance.id ?? '');
  printDataMap.value.startTime = formatDate(
    printData.value.processInstance.startTime,
  );
  printDataMap.value.endTime = formatDate(
    printData.value.processInstance.endTime,
  );
  printDataMap.value.processStatus = String(
    getDictLabel(
      DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS,
      printData.value.processInstance.status,
    ) ?? '',
  );
  printDataMap.value.printUser = userName.value;
  printDataMap.value.printTime = printTime.value;
}

/** 获取打印模板 HTML  */
function getPrintTemplateHTML() {
  if (!printData.value?.printTemplateHtml) return '';

  const parser = new DOMParser();
  const doc = parser.parseFromString(
    printData.value.printTemplateHtml,
    'text/html',
  );

  // 替换 mentions
  const mentions = doc.querySelectorAll('[data-w-e-type="mention"]');
  mentions.forEach((item) => {
    const htmlElement = item as HTMLElement;
    const mentionId = JSON.parse(
      decodeURIComponent(htmlElement.dataset.info ?? ''),
    ).id;
    item.innerHTML = printDataMap.value[mentionId] ?? '';
  });

  // 替换流程记录
  const processRecords = doc.querySelectorAll(
    '[data-w-e-type="process-record"]',
  );
  const processRecordTable: Element = document.createElement('table');

  if (processRecords.length > 0) {
    // 构建流程记录 html
    processRecordTable.setAttribute('class', 'w-full border-collapse');

    const headTr = document.createElement('tr');
    const headTd = document.createElement('td');
    headTd.setAttribute('colspan', '2');
    headTd.setAttribute('class', 'border border-black p-1.5 text-center');
    headTd.textContent = '流程记录';
    headTr.append(headTd);
    processRecordTable.append(headTr);

    printData.value?.tasks.forEach((item) => {
      const tr = document.createElement('tr');
      const td1 = document.createElement('td');
      td1.setAttribute('class', 'border border-black p-1.5');
      td1.textContent = item.name;
      const td2 = document.createElement('td');
      td2.setAttribute('class', 'border border-black p-1.5');
      td2.textContent = item.description;
      tr.append(td1);
      tr.append(td2);
      processRecordTable.append(tr);
    });
  }

  processRecords.forEach((item) => {
    item.innerHTML = processRecordTable.outerHTML;
  });

  // 返回 html
  return doc.body.innerHTML;
}
</script>

<template>
  <Modal class="w-2/3">
    <div id="printDivTag" class="break-all">
      <!-- eslint-disable vue/no-v-html  使用自定义打印模板 -->
      <div
        v-if="printData?.printTemplateEnable"
        v-html="getPrintTemplateHTML()"
      ></div>
      <div v-else-if="printData">
        <h2 class="mb-3 text-center text-xl font-bold">
          {{ printData.processInstance.name }}
        </h2>
        <div class="mb-2 flex justify-between text-sm">
          <div>
            {{ `流程编号: ${printData.processInstance.id}` }}
          </div>
          <div>
            {{ `打印人员: ${userName}` }}
          </div>
        </div>
        <table class="mt-3 w-full border-collapse">
          <tbody>
            <tr>
              <td class="w-1/4 border border-black p-1.5">发起人</td>
              <td class="w-1/4 border border-black p-1.5">
                {{ printData.processInstance.startUser?.nickname }}
              </td>
              <td class="w-1/4 border border-black p-1.5">发起时间</td>
              <td class="w-1/4 border border-black p-1.5">
                {{ formatDate(printData.processInstance.startTime) }}
              </td>
            </tr>
            <tr>
              <td class="w-1/4 border border-black p-1.5">所属部门</td>
              <td class="w-1/4 border border-black p-1.5">
                {{ printData.processInstance.startUser?.deptName }}
              </td>
              <td class="w-1/4 border border-black p-1.5">流程状态</td>
              <td class="w-1/4 border border-black p-1.5">
                {{
                  getDictLabel(
                    DICT_TYPE.BPM_PROCESS_INSTANCE_STATUS,
                    printData.processInstance.status,
                  )
                }}
              </td>
            </tr>
            <tr>
              <td
                class="w-full border border-black p-1.5 text-center"
                colspan="4"
              >
                <h4>表单内容</h4>
              </td>
            </tr>
            <tr v-for="item in formFields" :key="item.id">
              <td class="w-1/5 border border-black p-1.5">
                {{ item.name }}
              </td>
              <td class="w-4/5 border border-black p-1.5" colspan="3">
                <div v-html="item.html"></div>
              </td>
            </tr>
            <tr>
              <td
                class="w-full border border-black p-1.5 text-center"
                colspan="4"
              >
                <h4>流程记录</h4>
              </td>
            </tr>
            <tr v-for="item in printData.tasks" :key="item.id">
              <td class="w-1/5 border border-black p-1.5">
                {{ item.name }}
              </td>
              <td class="w-4/5 border border-black p-1.5" colspan="3">
                {{ item.description }}
                <div v-if="item.signPicUrl && item.signPicUrl.length > 0">
                  <img class="h-10 w-[90px]" :src="item.signPicUrl" alt="" />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <template #footer>
      <div class="flex justify-end gap-2">
        <Button @click="modalApi.close()">取 消</Button>
        <Button v-print="printObj" type="primary">打 印</Button>
      </div>
    </template>
  </Modal>
</template>
