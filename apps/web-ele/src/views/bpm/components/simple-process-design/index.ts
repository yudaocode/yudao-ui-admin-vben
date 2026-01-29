import './styles/simple-process-designer.scss';

export { default as HttpRequestSetting } from './components/nodes-config/modules/http-request-setting.vue';

export { default as SimpleProcessDesigner } from './components/simple-process-designer.vue';

export { default as SimpleProcessViewer } from './components/simple-process-viewer.vue';

export type { SimpleFlowNode } from './consts';

// TODO @jaosn：和 antd 对应的文件，不太一样
export { parseFormFields } from './helpers';
