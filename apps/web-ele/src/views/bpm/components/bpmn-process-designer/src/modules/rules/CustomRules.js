import BpmnRules from 'bpmn-js/lib/features/rules/BpmnRules';
// eslint-disable-next-line n/no-extraneous-import
import inherits from 'inherits';

function CustomRules(eventBus) {
  BpmnRules.call(this, eventBus);
}

inherits(CustomRules, BpmnRules);

CustomRules.prototype.canDrop = function () {
  return false;
};

CustomRules.prototype.canMove = function () {
  return false;
};

export default CustomRules;
