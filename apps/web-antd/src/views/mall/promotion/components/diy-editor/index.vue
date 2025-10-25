<script lang="ts" setup>
import type { DiyComponent, DiyComponentLibrary, PageConfig } from './util';

import { inject, onMounted, ref, unref, watch } from 'vue';

import { IFrame } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { cloneDeep, isEmpty, isString } from '@vben/utils';

import { useQRCode } from '@vueuse/integrations/useQRCode';
import draggable from 'vuedraggable';

import statusBarImg from '#/assets/imgs/diy/statusBar.png';
import {
  componentConfigs,
  components,
} from './components/mobile';
import { component as PAGE_CONFIG_COMPONENT } from './components/mobile/page-config/config';

import ComponentContainer from './components/component-container.vue';
import ComponentLibrary from './components/component-library.vue';
import { component as NAVIGATION_BAR_COMPONENT } from './components/mobile/navigation-bar/config';
import { component as TAB_BAR_COMPONENT } from './components/mobile/tab-bar/config';
/** 页面装修详情页 */
defineOptions({
  name: 'DiyPageDetail',
  components,
});
// 定义属性
const props = defineProps({
  // 页面配置，支持Json字符串
  modelValue: { type: [String, Object], required: true },
  // 标题
  title: { type: String, default: '' },
  // 组件库
  libs: { type: Array<DiyComponentLibrary>, default: () => [] },
  // 是否显示顶部导航栏
  showNavigationBar: { type: Boolean, default: true },
  // 是否显示底部导航菜单
  showTabBar: { type: Boolean, default: false },
  // 是否显示页面配置
  showPageConfig: { type: Boolean, default: true },
  // 预览地址：提供了预览地址，才会显示预览按钮
  previewUrl: { type: String, default: '' },
});
// 工具栏操作
const emits = defineEmits(['reset', 'preview', 'save', 'update:modelValue']);

const qrcode = useQRCode(props.previewUrl, {
  errorCorrectionLevel: 'H',
  margin: 4,
});

// 左侧组件库
const componentLibrary = ref();
// 页面设置组件
const pageConfigComponent = ref<DiyComponent<any>>(
  cloneDeep(PAGE_CONFIG_COMPONENT),
);
// 顶部导航栏
const navigationBarComponent = ref<DiyComponent<any>>(
  cloneDeep(NAVIGATION_BAR_COMPONENT),
);
// 底部导航菜单
const tabBarComponent = ref<DiyComponent<any>>(cloneDeep(TAB_BAR_COMPONENT));

// 选中的组件，默认选中顶部导航栏
const selectedComponent = ref<DiyComponent<any>>();
// 选中的组件索引
const selectedComponentIndex = ref<number>(-1);
// 组件列表
const pageComponents = ref<DiyComponent<any>[]>([]);
// 监听传入的页面配置
// 解析出 pageConfigComponent 页面整体的配置，navigationBarComponent、pageComponents、tabBarComponent 页面上、中、下的配置
watch(
  () => props.modelValue,
  () => {
    const modelValue =
      isString(props.modelValue) && !isEmpty(props.modelValue)
        ? (JSON.parse(props.modelValue) as PageConfig)
        : props.modelValue;
    pageConfigComponent.value.property =
      (typeof modelValue !== 'string' && modelValue?.page) ||
      PAGE_CONFIG_COMPONENT.property;
    navigationBarComponent.value.property =
      (typeof modelValue !== 'string' && modelValue?.navigationBar) ||
      NAVIGATION_BAR_COMPONENT.property;
    tabBarComponent.value.property =
      (typeof modelValue !== 'string' && modelValue?.tabBar) ||
      TAB_BAR_COMPONENT.property;
    // 查找对应的页面组件
    pageComponents.value = (
      (typeof modelValue !== 'string' && modelValue?.components) ||
      []
    ).map((item: any) => {
      const component = componentConfigs[item.id];
      return { ...component, property: item.property };
    });
  },
  {
    immediate: true,
  },
);

/** 选择组件修改其属性后更新它的配置 */
watch(
  selectedComponent,
  (val: any) => {
    if (!val || selectedComponentIndex.value === -1) {
      return;
    }
    pageComponents.value[selectedComponentIndex.value] =
      selectedComponent.value!;
  },
  { deep: true },
);

// 保存
const handleSave = () => {
  // 发送保存通知
  emits('save');
};
// 监听配置修改
const pageConfigChange = () => {
  const pageConfig = {
    page: pageConfigComponent.value.property,
    navigationBar: navigationBarComponent.value.property,
    tabBar: tabBarComponent.value.property,
    components: pageComponents.value.map((component) => {
      // 只保留APP有用的字段
      return { id: component.id, property: component.property };
    }),
  } as PageConfig;
  if (!props.showTabBar) {
    delete pageConfig.tabBar;
  }
  // 发送数据更新通知
  const modelValue = isString(props.modelValue)
    ? JSON.stringify(pageConfig)
    : pageConfig;
  emits('update:modelValue', modelValue);
};
watch(
  () => [
    pageConfigComponent.value.property,
    navigationBarComponent.value.property,
    tabBarComponent.value.property,
    pageComponents.value,
  ],
  () => {
    pageConfigChange();
  },
  { deep: true },
);
// 处理页面选中：显示属性表单
const handlePageSelected = (event: any) => {
  if (!props.showPageConfig) return;

  // 配置了样式 page-prop-area 的元素，才显示页面设置
  if (event?.target?.classList?.contains('page-prop-area')) {
    handleComponentSelected(unref(pageConfigComponent));
  }
};

/**
 * 选中组件
 *
 * @param component 组件
 * @param index 组件的索引
 */
const handleComponentSelected = (
  component: DiyComponent<any>,
  index: number = -1,
) => {
  selectedComponent.value = component;
  selectedComponentIndex.value = index;
};

// 选中顶部导航栏
const handleNavigationBarSelected = () => {
  handleComponentSelected(unref(navigationBarComponent));
};

// 选中底部导航菜单
const handleTabBarSelected = () => {
  handleComponentSelected(unref(tabBarComponent));
};

// 组件变动（拖拽）
const handleComponentChange = (dragEvent: any) => {
  // 新增，即从组件库拖拽添加组件
  if (dragEvent.added) {
    const { element, newIndex } = dragEvent.added;
    handleComponentSelected(element, newIndex);
  } else if (dragEvent.moved) {
    // 拖拽排序
    const { newIndex } = dragEvent.moved;
    // 保持选中
    selectedComponentIndex.value = newIndex;
  }
};

// 交换组件
const swapComponent = (oldIndex: number, newIndex: number) => {
  const temp = pageComponents.value[oldIndex]!;
  pageComponents.value[oldIndex] = pageComponents.value[newIndex]!;
  pageComponents.value[newIndex] = temp;
  // 保持选中
  selectedComponentIndex.value = newIndex;
};

/** 移动组件（上移、下移） */
const handleMoveComponent = (index: number, direction: number) => {
  const newIndex = index + direction;
  if (newIndex < 0 || newIndex >= pageComponents.value.length) return;

  swapComponent(index, newIndex);
};

/** 复制组件 */
const handleCopyComponent = (index: number) => {
  const component = pageComponents.value[index];
  if (component) {
    const clonedComponent = cloneDeep(component);
    clonedComponent.uid = Date.now();
    pageComponents.value.splice(index + 1, 0, clonedComponent);
  }
};

/**
 * 删除组件
 * @param index 当前组件index
 */
const handleDeleteComponent = (index: number) => {
  // 删除组件
  pageComponents.value.splice(index, 1);
  if (index < pageComponents.value.length) {
    // 1. 不是最后一个组件时，删除后选中下面的组件
    const bottomIndex = index;
    const component = pageComponents.value[bottomIndex];
    if (component) {
      handleComponentSelected(component, bottomIndex);
    }
  } else if (pageComponents.value.length > 0) {
    // 2. 不是第一个组件时，删除后选中上面的组件
    const topIndex = index - 1;
    const component = pageComponents.value[topIndex];
    if (component) {
      handleComponentSelected(component, topIndex);
    }
  } else {
    // 3. 组件全部删除之后，显示页面设置
    handleComponentSelected(unref(pageConfigComponent));
  }
};

// 注入无感刷新页面函数
const reload = inject<() => void>('reload'); // TODO @芋艿：是 vue3 + element-plus 独有的，可以清理掉。
// 重置
const handleReset = () => {
  if (reload) reload();
  emits('reset');
};

// 预览
const previewDialogVisible = ref(false);
const handlePreview = () => {
  previewDialogVisible.value = true;
  emits('preview');
};

// 设置默认选中的组件
const setDefaultSelectedComponent = () => {
  if (props.showPageConfig) {
    selectedComponent.value = unref(pageConfigComponent);
  } else if (props.showNavigationBar) {
    selectedComponent.value = unref(navigationBarComponent);
  } else if (props.showTabBar) {
    selectedComponent.value = unref(tabBarComponent);
  }
};

watch(
  () => [props.showPageConfig, props.showNavigationBar, props.showTabBar],
  () => setDefaultSelectedComponent(),
);
onMounted(() => {
  setDefaultSelectedComponent();
});
</script>
<template>
  <div>
    <div class="editor flex flex-col h-full">
      <!-- 顶部：工具栏 -->
      <div class="editor-header flex items-center">
        <!-- 左侧操作区 -->
        <slot name="toolBarLeft"></slot>
        <!-- 中心操作区 -->
        <div class="header-center flex flex-1 items-center justify-center">
          <span>{{ title }}</span>
        </div>
        <!-- 右侧操作区 -->
        <div class="header-right flex">
          <Tooltip title="重置">
            <Button @click="handleReset">
              <IconifyIcon :size="24" icon="system-uicons:reset-alt" />
            </Button>
          </Tooltip>
          <Tooltip v-if="previewUrl" title="预览">
            <Button @click="handlePreview">
              <IconifyIcon :size="24" icon="ep:view" />
            </Button>
          </Tooltip>
          <Tooltip title="保存">
            <Button @click="handleSave">
              <IconifyIcon :size="24" icon="ep:check" />
            </Button>
          </Tooltip>
        </div>
      </div>

      <!-- 中心区域 -->
      <div class="editor-container flex flex-1">
        <!-- 左侧：组件库（ComponentLibrary） -->
        <ComponentLibrary
          v-if="libs && libs.length > 0"
          ref="componentLibrary"
          :list="libs"
        />
        <!-- 中心：设计区域（ComponentContainer） -->
        <div class="editor-center page-prop-area" @click="handlePageSelected">
          <!-- 手机顶部 -->
          <div class="editor-design-top">
            <!-- 手机顶部状态栏 -->
            <img alt="" class="status-bar" :src="statusBarImg" />
            <!-- 手机顶部导航栏 -->
            <ComponentContainer
              v-if="showNavigationBar"
              :active="selectedComponent?.id === navigationBarComponent.id"
              :component="navigationBarComponent"
              :show-toolbar="false"
              class="cursor-pointer"
              @click="handleNavigationBarSelected"
            />
          </div>
          <!-- 绝对定位的组件：例如 弹窗、浮动按钮等 -->
          <div
            v-for="(component, index) in pageComponents"
            :key="index"
            @click="handleComponentSelected(component, index)"
          >
            <component
              :is="component.id"
              v-if="
                component.position === 'fixed' &&
                selectedComponent?.uid === component.uid
              "
              :property="component.property"
            />
          </div>
          <!-- 手机页面编辑区域 -->
          <div
            class="editor-design-center page-prop-area overflow-y-auto phone-container"
            :style="{
              backgroundColor: pageConfigComponent.property.backgroundColor,
              backgroundImage: `url(${pageConfigComponent.property.backgroundImage})`,
              height: 'calc(100vh - 135px - 120px)'
            }"
          >
            <draggable
              v-model="pageComponents"
              :animation="200"
              :force-fallback="true"
              class="page-prop-area drag-area"
              filter=".component-toolbar"
              ghost-class="draggable-ghost"
              group="component"
              item-key="index"
              @change="handleComponentChange"
            >
              <template #item="{ element, index }">
                <ComponentContainer
                  v-if="!element.position || element.position === 'center'"
                  :active="selectedComponentIndex === index"
                  :can-move-down="index < pageComponents.length - 1"
                  :can-move-up="index > 0"
                  :component="element"
                  @click="handleComponentSelected(element, index)"
                  @copy="handleCopyComponent(index)"
                  @delete="handleDeleteComponent(index)"
                  @move="
                    (direction: number) => handleMoveComponent(index, direction)
                  "
                />
              </template>
            </draggable>
          </div>
          <!-- 手机底部导航 -->
          <div
            v-if="showTabBar"
            class="editor-design-bottom component cursor-pointer"
          >
            <ComponentContainer
              :active="selectedComponent?.id === tabBarComponent.id"
              :component="tabBarComponent"
              :show-toolbar="false"
              @click="handleTabBarSelected"
            />
          </div>
          <!-- 固定布局的组件 操作按钮区 -->
          <div class="fixed-component-action-group gap-2">
            <Tag
              v-if="showPageConfig"
              :color="
                selectedComponent?.uid === pageConfigComponent.uid
                  ? 'blue'
                  : 'default'
              "
              class="cursor-pointer"
              @click="handleComponentSelected(pageConfigComponent)"
            >
              <IconifyIcon :icon="pageConfigComponent.icon" :size="12" />
              <span>{{ pageConfigComponent.name }}</span>
            </Tag>
            <template v-for="(component, index) in pageComponents" :key="index">
              <Tag
                v-if="component.position === 'fixed'"
                :color="
                  selectedComponent?.uid === component.uid ? 'blue' : 'default'
                "
                closable
                class="cursor-pointer"
                @click="handleComponentSelected(component)"
                @close="handleDeleteComponent(index)"
              >
                <IconifyIcon :icon="component.icon" :size="12" />
                <span>{{ component.name }}</span>
              </Tag>
            </template>
          </div>
        </div>
        <!-- 右侧：属性面板（ComponentContainerProperty） -->
        <div
          v-if="selectedComponent?.property"
          class="editor-right w-[350px]"
        >
          <Card
            class="h-full"
            :bodyStyle="{ height: 'calc(100% - 57px)', padding: 0 }"
          >
            <!-- 组件名称 -->
            <template #title>
              <div class="flex items-center gap-2">
                <IconifyIcon :icon="selectedComponent?.icon" color="gray" />
                <span>{{ selectedComponent?.name }}</span>
              </div>
            </template>
            <div
              class="h-full overflow-y-auto p-4 property"
            >
              <component
                :is="`${selectedComponent?.id}Property`"
                :key="selectedComponent?.uid || selectedComponent?.id"
                v-model="selectedComponent.property"
              />
            </div>
          </Card>
        </div>
      </div>
    </div>

    <!-- 预览弹框 -->
    <Modal v-model:open="previewDialogVisible" title="预览" width="700">
      <div class="flex justify-around">
        <IFrame
          :src="previewUrl"
          class="h-[667px] w-[375px] rounded-lg border-4 border-solid p-0.5"
        />
        <div class="flex flex-col">
          <div class="text-base">手机扫码预览</div>
          <img :src="qrcode" alt="qrcode" class="w-1/2" />
          <!-- <Qrcode :text="previewUrl" logo="/logo.gif" /> -->
        </div>
      </div>
    </Modal>
  </div>
</template>
<style lang="scss" scoped>
/* 手机宽度 */
$phone-width: 375px;

/* 根节点样式 */
.editor {
  display: flex;
  flex-direction: column;
  height: 100%;

  /* 顶部：工具栏 */
  .editor-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 42px;
    padding: 0;
    background-color: var(--ant-color-bg-container);
    border-bottom: solid 1px var(--ant-color-border);

    /* 工具栏：右侧按钮 */
    .header-right {
      height: 100%;

      .ant-btn {
        height: 100%;
      }
    }

    /* 隐藏工具栏按钮的边框 */
    :deep(.ant-radio-button-wrapper),
    :deep(.ant-btn) {
      border-top: none !important;
      border-bottom: none !important;
      border-radius: 0 !important;
    }
  }

  /* 中心操作区 */
  .editor-container {
    height: calc(100vh - 135px);

    /* 右侧属性面板 */
    :deep(.editor-right) {
      flex-shrink: 0;
      overflow: hidden;
      box-shadow: -8px 0 8px -8px rgb(0 0 0 / 12%);

      /* 属性面板顶部：减少内边距 */
      :deep(.ant-card-head) {
        padding: 8px 16px;
      }

      /* 属性面板分组 */
      :deep(.property-group) {
        margin: 0 -20px;

        &.ant-card {
          border: none;
        }

        /* 属性分组名称 */
        .ant-card-head {
          padding: 8px 32px;
          background: var(--ant-color-bg-layout);
          border: none;
        }

        .ant-card-body {
          border: none;
        }
      }
    }

    /* 中心区域 */
    .editor-center {
      position: relative;
      display: flex;
      flex: 1 1 0;
      flex-direction: column;
      justify-content: center;
      width: 100%;
      margin: 16px 0 0;
      overflow: hidden;
      background-color: var(--app-content-bg-color);

      /* 手机顶部 */
      .editor-design-top {
        display: flex;
        flex-direction: column;
        width: $phone-width;
        margin: 0 auto;

        /* 手机顶部状态栏 */
        .status-bar {
          width: $phone-width;
          height: 20px;
          background-color: #fff;
        }
      }

      /* 手机底部导航 */
      .editor-design-bottom {
        width: $phone-width;
        margin: 0 auto;
      }

      /* 手机页面编辑区域 */
      :deep(.editor-design-center) {
        width: 100%;

        /* 主体内容 */
        .phone-container {
          position: relative;
          width: $phone-width;
          height: 100%;
          margin: 0 auto;
          background-repeat: no-repeat;
          background-size: 100% 100%;

          .drag-area {
            width: 100%;
            height: 100%;
          }
        }
      }

      /* 固定布局的组件 操作按钮区 */
      .fixed-component-action-group {
        position: absolute;
        top: 0;
        right: 16px;
        display: flex;
        flex-direction: column;

        :deep(.ant-tag) {
          border: none;
          box-shadow: 0 2px 8px 0 rgb(0 0 0 / 10%);
          display: flex;
          align-items: center;
          justify-content: flex-start;
          width: 100%;

          .anticon {
            margin-right: 4px;
          }
        }
      }
    }
  }
}
</style>
