import {ManagedTable} from "../blockui/managedView/ManagedTable";
import {MenuStep, MenuStepInfo} from "../blockui/steps/stepcomp/stepimpl/MenuStep";
import {BeanFactory, MenuFunc} from "../decorator/decorator";
import {FixRowService} from "./service/FixRowService";
import {LocalRenderProvider} from "../blockui/table/TableRenderProvider";
import {BlockViewer} from "../blockui/uiruntime/BlockViewer";

/**
 * 固定行主功能，加额外的按钮
 */
@MenuFunc("FixMainUI")
export class FixMainUI<T extends MenuStepInfo> extends MenuStep<T> {

}
