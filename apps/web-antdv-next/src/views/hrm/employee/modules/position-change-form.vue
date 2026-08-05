<script lang="ts" setup>
import type { HrmEmployeeApi } from '#/api/hrm/employee';

import { ref } from 'vue';

import { useVbenForm, useVbenModal } from '@vben/common-ui';

import { message } from 'antdv-next';
import dayjs from 'dayjs';

import {
  demoteEmployee,
  promoteEmployee,
  transferEmployee,
} from '#/api/hrm/employee';
import { HrmEmployeeChangeReason } from '#/views/hrm/utils/constants';

import EmployeeSelect from '../components/employee-select.vue';
import { usePositionChangeFormSchema } from '../data';

defineOptions({ name: 'HrmEmployeePositionChangeForm' });

const emit = defineEmits(['success']);

/** 岗位异动模式：调岗 / 晋升 / 降级（对齐源 EmployeePositionChangeForm） */
export type PositionChangeMode = 'demote' | 'promote' | 'transfer';

/** 弹窗打开时传入的数据 */
export type PositionChangeFormData = {
  employee: HrmEmployeeApi.Employee;
  mode: PositionChangeMode;
};

/** 各 mode 对应的标题、schema 类型与提交接口 */
const MODE_CONFIG = {
  demote: {
    title: '办理降级',
    schemaType: 'demotion' as const,
    submit: demoteEmployee,
    defaultReason: HrmEmployeeChangeReason.VIOLATION,
  },
  promote: {
    title: '办理晋升',
    schemaType: 'promotion' as const,
    submit: promoteEmployee,
    defaultReason: HrmEmployeeChangeReason.ORGANIZATION_ADJUSTMENT,
  },
  transfer: {
    title: '调整部门/岗位',
    schemaType: 'transfer' as const,
    submit: transferEmployee,
    defaultReason: HrmEmployeeChangeReason.ORGANIZATION_ADJUSTMENT,
  },
} as const;

const disabledLeaderIds = ref<number[]>([]);
const leaderEmployeeId = ref<number>();
/** 当前打开的异动模式，提交时用于选择接口与成功文案 */
const currentMode = ref<PositionChangeMode>('transfer');

const [Form, formApi] = useVbenForm({
  commonConfig: { labelWidth: 112, componentProps: { class: 'w-full' } },
  layout: 'horizontal',
  // 默认用调岗 schema；实际打开时按 mode 动态替换
  schema: usePositionChangeFormSchema('transfer'),
  showDefaultActions: false,
  wrapperClass: 'grid-cols-1 md:grid-cols-2',
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;
    const config = MODE_CONFIG[currentMode.value];
    modalApi.lock();
    try {
      const values = await formApi.getValues();
      await config.submit({
        ...values,
        newLeaderEmployeeId: leaderEmployeeId.value,
      } as HrmEmployeeApi.TransferReq);
      // 与源项目一致：`${title}成功`
      message.success(`${config.title}成功`);
      await modalApi.close();
      emit('success');
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) return;
    const data = modalApi.getData<PositionChangeFormData>();
    if (!data?.employee || !data.mode) return;

    const { employee, mode } = data;
    const config = MODE_CONFIG[mode];
    currentMode.value = mode;
    disabledLeaderIds.value = employee.id ? [employee.id] : [];
    leaderEmployeeId.value = employee.leaderEmployeeId;

    modalApi.setState({ title: config.title });
    // 按 mode 切换原因选项与字段文案（降级原因集不同）
    formApi.setState({
      schema: usePositionChangeFormSchema(config.schemaType),
    });
    await formApi.resetForm();
    // 默认值对齐源：部门/岗位/职级/地点/上级沿用当前值；降级默认违规违纪
    await formApi.setValues({
      employeeId: employee.id,
      employeeName: employee.name,
      currentPostName: employee.postName,
      reason: config.defaultReason,
      newDeptId: employee.deptId,
      newPostName: employee.postName,
      newPostLevel: employee.postLevel,
      newWorkAddress: employee.workAddress,
      effectTime: dayjs().startOf('day').valueOf(),
    });
  },
});
</script>

<template>
  <Modal class="w-[760px]">
    <Form class="mx-4">
      <template #newLeaderEmployeeId>
        <EmployeeSelect
          v-model="leaderEmployeeId"
          :disabled-ids="disabledLeaderIds"
          placeholder="请选择新直属上级"
        />
      </template>
    </Form>
  </Modal>
</template>
