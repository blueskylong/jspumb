import {Dialog, DialogInfo} from "../../blockui/Dialog";
import {Constants} from "../../common/Constants";
import {BlockViewer} from "../../blockui/uiruntime/BlockViewer";
import {Form} from "../../blockui/Form";

export class DataDlg<T extends DataDialogInfo> extends Dialog<T> {
    private ui: Form;


    protected getBody(): HTMLElement {

        //style='overflow:auto' 加上后,里面的选择框只会显示在很小的区域
        return $("<div class ='sub-ui' style='width: 500px' ></div>").get(0);

    }

    protected initSubControls() {
        this.initUI();
    }

    private initUI() {
        this.ui = Form.getLocalInstance(this.properties.viewer);
        this.$element.find(".sub-ui").append(this.ui.getViewUI());
        this.ui.addReadyListener(() => {
            this.doOperation();
        });
    }

    protected doOperation() {
        this.ui.setValue(this.properties.initValue);
        if (this.properties.operType === Constants.DsOperatorType.add
            || this.properties.operType === Constants.DsOperatorType.edit) {
            this.setOkButtonText("保存");
        } else if (this.properties.operType === Constants.DsOperatorType.view) {
            this.setOkButtonVisible(false);
        }
    }

    protected beforeOK(): boolean {
        if (!this.ui.check()) {
            return;
        }
        return this.properties.callback(this.properties.operType, this.ui.getValue());

    }


    destroy(): boolean {
        if (this.ui && this.ui["destroy"]) {
            this.ui["destroy"]();
            this.ui = null;
        }
        return super.destroy();
    }
}

export interface DataDialogInfo extends DialogInfo {

    initValue: object;//初始化数据,如果新增,则是界面选择的相关数据,如果是查看,则是ID,如果是修改,则也是ID
    operType: number;//操作类型,查看,修改,增加 参见: Constants.TableOperatorType
    viewer?: BlockViewer;//可以直接指定视图内容
    callback(type, rowData): boolean;
}
