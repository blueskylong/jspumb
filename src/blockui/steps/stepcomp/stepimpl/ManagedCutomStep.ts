import {IManagedStep} from "../ManagedStepUI";
import {ManagedPage} from "../../../managedView/ManagedPage";
import {PageUIInfo} from "../../../PageUI";
import {StepGlobalInfo} from "../StepUI";
import {ButtonInfo} from "../../../../uidesign/view/JQueryComponent";
import BaseUI from "../../../../uidesign/view/BaseUI";
import {StepDetail} from "../dto/StepDetail";
import {ApplicationContext, BeanFactory} from "../../../../decorator/decorator";
import {AutoManagedUI, IManageCenter} from "../../../managedView/AutoManagedUI";
import {BaseComponent} from "../../../../uidesign/view/BaseComponent";
import {MenuButtonDto} from "../../../../sysfunc/menu/dto/MenuButtonDto";
import {PageDetailDto} from "../../../../funcdesign/dto/PageDetailDto";

export class ManagedCustomStep<T extends StepDetail> extends BaseComponent<T> implements IManagedStep {
    needCacheUI: boolean;
    title = this.properties.detailName;
    private customUi: BaseUI<T>;

    protected initStructure() {
        let funcClazz = ApplicationContext.getCustomStepUI(this.properties.customStep);
        this.customUi = <BaseUI<T>>BeanFactory.createBean(funcClazz, [this.properties]);
    }

    protected createUI(): HTMLElement {
        return this.customUi.getViewUI();
    }

    checkAndSaveStep(globalInfo: StepGlobalInfo, callback: (errorInfo: string) => void) {
        callback(null);
    }

    getSubManagedUI(): Array<AutoManagedUI> {
        if (typeof this.customUi["getSubManagedUI"] === 'function') {
            return this.customUi["getSubManagedUI"]();
        }
        if (ManagedPage.isAutoManagedUI(this.customUi)) {
            return [this.customUi as any];
        }
        return null;

    }

    getCommonButtons(): Array<ButtonInfo> {
        if (typeof this.customUi['getCommonButtons'] === 'function') {
            return this.customUi['getCommonButtons']();
        }
        return null;
    }

    getShowCom(globalInfo: StepGlobalInfo): BaseUI<any> {
        return this.customUi;
    }

    setManageCenter(manageCenter: IManageCenter) {
        if (typeof this.customUi['setManageCenter'] === 'function') {
            this.customUi['setManageCenter'](manageCenter);
        }
    }


    attrChanged(source: any, tableId: number, mapKeyAndValue: object, field: string, value: any) {
        if (typeof this.customUi['attrChanged'] === 'function') {
            this.customUi['attrChanged'](source, tableId, mapKeyAndValue, field, value);
        }
    }

    btnClicked(source: any, buttonInfo: MenuButtonDto, data): boolean {
        if (typeof this.customUi['btnClicked'] === 'function') {
            this.customUi['btnClicked'](source, buttonInfo, data);
        }
        return false;
    }

    checkAndSave(): Promise<boolean> {
        if (typeof this.customUi['checkAndSave'] === 'function') {
            return this.customUi['checkAndSave']();
        }
        return new Promise<boolean>(resolve => resolve(true));
    }

    dataChanged(source: any, tableId, mapKeyAndValue: object, changeType, rowData?: object) {
        if (typeof this.customUi['dataChanged'] === 'function') {
            this.customUi['dataChanged'](source, tableId, mapKeyAndValue, changeType, rowData);
        }
    }

    dsSelectChanged(source: any, tableId, mapKeyAndValue, row?) {
        if (typeof this.customUi['dsSelectChanged'] === 'function') {
            this.customUi['dsSelectChanged'](source, tableId, mapKeyAndValue);
        }
    }

    getPageDetail(): PageDetailDto {
        if (typeof this.customUi['getPageDetail'] === 'function') {
            return this.customUi['getPageDetail']();
        }
        return null;
    }

    getTableIds(): Array<number> {
        if (typeof this.customUi['getTableIds'] === 'function') {
            return this.customUi['getTableIds']();
        }
        return null;
    }

    getUiDataNum(): number {
        if (typeof this.customUi['getUiDataNum'] === 'function') {
            return this.customUi['getUiDataNum']();
        }
        return 0;
    }

    referenceSelectChanged(source: any, refId, id, isLeaf) {
        if (typeof this.customUi['referenceSelectChanged'] === 'function') {
            this.customUi['referenceSelectChanged'](source, refId, id, isLeaf);
        }
    }

    reload(): void {
        if (typeof this.customUi['reload'] === 'function') {
            this.customUi['reload']();
        }
    }

    setButtons(buttons: Array<MenuButtonDto>) {
        if (typeof this.customUi['setButtons'] === 'function') {
            return this.customUi['setButtons']();
        }
    }

    stateChange(source: any, tableId, state: number, extendData?: any) {
        if (typeof this.customUi['stateChange'] === 'function') {
            this.customUi['stateChange'](source, tableId, state, extendData);
        }
    }


}

