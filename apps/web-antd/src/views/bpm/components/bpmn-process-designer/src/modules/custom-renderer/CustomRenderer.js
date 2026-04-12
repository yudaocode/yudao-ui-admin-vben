import BpmnRenderer from 'bpmn-js/lib/draw/BpmnRenderer';

function CustomRenderer(
  config,
  eventBus,
  styles,
  pathMap,
  canvas,
  textRenderer,
) {
  BpmnRenderer.call(
    this,
    config,
    eventBus,
    styles,
    pathMap,
    canvas,
    textRenderer,
    2000,
  );

  this.handlers.label = () => null;
}

CustomRenderer.prototype = Object.create(BpmnRenderer.prototype);
CustomRenderer.prototype.constructor = CustomRenderer;

export default CustomRenderer;
