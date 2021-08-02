import {PageDetailDto} from "../../funcdesign/dto/PageDetailDto";
import {MenuButtonDto} from "../menu/dto/MenuButtonDto";
import {AbstractManagedCustomPanel} from "../../blockui/managedView/AbstractManagedCustomPanel";
import {ManagedUITools} from "../../blockui/managedView/ManagedUITools";
import {TableInfo} from "../../datamodel/DmRuntime/TableInfo";
import {SchemaFactory} from "../../datamodel/SchemaFactory";
import {Alert} from "../../uidesign/view/JQueryComponent/Alert";
import {Toolbar} from "../../uidesign/view/JQueryComponent/Toolbar";
import {ReferenceTree} from "../../blockui/JsTree/ReferenceTree";
import {GlobalParams} from "../../common/GlobalParams";
import {CustomUi} from "../../decorator/decorator";
import {Constants} from "../../common/Constants";
import {UserRightService} from "./service/UserRightService";
import {CommonUtils} from "../../common/CommonUtils";
import {StringMap} from "../../common/StringMap";
import {UserService} from "../user/service/UserService";
import {UiUtils} from "../../common/UiUtils";

/**
 * 权限关系维护,这里也包含了菜单和按钮,不过在这里维护不太合适
 */
@CustomUi("RightRelation")
export class RightRelation<T extends PageDetailDto> extends AbstractManagedCustomPanel<T> {

    private rightRelationDetail: TableInfo;
    private toolBar: Toolbar<any>;
    private treeFrom: ReferenceTree<any>;
    private treeTo: ReferenceTree<any>;
    private mapValue: StringMap<Array<string>>;
    private lastRrid;
    //源数据树最后次的选择
    private lastIdFrom;

    protected createUI(): HTMLElement {
        let $ele = RightRelation.createFullPanel("resource-relation-detail");
        if (!this.properties.relationDs) {
            console.log("没有提供默认数据源信息");
            return $ele.get(0);
        }
        this.rightRelationDetail = SchemaFactory.getTableByTableId(this.properties.relationDs);


        return $ele.get(0);
    }

    setButtons(buttons: Array<MenuButtonDto>) {
        if (!buttons || !this.rightRelationDetail) {
            return;
        }

        let btns = ManagedUITools.findRelationButtons(buttons,
            this.rightRelationDetail.getTableDto().tableId);
        if (btns) {
            this.toolBar.addButtons(this.toButtonInfo(btns));
        }

    }

    dsSelectChanged(source: any, tableId, mapKeyAndValue, row?) {
        if (!this.isReady()) {
            return;
        }

        //这里就直接认为,传入的是关系表的内容
        UiUtils.showMask();
        this.setEditable(false);
        if (!mapKeyAndValue || $.isEmptyObject(mapKeyAndValue)) {
            this.clearTree();
            UiUtils.hideMask();
            this.lastRrid = null;
            return;
        }
        this.lastRrid = mapKeyAndValue["rr_id"];
        let rsIdFrom = row["rs_id_from"];
        let rsIdTo = row["rs_id_to"];
        this.treeFrom.getTree().deselectAll(true);
        this.treeTo.getTree().deselectAll(true);
        UserRightService.findRightResources([rsIdFrom, rsIdTo], (handleResult => {
            if (handleResult.success) {
                let rows = handleResult.data;
                for (let row of rows as any) {
                    if (row.rs_id == rsIdFrom) {
                        this.treeFrom.changeRefId(row.resource_id, () => {
                            this.treeFrom.getTree().addSelectListener({
                                handleEvent: (eventType: string, data: any, source: any, extObject?: any) => {
                                    if (data) {
                                        this.signToTree(data.id);
                                    } else {
                                        this.signToTree(null);
                                    }
                                }
                            });
                        });
                    } else {
                        this.treeTo.changeRefId(row.resource_id);
                    }
                }
                UserRightService.findRightRelationDetail(this.lastRrid, -1, (handleResult) => {
                    if (handleResult.success) {
                        this.initMapData(handleResult.data as any);
                    }
                    UiUtils.hideMask();
                });
            }
        }));

    }

    private doRefresh() {
        if (!this.lastRrid) {
            return;
        }
        this.treeFrom.getTree().getJsTree().deselect_all();
        this.treeTo.getTree().getJsTree().deselect_all();
        this.mapValue = new StringMap<Array<string>>();
        UserRightService.findRightRelationDetail(this.lastRrid, -1, (handleResult) => {
            if (handleResult.success) {
                this.initMapData(handleResult.data as any);
            }
        });

    }

    private writebackData() {
        if (!this.editable) {
            return;
        }
        if (this.lastIdFrom && this.lastRrid) {
            let lstSelectId = this.treeTo.getTree().getSelectedId(true);
            if (!lstSelectId || lstSelectId.length < 1) {
                this.mapValue.delete(this.lastIdFrom);
            }
            this.mapValue.set(this.lastIdFrom, lstSelectId);
        }
    }

    private signToTree(idFrom) {
        //先要保存上次选择变化到内存中
        this.writebackData();
        this.lastIdFrom = idFrom;
        this.treeTo.getTree().getJsTree().deselect_all();
        if (!idFrom) {
            return;
        }
        let ids = this.mapValue.get(idFrom);
        if (!ids || ids.length == 0) {
            return;
        }
        this.treeTo.getTree().selectNodeById(ids);
    }

    private initMapData(lstData: Array<any>) {
        this.mapValue = new StringMap();
        if (lstData && lstData.length > 0) {
            let idFrom, idTo;
            for (let row of lstData) {
                idFrom = row.idSource;
                idTo = row.idTarget;
                let lstTarget = this.mapValue.get(idFrom);
                if (!lstTarget) {
                    lstTarget = [];
                    this.mapValue.set(idFrom, lstTarget);
                }
                lstTarget.push(idTo);
            }

        }

    }

    doSave(): Promise<boolean> {
        if (!this.editable) {
            Alert.showMessage("当前为只读状态,没有变化需要保存");
            return new Promise<boolean>(resolve => resolve(true));
        }
        this.writebackData();
        UserService.saveRightRelationDetailsByRrId(this.lastRrid, this.mapValue.getObject(), result => {
            if (result.success) {
                Alert.showMessage("保存成功");
                return new Promise<boolean>(resolve => resolve(true));
                this.setEditable(false);
                this.manageCenter.stateChange(this, this.getTableIds()[0], Constants.TableState.view);
            }
            return new Promise<boolean>(resolve => resolve(false));
        });
    }

    checkAndSave(): Promise<boolean> {
        return this.doSave();
    }

    private clearTree() {
        this.treeTo.changeRefId(-1);
        this.treeFrom.changeRefId(-1);
    }

    afterComponentAssemble(): void {
        this.fireReadyEvent();
    }

    getTableIds(): Array<number> {
        return [this.properties.relationDs];
    }

    setEditable(editable): void {
        this.treeTo.setEnable(editable);
        super.setEditable(editable);
    }


    protected initSubControls() {
        this.toolBar = new Toolbar<any>({float: false});
        this.$element.append(this.toolBar.getViewUI());

        this.treeFrom = ReferenceTree.getTreeInstance(-1);
        this.treeTo = ReferenceTree.getTreeInstance(-1, GlobalParams.getLoginVersion(), true);
        this.$element.append(this.treeFrom.getViewUI()).append(this.treeTo.getViewUI());
        this.treeFrom.setWidth(300);
        this.treeFrom.setHeight(500);
        this.treeTo.setWidth(300);
        this.treeTo.setHeight(500);
    }

    stateChange(source: any, tableId, state: number, extendData?: any) {
        if (source === this) {
            return;
        }
        if (state === Constants.DsOperatorType.edit) {
            this.doRefresh();
            this.setEditable(false);
            this.treeFrom.setEditable(false);
        } else {
            this.treeFrom.setEditable(true);
        }
    }

    protected componentButtonClicked(event: JQuery.ClickEvent<any, any, any, any>, menuBtnDto: MenuButtonDto, data) {
        if (menuBtnDto.tableOpertype === Constants.DsOperatorType.cancel) {
            if (this.editable) {
                this.doRefresh();
            }
            this.setEditable(false);
            this.manageCenter.stateChange(this, this.getTableIds()[0], Constants.TableState.view);
        } else if (menuBtnDto.tableOpertype === Constants.DsOperatorType.edit) {
            if (this.editable) {
                return;
            }
            this.setEditable(true);
            this.manageCenter.stateChange(this, this.getTableIds()[0], Constants.TableState.edit);
        } else if (menuBtnDto.tableOpertype === Constants.DsOperatorType.saveSingle
            || menuBtnDto.tableOpertype === Constants.DsOperatorType.saveMulti) {
            if (!this.editable) {
                Alert.showMessage("没有需要保存的变化");
                return;
            }
            this.doSave();

        }
    }
}
