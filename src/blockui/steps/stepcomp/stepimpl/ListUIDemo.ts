import BaseUI from "../../../../uidesign/view/BaseUI";
import {IStep} from "../StepUI";
import {ButtonInfo} from "../../../../uidesign/view/JQueryComponent";
import {CommonUtils} from "../../../../common/CommonUtils";
import {Alert} from "../../../../uidesign/view/JQueryComponent/Alert";
import {ListUI, ListUIInfo} from "../../../list/ListUI";
import {FlowLayout} from "../../../layout/FlowLayout";


export class ListUIDemo<T extends BaseUIDemoInfo> extends BaseUI<T> implements IStep {
    title = this.properties.text;
    private lstUiFrom: ListUI<ListUIInfo>;
    private lstUiTo: ListUI<ListUIInfo>;
    private layout = new FlowLayout({});

    protected createUI(): HTMLElement {
        let $ele = ListUIDemo.createFullPanel();
        return $ele.get(0);
    }


    getCommonButtons(): Array<ButtonInfo> {
        return null;
    }

    protected initSubControls() {
        this.$element.append(this.layout.getViewUI());
        this.lstUiFrom = new ListUI<ListUIInfo>({
            draggable: true,
            title: "这是一个列表",
            idField: "id",
            titleField: "title"
        });
        this.layout.addUI(this.lstUiFrom);
        this.lstUiFrom.addItem({id: "1", title: "第一个条目", otherData: "其它数据1"});
        this.lstUiFrom.addItem({id: "2", title: "第二个条目", otherData: "其它数据2"});
        this.lstUiFrom.addItem({id: "3", title: "第三个条目", otherData: "其它数据3"});
        this.lstUiFrom.addItem({id: "4", title: "第四个条目", otherData: "其它数据4"});
        this.lstUiFrom.addItem({id: "5", title: "第五个条目", otherData: "其它数据5"});

        this.lstUiFrom.addSelectionListener({
            handleEvent(eventType: string, data: any, source: any, extObject?: any) {
                Alert.showMessage(data);
            }
        });

        this.lstUiFrom.addDoubleClickListener({
            handleEvent: (eventType: string, data: any, source: any, extObject?: any) => {
                let value = this.lstUiFrom.getItem(data).getData();
                this.lstUiFrom.removeItem(data);
                this.lstUiTo.addItem(value);
            }
        });
        this.lstUiTo = new ListUI<ListUIInfo>({
            draggable: true,
            title: "这是另一个列表",
            idField: "id",
            titleField: "title"
        });
        this.layout.addUI(this.lstUiTo);

        this.lstUiTo.addSelectionListener({
            handleEvent(eventType: string, data: any, source: any, extObject?: any) {
                Alert.showMessage(data);
            }
        });

        this.lstUiTo.addDoubleClickListener({
            handleEvent: (eventType: string, data: any, source: any, extObject?: any) => {
                let value = this.lstUiTo.getItem(data).getData();
                this.lstUiTo.removeItem(data);
                this.lstUiFrom.addItem(value);
            }
        })

    }


    checkAndSave() {
        console.log("doSave!");
        return new Promise<boolean>(resolve => resolve(true));
    }


    getShowCom(): BaseUI<any> {
        return this;
    }


}

export interface BaseUIDemoInfo {
    text: string;
    btnTitle?: string;
    err?: string;
}
