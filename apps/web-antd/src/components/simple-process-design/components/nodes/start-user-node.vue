<script setup lang="ts">
// TODO @芋艿：后续是不是把业务组件，挪到每个模块里；待定；
import type { Ref } from 'vue';

import type { SimpleFlowNode } from '../../consts';

import { inject, ref } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { Input } from 'ant-design-vue';

import { BpmNodeTypeEnum } from '#/utils';

import { NODE_DEFAULT_TEXT } from '../../consts';
import { useNodeName2, useTaskStatusClass, useWatchNode } from '../../helpers';
import StartUserNodeConfig from '../nodes-config/start-user-node-config.vue';
import NodeHandler from './node-handler.vue';

defineOptions({ name: 'StartUserNode' });

const props = defineProps({
  flowNode: {
    type: Object as () => SimpleFlowNode,
    default: () => null,
  },
});

// 定义事件，更新父组件。
// const emits = defineEmits<{
defineEmits<{
  'update:modelValue': [node: SimpleFlowNode | undefined];
}>();

const readonly = inject<Boolean>('readonly'); // 是否只读
const tasks = inject<Ref<any[]>>('tasks', ref([]));
// 监控节点变化
const currentNode = useWatchNode(props);
// 节点名称编辑
const { showInput, changeNodeName, clickTitle, inputRef } = useNodeName2(
  currentNode,
  BpmNodeTypeEnum.START_USER_NODE,
);

const nodeSetting = ref();

// 任务的弹窗显示，用于只读模式
const selectTasks = ref<any[] | undefined>([]); // 选中的任务数组

function nodeClick() {
  if (readonly) {
    // 只读模式，弹窗显示任务信息
    if (tasks && tasks.value) {
      console.warn(
        'TODO 只读模式，弹窗显示任务信息',
        tasks.value,
        selectTasks.value,
      );
    }
  } else {
    console.warn(
      'TODO 编辑模式，打开节点配置、把当前节点传递给配置组件',
      nodeSetting.value,
    );
    nodeSetting.value.showStartUserNodeConfig(currentNode.value);
  }
}
</script>
<template>
  <div class="node-wrapper">
    <div class="node-container">
      <div
        class="node-box"
        :class="[
          { 'node-config-error': !currentNode.showText },
          `${useTaskStatusClass(currentNode?.activityStatus)}`,
        ]"
      >
        <div class="node-title-container">
          <div class="node-title-icon start-user">
            <span class="iconfont icon-start-user"></span>
          </div>
          <Input
            ref="inputRef"
            v-if="!readonly && showInput"
            type="text"
            class="editable-title-input"
            @blur="changeNodeName()"
            @press-enter="changeNodeName()"
            v-model:value="currentNode.name"
            :placeholder="currentNode.name"
          />
          <div v-else class="node-title" @click="clickTitle">
            {{ currentNode.name }}
          </div>
        </div>
        <div class="node-content" @click="nodeClick">
          <div
            class="node-text"
            :title="currentNode.showText"
            v-if="currentNode.showText"
          >
            {{ currentNode.showText }}
          </div>
          <div class="node-text" v-else>
            {{ NODE_DEFAULT_TEXT.get(BpmNodeTypeEnum.START_USER_NODE) }}
          </div>
          <IconifyIcon icon="ep:arrow-right-bold" v-if="!readonly" />
        </div>
      </div>
      <!-- 传递子节点给添加节点组件。会在子节点前面添加节点 -->
      <NodeHandler
        v-if="currentNode"
        v-model:child-node="currentNode.childNode"
        :current-node="currentNode"
      />
    </div>
  </div>

  <StartUserNodeConfig
    v-if="!readonly && currentNode"
    ref="nodeSetting"
    :flow-node="currentNode"
  />
  <!-- 审批记录  TODO -->
</template>
