import { defHttp } from '@/utils/http/axios'

export function getProcessDefinitionPage(params) {
  return defHttp.get({ url: '/bpm/process-definition/page', params })
}

export function getProcessDefinitionList(params) {
  return defHttp.get({ url: '/bpm/process-definition/list', params })
}

export function getProcessDefinitionBpmnXML(id) {
  return defHttp.get({ url: `/bpm/process-definition/get-bpmn-xml?id=${id}` })
}
