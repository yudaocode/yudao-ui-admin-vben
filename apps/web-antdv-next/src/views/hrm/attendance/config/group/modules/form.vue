<script lang="ts" setup>
import type { Rule, TableColumnsType } from 'antdv-next';

import type { HrmAttendanceGroupApi } from '#/api/hrm/attendance/group';
import type { SystemDeptApi } from '#/api/system/dept';

import { computed, reactive, ref, watch } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';
import { formatDate, handleTree } from '@vben/utils';

import {
  Alert,
  Button,
  Checkbox,
  Col,
  Form,
  FormItem,
  Input,
  InputNumber,
  message,
  Radio,
  Row,
  Select,
  Table,
  TreeSelect,
} from 'antdv-next';

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
const shiftColumns: TableColumnsType<HrmAttendanceGroupApi.Shift> = [
  { title: '工作日', key: 'weeks', minWidth: 220 },
  { title: '上下班时间', key: 'workTime', minWidth: 180 },
  { title: '打卡时间段', key: 'clockTime', minWidth: 310 },
  { title: '操作', key: 'actions', width: 120, align: 'center' },
];
const specialDateColumns: TableColumnsType<HrmAttendanceGroupApi.SpecialDate> =
  [
    { title: '日期', key: 'date', minWidth: 180 },
    { title: '上下班时间', key: 'workTime', minWidth: 220 },
    { title: '操作', key: 'actions', width: 120, align: 'center' },
  ];
const pointColumns: TableColumnsType<HrmAttendanceGroupApi.Point> = [
  { title: '地点名称', dataIndex: 'name', key: 'name', minWidth: 150 },
  { title: '打卡地址', dataIndex: 'address', key: 'address', minWidth: 260 },
  { title: '经纬度', key: 'coordinate', minWidth: 220 },
  { title: '范围(米)', dataIndex: 'radius', key: 'radius', width: 110 },
  { title: '操作', key: 'actions', width: 120, align: 'center' },
];
const wifiColumns: TableColumnsType<HrmAttendanceGroupApi.Wifi> = [
  { title: 'WiFi 名称', dataIndex: 'ssid', key: 'ssid', minWidth: 220 },
  { title: 'MAC 地址', dataIndex: 'mac', key: 'mac', minWidth: 220 },
  { title: '操作', key: 'actions', width: 120, align: 'center' },
];

const formRules = reactive<Record<string, Rule[]>>({
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
    message.warning('同一个工作日只能配置一个班次');
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
    message.warning('特殊日期不能重复');
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
    message.warning('请至少启用定位打卡或 WiFi 打卡');
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
      message.warning('请完整填写定位地点、地址、有效经纬度和打卡范围');
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
      message.warning('请完整填写 WiFi 名称和正确的 MAC 地址');
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
      message.warning('请至少新增一个班次');
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
      message.success($t('ui.actionMessage.operationSuccess'));
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
    <Form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      class="mx-4"
      label-width="120px"
    >
      <div class="section-title">基本信息</div>
      <FormItem label="考勤组名称" name="name">
        <Input
          v-model:value="formData.name"
          :maxlength="50"
          placeholder="请输入考勤组名称"
        />
      </FormItem>
      <Row :gutter="20">
        <Col :span="12">
          <FormItem label="适用部门" name="deptIds">
            <TreeSelect
              v-model:value="formData.deptIds"
              :field-names="{
                label: 'name',
                value: 'id',
                children: 'children',
              }"
              :tree-data="deptTree"
              allow-clear
              class="w-full"
              multiple
              placeholder="请选择部门"
              tree-checkable
              tree-default-expand-all
            />
          </FormItem>
        </Col>
        <Col :span="12">
          <FormItem label="适用员工" name="employeeIds">
            <HrmEmployeeMultiSelect
              v-model="formData.employeeIds"
              title="选择考勤组员工"
            />
          </FormItem>
        </Col>
      </Row>

      <div class="section-title">考勤规则</div>
      <FormItem label="规则类型">
        <Radio :checked="true">早晚打卡</Radio>
      </FormItem>
      <FormItem label="班次">
        <div class="w-full">
          <div class="mb-3 text-right">
            <Button @click="openShiftForm()">新增班次</Button>
          </div>
          <Table
            :columns="shiftColumns"
            :data-source="formData.shifts"
            :pagination="false"
            bordered
            size="small"
          >
            <template #bodyCell="{ column, record, index }">
              <template v-if="column.key === 'weeks'">
                {{ formatHrmAttendanceWeeks(record.weeks) }}
              </template>
              <template v-else-if="column.key === 'workTime'">
                {{ record.startTime }} - {{ record.endTime }}
              </template>
              <template v-else-if="column.key === 'clockTime'">
                {{ record.clockInStartTime }} - {{ record.clockInEndTime }} /
                {{ record.clockOutStartTime }} - {{ record.clockOutEndTime }}
              </template>
              <template v-else-if="column.key === 'actions'">
                <Button type="link" @click="openShiftForm(index)">编辑</Button>
                <Button danger type="link" @click="removeShift(index)">
                  删除
                </Button>
              </template>
            </template>
          </Table>
        </div>
      </FormItem>
      <FormItem label="节假日">
        <Checkbox v-model:checked="formData.rest"> 法定节假日休息 </Checkbox>
      </FormItem>
      <FormItem label="特殊日期">
        <div class="w-full">
          <div class="mb-3 text-right">
            <Button @click="openSpecialDateForm()">添加日期</Button>
          </div>
          <Table
            :columns="specialDateColumns"
            :data-source="formData.specialDates"
            :pagination="false"
            bordered
            size="small"
          >
            <template #bodyCell="{ column, record, index }">
              <template v-if="column.key === 'date'">
                {{ formatDate(record.date, 'YYYY-MM-DD') }}
              </template>
              <template v-else-if="column.key === 'workTime'">
                {{ formatHrmAttendanceSpecialDate(record, formData.shifts) }}
              </template>
              <template v-else-if="column.key === 'actions'">
                <Button type="link" @click="openSpecialDateForm(index)">
                  编辑
                </Button>
                <Button danger type="link" @click="removeSpecialDate(index)">
                  删除
                </Button>
              </template>
            </template>
          </Table>
        </div>
      </FormItem>

      <div class="section-title">打卡方式</div>
      <FormItem label="定位打卡">
        <div class="w-full">
          <div class="mb-3 flex items-center gap-4">
            <Checkbox v-model:checked="formData.openPointCard">
              关联打卡地址
            </Checkbox>
            <Button
              :disabled="!formData.openPointCard"
              @click="openPointForm()"
            >
              新增打卡地址
            </Button>
          </div>
          <Table
            v-if="formData.openPointCard"
            :columns="pointColumns"
            :data-source="formData.points"
            :pagination="false"
            bordered
            size="small"
          >
            <template #bodyCell="{ column, record, index }">
              <template v-if="column.key === 'coordinate'">
                {{ formatPointCoordinate(record) }}
              </template>
              <template v-else-if="column.key === 'actions'">
                <Button type="link" @click="openPointForm(index)">编辑</Button>
                <Button danger type="link" @click="removePoint(index)">
                  删除
                </Button>
              </template>
            </template>
          </Table>
        </div>
      </FormItem>
      <FormItem label="WiFi 打卡">
        <div class="w-full">
          <div class="mb-3 flex items-center gap-4">
            <Checkbox v-model:checked="formData.openWifiCard">
              关联打卡 WiFi
            </Checkbox>
            <Button :disabled="!formData.openWifiCard" @click="openWifiForm()">
              新增打卡 WiFi
            </Button>
          </div>
          <Table
            v-if="formData.openWifiCard"
            :columns="wifiColumns"
            :data-source="formData.wifis"
            :pagination="false"
            bordered
            size="small"
          >
            <template #bodyCell="{ column, index }">
              <template v-if="column.key === 'actions'">
                <Button type="link" @click="openWifiForm(index)">编辑</Button>
                <Button danger type="link" @click="removeWifi(index)">
                  删除
                </Button>
              </template>
            </template>
          </Table>
        </div>
      </FormItem>

      <div class="section-title">扣款规则</div>
      <Alert
        class="mb-4"
        message="扣款金额右侧单位随规则变化：按分钟为元/分钟，按次数为元/次，每月固定为元/月，旷工按元/天。"
        show-icon
        type="info"
      />
      <Row :gutter="20">
        <Col :span="12">
          <FormItem
            label="迟到规则"
            :name="['deductRule', 'lateMethod']"
            :rules="[
              { required: true, message: '请选择迟到规则', trigger: 'change' },
            ]"
          >
            <Select
              v-model:value="formData.deductRule!.lateMethod"
              :options="lateEarlyDeductMethodOptions"
              class="w-full"
            />
          </FormItem>
        </Col>
        <Col :span="12">
          <FormItem
            label="迟到计算方式"
            :name="['deductRule', 'lateDeductMoney']"
            :rules="[
              {
                required: true,
                message: '请输入迟到扣款金额',
                trigger: 'blur',
              },
            ]"
          >
            <div class="flex w-full items-center gap-2">
              <InputNumber
                v-model:value="formData.deductRule!.lateDeductMoney"
                :controls="false"
                :min="0"
                :precision="2"
                class="flex-1"
              />
              <span>{{ deductUnitText(formData.deductRule!.lateMethod) }}</span>
            </div>
          </FormItem>
        </Col>
        <Col :span="12">
          <FormItem
            label="早退规则"
            :name="['deductRule', 'earlyMethod']"
            :rules="[
              { required: true, message: '请选择早退规则', trigger: 'change' },
            ]"
          >
            <Select
              v-model:value="formData.deductRule!.earlyMethod"
              :options="lateEarlyDeductMethodOptions"
              class="w-full"
            />
          </FormItem>
        </Col>
        <Col :span="12">
          <FormItem
            label="早退计算方式"
            :name="['deductRule', 'earlyDeductMoney']"
            :rules="[
              {
                required: true,
                message: '请输入早退扣款金额',
                trigger: 'blur',
              },
            ]"
          >
            <div class="flex w-full items-center gap-2">
              <InputNumber
                v-model:value="formData.deductRule!.earlyDeductMoney"
                :controls="false"
                :min="0"
                :precision="2"
                class="flex-1"
              />
              <span>{{
                deductUnitText(formData.deductRule!.earlyMethod)
              }}</span>
            </div>
          </FormItem>
        </Col>
        <Col :span="12">
          <FormItem
            label="旷工规则"
            :name="['deductRule', 'absenteeismMethod']"
            :rules="[
              { required: true, message: '请选择旷工规则', trigger: 'change' },
            ]"
          >
            <Select
              v-model:value="formData.deductRule!.absenteeismMethod"
              :options="absenteeismDeductMethodOptions"
              class="w-full"
            />
          </FormItem>
        </Col>
        <Col :span="12">
          <FormItem
            label="旷工计算方式"
            :name="['deductRule', 'absenteeismDeductMoney']"
            :rules="[
              {
                required: true,
                message: '请输入旷工扣款金额',
                trigger: 'blur',
              },
            ]"
          >
            <div class="flex w-full items-center gap-2">
              <InputNumber
                v-model:value="formData.deductRule!.absenteeismDeductMoney"
                :controls="false"
                :min="0"
                :precision="2"
                class="flex-1"
              />
              <span>元/天</span>
            </div>
          </FormItem>
        </Col>
        <Col :span="12">
          <FormItem
            label="缺卡规则"
            :name="['deductRule', 'misscardMethod']"
            :rules="[
              { required: true, message: '请选择缺卡规则', trigger: 'change' },
            ]"
          >
            <Select
              v-model:value="formData.deductRule!.misscardMethod"
              :options="misscardDeductMethodOptions"
              class="w-full"
            />
          </FormItem>
        </Col>
        <Col :span="12">
          <FormItem
            label="缺卡计算方式"
            :name="['deductRule', 'misscardDeductMoney']"
            :rules="[
              {
                required: true,
                message: '请输入缺卡扣款金额',
                trigger: 'blur',
              },
            ]"
          >
            <div class="flex w-full items-center gap-2">
              <InputNumber
                v-model:value="formData.deductRule!.misscardDeductMoney"
                :controls="false"
                :min="0"
                :precision="2"
                class="flex-1"
              />
              <span>元/次</span>
            </div>
          </FormItem>
        </Col>
      </Row>
    </Form>
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
  background: hsl(var(--primary));
  border-radius: 2px;
}
</style>
