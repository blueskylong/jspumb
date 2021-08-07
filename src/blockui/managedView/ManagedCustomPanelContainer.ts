import {Table} from "../table/Table";
import {AutoManagedUI, IManageCenter} from "./AutoManagedUI";
import BaseUI from "../../uidesign/view/BaseUI";
import {PageDetailDto} from "../../funcdesign/dto/PageDetailDto";
import {MenuButtonDto} from "../../sysfunc/menu/dto/MenuButtonDto";
import {ApplicationContext, BeanFactory} from "../../decorator/decorator";
import {MenuFunction} from "../MenuFunction";
import {Constants} from "../../common/Constants";

export class ManagedCustomPanelContainer<T extends PageDetailDto> extends BaseUI<T> implements AutoManagedUI {
    private customControl: AutoManagedUI;

    getPageDetail(): PageDetailDto {
        return this.properties;
    }

    getTableIds(): Array<number> {
        return this.customControl.getTableIds();
    }

    getUiDataNum(): number {
        return this.customControl.getUiDataNum();
    }
    checkAndSave(): Promise<boolean> {
        return new Promise<boolean>(resolve => resolve(true));
    }
    setButtons(buttons: Array<MenuButtonDto>) {
        this.customControl.setButtons(buttons);
    }

    setEditable(editable): void {
        this.customControl.setEditable(editable);
    }

    setManageCenter(manageCenter: IManageCenter) {
        this.customControl.setManageCenter(manageCenter);
    }

    attrChanged(source: any, tableId: number, mapKeyAndValue: object, field: string, value: any) {
        this.customControl.attrChanged(source, tableId, mapKeyAndValue, field, value);
    }

    btnClicked(source: any, buttonInfo: MenuButtonDto, data): boolean {
        return this.customControl.btnClicked(source, buttonInfo, data);
    }

    dataChanged(source: any, tableId, mapKeyAndValue: object, changeType) {
        this.customControl.dataChanged(source, tableId, mapKeyAndValue, changeType);
    }

    dsSelectChanged(source: any, tableId, mapKeyAndValue, row?) {
        this.customControl.dsSelectChanged(source, tableId, mapKeyAndValue, row);
    }

    referenceSelectChanged(source: any, refId, id, isLeaf) {
        this.customControl.referenceSelectChanged(source, refId, id, isLeaf)
    }

    stateChange(source: any, tableId, state: number, extendData?: any) {
        this.customControl.stateChange(source, tableId, state, extendData);
    }

    protected createUI(): HTMLElement {
        return $("<div class='full-display'></div>").get(0);
    }

    reload(): void {

    }

    protected initSubControls() {
        if (!this.properties.customUi) {
            console.log("没有配置自定义控件的实现类");
            return;
        }
        //初始化
        let funcClazz = ApplicationContext.getCustomUi(this.properties.customUi);
        if(!funcClazz){
            throw new Error("指定的功能类为空！");
        }
        this.customControl = <AutoManagedUI>BeanFactory.createBean(funcClazz, [this.properties]);
        this.$element.append(this.customControl.getViewUI());
        this.customControl.addReadyListener(() => {

            this.fireReadyEvent();
        });
    }


}
