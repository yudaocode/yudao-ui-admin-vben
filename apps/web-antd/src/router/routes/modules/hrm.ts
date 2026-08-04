import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/hrm',
    name: 'HrmCenter',
    meta: {
      title: '人力资源',
      icon: 'lucide:users',
      keepAlive: true,
      hideInMenu: true,
    },
    children: [
      {
        path: 'dept/detail/:id',
        name: 'HrmDeptDetail',
        meta: {
          title: '组织详情',
          activePath: '/hrm/dept',
        },
        component: () => import('#/views/hrm/dept/detail/index.vue'),
      },
      {
        path: 'recruit/candidate/detail/:id',
        name: 'HrmRecruitCandidateDetail',
        meta: {
          title: '候选人详情',
          activePath: '/hrm/recruit/candidate',
        },
        component: () =>
          import('#/views/hrm/recruit/candidate/detail/index.vue'),
      },
      {
        path: 'recruit/post/detail/:id',
        name: 'HrmRecruitPostDetail',
        meta: {
          title: '招聘职位详情',
          activePath: '/hrm/recruit/post',
        },
        component: () => import('#/views/hrm/recruit/post/detail/index.vue'),
      },
      {
        path: 'employee/detail/:id',
        name: 'HrmEmployeeDetail',
        meta: {
          title: '员工详情',
          activePath: '/hrm/employee/list',
        },
        component: () => import('#/views/hrm/employee/detail/index.vue'),
      },
      {
        path: 'attendance/month/detail/:employeeId',
        name: 'HrmAttendanceMonthDetail',
        meta: {
          title: '月度考勤详情',
          activePath: '/hrm/attendance/month',
        },
        component: () =>
          import('#/views/hrm/attendance/month/detail/index.vue'),
      },
      {
        path: 'insurance/month-record/detail/:id',
        name: 'HrmInsuranceMonthRecordDetail',
        meta: {
          title: '月度社保详情',
          activePath: '/hrm/insurance/month-record',
        },
        component: () =>
          import('#/views/hrm/insurance/month-record/detail/index.vue'),
      },
      {
        path: 'salary/employee-info/detail/:id',
        name: 'HrmSalaryEmployeeInfoDetail',
        meta: {
          title: '薪资档案详情',
          activePath: '/hrm/salary/employee-info',
        },
        component: () =>
          import('#/views/hrm/salary/employee-info/detail/index.vue'),
      },
      {
        path: 'salary/slip/send-record/detail/:id',
        name: 'HrmSalarySlipSendRecordDetail',
        meta: {
          title: '工资条发放详情',
          activePath: '/hrm/salary/slip',
        },
        component: () =>
          import('#/views/hrm/salary/slip/send-record/detail/index.vue'),
      },
      {
        path: 'salary/history/detail/:id',
        name: 'HrmSalaryHistoryDetail',
        meta: {
          title: '历史工资详情',
          activePath: '/hrm/salary/history',
        },
        component: () =>
          import('#/views/hrm/salary/month-record/detail/index.vue'),
      },
      {
        path: 'performance/plan/detail/:id',
        name: 'HrmPerformancePlanDetail',
        meta: {
          title: 'KPI 考核详情',
          activePath: '/hrm/performance/plan',
        },
        component: () =>
          import('#/views/hrm/performance/plan/detail/index.vue'),
      },
      {
        path: 'performance/plan/form',
        name: 'HrmPerformancePlanForm',
        meta: {
          title: 'KPI 考核设置',
          activePath: '/hrm/performance/plan',
        },
        component: () => import('#/views/hrm/performance/plan/form/index.vue'),
      },
      {
        path: 'performance/assessment/employee/:employeeId',
        name: 'HrmPerformanceAssessmentEmployee',
        meta: {
          title: '员工绩效档案',
          activePath: '/hrm/performance/assessment',
        },
        component: () =>
          import('#/views/hrm/performance/assessment/employee/index.vue'),
      },
      {
        path: 'performance/assessment/detail/:id',
        name: 'HrmPerformanceAssessmentDetail',
        meta: {
          title: '员工考核详情',
          activePath: '/hrm/performance/assessment',
        },
        component: () =>
          import('#/views/hrm/performance/assessment/detail/index.vue'),
      },
      {
        path: 'salary/config/group',
        name: 'HrmSalaryConfigGroup',
        meta: { title: '薪资组', hideInMenu: true },
        component: () => import('#/views/hrm/salary/config/group/index.vue'),
      },
      {
        path: 'salary/config/tax-rule',
        name: 'HrmSalaryConfigTaxRule',
        meta: { title: '计税规则', hideInMenu: true },
        component: () => import('#/views/hrm/salary/config/tax-rule/index.vue'),
      },
      {
        path: 'salary/config/config',
        name: 'HrmSalaryConfigConfig',
        meta: { title: '计薪设置', hideInMenu: true },
        component: () => import('#/views/hrm/salary/config/config/index.vue'),
      },
      {
        path: 'salary/config/option',
        name: 'HrmSalaryConfigOption',
        meta: { title: '工资表设置', hideInMenu: true },
        component: () => import('#/views/hrm/salary/config/option/index.vue'),
      },
      {
        path: 'salary/config/change-template',
        name: 'HrmSalaryConfigChangeTemplate',
        meta: { title: '调薪模板', hideInMenu: true },
        component: () =>
          import('#/views/hrm/salary/config/change-template/index.vue'),
      },
      {
        path: 'insurance/config/scheme',
        name: 'HrmInsuranceConfigScheme',
        meta: { title: '社保方案', hideInMenu: true },
        component: () => import('#/views/hrm/insurance/scheme/index.vue'),
      },
      {
        path: 'insurance/scheme',
        name: 'HrmInsuranceScheme',
        meta: { title: '社保方案', hideInMenu: true },
        component: () => import('#/views/hrm/insurance/scheme/index.vue'),
      },
      {
        path: 'attendance/config/group',
        name: 'HrmAttendanceConfigGroup',
        meta: { title: '考勤组', hideInMenu: true },
        component: () =>
          import('#/views/hrm/attendance/config/group/index.vue'),
      },
      {
        path: 'attendance/config/holiday',
        name: 'HrmAttendanceConfigHoliday',
        meta: { title: '节假日', hideInMenu: true },
        component: () =>
          import('#/views/hrm/attendance/config/holiday/index.vue'),
      },
      {
        path: 'portal/home',
        name: 'HrmPortalHome',
        meta: { title: '员工工作台', hideInMenu: true },
        component: () => import('#/views/hrm/portal/home/index.vue'),
      },
      {
        path: 'portal/employee',
        name: 'HrmPortalEmployee',
        meta: { title: '我的档案', hideInMenu: true },
        component: () => import('#/views/hrm/portal/employee/index.vue'),
      },
      {
        path: 'portal/insurance',
        name: 'HrmPortalInsurance',
        meta: { title: '我的社保', hideInMenu: true },
        component: () =>
          import('#/views/hrm/portal/insurance/record/index.vue'),
      },
      {
        path: 'portal/salary/slip',
        name: 'HrmPortalSalarySlip',
        meta: { title: '我的工资条', hideInMenu: true },
        component: () => import('#/views/hrm/portal/salary/slip/index.vue'),
      },
      {
        path: 'portal/attendance/report',
        name: 'HrmPortalAttendanceReport',
        meta: { title: '我的考勤', hideInMenu: true },
        component: () =>
          import('#/views/hrm/portal/attendance/report/index.vue'),
      },
      {
        path: 'portal/performance/assessment',
        name: 'HrmPortalPerformanceAssessment',
        meta: { title: '绩效任务', hideInMenu: true },
        component: () =>
          import('#/views/hrm/portal/performance/assessment/index.vue'),
      },
      {
        path: 'portal/performance/history',
        name: 'HrmPortalPerformanceHistory',
        meta: { title: '绩效档案', hideInMenu: true },
        component: () =>
          import('#/views/hrm/portal/performance/assessment/history/index.vue'),
      },
      {
        path: 'portal/opening-guide',
        name: 'HrmPortalOpeningGuide',
        meta: { title: '员工端开通引导', hideInMenu: true },
        component: () => import('#/views/hrm/portal/opening-guide/index.vue'),
      },
    ],
  },
];

export default routes;
