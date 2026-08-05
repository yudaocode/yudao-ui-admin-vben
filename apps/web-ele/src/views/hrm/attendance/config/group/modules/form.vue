<script lang="ts" setup>
import type { HrmAttendanceGroupApi } from '#/api/hrm/attendance/group';
import type { SystemDeptApi } from '#/api/system/dept';

import { computed, reactive, ref, watch } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';
import { formatDate, handleTree } from '@vben/utils';

import {
  ElAlert,
  ElButton,
  ElCheckbox,
  ElCol,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElMessage,
  ElRadio,
  ElRow,
  ElSelect,
  ElTable,
  ElTableColumn,
  ElTreeSelect,
} from 'element-plus';

import {
  createAttendanceGroup,
  getAttendanceGroup,
  updateAttendanceGroup,
} from '#/api/hrm/attendance/group';
import { $t } from '#/locales';
import HrmEmployeeMultiSelect from '#/views/hrm/employee/components/employee-multi-select.vue';
import {
  HRM_ATTENDANCE_POINT_RADIUS_OPTIONS,
  HrmAttendanceAbsenteeismDeductMethod,
  HrmAttendanceLateEarlyDeductMethod,
  HrmAttendanceMisscardDeductMethod,
} from '#/views/hrm/utils/constants';
import {
  formatHrmAttendanceDeductUnit as formatDeductUnit,
  formatHrmAttendanceSpecialDate,
  formatHrmAttendanceWeeks,
} from '#/views/hrm/utils/format';

import PointForm from './point-form.vue';
import ShiftForm from './shift-form.vue';
import SpecialDateForm from './special-date-form.vue';
import WifiForm from './wifi-form.vue';

defineOptions({ name: 'HrmAttendanceGroupForm' });

const emit = defineEmits(['success']);

const macPattern = /^((([0-9a-f]{2}:){5})|(([0-9a-f]{2}-){5}))[0-9a-f]{2}$/i;

const formType = ref<'create' | 'update'>('create');
const formRef = ref();
const shiftFormRef = ref<InstanceType<typeof ShiftForm>>();
const specialDateFormRef = ref<InstanceType<typeof SpecialDateForm>>();
const pointFormRef = ref<InstanceType<typeof PointForm>>();
const wifiFormRef = ref<InstanceType<typeof WifiForm>>();
const deptTree = ref<SystemDeptApi.Dept[]>([]);
const formData = ref<HrmAttendanceGroupApi.AttendanceGroup>(createDefault());

const dialogTitle = computed(() =>
  formType.value === 'create'
    ? $t('ui.actionTitle.create', ['考勤组'])
    : $t('ui.actionTitle.edit', ['考勤组']),
);

const lateEarlyDeductMethodOptions = getDictOptions(
  DICT_TYPE.HRM_ATTENDANCE_LATE_EARLY_DEDUCT_METHOD,
  'number',
);
const absenteeismDeductMethodOptions = getDictOptions(
  DICT_TYPE.HRM_ATTENDANCE_ABSENTEEISM_DEDUCT_METHOD,
  'number',
);
const misscardDeductMethodOptions = getDictOptions(
  DICT_TYPE.HRM_ATTENDANCE_MISSCARD_DEDUCT_METHOD,
  'number',
);

const formRules = reactive({
  name: [{ required: true, message: '考勤组名称不能为空', trigger: 'blur' }],
  deptIds: [{ validator: validateScope, trigger: 'change' }],
  employeeIds: [{ validator: validateScope, trigger: 'change' }],
});

function deductUnitText(method?: number) {
  return method === undefined ? '' : `元/${formatDeductUnit(method)}`;
}

function createDefaultDeductRule(): HrmAttendanceGroupApi.DeductRule {
  return {
    lateMethod: HrmAttendanceLateEarlyDeductMethod.FIXED_MONTH,
    lateDeductMoney: 0,
    earlyMethod: HrmAttendanceLateEarlyDeductMethod.FIXED_MONTH,
    earlyDeductMoney: 0,
    absenteeismMethod: HrmAttendanceAbsenteeismDeductMethod.BY_DAY,
    absenteeismDeductMoney: 0,
    misscardMethod: HrmAttendanceMisscardDeductMethod.BY_COUNT,
    misscardDeductMoney: 0,
  };
}

function createDefault(): HrmAttendanceGroupApi.AttendanceGroup {
  return {
    name: '',
    deptIds: [],
    employeeIds: [],
    shifts: [
      {
        weeks: [1, 2, 3, 4, 5],
        startTime: '09:00',
        endTime: '18:00',
        clockInStartTime: '05:00',
        clockInEndTime: '17:59',
        clockOutStartTime: '09:01',
        clockOutEndTime: '04:59',
        restStartTime: '12:00',
        restEndTime: '13:00',
        excludeRestTime: false,
      },
    ],
    specialDates: [],
    points: [],
    wifis: [],
    openPointCard: false,
    openWifiCard: false,
    rest: true,
    deductRule: createDefaultDeductRule(),
  };
}

function validateScope() {
  if (formData.value.deptIds?.length || formData.value.employeeIds?.length) {
    return Promise.resolve();
  }
  return Promise.reject(new Error('至少选择一个适用部门或员工'));
}

function formatPointCoordinate(point: HrmAttendanceGroupApi.Point) {
  if (point.longitude === undefined || point.latitude === undefined) {
    return '-';
  }
  return `${point.longitude}, ${point.latitude}`;
}

function openShiftForm(index?: number) {
  shiftFormRef.value?.open(
    index === undefined ? undefined : formData.value.shifts?.[index],
    index,
  );
}

function handleShiftConfirm(
  shift: HrmAttendanceGroupApi.Shift,
  index?: number,
) {
  const duplicatedWeek = formData.value.shifts?.some(
    (item, itemIndex) =>
      itemIndex !== index &&
      item.weeks.some((week) => shift.weeks.includes(week)),
  );
  if (duplicatedWeek) {
    ElMessage.warning('同一个工作日只能配置一个班次');
    return;
  }
  const shifts = [...(formData.value.shifts || [])];
  if (index === undefined) shifts.push(shift);
  else shifts[index] = shift;
  formData.value.shifts = shifts;
}

function removeShift(index: number) {
  formData.value.shifts = (formData.value.shifts || []).filter(
    (_, i) => i !== index,
  );
}

function openSpecialDateForm(index?: number) {
  specialDateFormRef.value?.open(
    index === undefined ? undefined : formData.value.specialDates?.[index],
    index,
  );
}

function handleSpecialDateConfirm(
  specialDate: HrmAttendanceGroupApi.SpecialDate,
  index?: number,
) {
  const duplicatedDate = formData.value.specialDates?.some(
    (item, itemIndex) =>
      itemIndex !== index && Number(item.date) === Number(specialDate.date),
  );
  if (duplicatedDate) {
    ElMessage.warning('特殊日期不能重复');
    return;
  }
  const specialDates = [...(formData.value.specialDates || [])];
  if (index === undefined) specialDates.push(specialDate);
  else specialDates[index] = specialDate;
  formData.value.specialDates = specialDates;
}

function removeSpecialDate(index: number) {
  formData.value.specialDates = (formData.value.specialDates || []).filter(
    (_, i) => i !== index,
  );
}

function openPointForm(index?: number) {
  pointFormRef.value?.open(
    index === undefined ? undefined : formData.value.points?.[index],
    index,
  );
}

function handlePointConfirm(
  point: HrmAttendanceGroupApi.Point,
  index?: number,
) {
  const points = [...(formData.value.points || [])];
  if (index === undefined) points.push(point);
  else points[index] = point;
  formData.value.points = points;
}

function removePoint(index: number) {
  formData.value.points = (formData.value.points || []).filter(
    (_, i) => i !== index,
  );
}

function openWifiForm(index?: number) {
  wifiFormRef.value?.open(
    index === undefined ? undefined : formData.value.wifis?.[index],
    index,
  );
}

function handleWifiConfirm(wifi: HrmAttendanceGroupApi.Wifi, index?: number) {
  const wifis = [...(formData.value.wifis || [])];
  if (index === undefined) wifis.push(wifi);
  else wifis[index] = wifi;
  formData.value.wifis = wifis;
}

function removeWifi(index: number) {
  formData.value.wifis = (formData.value.wifis || []).filter(
    (_, i) => i !== index,
  );
}

function validateCardSettings() {
  if (!formData.value.openPointCard && !formData.value.openWifiCard) {
    ElMessage.warning('请至少启用定位打卡或 WiFi 打卡');
    return false;
  }
  if (formData.value.openPointCard) {
    const points = formData.value.points || [];
    const invalidPoint =
      points.length === 0 ||
      points.some(
        (point) =>
          !point.name?.trim() ||
          !point.address?.trim() ||
          point.latitude === undefined ||
          point.longitude === undefined ||
          !Number.isFinite(point.latitude) ||
          point.latitude < -90 ||
          point.latitude > 90 ||
          !Number.isFinite(point.longitude) ||
          point.longitude < -180 ||
          point.longitude > 180 ||
          !point.radius ||
          !HRM_ATTENDANCE_POINT_RADIUS_OPTIONS.some(
            (radius) => radius === point.radius,
          ),
      );
    if (invalidPoint) {
      ElMessage.warning('请完整填写定位地点、地址、有效经纬度和打卡范围');
      return false;
    }
  }
  if (formData.value.openWifiCard) {
    const wifis = formData.value.wifis || [];
    if (
      wifis.length === 0 ||
      wifis.some(
        (wifi) => !wifi.ssid?.trim() || !wifi.mac || !macPattern.test(wifi.mac),
      )
    ) {
      ElMessage.warning('请完整填写 WiFi 名称和正确的 MAC 地址');
      return false;
    }
  }
  return true;
}

watch(
  () => formData.value.openPointCard,
  (enabled) => {
    if (!enabled) formData.value.points = [];
  },
);

watch(
  () => formData.value.openWifiCard,
  (enabled) => {
    if (!enabled) formData.value.wifis = [];
  },
);

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    await formRef.value?.validate();
    if (!formData.value.shifts?.length) {
      ElMessage.warning('请至少新增一个班次');
      return;
    }
    if (!validateCardSettings()) return;
    modalApi.lock();
    try {
      const payload = {
        ...formData.value,
        points: formData.value.openPointCard ? formData.value.points : [],
        wifis: formData.value.openWifiCard ? formData.value.wifis : [],
      };
      await (formType.value === 'create'
        ? createAttendanceGroup(payload)
        : updateAttendanceGroup(payload));
      ElMessage.success($t('ui.actionMessage.operationSuccess'));
      await modalApi.close();
      emit('success');
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      formData.value = createDefault();
      return;
    }
    const data = modalApi.getData<{ id?: number; type: 'create' | 'update' }>();
    formType.value = data?.type || 'create';
    const deptApi = await import('#/api/system/dept');
    deptTree.value = handleTree(await deptApi.getSimpleDeptList());
    formData.value = data?.id
      ? { ...createDefault(), ...(await getAttendanceGroup(data.id)) }
      : createDefault();
  },
});
</script>

<template>
  <Modal :title="dialogTitle" class="w-[1120px]">
    <ElForm
      ref="formRef"
      :model="formData"
      :rules="formRules"
      class="mx-4"
      label-width="120px"
    >
      <div class="section-title">基本信息</div>
      <ElFormItem label="考勤组名称" prop="name">
        <ElInput
          v-model="formData.name"
          maxlength="50"
          placeholder="请输入考勤组名称"
        />
      </ElFormItem>
      <ElRow :gutter="20">
        <ElCol :span="12">
          <ElFormItem label="适用部门" prop="deptIds">
            <ElTreeSelect
              v-model="formData.deptIds"
              :data="deptTree"
              :props="{ label: 'name', children: 'children' }"
              check-strictly
              clearable
              class="w-full"
              default-expand-all
              multiple
              node-key="id"
              placeholder="请选择部门"
              show-checkbox
            />
          </ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElFormItem label="适用员工" prop="employeeIds">
            <HrmEmployeeMultiSelect
              v-model="formData.employeeIds"
              title="选择考勤组员工"
            />
          </ElFormItem>
        </ElCol>
      </ElRow>

      <div class="section-title">考勤规则</div>
      <ElFormItem label="规则类型">
        <ElRadio :model-value="true">早晚打卡</ElRadio>
      </ElFormItem>
      <ElFormItem label="班次">
        <div class="w-full">
          <div class="mb-3 text-right">
            <ElButton @click="openShiftForm()">新增班次</ElButton>
          </div>
          <ElTable :data="formData.shifts" border size="small">
            <ElTableColumn label="工作日" min-width="220">
              <template #default="{ row }">
                {{ formatHrmAttendanceWeeks(row.weeks) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="上下班时间" min-width="180">
              <template #default="{ row }">
                {{ row.startTime }} - {{ row.endTime }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="打卡时间段" min-width="310">
              <template #default="{ row }">
                {{ row.clockInStartTime }} - {{ row.clockInEndTime }} /
                {{ row.clockOutStartTime }} - {{ row.clockOutEndTime }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="操作" width="120" align="center">
              <template #default="{ $index }">
                <ElButton link type="primary" @click="openShiftForm($index)">
                  编辑
                </ElButton>
                <ElButton link type="danger" @click="removeShift($index)">
                  删除
                </ElButton>
              </template>
            </ElTableColumn>
          </ElTable>
        </div>
      </ElFormItem>
      <ElFormItem label="节假日">
        <ElCheckbox v-model="formData.rest"> 法定节假日休息 </ElCheckbox>
      </ElFormItem>
      <ElFormItem label="特殊日期">
        <div class="w-full">
          <div class="mb-3 text-right">
            <ElButton @click="openSpecialDateForm()">添加日期</ElButton>
          </div>
          <ElTable :data="formData.specialDates" border size="small">
            <ElTableColumn label="日期" min-width="180">
              <template #default="{ row }">
                {{ formatDate(row.date, 'YYYY-MM-DD') }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="上下班时间" min-width="220">
              <template #default="{ row }">
                {{ formatHrmAttendanceSpecialDate(row, formData.shifts) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="操作" width="120" align="center">
              <template #default="{ $index }">
                <ElButton
                  link
                  type="primary"
                  @click="openSpecialDateForm($index)"
                >
                  编辑
                </ElButton>
                <ElButton link type="danger" @click="removeSpecialDate($index)">
                  删除
                </ElButton>
              </template>
            </ElTableColumn>
          </ElTable>
        </div>
      </ElFormItem>

      <div class="section-title">打卡方式</div>
      <ElFormItem label="定位打卡">
        <div class="w-full">
          <div class="mb-3 flex items-center gap-4">
            <ElCheckbox v-model="formData.openPointCard">
              关联打卡地址
            </ElCheckbox>
            <ElButton
              :disabled="!formData.openPointCard"
              @click="openPointForm()"
            >
              新增打卡地址
            </ElButton>
          </div>
          <ElTable
            v-if="formData.openPointCard"
            :data="formData.points"
            border
            size="small"
          >
            <ElTableColumn label="地点名称" prop="name" min-width="150" />
            <ElTableColumn
              label="打卡地址"
              prop="address"
              min-width="260"
              show-overflow-tooltip
            />
            <ElTableColumn label="经纬度" min-width="220">
              <template #default="{ row }">
                {{ formatPointCoordinate(row as HrmAttendanceGroupApi.Point) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="范围(米)" prop="radius" width="110" />
            <ElTableColumn label="操作" width="120" align="center">
              <template #default="{ $index }">
                <ElButton link type="primary" @click="openPointForm($index)">
                  编辑
                </ElButton>
                <ElButton link type="danger" @click="removePoint($index)">
                  删除
                </ElButton>
              </template>
            </ElTableColumn>
          </ElTable>
        </div>
      </ElFormItem>
      <ElFormItem label="WiFi 打卡">
        <div class="w-full">
          <div class="mb-3 flex items-center gap-4">
            <ElCheckbox v-model="formData.openWifiCard">
              关联打卡 WiFi
            </ElCheckbox>
            <ElButton
              :disabled="!formData.openWifiCard"
              @click="openWifiForm()"
            >
              新增打卡 WiFi
            </ElButton>
          </div>
          <ElTable
            v-if="formData.openWifiCard"
            :data="formData.wifis"
            border
            size="small"
          >
            <ElTableColumn label="WiFi 名称" prop="ssid" min-width="220" />
            <ElTableColumn label="MAC 地址" prop="mac" min-width="220" />
            <ElTableColumn label="操作" width="120" align="center">
              <template #default="{ $index }">
                <ElButton link type="primary" @click="openWifiForm($index)">
                  编辑
                </ElButton>
                <ElButton link type="danger" @click="removeWifi($index)">
                  删除
                </ElButton>
              </template>
            </ElTableColumn>
          </ElTable>
        </div>
      </ElFormItem>

      <div class="section-title">扣款规则</div>
      <ElAlert
        :closable="false"
        class="mb-4"
        show-icon
        title="扣款金额右侧单位随规则变化：按分钟为元/分钟，按次数为元/次，每月固定为元/月，旷工按元/天。"
        type="info"
      />
      <ElRow :gutter="20">
        <ElCol :span="12">
          <ElFormItem
            label="迟到规则"
            :prop="['deductRule', 'lateMethod']"
            :rules="[
              { required: true, message: '请选择迟到规则', trigger: 'change' },
            ]"
          >
            <ElSelect
              v-model="formData.deductRule!.lateMethod"
              :options="lateEarlyDeductMethodOptions"
              class="w-full"
            />
          </ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElFormItem
            label="迟到计算方式"
            :prop="['deductRule', 'lateDeductMoney']"
            :rules="[
              {
                required: true,
                message: '请输入迟到扣款金额',
                trigger: 'blur',
              },
            ]"
          >
            <div class="flex w-full items-center gap-2">
              <ElInputNumber
                v-model="formData.deductRule!.lateDeductMoney"
                :controls="false"
                :min="0"
                :precision="2"
                class="!flex-1"
              />
              <span>{{ deductUnitText(formData.deductRule!.lateMethod) }}</span>
            </div>
          </ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElFormItem
            label="早退规则"
            :prop="['deductRule', 'earlyMethod']"
            :rules="[
              { required: true, message: '请选择早退规则', trigger: 'change' },
            ]"
          >
            <ElSelect
              v-model="formData.deductRule!.earlyMethod"
              :options="lateEarlyDeductMethodOptions"
              class="w-full"
            />
          </ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElFormItem
            label="早退计算方式"
            :prop="['deductRule', 'earlyDeductMoney']"
            :rules="[
              {
                required: true,
                message: '请输入早退扣款金额',
                trigger: 'blur',
              },
            ]"
          >
            <div class="flex w-full items-center gap-2">
              <ElInputNumber
                v-model="formData.deductRule!.earlyDeductMoney"
                :controls="false"
                :min="0"
                :precision="2"
                class="!flex-1"
              />
              <span>{{
                deductUnitText(formData.deductRule!.earlyMethod)
              }}</span>
            </div>
          </ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElFormItem
            label="旷工规则"
            :prop="['deductRule', 'absenteeismMethod']"
            :rules="[
              { required: true, message: '请选择旷工规则', trigger: 'change' },
            ]"
          >
            <ElSelect
              v-model="formData.deductRule!.absenteeismMethod"
              :options="absenteeismDeductMethodOptions"
              class="w-full"
            />
          </ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElFormItem
            label="旷工计算方式"
            :prop="['deductRule', 'absenteeismDeductMoney']"
            :rules="[
              {
                required: true,
                message: '请输入旷工扣款金额',
                trigger: 'blur',
              },
            ]"
          >
            <div class="flex w-full items-center gap-2">
              <ElInputNumber
                v-model="formData.deductRule!.absenteeismDeductMoney"
                :controls="false"
                :min="0"
                :precision="2"
                class="!flex-1"
              />
              <span>元/天</span>
            </div>
          </ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElFormItem
            label="缺卡规则"
            :prop="['deductRule', 'misscardMethod']"
            :rules="[
              { required: true, message: '请选择缺卡规则', trigger: 'change' },
            ]"
          >
            <ElSelect
              v-model="formData.deductRule!.misscardMethod"
              :options="misscardDeductMethodOptions"
              class="w-full"
            />
          </ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElFormItem
            label="缺卡计算方式"
            :prop="['deductRule', 'misscardDeductMoney']"
            :rules="[
              {
                required: true,
                message: '请输入缺卡扣款金额',
                trigger: 'blur',
              },
            ]"
          >
            <div class="flex w-full items-center gap-2">
              <ElInputNumber
                v-model="formData.deductRule!.misscardDeductMoney"
                :controls="false"
                :min="0"
                :precision="2"
                class="!flex-1"
              />
              <span>元/次</span>
            </div>
          </ElFormItem>
        </ElCol>
      </ElRow>
    </ElForm>
    <ShiftForm ref="shiftFormRef" @confirm="handleShiftConfirm" />
    <SpecialDateForm
      ref="specialDateFormRef"
      @confirm="handleSpecialDateConfirm"
    />
    <PointForm ref="pointFormRef" @confirm="handlePointConfirm" />
    <WifiForm ref="wifiFormRef" @confirm="handleWifiConfirm" />
  </Modal>
</template>

<style scoped>
.section-title {
  display: flex;
  align-items: center;
  margin: 8px 0 20px;
  font-size: 16px;
  font-weight: 600;
}

.section-title::before {
  width: 4px;
  height: 18px;
  margin-right: 10px;
  content: '';
  background: var(--el-color-primary);
  border-radius: 2px;
}
</style>
