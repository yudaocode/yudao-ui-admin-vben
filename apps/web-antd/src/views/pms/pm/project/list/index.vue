<script lang="ts" setup>
import type { EChartsOption } from '@vben/plugins/echarts';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PmsProjectApi } from '#/api/pms/pm/project';
import type { PmsProjectGroupApi } from '#/api/pms/pm/project/group';

import { computed, defineComponent, h, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { useAccess } from '@vben/access';
import { confirm, DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { getDictLabel } from '@vben/hooks';
import { IconifyIcon } from '@vben/icons';
import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

import {
  Button,
  Dropdown,
  Empty,
  Menu,
  message,
  Progress,
  Switch,
  Tabs,
  Tag,
  Tooltip,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  archiveProject,
  getFavoriteProjectList,
  getProjectOverview,
  getProjectPage,
  recycleProject,
} from '#/api/pms/pm/project';
import {
  createProjectFavorite,
  deleteProjectFavorite,
} from '#/api/pms/pm/project/favorite';
import {
  getProjectGroupList,
  moveProjectToGroup,
} from '#/api/pms/pm/project/group';
import { exitProject } from '#/api/pms/pm/project/member';
import {
  PmsProjectGroupType,
  PmsProjectSceneType,
  PmsProjectStatus,
  PmsProjectType,
} from '#/views/pms/pm/utils/constants';
import {
  formatProjectCompletionRate,
  formatProjectWorkItemCounts,
} from '#/views/pms/pm/utils/format';

import ProjectForm from '../components/project-form.vue';
import ProjectGroupList from './components/group/project-group-list.vue';
import { useGridColumns, useSearchFormSchema } from './data';

defineOptions({ name: 'PmsProjectList' });

/** 星标项目趋势小图（v-for 内逐卡片渲染） */
// TODO @AI：不用这么封装把？直接 html 里使用把。
const FavoriteTrendChart = defineComponent({
  props: {
    options: { required: true, type: Object },
  },
  setup(props) {
    const chartRef = ref<any>();
    const { renderEcharts } = useEcharts(chartRef);
    onMounted(() => renderEcharts(props.options as EChartsOption));
    watch(
      () => props.options,
      (options) => renderEcharts(options as EChartsOption),
    );
    return () => h(EchartsUI, { ref: chartRef, height: '56px' });
  },
});

const { hasAccessByCodes } = useAccess();
const { push, replace } = useRouter(); // 路由
const route = useRoute(); // 当前路由
const PROJECT_SCENE_TAB_MAP: Record<number, string> = {
  [PmsProjectSceneType.ALL]: 'all',
  [PmsProjectSceneType.MANAGED]: 'owner',
  [PmsProjectSceneType.PARTICIPATED]: 'participate',
}; // 项目范围与路由页签参数的映射
const initialized = ref(false); // 页面是否完成初始化
const favoriteLoading = ref(false); // 星标项目加载中
const favoriteProjectList = ref<PmsProjectApi.Project[]>([]); // 星标项目列表
const sceneType = ref<number>(getProjectSceneByRoute()); // 当前项目范围
const groupList = ref<PmsProjectGroupApi.ProjectGroup[]>([]); // 当前用户的个人项目分组列表
const isParticipatedScene = computed(
  () => sceneType.value === PmsProjectSceneType.PARTICIPATED,
); // 是否“我参与的项目”场景
const movableGroupList = computed(() =>
  groupList.value.filter((group) => group.type !== PmsProjectGroupType.ALL),
); // 可以移动到的个人分组

/** 生成星标项目近十四日完成趋势图配置 */
function getFavoriteTrendChartOptions(
  project: PmsProjectApi.Project,
): EChartsOption {
  const trends = project.completedTrends || [];
  return {
    animation: false,
    grid: { top: 8, right: 8, bottom: 8, left: 8 },
    xAxis: {
      type: 'category',
      show: false,
      data: trends.map((item) => item.date.slice(5)),
    },
    yAxis: { type: 'value', show: false, minInterval: 1 },
    series: [
      {
        type: 'line',
        smooth: true,
        symbol: 'none',
        data: trends.map((item) => item.count),
        lineStyle: { width: 2, color: '#409eff' },
        areaStyle: { color: 'rgba(64, 158, 255, 0.12)' },
      },
    ],
  };
}

/** 根据路由页签参数获得项目范围 */
function getProjectSceneByRoute() {
  const tabs =
    typeof route.query.tabs === 'string' ? route.query.tabs : undefined;
  const sceneTypeValue = Object.entries(PROJECT_SCENE_TAB_MAP).find(
    ([, tab]) => tab === tabs,
  )?.[0];
  return sceneTypeValue
    ? Number(sceneTypeValue)
    : PmsProjectSceneType.PARTICIPATED;
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useSearchFormSchema(),
    submitOnEnter: true,
  },
  gridOptions: {
    columns: useGridColumns(
      getProjectSceneByRoute() !== PmsProjectSceneType.ALL,
    ),
    height: 'auto',
    proxyConfig: {
      autoLoad: false,
      ajax: {
        query: async ({ page }, formValues) => {
          return await getProjectPage({
            ...formValues,
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            sceneType: sceneType.value,
            status: PmsProjectStatus.ACTIVE,
          });
        },
      },
    },
    rowConfig: {
      keyField: 'id',
      isHover: true,
    },
  } as VxeTableGridOptions<PmsProjectApi.Project>,
});

/** 查询星标项目列表 */
async function getFavoriteList() {
  favoriteLoading.value = true;
  try {
    const projects = await getFavoriteProjectList();
    favoriteProjectList.value = await Promise.all(
      projects.map(async (project) => ({
        ...project,
        completedTrends: (await getProjectOverview(project.id)).completedTrends,
      })),
    );
  } finally {
    favoriteLoading.value = false;
  }
}

/** 查询个人项目分组并回填搜索表单的分组选项 */
async function getGroupList() {
  groupList.value = await getProjectGroupList();
  const allGroup = groupList.value.find(
    (group) => group.type === PmsProjectGroupType.ALL,
  );
  gridApi.formApi.updateSchema([
    {
      fieldName: 'groupId',
      componentProps: {
        allowClear: true,
        options: groupList.value.map((group) => ({
          label: `${group.name}（${group.projectCount}）`,
          value: group.id!,
        })),
        placeholder: '请选择个人分组',
      },
    },
  ]);
  await gridApi.formApi.setFieldValue('groupId', allGroup?.id);
}

/** 打开项目详情 */
function openProjectDetail(project: PmsProjectApi.Project) {
  push({
    name: 'PmsProjectDetail',
    params: {
      id: project.id,
    },
    query:
      project.type === PmsProjectType.AGILE
        ? {
            tabs: 'planning',
          }
        : undefined,
  });
}

/** 切换项目范围 */
function handleSceneChange(key: number | string) {
  sceneType.value = Number(key);
  replace({
    name: 'PmsProjectList',
    query: {
      ...route.query,
      tabs: PROJECT_SCENE_TAB_MAP[sceneType.value],
    },
  });
}

const [ProjectFormModal, projectFormModalApi] = useVbenModal({
  connectedComponent: ProjectForm,
});
const [ProjectGroupListModal, projectGroupListModalApi] = useVbenModal({
  connectedComponent: ProjectGroupList,
});

/** 打开项目表单 */
function openForm(formType: 'create' | 'update', id?: number) {
  projectFormModalApi.setData({ formType, id }).open();
}

/** 打开项目设置 */
function openProjectConfig(id: number) {
  push({
    name: 'PmsProjectConfig',
    params: { id },
  });
}

/** 打开项目分组管理弹窗 */
function openGroupManageDialog() {
  projectGroupListModalApi.open();
}

/** 移动项目到个人分组 */
async function handleMoveGroup(projectId: number, groupId: number) {
  await moveProjectToGroup({ projectId, groupId });
  message.success('项目分组已更新');
  await Promise.all([gridApi.query(), getGroupList()]);
}

/** 星标或取消星标项目 */
async function handleCollect(project: PmsProjectApi.Project) {
  if (project.favoriteStatus) {
    await deleteProjectFavorite(project.id);
  } else {
    await createProjectFavorite(project.id);
  }
  const favoriteStatus = !project.favoriteStatus;
  message.success(favoriteStatus ? '星标成功' : '已取消星标');
  await Promise.all([gridApi.query(), getFavoriteList()]);
}

/** 主动退出项目 */
async function handleExit(project: PmsProjectApi.Project) {
  try {
    // 退出的二次确认
    await confirm(
      `确认退出项目“${project.name}”吗？退出后将不能访问该项目，需要项目管理员重新邀请才能加入。`,
    );
    // 发起退出
    await exitProject(project.id);
    message.success('已退出项目');
    await handleProjectChanged();
  } catch {
  }
}

/** 处理项目生命周期操作 */
async function handleProjectCommand(
  command: string,
  project: PmsProjectApi.Project,
) {
  if (command === 'config') {
    openProjectConfig(project.id);
    return;
  }
  if (command === 'exit') {
    await handleExit(project);
    return;
  }
  if (command.startsWith('group:')) {
    await handleMoveGroup(
      project.id,
      Number(command.substring('group:'.length)),
    );
    return;
  }
  try {
    // 操作的二次确认
    if (command === 'archive') {
      await confirm(`确认归档项目“${project.name}”吗？`);
      await archiveProject(project.id);
      message.success('项目已归档');
    } else if (command === 'recycle') {
      await confirm(`确认将项目“${project.name}”移入回收站吗？`);
      await recycleProject(project.id);
      message.success('项目已移入回收站');
    }
    await handleProjectChanged();
  } catch {
  }
}

/** 项目发生变化后刷新列表与个人分组 */
async function handleProjectChanged() {
  await Promise.all([gridApi.query(), getGroupList(), getFavoriteList()]);
}

/** 应用当前项目范围：切换个人分组显隐与星标列，并刷新列表 */
async function applySceneType() {
  gridApi.formApi.updateSchema([
    {
      fieldName: 'groupId',
      dependencies: {
        triggerFields: ['name'],
        if: () => isParticipatedScene.value,
      },
    },
  ]);
  if (!isParticipatedScene.value) {
    await gridApi.formApi.setFieldValue('groupId', undefined);
  }
  gridApi.setGridOptions({
    columns: useGridColumns(sceneType.value !== PmsProjectSceneType.ALL),
  });
  await Promise.all([gridApi.query(), getFavoriteList()]);
}

/** 初始化 */
onMounted(async () => {
  // 1. 修正无效的项目范围页签
  if (
    typeof route.query.tabs !== 'string' ||
    !Object.values(PROJECT_SCENE_TAB_MAP).includes(route.query.tabs)
  ) {
    await replace({
      name: 'PmsProjectList',
      query: {
        ...route.query,
        tabs: PROJECT_SCENE_TAB_MAP[PmsProjectSceneType.PARTICIPATED],
      },
    });
    sceneType.value = getProjectSceneByRoute();
  }
  // 2. 先加载个人项目分组，再并行加载项目列表和星标项目
  await getGroupList();
  await applySceneType();
  initialized.value = true;
});

/** 监听路由页签变化并切换项目范围 */
watch(
  () => route.query.tabs,
  async () => {
    if (!initialized.value) {
      return;
    }
    sceneType.value = getProjectSceneByRoute();
    await applySceneType();
  },
);
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="【PMS】项目中心、工作台与项目管理"
        url="https://doc.iocoder.cn/pms/pm/project/"
      />
    </template>

    <div v-loading="favoriteLoading" class="mb-4 rounded-lg bg-background p-4">
      <!-- 星标项目 -->
      <div class="mb-4 flex items-baseline gap-3">
        <span class="text-base font-semibold">星标项目</span>
        <span class="text-[13px] text-muted-foreground">
          快速访问经常使用的项目
        </span>
      </div>
      <div
        v-if="favoriteProjectList.length"
        class="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-3"
      >
        <div
          v-for="project in favoriteProjectList"
          :key="project.id"
          class="relative flex h-full min-w-0 cursor-pointer items-center gap-3 rounded-md border border-solid border-border bg-accent p-4 transition-[border-color,box-shadow] hover:border-primary hover:shadow-md"
          @click="openProjectDetail(project)"
        >
          <span
            class="inline-flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"
          >
            <IconifyIcon :icon="project.icon || 'lucide:folder'" />
          </span>
          <div class="min-w-0 flex-1">
            <div class="truncate font-medium text-primary">
              {{ project.name }}
            </div>
            <div class="mt-1 truncate text-xs text-muted-foreground">
              {{
                project.description ||
                `${getDictLabel(DICT_TYPE.PMS_PROJECT_TYPE, project.type) || '-'} · 暂无项目描述`
              }}
            </div>
            <Progress
              class="mt-2.5"
              :percent="formatProjectCompletionRate(project)"
              :show-info="false"
              :stroke-width="5"
            />
            <FavoriteTrendChart
              v-if="project.completedTrends"
              class="mt-1.5"
              :options="getFavoriteTrendChartOptions(project)"
            />
          </div>
          <Tooltip title="取消星标" placement="top">
            <Button
              aria-label="取消星标"
              class="absolute right-3 top-3 !text-yellow-500"
              type="link"
              @click.stop="handleCollect(project)"
            >
              <IconifyIcon :size="20" icon="lucide:star" />
            </Button>
          </Tooltip>
          <div class="absolute bottom-2 right-3" @click.stop>
            <Dropdown>
              <Button aria-label="更多操作" type="link">
                <IconifyIcon :size="18" icon="lucide:ellipsis" />
              </Button>
              <template #overlay>
                <Menu
                  @click="({ key }: any) => handleProjectCommand(key, project)"
                >
                  <Menu.Item
                    v-if="project.adminStatus"
                    v-access:code="['pms:pm:project:update']"
                    key="config"
                  >
                    项目设置
                  </Menu.Item>
                  <template v-if="project.memberStatus">
                    <Menu.Item disabled>移动到分组</Menu.Item>
                    <Menu.Item
                      v-for="group in movableGroupList"
                      :key="`group:${group.id}`"
                    >
                      {{ group.name }}
                    </Menu.Item>
                  </template>
                  <Menu.Divider v-if="project.exitStatus" />
                  <Menu.Item
                    v-if="project.exitStatus"
                    v-access:code="['pms:pm:project-member:query']"
                    key="exit"
                  >
                    退出项目
                  </Menu.Item>
                  <template v-if="hasAccessByCodes(['pms:pm:project:update'])">
                    <Menu.Item v-if="project.adminStatus" key="archive">
                      归档项目
                    </Menu.Item>
                    <Menu.Item v-if="project.adminStatus" key="recycle">
                      移入回收站
                    </Menu.Item>
                  </template>
                </Menu>
              </template>
            </Dropdown>
          </div>
        </div>
      </div>
      <Empty v-else description="暂无星标项目" />
    </div>

    <!-- 项目列表 -->
    <Grid>
      <template #toolbar-actions>
        <!-- 项目范围 -->
        <Tabs
          class="w-full"
          :active-key="sceneType"
          @change="handleSceneChange"
        >
          <Tabs.TabPane :key="PmsProjectSceneType.ALL" tab="全部项目" />
          <Tabs.TabPane :key="PmsProjectSceneType.MANAGED" tab="我负责的" />
          <Tabs.TabPane
            :key="PmsProjectSceneType.PARTICIPATED"
            tab="我参与的"
          />
        </Tabs>
      </template>
      <template #toolbar-tools>
        <Button
          v-access:code="['pms:pm:project:create']"
          type="primary"
          @click="openForm('create')"
        >
          新建项目
        </Button>
        <Button
          v-access:code="['pms:pm:project-group:query']"
          @click="openGroupManageDialog"
        >
          管理分组
        </Button>
      </template>
      <template #name="{ row }">
        <div class="flex items-center">
          <span
            class="mr-2.5 inline-flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"
          >
            <IconifyIcon :icon="row.icon || 'lucide:folder'" />
          </span>
          <div class="flex min-w-0 items-center gap-2">
            <div
              class="truncate cursor-pointer font-medium text-primary"
              @click="openProjectDetail(row)"
            >
              {{ row.name }}
            </div>
            <Tag>{{ getDictLabel(DICT_TYPE.PMS_PROJECT_TYPE, row.type) || '-' }}</Tag>
          </div>
        </div>
      </template>
      <template #completion="{ row }">
        <div class="flex items-center gap-3">
          <Progress
            class="flex-1"
            :percent="formatProjectCompletionRate(row)"
            :show-info="false"
          />
          <Tooltip title="已完成 / 未开始 / 进行中" placement="top">
            <span class="whitespace-nowrap text-xs text-muted-foreground">
              {{ formatProjectWorkItemCounts(row) }}
            </span>
          </Tooltip>
        </div>
      </template>
      <template #endTime="{ row }">
        <Tag v-if="row.endTime">
          {{ dayjs(row.endTime).format('M月D日截止') }}
        </Tag>
        <span v-else>-</span>
      </template>
      <template #adminNames="{ row }">
        {{ row.adminNames.join('、') || '-' }}
      </template>
      <template #favoriteStatus="{ row }">
        <Switch :checked="row.favoriteStatus" @change="handleCollect(row)" />
      </template>
      <template #actions="{ row }">
        <Dropdown>
          <Button type="link">更多</Button>
          <template #overlay>
            <Menu @click="({ key }: any) => handleProjectCommand(key, row)">
              <Menu.Item
                v-if="row.adminStatus"
                v-access:code="['pms:pm:project:update']"
                key="config"
              >
                项目设置
              </Menu.Item>
              <template v-if="isParticipatedScene && row.memberStatus">
                <Menu.Item disabled>移动到分组</Menu.Item>
                <Menu.Item
                  v-for="group in movableGroupList"
                  :key="`group:${group.id}`"
                >
                  {{ group.name }}
                </Menu.Item>
              </template>
              <Menu.Divider v-if="row.exitStatus" />
              <Menu.Item
                v-if="row.exitStatus"
                v-access:code="['pms:pm:project-member:query']"
                key="exit"
              >
                退出项目
              </Menu.Item>
              <template v-if="hasAccessByCodes(['pms:pm:project:update'])">
                <Menu.Item v-if="row.adminStatus" key="archive">
                  归档项目
                </Menu.Item>
                <Menu.Item v-if="row.adminStatus" key="recycle">
                  移入回收站
                </Menu.Item>
              </template>
            </Menu>
          </template>
        </Dropdown>
      </template>
    </Grid>

    <!-- 新建或修改项目 -->
    <ProjectFormModal @success="handleProjectChanged" />
    <!-- 管理项目分组 -->
    <ProjectGroupListModal @success="getGroupList" />
  </Page>
</template>
