import type {WidgetTaskHandlerProps} from 'react-native-android-widget';
import {
  buildWidget,
  clearOffset,
  getOffset,
  setOffset,
} from './ShiftCalendarWidget';

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const info = props.widgetInfo;

  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED':
      props.renderWidget(await buildWidget(info));
      break;

    case 'WIDGET_CLICK': {
      if (props.clickAction === 'CHANGE_MONTH') {
        const delta = Number((props.clickActionData as any)?.delta) || 0;
        const current = await getOffset(info.widgetId);
        await setOffset(info.widgetId, current + delta);
      } else if (props.clickAction === 'TODAY') {
        await setOffset(info.widgetId, 0);
      }
      props.renderWidget(await buildWidget(info));
      break;
    }

    case 'WIDGET_DELETED':
      await clearOffset(info.widgetId);
      break;

    default:
      break;
  }
}
