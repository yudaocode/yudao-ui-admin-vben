<script setup>
import { ref, watch } from 'vue';

import dayjs from 'dayjs';
import {
  ElButton,
  ElButtonGroup,
  ElCheckbox,
  ElCheckboxGroup,
  ElDatePicker,
  ElInput,
  ElInputNumber,
  ElRadio,
  ElRadioGroup,
  ElTabPane,
  ElTabs,
} from 'element-plus';

const props = defineProps({
  value: {
    type: String,
    default: '',
  },
});
const emit = defineEmits(['change']);

const tab = ref('cron');
const cronStr = ref(props.value || '* * * * * ?');
const fields = ref({
  second: '*',
  minute: '*',
  hour: '*',
  day: '*',
  month: '*',
  week: '?',
  year: '',
});
const cronFieldList = [
  { key: 'second', label: '秒', min: 0, max: 59 },
  { key: 'minute', label: '分', min: 0, max: 59 },
  { key: 'hour', label: '时', min: 0, max: 23 },
  { key: 'day', label: '天', min: 1, max: 31 },
  { key: 'month', label: '月', min: 1, max: 12 },
  { key: 'week', label: '周', min: 1, max: 7 },
  { key: 'year', label: '年', min: 1970, max: 2099 },
];
const activeField = ref('second');
const cronMode = ref({
  second: 'every',
  minute: 'every',
  hour: 'every',
  day: 'every',
  month: 'every',
  week: 'every',
  year: 'every',
});
const cronAppoint = ref({
  second: [],
  minute: [],
  hour: [],
  day: [],
  month: [],
  week: [],
  year: [],
});
const cronRange = ref({
  second: [0, 1],
  minute: [0, 1],
  hour: [0, 1],
  day: [1, 2],
  month: [1, 2],
  week: [1, 2],
  year: [1970, 1971],
});
const cronStep = ref({
  second: [1, 1],
  minute: [1, 1],
  hour: [1, 1],
  day: [1, 1],
  month: [1, 1],
  week: [1, 1],
  year: [1970, 1],
});

function pad(n) {
  return n < 10 ? `0${n}` : `${n}`;
}

watch(
  [fields, cronMode, cronAppoint, cronRange, cronStep],
  () => {
    // 组装cron表达式
    const arr = cronFieldList.map((f) => {
      if (cronMode.value[f.key] === 'every') return '*';
      if (cronMode.value[f.key] === 'appoint')
        return cronAppoint.value[f.key].join(',') || '*';
      if (cronMode.value[f.key] === 'range')
        return `${cronRange.value[f.key][0]}-${cronRange.value[f.key][1]}`;
      if (cronMode.value[f.key] === 'step')
        return `${cronStep.value[f.key][0]}/${cronStep.value[f.key][1]}`;
      return fields.value[f.key] || '*';
    });
    // week和year特殊处理
    arr[5] = arr[5] || '?';
    cronStr.value = arr.join(' ');
    if (tab.value === 'cron') emit('change', cronStr.value);
  },
  { deep: true },
);

// 标准格式
const isoStr = ref('');
const repeat = ref(1);
const isoDate = ref('');
const durationUnits = [
  { key: 'Y', label: '年', presets: [1, 2, 3, 4] },
  { key: 'M', label: '月', presets: [1, 2, 3, 4] },
  { key: 'D', label: '天', presets: [1, 2, 3, 4] },
  { key: 'H', label: '时', presets: [4, 8, 12, 24] },
  { key: 'm', label: '分', presets: [5, 10, 30, 50] },
  { key: 'S', label: '秒', presets: [5, 10, 30, 50] },
];
const durationCustom = ref({ Y: '', M: '', D: '', H: '', m: '', S: '' });
const isoDuration = ref('');

function setDuration(key, val) {
  durationCustom.value[key] = !val || Number.isNaN(val) ? '' : val;
  updateDurationStr();
}

function updateDurationStr() {
  let str = 'P';
  str += durationCustom.value.Y ? `${durationCustom.value.Y}Y` : '';
  str += durationCustom.value.M ? `${durationCustom.value.M}M` : '';
  str += durationCustom.value.D ? `${durationCustom.value.D}D` : '';
  str +=
    durationCustom.value.H || durationCustom.value.m || durationCustom.value.S
      ? 'T'
      : '';
  str += durationCustom.value.H ? `${durationCustom.value.H}H` : '';
  str += durationCustom.value.m ? `${durationCustom.value.m}M` : '';
  str += durationCustom.value.S ? `${durationCustom.value.S}S` : '';
  isoDuration.value = str === 'P' ? '' : str;
  updateIsoStr();
}

function updateIsoStr() {
  let str = `R${repeat.value}`;
  if (isoDate.value) {
    const dateStr =
      typeof isoDate.value === 'string'
        ? isoDate.value
        : isoDate.value.toISOString();
    str += `/${dateStr}`;
  }
  if (isoDuration.value) str += `/${isoDuration.value}`;
  isoStr.value = str;
  if (tab.value === 'iso') emit('change', isoStr.value);
}
watch([repeat, isoDate], updateIsoStr);
watch(durationCustom, updateDurationStr, { deep: true });
watch(
  () => props.value,
  (val) => {
    if (!val) return;
    // 自动检测格式：以R开头的是ISO 8601格式，否则是CRON表达式
    if (val.startsWith('R')) {
      tab.value = 'iso';
      isoStr.value = val;
      // 解析ISO格式：R{repeat}/{date}/{duration}
      const parts = val.split('/');
      if (parts[0]) {
        const repeatMatch = parts[0].match(/^R(\d+)$/);
        if (repeatMatch) repeat.value = Number.parseInt(repeatMatch[1], 10);
      }
      // 解析date部分（ISO 8601日期时间格式）
      const datePart = parts.find(
        (p) => p.includes('T') && !p.startsWith('P') && !p.startsWith('R'),
      );
      if (datePart) {
        isoDate.value = dayjs(datePart);
      }
      // 解析duration部分
      const durationPart = parts.find((p) => p.startsWith('P'));
      if (durationPart) {
        const match = durationPart.match(
          /^P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/,
        );
        if (match) {
          durationCustom.value.Y = match[1] || '';
          durationCustom.value.M = match[2] || '';
          durationCustom.value.D = match[3] || '';
          durationCustom.value.H = match[4] || '';
          durationCustom.value.m = match[5] || '';
          durationCustom.value.S = match[6] || '';
          isoDuration.value = durationPart;
        }
      }
    } else {
      tab.value = 'cron';
      cronStr.value = val;
    }
  },
  { immediate: true },
);
</script>
<template>
  <ElTabs v-model="tab">
    <ElTabPane name="cron" label="CRON表达式">
      <div class="mb-2.5">
        <ElInput
          v-model="cronStr"
          readonly
          class="!w-[400px] font-bold"
          key="cronStr"
        />
      </div>
      <div class="mb-2 flex gap-2">
        <ElInput
          v-model="fields.second"
          placeholder="秒"
          class="w-20"
          key="second"
        />
        <ElInput
          v-model="fields.minute"
          placeholder="分"
          class="w-20"
          key="minute"
        />
        <ElInput
          v-model="fields.hour"
          placeholder="时"
          class="w-20"
          key="hour"
        />
        <ElInput v-model="fields.day" placeholder="天" class="w-20" key="day" />
        <ElInput
          v-model="fields.month"
          placeholder="月"
          class="w-20"
          key="month"
        />
        <ElInput
          v-model="fields.week"
          placeholder="周"
          class="w-20"
          key="week"
        />
        <ElInput
          v-model="fields.year"
          placeholder="年"
          class="w-20"
          key="year"
        />
      </div>
      <ElTabs v-model="activeField" type="card" class="mb-2">
        <ElTabPane
          v-for="f in cronFieldList"
          :key="f.key"
          :name="f.key"
          :label="f.label"
        >
          <div class="mb-2">
            <ElRadioGroup v-model="cronMode[f.key]" :key="`radio-${f.key}`">
              <ElRadio value="every" :key="`every-${f.key}`">
                每{{ f.label }}
              </ElRadio>
              <ElRadio value="range" :key="`range-${f.key}`">
                从
                <ElInputNumber
                  v-model="cronRange[f.key][0]"
                  :min="f.min"
                  :max="f.max"
                  size="small"
                  class="!w-[100px]"
                  :key="`range0-${f.key}`"
                />
                到
                <ElInputNumber
                  v-model="cronRange[f.key][1]"
                  :min="f.min"
                  :max="f.max"
                  size="small"
                  class="!w-[100px]"
                  :key="`range1-${f.key}`"
                />
                之间每{{ f.label }}
              </ElRadio>
              <ElRadio value="step" :key="`step-${f.key}`">
                从第
                <ElInputNumber
                  v-model="cronStep[f.key][0]"
                  :min="f.min"
                  :max="f.max"
                  size="small"
                  class="!w-[100px]"
                  :key="`step0-${f.key}`"
                />
                开始每
                <ElInputNumber
                  v-model="cronStep[f.key][1]"
                  :min="1"
                  :max="f.max"
                  size="small"
                  class="!w-[100px]"
                  :key="`step1-${f.key}`"
                />
                {{ f.label }}
              </ElRadio>
              <ElRadio value="appoint" :key="`appoint-${f.key}`">
                指定
              </ElRadio>
            </ElRadioGroup>
          </div>
          <div v-if="cronMode[f.key] === 'appoint'">
            <ElCheckboxGroup
              v-model="cronAppoint[f.key]"
              :key="`group-${f.key}`"
            >
              <ElCheckbox
                v-for="n in f.max + 1"
                :key="`cb-${f.key}-${n - 1}`"
                :value="pad(n - 1)"
                :label="pad(n - 1)"
              />
            </ElCheckboxGroup>
          </div>
        </ElTabPane>
      </ElTabs>
    </ElTabPane>
    <ElTabPane name="iso" label="标准格式">
      <div class="mb-2.5">
        <ElInput
          v-model="isoStr"
          placeholder="如R1/2025-05-21T21:59:54/P3DT30M30S"
          class="w-[400px] font-bold"
          key="isoStr"
        />
      </div>
      <div class="mb-2.5">
        循环次数：<ElInputNumber
          v-model="repeat"
          :min="1"
          class="!w-[100px]"
          key="repeat"
        />
      </div>
      <div class="mb-2.5">
        开始时间：<ElDatePicker
          v-model="isoDate"
          type="datetime"
          placeholder="选择开始时间"
          class="!w-[200px]"
          key="isoDate"
        />
      </div>
      <div class="mb-2.5">
        间隔时长：<ElInput
          v-model="isoDuration"
          readonly
          placeholder="如P3DT30M30S"
          class="!w-[200px]"
          key="isoDuration"
        />
      </div>
      <div>
        <div v-for="unit in durationUnits" :key="unit.key" class="mb-2">
          <span>{{ unit.label }}：</span>
          <ElButtonGroup>
            <ElButton
              v-for="val in unit.presets"
              :key="val"
              size="small"
              @click="setDuration(unit.key, val)"
            >
              {{ val }}
            </ElButton>
          </ElButtonGroup>
          <ElInput
            v-model="durationCustom[unit.key]"
            size="small"
            class="ml-2 !w-[60px]"
            placeholder="自定义"
            @change="setDuration(unit.key, durationCustom[unit.key])"
          />
        </div>
      </div>
    </ElTabPane>
  </ElTabs>
</template>
