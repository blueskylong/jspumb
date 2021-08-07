import {Dialog, DialogInfo} from "../Dialog";
import {Constants} from "../../common/Constants";
import {ManagedTable} from "./ManagedTable";
import {ServerRenderProvider} from "../table/TableRenderProvider";
import {PageDetailDto} from "../../funcdesign/dto/PageDetailDto";
import {ManagedForm} from "./ManagedForm";
import {AutoManagedUI} from "./AutoManagedUI";
import {ManagedTreeUI} from "./ManagedTreeUI";
import {SchemaFactory} from "../../datamodel/SchemaFactory";
import {UiService} from "../service/UiService";
import {BlockViewer} from "../uiruntime/BlockViewer";
import {Alert} from "../../uidesign/view/JQueryComponent/Alert";
import {ManagedCard} from "./ManagedCard";

export class ManagedDlg<T extends ManagedDialogInfo> extends Dialog<T> {
    private ui: AutoManagedUI;


    protected getBody(): HTMLElement {
        this.initUI();
        //style='overflow:auto' 加上后,里面的选择框只会显示在很小的区域
        return $("<div class ='sub-ui' ></div>").get(0);

    }

    private async initUI() {
        if (this.properties.blockViewId) {
            await this.showBlock(this.properties.blockViewId, this.properties.showType);
        } else if (this.properties.dsId) {
            let tableInfo = SchemaFactory.getTableByTableId(this.properties.dsId);
            let viewId = tableInfo.getTableDto().blockViewId;
            if (!viewId) {
                Alert.showMessage("没有指定表默认的编辑界面")
                return;
            }
            await this.showBlock(viewId, this.properties.showType);

        } else {
            Alert.showMessage("数据表没有指定默认的展示界面");
        }
        this.$element.find(".sub-ui").append(this.ui.getViewUI());


        this.ui.addReadyListener(() => {
            this.doOperation();
        });
    }

    protected doOperation() {
        if (this.properties.operType === Constants.DsOperatorType.add) {
            if (this.ui["doAdd"]) {
                this.ui["doAdd"](this.properties.initValue);
            }
            this.setOkButtonText("保存");
        } else if (this.properties.operType === Constants.DsOperatorType.view) {
            if (this.ui["doView"]) {
                this.ui["doView"](null, this.properties.initValue);
            }
            this.setOkButtonVisible(false);
        } else if (this.properties.operType === Constants.DsOperatorType.edit) {
            if (this.ui["doEdit"]) {
                this.ui["doEdit"](null, this.properties.initValue);
            }
            this.setOkButtonText("保存");
        }
    }

    protected beforeOK(): boolean {
        if (this.ui["doSave"]) {
            this.ui["doSave"]((result) => {
                if (result) {
                    if (this.properties.callback) {
                        if (this.properties.operType === Constants.DsOperatorType.add) {
                            this.properties.callback(true, result[0].keys[0][1]);
                        } else {
                            this.properties.callback(true, this.properties.initValue);
                        }

                    }
                    this.close();
                }

            });
            return false;
        }
        return super.beforeOK();
    }

    private async showBlock(blockViewId, showType) {
        let pageDetail = new PageDetailDto();
        let viewer: BlockViewer = await UiService.getSchemaViewer(blockViewId);
        showType = showType || viewer.getBlockViewDto().defaultShowType;
        pageDetail.loadOnshow = 0;
        pageDetail.viewId = blockViewId;
        if (showType === Constants.DispType.table) {
            this.ui = ManagedTable.getManagedInstance(new ServerRenderProvider(blockViewId), pageDetail);
        } else if (showType === Constants.DispType.tree) {
            this.ui = ManagedTreeUI.getManagedInstance(pageDetail);
        } else if (showType === Constants.DispType.card) {
            this.ui = ManagedCard.getManagedInstance(pageDetail)
        } else {
            this.ui = ManagedForm.getManagedInstance(pageDetail);
        }
    }

    destroy(): boolean {
        if (this.ui && this.ui["destroy"]) {
            this.ui["destroy"]();
            this.ui = null;
        }
        return super.destroy();
    }
}

export interface ManagedDialogInfo extends DialogInfo {
    dsId?: number;//数据表,可以根据数据表来查询默认编辑界面.
    initValue: object;//初始化数据,如果新增,则是界面选择的相关数据,如果是查看,则是ID,如果是修改,则也是ID
    operType: number;//操作类型,查看,修改,增加 参见: Constants.TableOperatorType
    blockViewId?: number;//指定显示的视图 与DSID相同，此参数优先级高于数据表默认编辑界面的设定．
    showType?: number;//指定显示类型
    callback?(result: boolean, rowId?): void;
}
