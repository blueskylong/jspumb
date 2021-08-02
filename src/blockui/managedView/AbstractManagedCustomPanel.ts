import {PageDetailDto} from "../../funcdesign/dto/PageDetailDto";
import BaseUI from "../../uidesign/view/BaseUI";
import {AutoManagedUI, IManageCenter} from "./AutoManagedUI";
import {MenuButtonDto} from "../../sysfunc/menu/dto/MenuButtonDto";
import {BaseComponent} from "../../uidesign/view/BaseComponent";
import {Constants} from "../../common/Constants";


export abstract class AbstractManagedCustomPanel<T extends PageDetailDto> extends BaseComponent<T> implements AutoManagedUI {
    protected manageCenter: IManageCenter;

    attrChanged(source: any, tableId: number, mapKeyAndValue: object, field: string, value: any) {
    }

    btnClicked(source: any, buttonInfo: MenuButtonDto, data): boolean {
        return false;
    }

    protected abstract createUI(): HTMLElement ;

    dataChanged(source: any, tableId, mapKeyAndValue: object, changeType) {
    }

    dsSelectChanged(source: any, tableId, mapKeyAndValue, row?) {
    }

    getPageDetail(): PageDetailDto {
        return this.properties;
    }

    getTableIds(): Array<number> {
        return [];
    }

    getUiDataNum(): number {
        return 1;
    }

    abstract checkAndSave(): Promise<boolean> ;


    referenceSelectChanged(source: any, refId, id, isLeaf) {
    }

    setButtons(buttons: Array<MenuButtonDto>) {
    }

    setEditable(editable): void {
        this.editable = editable;
    }

    setManageCenter(manageCenter: IManageCenter) {
        this.manageCenter = manageCenter;
    }

    protected initEvent() {
        this.addReadyListener(() => {
            this.setEditable(this.properties.initState === Constants.UIState.edit);
        })
    }

    stateChange(source: any, tableId, state: number, extendData?: any) {
    }

    destroy(): boolean {
        this.manageCenter = null;
        return super.destroy();
    }


    public getValue() {
        return null;
    }

    reload(): void {
    }

    public setValue(obj) {

    }
}
