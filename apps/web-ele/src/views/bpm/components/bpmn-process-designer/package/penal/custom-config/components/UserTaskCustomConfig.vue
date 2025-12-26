<!-- UserTask 自定义配置：
     1. 审批人与提交人为同一人时
     2. 审批人拒绝时
     3. 审批人为空时
     4. 操作按钮
     5. 字段权限
     6. 审批类型
     7. 是否需要签名
-->
<script lang="ts" setup>
import type { ComponentPublicInstance } from 'vue';

import type { SystemUserApi } from '#/api/system/user';

import { inject, nextTick, onMounted, ref, toRaw, watch } from 'vue';

import { BpmModelFormType } from '@vben/constants';
import { IconifyIcon } from '@vben/icons';

import {
  ElButton,
  ElDivider,
  ElFormItem,
  ElInput,
  ElOption,
  ElRadio,
  ElRadioGroup,
  ElSelect,
  ElSwitch,
} from 'element-plus';

import { getSimpleUserList } from '#/api/system/user';
import {
  APPROVE_TYPE,
  ApproveType,
  ASSIGN_EMPTY_HANDLER_TYPES,
  ASSIGN_START_USER_HANDLER_TYPES,
  AssignEmptyHandlerType,
  DEFAULT_BUTTON_SETTING,
  FieldPermissionType,
  OPERATION_BUTTON_NAME,
  REJECT_HANDLER_TYPES,
  RejectHandlerType,
} from '#/views/bpm/components/simple-process-design/consts';
import { useFormFieldsPermission } from '#/views/bpm/components/simple-process-design/helpers';

defineOptions({ name: 'ElementCustomConfig4UserTask' });
const props = defineProps({
  id: {
    type: String,
    required: false,
    default: '',
  },
  type: {
    type: String,
    required: false,
    default: '',
  },
});
const prefix = inject('prefix');

// 审批人与提交人为同一人时
const assignStartUserHandlerTypeEl = ref<any>();
const assignStartUserHandlerType = ref<any>();

// 审批人拒绝时
const rejectHandlerTypeEl = ref<any>();
const rejectHandlerType = ref<any>();
const returnNodeIdEl = ref<any>();
const returnNodeId = ref<any>();
const returnTaskList = ref<any[]>([]);

// 审批人为空时
const assignEmptyHandlerTypeEl = ref<any>();
const assignEmptyHandlerType = ref<any>();
const assignEmptyUserIdsEl = ref<any>();
const assignEmptyUserIds = ref<any>();

// 操作按钮设置
const {
  buttonsSetting,
  btnDisplayNameEdit,
  changeBtnDisplayName,
  btnDisplayNameBlurEvent,
  setInputRef,
} = useButtonsSetting();

/** 操作按钮设置 */
function useButtonsSetting() {
  const buttonsSetting = ref<any[]>([]);
  // 操作按钮显示名称可编辑
  const btnDisplayNameEdit = ref<boolean[]>([]);
  // 输入框的引用数组 - 内部使用，不暴露出去
  const _btnDisplayNameInputRefs = ref<Array<HTMLInputElement | null>>([]);

  const changeBtnDisplayName = (index: number) => {
    btnDisplayNameEdit.value[index] = true;
    // 输入框自动聚集
    nextTick(() => {
      if (_btnDisplayNameInputRefs.value[index]) {
        _btnDisplayNameInputRefs.value[index]?.focus();
      }
    });
  };

  const btnDisplayNameBlurEvent = (index: number) => {
    btnDisplayNameEdit.value[index] = false;
    const buttonItem = buttonsSetting.value![index];
    if (buttonItem)
      buttonItem.displayName =
        buttonItem.displayName || OPERATION_BUTTON_NAME.get(buttonItem.id)!;
  };

  // 设置 ref 引用的方法
  const setInputRef = (
    el: ComponentPublicInstance | Element | null,
    index: number,
  ) => {
    _btnDisplayNameInputRefs.value[index] = el as HTMLInputElement;
  };

  return {
    buttonsSetting,
    btnDisplayNameEdit,
    changeBtnDisplayName,
    btnDisplayNameBlurEvent,
    setInputRef,
  };
}

// 字段权限
const fieldsPermissionEl = ref<any[]>([]);
const { formType, fieldsPermissionConfig, getNodeConfigFormFields } =
  useFormFieldsPermission(FieldPermissionType.READ);

// 审批类型
const approveType = ref({ value: ApproveType.USER });

// 是否需要签名
const signEnable = ref({ value: false });

// 审批意见
const reasonRequire = ref({ value: false });

const elExtensionElements = ref<any>();
const otherExtensions = ref<any>();
const bpmnElement = ref<any>();
const bpmnInstances = () => (window as any)?.bpmnInstances;

const resetCustomConfigList = () => {
  bpmnElement.value = bpmnInstances().bpmnElement;

  // 获取可回退的列表
  returnTaskList.value = findAllPredecessorsExcludingStart(
    bpmnElement.value.id,
    bpmnInstances().modeler,
  );
  // 获取元素扩展属性 或者 创建扩展属性
  elExtensionElements.value =
    bpmnElement.value.businessObject?.extensionElements ??
    bpmnInstances().moddle.create('bpmn:ExtensionElements', { values: [] });

  // 审批类型
  approveType.value =
    elExtensionElements.value.values?.find(
      (ex: any) => ex.$type === `${prefix}:ApproveType`,
    )?.[0] ||
    bpmnInstances().moddle.create(`${prefix}:ApproveType`, {
      value: ApproveType.USER,
    });

  // 审批人与提交人为同一人时
  assignStartUserHandlerTypeEl.value =
    elExtensionElements.value.values?.find(
      (ex: any) => ex.$type === `${prefix}:AssignStartUserHandlerType`,
    )?.[0] ||
    bpmnInstances().moddle.create(`${prefix}:AssignStartUserHandlerType`, {
      value: 1,
    });
  assignStartUserHandlerType.value = assignStartUserHandlerTypeEl.value.value;

  // 审批人拒绝时
  rejectHandlerTypeEl.value =
    elExtensionElements.value.values?.find(
      (ex: any) => ex.$type === `${prefix}:RejectHandlerType`,
    )?.[0] ||
    bpmnInstances().moddle.create(`${prefix}:RejectHandlerType`, { value: 1 });
  rejectHandlerType.value = rejectHandlerTypeEl.value.value;
  returnNodeIdEl.value =
    elExtensionElements.value.values?.find(
      (ex: any) => ex.$type === `${prefix}:RejectReturnTaskId`,
    )?.[0] ||
    bpmnInstances().moddle.create(`${prefix}:RejectReturnTaskId`, {
      value: '',
    });
  returnNodeId.value = returnNodeIdEl.value.value;

  // 审批人为空时
  assignEmptyHandlerTypeEl.value =
    elExtensionElements.value.values?.find(
      (ex: any) => ex.$type === `${prefix}:AssignEmptyHandlerType`,
    )?.[0] ||
    bpmnInstances().moddle.create(`${prefix}:AssignEmptyHandlerType`, {
      value: 1,
    });
  assignEmptyHandlerType.value = assignEmptyHandlerTypeEl.value.value;
  assignEmptyUserIdsEl.value =
    elExtensionElements.value.values?.find(
      (ex: any) => ex.$type === `${prefix}:AssignEmptyUserIds`,
    )?.[0] ||
    bpmnInstances().moddle.create(`${prefix}:AssignEmptyUserIds`, {
      value: '',
    });
  assignEmptyUserIds.value = assignEmptyUserIdsEl.value.value
    ?.split(',')
    .map((item: string) => {
      // 如果数字超出了最大安全整数范围，则将其作为字符串处理
      const num = Number(item);
      return num > Number.MAX_SAFE_INTEGER || num < -Number.MAX_SAFE_INTEGER
        ? item
        : num;
    });

  // 操作按钮
  buttonsSetting.value = elExtensionElements.value.values?.filter(
    (ex: any) => ex.$type === `${prefix}:ButtonsSetting`,
  );
  if (buttonsSetting.value.length === 0) {
    DEFAULT_BUTTON_SETTING.forEach((item) => {
      buttonsSetting.value.push(
        bpmnInstances().moddle.create(`${prefix}:ButtonsSetting`, {
          'flowable:id': item.id,
          'flowable:displayName': item.displayName,
          'flowable:enable': item.enable,
        }),
      );
    });
  }

  // 字段权限
  if (formType.value === BpmModelFormType.NORMAL) {
    const fieldsPermissionList = elExtensionElements.value.values?.filter(
      (ex: any) => ex.$type === `${prefix}:FieldsPermission`,
    );
    fieldsPermissionEl.value = [];
    getNodeConfigFormFields();
    fieldsPermissionConfig.value.forEach((element: any) => {
      element.permission =
        fieldsPermissionList?.find((obj: any) => obj.field === element.field)
          ?.permission ?? '1';
      fieldsPermissionEl.value.push(
        bpmnInstances().moddle.create(`${prefix}:FieldsPermission`, element),
      );
    });
  }

  // 是否需要签名
  signEnable.value =
    elExtensionElements.value.values?.find(
      (ex: any) => ex.$type === `${prefix}:SignEnable`,
    ) ||
    bpmnInstances().moddle.create(`${prefix}:SignEnable`, { value: false });

  // 审批意见
  reasonRequire.value =
    elExtensionElements.value.values?.find(
      (ex: any) => ex.$type === `${prefix}:ReasonRequire`,
    ) ||
    bpmnInstances().moddle.create(`${prefix}:ReasonRequire`, { value: false });

  // 保留剩余扩展元素，便于后面更新该元素对应属性
  otherExtensions.value =
    elExtensionElements.value.values?.filter(
      (ex: any) =>
        ex.$type !== `${prefix}:AssignStartUserHandlerType` &&
        ex.$type !== `${prefix}:RejectHandlerType` &&
        ex.$type !== `${prefix}:RejectReturnTaskId` &&
        ex.$type !== `${prefix}:AssignEmptyHandlerType` &&
        ex.$type !== `${prefix}:AssignEmptyUserIds` &&
        ex.$type !== `${prefix}:ButtonsSetting` &&
        ex.$type !== `${prefix}:FieldsPermission` &&
        ex.$type !== `${prefix}:ApproveType` &&
        ex.$type !== `${prefix}:SignEnable` &&
        ex.$type !== `${prefix}:ReasonRequire`,
    ) ?? [];

  // 更新元素扩展属性，避免后续报错
  updateElementExtensions();
};

const updateAssignStartUserHandlerType = () => {
  assignStartUserHandlerTypeEl.value.value = assignStartUserHandlerType.value;

  updateElementExtensions();
};

const updateRejectHandlerType = () => {
  rejectHandlerTypeEl.value.value = rejectHandlerType.value;

  returnNodeId.value = returnTaskList.value[0]?.id;
  returnNodeIdEl.value.value = returnNodeId.value;

  updateElementExtensions();
};

const updateReturnNodeId = () => {
  returnNodeIdEl.value.value = returnNodeId.value;

  updateElementExtensions();
};

const updateAssignEmptyHandlerType = () => {
  assignEmptyHandlerTypeEl.value.value = assignEmptyHandlerType.value;

  updateElementExtensions();
};

const updateAssignEmptyUserIds = () => {
  assignEmptyUserIdsEl.value.value = assignEmptyUserIds.value.toString();

  updateElementExtensions();
};

const updateElementExtensions = () => {
  const extensions = bpmnInstances().moddle.create('bpmn:ExtensionElements', {
    values: [
      ...otherExtensions.value,
      assignStartUserHandlerTypeEl.value,
      rejectHandlerTypeEl.value,
      returnNodeIdEl.value,
      assignEmptyHandlerTypeEl.value,
      assignEmptyUserIdsEl.value,
      approveType.value,
      ...buttonsSetting.value,
      ...fieldsPermissionEl.value,
      signEnable.value,
      reasonRequire.value,
    ],
  });
  bpmnInstances().modeling.updateProperties(toRaw(bpmnElement.value), {
    extensionElements: extensions,
  });
};

watch(
  () => props.id,
  (val) => {
    val &&
      val.length > 0 &&
      nextTick(() => {
        resetCustomConfigList();
      });
  },
  { immediate: true },
);

function findAllPredecessorsExcludingStart(elementId: string, modeler: any) {
  const elementRegistry = modeler.get('elementRegistry');
  const allConnections = elementRegistry.filter(
    (element: any) => element.type === 'bpmn:SequenceFlow',
  );
  const predecessors = new Set(); // 使用 Set 来避免重复节点
  const visited = new Set(); // 用于记录已访问的节点

  // 检查是否是开始事件节点
  function isStartEvent(element: any) {
    return element.type === 'bpmn:StartEvent';
  }

  function findPredecessorsRecursively(element: any) {
    // 如果该节点已经访问过，直接返回，避免循环
    if (visited.has(element)) {
      return;
    }

    // 标记当前节点为已访问
    visited.add(element);

    // 获取与当前节点相连的所有连接
    const incomingConnections = allConnections.filter(
      (connection: any) => connection.target === element,
    );

    incomingConnections.forEach((connection: any) => {
      const source = connection.source; // 获取前置节点

      // 只添加不是开始事件的前置节点
      if (!isStartEvent(source)) {
        predecessors.add(source.businessObject);
        // 递归查找前置节点
        findPredecessorsRecursively(source);
      }
    });
  }

  const targetElement = elementRegistry.get(elementId);
  if (targetElement) {
    findPredecessorsRecursively(targetElement);
  }

  return [...predecessors]; // 返回前置节点数组
}

/** 批量更新权限 */
const updatePermission = (type: string) => {
  fieldsPermissionEl.value.forEach((field: any) => {
    if (type === 'READ') {
      field.permission = FieldPermissionType.READ;
    } else if (type === 'WRITE') {
      field.permission = FieldPermissionType.WRITE;
    } else {
      field.permission = FieldPermissionType.NONE;
    }
  });
};

const userOptions = ref<SystemUserApi.User[]>([]); // 用户列表
onMounted(async () => {
  // 获得用户列表
  userOptions.value = await getSimpleUserList();
});
</script>

<template>
  <div>
    <ElDivider content-position="left">审批类型</ElDivider>
    <ElFormItem prop="approveType" label="审批类型">
      <ElRadioGroup v-model="approveType.value">
        <ElRadio
          v-for="(item, index) in APPROVE_TYPE"
          :key="index"
          :value="item.value"
        >
          {{ item.label }}
        </ElRadio>
      </ElRadioGroup>
    </ElFormItem>

    <ElDivider content-position="left">审批人拒绝时</ElDivider>
    <ElFormItem prop="rejectHandlerType" label="处理方式">
      <ElRadioGroup
        v-model="rejectHandlerType"
        :disabled="returnTaskList.length === 0"
        @change="updateRejectHandlerType"
      >
        <ElRadio
          v-for="(item, index) in REJECT_HANDLER_TYPES"
          :key="index"
          :value="item.value"
        >
          {{ item.label }}
        </ElRadio>
      </ElRadioGroup>
    </ElFormItem>
    <ElFormItem
      v-if="rejectHandlerType === RejectHandlerType.RETURN_USER_TASK"
      prop="returnNodeId"
      label="驳回节点"
    >
      <ElSelect
        v-model="returnNodeId"
        clearable
        style="width: 100%"
        @change="updateReturnNodeId"
        placeholder="请选择驳回节点"
      >
        <ElOption
          v-for="item in returnTaskList"
          :key="item.id"
          :value="item.id"
          :label="item.name"
        />
      </ElSelect>
    </ElFormItem>

    <ElDivider content-position="left">审批人为空时</ElDivider>
    <ElFormItem prop="assignEmptyHandlerType">
      <ElRadioGroup
        v-model="assignEmptyHandlerType"
        @change="updateAssignEmptyHandlerType"
      >
        <div class="flex flex-col gap-2">
          <div v-for="(item, index) in ASSIGN_EMPTY_HANDLER_TYPES" :key="index">
            <ElRadio :key="item.value" :value="item.value">
              {{ item.label }}
            </ElRadio>
          </div>
        </div>
      </ElRadioGroup>
    </ElFormItem>
    <ElFormItem
      v-if="assignEmptyHandlerType === AssignEmptyHandlerType.ASSIGN_USER"
      label="指定用户"
      prop="assignEmptyHandlerUserIds"
    >
      <ElSelect
        v-model="assignEmptyUserIds"
        clearable
        multiple
        style="width: 100%"
        @change="updateAssignEmptyUserIds"
      >
        <ElOption
          v-for="item in userOptions"
          :key="item.id"
          :value="item.id!"
          :label="item.nickname"
        />
      </ElSelect>
    </ElFormItem>

    <ElDivider content-position="left">审批人与提交人为同一人时</ElDivider>
    <ElRadioGroup
      v-model="assignStartUserHandlerType"
      @change="updateAssignStartUserHandlerType"
    >
      <div class="flex flex-col gap-2">
        <div
          v-for="(item, index) in ASSIGN_START_USER_HANDLER_TYPES"
          :key="index"
        >
          <ElRadio :key="item.value" :value="item.value">
            {{ item.label }}
          </ElRadio>
        </div>
      </div>
    </ElRadioGroup>

    <ElDivider content-position="left">操作按钮</ElDivider>
    <div class="mt-2 text-sm">
      <!-- 头部标题行 -->
      <div
        class="flex items-center justify-between border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900"
      >
        <div class="w-28 text-left">操作按钮</div>
        <div class="w-40 pl-2 text-left">显示名称</div>
        <div class="w-20 text-center">启用</div>
      </div>

      <!-- 按钮配置行 -->
      <div
        v-for="(item, index) in buttonsSetting"
        :key="index"
        class="flex items-center justify-between border border-t-0 border-slate-200 px-3 py-2 text-sm"
      >
        <div class="w-28 truncate text-left">
          {{ OPERATION_BUTTON_NAME.get(item.id) }}
        </div>
        <div class="flex w-40 items-center truncate text-left">
          <ElInput
            v-if="btnDisplayNameEdit[index]"
            :ref="(el) => setInputRef(el, index)"
            @blur="btnDisplayNameBlurEvent(index)"
            @keyup.enter="btnDisplayNameBlurEvent(index)"
            type="text"
            v-model="item.displayName"
            :placeholder="item.displayName"
            class="max-w-32 focus:border-blue-500 focus:shadow-[0_0_0_2px_rgba(24,144,255,0.2)] focus:outline-none"
          />
          <ElButton v-else @click="changeBtnDisplayName(index)">
            <div class="flex items-center">
              {{ item.displayName }}
              <IconifyIcon icon="lucide:edit" class="ml-2" />
            </div>
          </ElButton>
        </div>
        <div class="flex w-20 items-center justify-center">
          <ElSwitch v-model="item.enable" @change="updateElementExtensions" />
        </div>
      </div>
    </div>

    <ElDivider content-position="left">字段权限</ElDivider>
    <div v-if="formType === BpmModelFormType.NORMAL" class="mt-2 text-sm">
      <!-- 头部标题行 -->
      <div
        class="flex items-center justify-between border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900"
      >
        <div class="w-28 text-left">字段名称</div>
        <div class="flex flex-1 justify-between">
          <span
            class="inline-block w-24 cursor-pointer text-center hover:text-blue-500"
            @click="updatePermission('READ')"
          >
            只读
          </span>
          <span
            class="inline-block w-24 cursor-pointer text-center hover:text-blue-500"
            @click="updatePermission('WRITE')"
          >
            可编辑
          </span>
          <span
            class="inline-block w-24 cursor-pointer text-center hover:text-blue-500"
            @click="updatePermission('NONE')"
          >
            隐藏
          </span>
        </div>
      </div>

      <!-- 字段权限行 -->
      <div
        v-for="(item, index) in fieldsPermissionEl"
        :key="index"
        class="flex items-center justify-between border border-t-0 border-slate-200 px-3 py-2 text-sm"
      >
        <div class="w-28 truncate text-left" :title="item.title">
          {{ item.title }}
        </div>
        <ElRadioGroup v-model="item.permission" class="ml-7 w-full">
          <div class="flex flex-1 items-center justify-center">
            <ElRadio
              :value="FieldPermissionType.READ"
              size="large"
              @change="updateElementExtensions"
            >
              <span></span>
            </ElRadio>
          </div>
          <div class="flex flex-1 items-center justify-center">
            <ElRadio
              :value="FieldPermissionType.WRITE"
              size="large"
              @change="updateElementExtensions"
            >
              <span></span>
            </ElRadio>
          </div>
          <div class="flex flex-1 items-center justify-center">
            <ElRadio
              :value="FieldPermissionType.NONE"
              size="large"
              @change="updateElementExtensions"
            >
              <span></span>
            </ElRadio>
          </div>
        </ElRadioGroup>
      </div>
    </div>

    <ElDivider content-position="left">是否需要签名</ElDivider>
    <ElFormItem prop="signEnable">
      <ElSwitch
        v-model="signEnable.value"
        active-text="是"
        inactive-text="否"
        @change="updateElementExtensions"
      />
    </ElFormItem>

    <ElDivider content-position="left">审批意见</ElDivider>
    <ElFormItem prop="reasonRequire">
      <ElSwitch
        v-model="reasonRequire.value"
        active-text="必填"
        inactive-text="非必填"
        @change="updateElementExtensions"
      />
    </ElFormItem>
  </div>
</template>
