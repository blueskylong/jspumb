import {BaseComponent} from "../../uidesign/view/BaseComponent";
import {AutoManagedUI, EventInterceptor, IManageCenter} from "./AutoManagedUI";
import {PageDetailDto} from "../../funcdesign/dto/PageDetailDto";
import {MenuButtonDto} from "../../sysfunc/menu/dto/MenuButtonDto";

export abstract class BaseAutoManagedUI<T> extends BaseComponent<T> implements AutoManagedUI {
    addEventInterceptor(operType: number | string, interceptor: EventInterceptor) {
    }

    attrChanged(source: any, tableId: number, mapKeyAndValue: object, field: string, value: any) {
    }

    btnClicked(source: any, buttonInfo: MenuButtonDto, data): boolean {
        return false;
    }

    protected createUI(): HTMLElement {
        return undefined;
    }

    dataChanged(source: any, tableId, mapKeyAndValue: object, changeType) {
    }

    dsSelectChanged(source: any, tableId, mapKeyAndValue, row?) {
    }

    getPageDetail(): PageDetailDto {
        return undefined;
    }

    getTableIds(): Array<number> {
        return undefined;
    }

    checkAndSave(): Promise<boolean> {
        return new Promise<boolean>(resolve => resolve(true));
    }

    getUiDataNum(): number {
        return 0;
    }

    referenceSelectChanged(source: any, refId, id, isLeaf) {
    }

    reload(): void {
    }

    setButtons(buttons: Array<MenuButtonDto>) {
    }

    setManageCenter(manageCenter: IManageCenter) {
    }

    stateChange(source: any, tableId, state: number, extendData?: any) {
    }
}
