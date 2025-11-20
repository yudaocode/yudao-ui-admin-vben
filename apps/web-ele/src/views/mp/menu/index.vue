<script lang="ts" setup>
import type { Menu, RawMenu } from './modules/types';

import { nextTick, onMounted, ref } from 'vue';

import { confirm, ContentWrap, DocAlert, Page } from '@vben/common-ui';

import { ElButton, ElLoading, ElMessage } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import { getSimpleAccountList } from '#/api/mp/account';
import * as MpMenuApi from '#/api/mp/menu';
import * as UtilsTree from '#/utils/tree';
import {
  Level,
  MENU_NOT_SELECTED,
  useGridFormSchema,
} from '#/views/mp/menu/data';
import MenuEditor from '#/views/mp/menu/modules/menu-editor.vue';
import MenuPreviewer from '#/views/mp/menu/modules/menu-previewer.vue';

// Assets for backgrounds
// TODO @hw：是不是资源的地址，统一下；antd 和 ele，目录不同。建议按照 ele 的方法先；
import iphoneBackImg from './assets/iphone_backImg.png';
import menuFootImg from './assets/menu_foot.png';
import menuHeadImg from './assets/menu_head.png';

defineOptions({ name: 'MpMenu' });

// ======================== 列表查询 ========================
const loading = ref(false); // 遮罩层
const accountId = ref(-1);
const accountName = ref<string>('');
const menuList = ref<Menu[]>([]);

// ======================== 菜单操作 ========================
// 当前选中菜单编码：
//  * 一级（'x'）
//  * 二级（'x-y'）
//  * 未选中（MENU_NOT_SELECTED）
const activeIndex = ref<string>(MENU_NOT_SELECTED);
// 二级菜单显示标志: 归属的一级菜单index
// * 未初始化：-1
// * 初始化：x
const parentIndex = ref(-1);

// ======================== 菜单编辑 ========================
const showRightPanel = ref(false); // 右边配置显示默认详情还是配置详情
const isParent = ref<boolean>(true); // 是否一级菜单，控制MenuEditor中name字段长度
const activeMenu = ref<Menu>({}); // 选中菜单，MenuEditor的modelValue

// 一些临时值放在这里进行判断，如果放在 activeMenu，由于引用关系，menu 也会多了多余的参数
const tempSelfObj = ref<{
  grand: Level;
  x: number;
  y: number;
}>({
  grand: Level.Undefined,
  x: 0,
  y: 0,
});
const dialogNewsVisible = ref(false); // 跳转图文时的素材选择弹窗

// 创建表单
const [AccountForm, accountFormApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-[240px]',
    },
  },
  layout: 'horizontal',
  schema: useGridFormSchema(),
  wrapperClass: 'grid-cols-1',
  showDefaultActions: false,
  handleValuesChange: async (values, changedFields) => {
    // 当 accountId 字段变化时（包括 autoSelect 自动选择），同步更新 accountId
    if (changedFields.includes('accountId') && values.accountId) {
      await onAccountChanged(values);
    }
  },
});

/** 侦听公众号变化 */
async function onAccountChanged(values: Record<string, any>) {
  accountId.value = values.accountId;
  // 从 API 获取公众号列表并查找对应的公众号名称
  const accountList = await getSimpleAccountList();
  const account = accountList.find((item) => item.id === values.accountId);
  accountName.value = account?.name || '';
  getList();
}

/** 查询并转换菜单 */
async function getList() {
  loading.value = true;
  try {
    const data = await MpMenuApi.getMenuList(accountId.value);
    const menuData = menuListToFrontend(data);
    menuList.value = UtilsTree.handleTree(menuData, 'id');
  } finally {
    loading.value = false;
  }
}

/** 搜索按钮操作 */
function handleQuery() {
  resetForm();
  getList();
}

/** 将后端返回的 menuList，转换成前端的 menuList */
function menuListToFrontend(list: any[]) {
  if (!list) return [];

  const result: RawMenu[] = [];
  list.forEach((item: RawMenu) => {
    const menu: any = {
      ...item,
    };
    menu.reply = {
      type: item.replyMessageType,
      accountId: item.accountId,
      content: item.replyContent,
      mediaId: item.replyMediaId,
      url: item.replyMediaUrl,
      title: item.replyTitle,
      description: item.replyDescription,
      thumbMediaId: item.replyThumbMediaId,
      thumbMediaUrl: item.replyThumbMediaUrl,
      articles: item.replyArticles,
      musicUrl: item.replyMusicUrl,
      hqMusicUrl: item.replyHqMusicUrl,
    };
    result.push(menu as RawMenu);
  });
  return result;
}

/** 重置表单，清空表单数据 */
function resetForm() {
  // 菜单操作
  activeIndex.value = MENU_NOT_SELECTED;
  parentIndex.value = -1;

  // 菜单编辑
  showRightPanel.value = false;
  activeMenu.value = {};
  tempSelfObj.value = { grand: Level.Undefined, x: 0, y: 0 };
  dialogNewsVisible.value = false;
}

// ======================== 菜单操作 ========================
/** 一级菜单点击事件 */
function menuClicked(parent: Menu, x: number) {
  // 右侧的表单相关
  showRightPanel.value = true; // 右边菜单
  activeMenu.value = parent; // 这个如果放在顶部，flag 会没有。因为重新赋值了。
  tempSelfObj.value.grand = Level.Parent; // 表示一级菜单
  tempSelfObj.value.x = x; // 表示一级菜单索引
  isParent.value = true;

  // 左侧的选中
  activeIndex.value = `${x}`; // 菜单选中样式
  parentIndex.value = x; // 二级菜单显示标志
}

/** 二级菜单点击事件 */
function subMenuClicked(child: Menu, x: number, y: number) {
  // 右侧的表单相关
  showRightPanel.value = true; // 右边菜单
  activeMenu.value = child; // 将点击的数据放到临时变量，对象有引用作用
  tempSelfObj.value.grand = Level.Child; // 表示二级菜单
  tempSelfObj.value.x = x; // 表示一级菜单索引
  tempSelfObj.value.y = y; // 表示二级菜单索引
  isParent.value = false;

  // 左侧的选中
  activeIndex.value = `${x}-${y}`;
}

/** 删除当前菜单 */
async function onDeleteMenu() {
  try {
    await confirm('确定要删除吗?');
    if (tempSelfObj.value.grand === Level.Parent) {
      // 一级菜单的删除方法
      menuList.value.splice(tempSelfObj.value.x, 1);
    } else if (tempSelfObj.value.grand === Level.Child) {
      // 二级菜单的删除方法
      menuList.value[tempSelfObj.value.x]?.children?.splice(
        tempSelfObj.value.y,
        1,
      );
    }
    // 提示
    ElMessage.success('删除成功');

    // 处理菜单的选中
    activeMenu.value = {};
    showRightPanel.value = false;
    activeIndex.value = MENU_NOT_SELECTED;
  } catch {
    //
  }
}

// ======================== 菜单编辑 ========================
/** 保存菜单 */
async function onSave() {
  try {
    await confirm('确定要保存吗?');
    const loadingInstance = ElLoading.service({
      text: '保存中...',
    });
    try {
      await MpMenuApi.saveMenu(accountId.value, menuListToBackend());
      getList();
      ElMessage.success('发布成功');
    } finally {
      loadingInstance.close();
    }
  } catch {
    //
  }
}

/** 清空菜单 */
async function onClear() {
  try {
    await confirm('确定要删除吗?');
    const loadingInstance = ElLoading.service({
      text: '删除中...',
    });
    try {
      await MpMenuApi.deleteMenu(accountId.value);
      handleQuery();
      ElMessage.success('清空成功');
    } finally {
      loadingInstance.close();
    }
  } catch {
    //
  }
}

/** 将前端的 menuList，转换成后端接收的 menuList */
function menuListToBackend() {
  const result: any[] = [];
  menuList.value.forEach((item) => {
    const menu = menuToBackend(item);
    result.push(menu);

    // 处理子菜单
    if (!item.children || item.children.length <= 0) {
      return;
    }
    menu.children = [];
    item.children.forEach((subItem) => {
      menu.children.push(menuToBackend(subItem));
    });
  });
  return result;
}

/** 将前端的 menu，转换成后端接收的 menu */
// TODO: @芋艿，需要根据后台API删除不需要的字段
function menuToBackend(menu: any) {
  const result = {
    ...menu,
    children: undefined, // 不处理子节点
    reply: undefined, // 稍后复制
  };
  result.replyMessageType = menu.reply.type;
  result.replyContent = menu.reply.content;
  result.replyMediaId = menu.reply.mediaId;
  result.replyMediaUrl = menu.reply.url;
  result.replyTitle = menu.reply.title;
  result.replyDescription = menu.reply.description;
  result.replyThumbMediaId = menu.reply.thumbMediaId;
  result.replyThumbMediaUrl = menu.reply.thumbMediaUrl;
  result.replyArticles = menu.reply.articles;
  result.replyMusicUrl = menu.reply.musicUrl;
  result.replyHqMusicUrl = menu.reply.hqMusicUrl;

  return result;
}

/** 初始化账号ID - 作为备用方案，防止 handleValuesChange 未触发 */
async function initAccountId() {
  // 等待表单初始化完成
  await nextTick();
  try {
    const values = await accountFormApi.getValues();
    if (values?.accountId && accountId.value === -1) {
      // 如果表单有值但 accountId 还是初始值，则手动触发一次
      await onAccountChanged(values);
    }
  } catch {
    // 忽略错误
  }
}

// 组件挂载时初始化账号ID
onMounted(async () => {
  await nextTick();
  await initAccountId();
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert title="公众号菜单" url="https://doc.iocoder.cn/mp/menu/" />
    </template>

    <!-- 搜索工作栏 -->
    <!-- <ContentWrap> -->
    <AccountForm class="-mb-15px w-240px" @values-change="onAccountChanged" />

    <!-- </ContentWrap> -->

    <ContentWrap>
      <div
        class="public-account-management mx-auto flex w-full max-w-[1200px] flex-wrap items-start gap-[20px]"
        v-loading="loading"
      >
        <!--左边配置菜单-->
        <div
          class="left relative box-border block h-[715px] w-[350px] flex-shrink-0 bg-[length:100%_auto] bg-no-repeat px-[25px] pb-[88px] pt-[518px]"
          :style="{ backgroundImage: `url(${iphoneBackImg})` }"
        >
          <div
            class="relative bottom-[426px] left-0 h-[64px] w-[300px] bg-[length:100%_auto] bg-no-repeat text-center text-white"
            :style="{ backgroundImage: `url(${menuHeadImg})` }"
          >
            <div
              class="absolute left-0 top-[33px] w-full text-center text-[14px] text-white"
            >
              {{ accountName }}
            </div>
          </div>
          <div
            class="weixin-menu h-[46px] bg-no-repeat pl-[43px] text-[12px]"
            :style="{ backgroundImage: `url(${menuFootImg})` }"
          >
            <MenuPreviewer
              v-model="menuList"
              :account-id="accountId"
              :active-index="activeIndex"
              :parent-index="parentIndex"
              @menu-clicked="(parent, x) => menuClicked(parent, x)"
              @submenu-clicked="(child, x, y) => subMenuClicked(child, x, y)"
            />
          </div>
          <div class="mt-[15px] text-center">
            <ElButton
              class="mx-2"
              type="success"
              @click="onSave"
              v-access:code="['mp:menu:save']"
            >
              保存并发布菜单
            </ElButton>
            <ElButton
              class="mx-2"
              type="danger"
              @click="onClear"
              v-access:code="['mp:menu:delete']"
            >
              清空菜单
            </ElButton>
          </div>
        </div>
        <!--右边配置-->
        <div
          class="right box-border flex-1 basis-[63%] bg-[#e8e7e7] p-[20px]"
          v-if="showRightPanel"
        >
          <MenuEditor
            :account-id="accountId"
            :is-parent="isParent"
            v-model="activeMenu"
            @delete="onDeleteMenu"
          />
        </div>
        <!-- 一进页面就显示的默认页面，当点击左边按钮的时候，就不显示了-->
        <div
          v-else
          class="right box-border flex-1 basis-[63%] bg-[#e8e7e7] p-[20px]"
        >
          <p class="text-left">请选择菜单配置</p>
        </div>
      </div>
    </ContentWrap>
  </Page>
</template>
