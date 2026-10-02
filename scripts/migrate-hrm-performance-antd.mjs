/**
 * Migrate HRM performance vue3 source views to web-antd (antd) stubs.
 * Copies source files and applies import/path transformations.
 */
import fs from 'node:fs';
import path from 'node:path';

const SRC =
  '/Users/yunai/Java/yudao-hrm-all/yudao-ui-admin-vue3/src/views/hrm/performance';
const DST =
  '/Users/yunai/Java/yudao-all-in-vben/yudao-ui-admin-vben/apps/web-antd/src/views/hrm/performance';

const FILE_MAP = [
  ['plan/index.vue', 'plan/index.vue'],
  ['plan/form/index.vue', 'plan/form/index.vue'],
  [
    'plan/form/PerformancePlanBasicForm.vue',
    'plan/form/modules/basic-form.vue',
  ],
  [
    'plan/form/PerformancePlanScopeForm.vue',
    'plan/form/modules/scope-form.vue',
  ],
  [
    'plan/form/PerformancePlanIndicatorForm.vue',
    'plan/form/modules/indicator-form.vue',
  ],
  [
    'plan/form/PerformancePlanProcessForm.vue',
    'plan/form/modules/process-form.vue',
  ],
  [
    'plan/form/PerformancePlanHandlerStageForm.vue',
    'plan/form/modules/handler-stage-form.vue',
  ],
  [
    'plan/form/PerformancePlanResultForm.vue',
    'plan/form/modules/result-form.vue',
  ],
  ['plan/detail/index.vue', 'plan/detail/index.vue'],
  [
    'plan/detail/PerformancePlanDetailsHeader.vue',
    'plan/detail/modules/header.vue',
  ],
  [
    'plan/detail/PerformancePlanDetailsInfo.vue',
    'plan/detail/modules/info.vue',
  ],
  [
    'plan/PerformancePlanAssessmentAddForm.vue',
    'plan/modules/assessment-add-form.vue',
  ],
  ['assessment/index.vue', 'assessment/index.vue'],
  ['assessment/employee/index.vue', 'assessment/employee/index.vue'],
  ['assessment/detail/index.vue', 'assessment/detail/index.vue'],
  [
    'assessment/components/PerformanceProcessRecordTimeline.vue',
    'assessment/components/process-record-timeline.vue',
  ],
  [
    'config/assessment-template/index.vue',
    'config/assessment-template/index.vue',
  ],
  [
    'config/assessment-template/PerformanceAssessmentTemplateForm.vue',
    'config/assessment-template/modules/form.vue',
  ],
  [
    'config/assessment-template/PerformanceAssessmentDimensionForm.vue',
    'config/assessment-template/modules/dimension-form.vue',
  ],
  [
    'config/assessment-template/components/PerformanceAssessmentConfigEditor.vue',
    'config/assessment-template/components/config-editor.vue',
  ],
  [
    'config/assessment-template/components/PerformanceAssessmentTemplateSelect.vue',
    'config/assessment-template/components/template-select.vue',
  ],
  ['config/result-template/index.vue', 'config/result-template/index.vue'],
  [
    'config/result-template/PerformanceResultTemplateForm.vue',
    'config/result-template/modules/form.vue',
  ],
  [
    'config/result-template/components/PerformanceResultLevelForm.vue',
    'config/result-template/components/level-form.vue',
  ],
  [
    'components/HrmPerformanceRaterLevelSelect.vue',
    'components/rater-level-select.vue',
  ],
];

function transform(content, relPath) {
  let s = content;

  // imports
  s = s.replaceAll('@/api/hrm/performance/', '#/api/hrm/performance/');
  s = s.replaceAll('@/views/hrm/', '#/views/hrm/');
  s = s.replaceAll('@/utils/dict', '@vben/constants');
  s = s.replaceAll('@/utils/formatTime', '@vben/utils');
  s = s.replaceAll('@/utils/file', '@vben/utils');
  s = s.replaceAll('@/utils/url', '@vben/utils');
  s = s.replaceAll(
    "import { DICT_TYPE, getDictLabel } from '@vben/constants'",
    "import { DICT_TYPE } from '@vben/constants';\nimport { getDictLabel, getDictOptions } from '@vben/hooks'",
  );
  s = s.replaceAll(
    "import { DICT_TYPE, getIntDictOptions } from '@vben/constants'",
    "import { DICT_TYPE } from '@vben/constants';\nimport { getDictOptions } from '@vben/hooks'",
  );
  s = s.replaceAll('getIntDictOptions(DICT_TYPE.', 'getDictOptions(DICT_TYPE.');
  s = s.replaceAll('dateFormatter', 'formatDateTime');

  // component renames in imports
  s = s.replaceAll('PerformancePlanBasicForm', 'BasicForm');
  s = s.replaceAll('PerformancePlanScopeForm', 'ScopeForm');
  s = s.replaceAll('PerformancePlanIndicatorForm', 'IndicatorForm');
  s = s.replaceAll('PerformancePlanProcessForm', 'ProcessForm');
  s = s.replaceAll('PerformancePlanHandlerStageForm', 'HandlerStageForm');
  s = s.replaceAll('PerformancePlanResultForm', 'ResultForm');
  s = s.replaceAll('PerformancePlanDetailsHeader', 'DetailsHeader');
  s = s.replaceAll('PerformancePlanDetailsInfo', 'DetailsInfo');
  s = s.replaceAll('PerformancePlanAssessmentAddForm', 'AssessmentAddForm');
  s = s.replaceAll('PerformanceAssessmentConfigEditor', 'ConfigEditor');
  s = s.replaceAll('PerformanceAssessmentTemplateSelect', 'TemplateSelect');
  s = s.replaceAll('PerformanceAssessmentDimensionForm', 'DimensionForm');
  s = s.replaceAll('PerformanceAssessmentTemplateForm', 'TemplateForm');
  s = s.replaceAll('PerformanceResultTemplateForm', 'ResultTemplateForm');
  s = s.replaceAll('PerformanceResultLevelForm', 'LevelForm');
  s = s.replaceAll('PerformanceProcessRecordTimeline', 'ProcessRecordTimeline');
  s = s.replaceAll('HrmPerformanceRaterLevelSelect', 'RaterLevelSelect');

  // API namespace types
  s = s.replaceAll(
    /PerformanceAssessmentTemplateApi\.(\w+)/g,
    'HrmPerformanceAssessmentTemplateApi.$1',
  );
  s = s.replaceAll('AssessmentTemplateVO', 'AssessmentTemplate');
  s = s.replaceAll('AssessmentConfigVO', 'AssessmentConfig');
  s = s.replaceAll('AssessmentDimensionVO', 'AssessmentDimension');
  s = s.replaceAll('AssessmentQuotaVO', 'AssessmentQuota');
  s = s.replaceAll(
    /PerformanceResultTemplateApi\.(\w+)/g,
    'HrmPerformanceResultTemplateApi.$1',
  );
  s = s.replaceAll('ResultTemplateVO', 'ResultTemplate');
  s = s.replaceAll('ResultLevelVO', 'ResultLevel');
  s = s.replaceAll(/PerformancePlanApi\.(\w+)/g, 'HrmPerformancePlanApi.$1');
  s = s.replaceAll('PerformancePlanVO', 'PerformancePlan');
  s = s.replaceAll('PerformanceReviewStageVO', 'PerformanceReviewStage');
  s = s.replaceAll('PerformanceHandlerStageVO', 'PerformanceHandlerStage');
  s = s.replaceAll(
    /PerformanceAssessmentApi\.(\w+)/g,
    'HrmPerformanceAssessmentApi.$1',
  );
  s = s.replaceAll(
    'PerformanceArchiveEmployeeVO',
    'PerformanceArchiveEmployee',
  );
  s = s.replaceAll('PerformanceAssessmentVO', 'PerformanceAssessment');
  s = s.replaceAll('PerformanceArchivePlanVO', 'PerformanceArchivePlan');
  s = s.replaceAll('PerformanceProcessRecordVO', 'PerformanceProcessRecord');

  // import paths for renamed files
  s = s.replaceAll(
    './PerformancePlanBasicForm.vue',
    './modules/basic-form.vue',
  );
  s = s.replaceAll(
    './PerformancePlanScopeForm.vue',
    './modules/scope-form.vue',
  );
  s = s.replaceAll(
    './PerformancePlanIndicatorForm.vue',
    './modules/indicator-form.vue',
  );
  s = s.replaceAll(
    './PerformancePlanProcessForm.vue',
    './modules/process-form.vue',
  );
  s = s.replaceAll(
    './PerformancePlanHandlerStageForm.vue',
    './modules/handler-stage-form.vue',
  );
  s = s.replaceAll(
    './PerformancePlanResultForm.vue',
    './modules/result-form.vue',
  );
  s = s.replaceAll(
    './PerformancePlanDetailsHeader.vue',
    './modules/header.vue',
  );
  s = s.replaceAll('./PerformancePlanDetailsInfo.vue', './modules/info.vue');
  s = s.replaceAll(
    './PerformancePlanAssessmentAddForm.vue',
    './modules/assessment-add-form.vue',
  );
  s = s.replaceAll(
    './components/PerformanceAssessmentConfigEditor.vue',
    './components/config-editor.vue',
  );
  s = s.replaceAll(
    './components/PerformanceAssessmentTemplateSelect.vue',
    './components/template-select.vue',
  );
  s = s.replaceAll(
    '../PerformanceAssessmentDimensionForm.vue',
    '../modules/dimension-form.vue',
  );
  s = s.replaceAll(
    './PerformanceAssessmentTemplateForm.vue',
    './modules/form.vue',
  );
  s = s.replaceAll('./PerformanceResultTemplateForm.vue', './modules/form.vue');
  s = s.replaceAll(
    './components/PerformanceResultLevelForm.vue',
    './components/level-form.vue',
  );
  s = s.replaceAll(
    './components/PerformanceProcessRecordTimeline.vue',
    './components/process-record-timeline.vue',
  );

  // message
  s = s.replaceAll(
    'const message = useMessage()',
    '// message from ant-design-vue',
  );
  s = s.replaceAll('message.delConfirm', 'confirmDelete');
  s = s.replaceAll('message.confirm', 'confirm');
  s = s.replaceAll('message.success', 'antdMessage.success');
  s = s.replaceAll('message.warning', 'antdMessage.warning');

  // add antd imports if script setup and uses el components
  if (s.includes('<el-') || s.includes('useMessage')) {
    if (!s.includes("from 'ant-design-vue'")) {
      s = s.replace(
        /<script lang="ts" setup>\n/,
        `<script lang="ts" setup>\nimport { message as antdMessage } from 'ant-design-vue';\nimport { confirm, confirmDelete } from '@vben/common-ui';\n`,
      );
    }
  }

  // formatHrmDateRange import
  if (
    s.includes('formatHrmDateRange') &&
    !s.includes("from '#/views/hrm/utils/format'")
  ) {
    // already has views/hrm import likely
  }

  return s;
}

for (const [srcRel, dstRel] of FILE_MAP) {
  const srcPath = path.join(SRC, srcRel);
  const dstPath = path.join(DST, dstRel);
  if (!fs.existsSync(srcPath)) {
    console.warn('SKIP missing:', srcRel);
    continue;
  }
  fs.mkdirSync(path.dirname(dstPath), { recursive: true });
  const raw = fs.readFileSync(srcPath, 'utf8');
  const out = transform(raw, dstRel);
  fs.writeFileSync(dstPath, out);
  console.log('OK', dstRel);
}

console.log('Done.');
