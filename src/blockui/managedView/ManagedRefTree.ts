import {AutoManagedUI, ManagedEventListener} from "./AutoManagedUI";
import {ReferenceTree, ReferenceTreeInfo} from "../JsTree/ReferenceTree";
import {Constants} from "../../common/Constants";
import {GlobalParams} from "../../common/GlobalParams";
import {PageDetailDto} from "../../funcdesign/dto/PageDetailDto";
import {MenuButtonDto} from "../../sysfunc/menu/dto/MenuButtonDto";
import {CommonUtils} from "../../common/CommonUtils";

/**
 * 引用树,只会触发自己的选择事件.
 */
export class ManagedRefTree<T extends ReferenceTreeInfo> extends ReferenceTree<T> implements AutoManagedUI {
    private listener: ManagedEventListener;
    protected pageDetail: PageDetailDto;

    attrChanged(source: any, tableId, mapKeyAndValue, field, value) {
        return;
    }

    dataChanged(source: any, tableId, mapKeyAndValue) {
        return;
    }

    dsSelectChanged(source: any, tableId, mapKeyAndValue, row?) {
        return;
    }


    getTableIds(): Array<number> {
        return [];
    }

    loadData() {
        this.reload();
    }

    getPageDetail(): PageDetailDto {
        return this.pageDetail;
    }

    referenceSelectChanged(source: any, refId, id) {
        return;
    }

    setManageCenter(listener: ManagedEventListener) {
        this.listener = listener;
    }
    checkAndSave(): Promise<boolean> {
        return new Promise<boolean>(resolve => resolve(true));
    }
    stateChange(source: any, tableId, state: number) {
    }

    static getManagedInstance(reference, pageDetail: PageDetailDto, version?) {
        let refInfo = {refId: reference, version: version || GlobalParams.getLoginVersion()};
        let tree = new ManagedRefTree(refInfo);
        tree.pageDetail = pageDetail;
        return tree;
    }

    protected initEvent() {
        super.initEvent();
        this.addReadyListener(() => {
            this.getTree().addSelectListener({
                handleEvent: (eventType: string, data: any, source: any, extObject?: any) => {
                    if (this.listener) {
                        let data = this.getTree().getCurrentNode();
                        let id = null;
                        if (data && data.data) {
                            id = data.data.id;
                        }
                        this.listener.referenceSelectChanged(this, this.properties.refId, id,
                            (data && (!data.children || data.children.length == 0)));
                    }
                }
            });

            if (this.pageDetail.loadOnshow) {
                this.reload();
            }
        });
    }


    setButtons(buttons: Array<MenuButtonDto>) {
    }

    getUiDataNum(): number {
        return Constants.UIDataNum.multi;
    }


}
