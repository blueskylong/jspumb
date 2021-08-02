import {AutoManagedUI, IManageCenter} from "../../blockui/managedView/AutoManagedUI";
import {MenuButtonDto} from "../menu/dto/MenuButtonDto";
import {PageDetailDto} from "../../funcdesign/dto/PageDetailDto";
import {CustomUi} from "../../decorator/decorator";
import {UiService} from "../../blockui/service/UiService";
import {HandleResult} from "../../common/HandleResult";
import {ReferenceTree} from "../../blockui/JsTree/ReferenceTree";
import "./templates/user.css";
import {GlobalParams} from "../../common/GlobalParams";
import {Toolbar} from "../../uidesign/view/JQueryComponent/Toolbar";
import {ManagedUITools} from "../../blockui/managedView/ManagedUITools";
import {BaseComponent} from "../../uidesign/view/BaseComponent";
import {Alert} from "../../uidesign/view/JQueryComponent/Alert";
import {CommonUtils} from "../../common/CommonUtils";
import {UserService} from "./service/UserService";
import {StringMap} from "../../common/StringMap";
import {Constants} from "../../common/Constants";
import {MenuAndButton} from "../right/MenuAndButton";
import {SchemaFactory} from "../../datamodel/SchemaFactory";
import {DmConstants} from "../../datamodel/DmConstants";
import {Dialog} from "../../blockui/Dialog";
import {UiUtils} from "../../common/UiUtils";

@CustomUi("UserToResource")
export class UserToResource<T extends PageDetailDto> extends BaseComponent<T> implements AutoManagedUI {

    /**
     * 菜单和按钮 资源单独处理
     */
    private menuBtn: MenuAndButton<any>;
    private lstTree = new Array<ReferenceTree<any>>();
    private mapTree = new StringMap<ReferenceTree<any>>();
    private lstResource: Array<object>;
    private toolBar: Toolbar<any>;
    private manageCenter: IManageCenter;
    private userId: number;
    private state: number;
    private readyCount = 0;
    private treeCount = 0;

    /**
     * 资源ID
     */
        // static USER_TO_RESOURCE_DS_ID = 4996398596377088;
    static USER_TO_RESOURCE_TABLE = "aolie_s_user_right";
    // static USER_DS_ID = 4958233176623708;
    static USER_TABLE = "aolie_s_user";
    // static RESOURCE_DS_ID = 4992135365380608;
    static RESOURCE_TABLE = "aolie_s_right_resource";

    attrChanged(source: any, tableId: number, mapKeyAndValue: object, field: string, value: any) {
    }

    btnClicked(source: any, buttonInfo: MenuButtonDto, data): boolean {
        return false;
    }

    dataChanged(source: any, tableId, mapKeyAndValue: object, changeType) {
    }

    dsSelectChanged(source: any, tableId, mapKeyAndValue, row?) {
        this.clearSelection();
        if (mapKeyAndValue) {
            this.userId = mapKeyAndValue["user_id"];
            this.signTrees(this.userId);
        } else {
            this.userId = null;
        }
        this.state = Constants.UIState.view;
        this.setEditable(false);
    }

    private initSelection(userId) {
        if (!userId) {
            return;
        }
        UiUtils.showMask();

    }

    private clearSelection() {
        if (this.lstTree && this.lstTree.length > 0) {
            for (let tree of this.lstTree) {
                tree.getTree().deselectAll();
            }
        }
        this.menuBtn.clearSelection();
    }

    getPageDetail(): PageDetailDto {
        return this.properties;
    }

    getTableIds(): Array<number> {
        return [SchemaFactory.getTableByTableName(UserToResource.USER_TABLE,
            DmConstants.DefaultSchemaIDs.DEFAULT_SYS_SCHEMA).getTableDto().tableId];
    }

    getUiDataNum(): number {
        return 1;
    }

    referenceSelectChanged(source: any, refId, id, isLeaf) {
    }

    checkAndSave(): Promise<boolean> {
        return this.doSave();
    }

    setButtons(buttons: Array<MenuButtonDto>) {
        if (!buttons) {
            return;
        }
        let btns = ManagedUITools.findRelationButtons(buttons,
            SchemaFactory.getTableByTableName(UserToResource.USER_TO_RESOURCE_TABLE,
                DmConstants.DefaultSchemaIDs.DEFAULT_SYS_SCHEMA).getTableDto().tableId);
        if (btns) {
            this.toolBar.addButtons(this.toButtonInfo(btns));
        }

    }

    protected componentButtonClicked(event: JQuery.ClickEvent<any, any, any, any>, menuBtnDto: MenuButtonDto, data) {
        if (menuBtnDto.tableOpertype == Constants.DsOperatorType.saveSingle
            || menuBtnDto.tableOpertype == Constants.DsOperatorType.saveMulti) {
            this.doSave();
        } else if (menuBtnDto.tableOpertype == Constants.DsOperatorType.edit) {
            this.doEdit()
        } else if (menuBtnDto.tableOpertype == Constants.DsOperatorType.cancel) {
            this.doCancel();
        }
    }

    private doDisableUser(userId, userName, state) {
        if (CommonUtils.isEmpty(state) || state == Constants.UserState.normal) {
            Dialog.showConfirm("确定要禁用用户[" + userName + "]吗?", () => {
                UserService.disableUser(userId, (result) => {
                    if (result.success) {
                        Alert.showMessage("禁用完成");
                    }
                })
            });
        } else {
            Alert.showMessage("用户已禁用,不需要操作");
        }

    }

    private doCancel() {
        if (this.state === Constants.UIState.view) {
            return;
        }
        this.state = Constants.UIState.view;
        this.setEditable(false);
        if (this.userId) {
            this.signTrees(this.userId);
        }
    }

    private doEdit() {
        if (this.state === Constants.UIState.edit) {
            return;
        }
        if (!this.userId) {
            Alert.showMessage("请选择用户后修改");
            return;
        }
        this.state = Constants.UIState.edit;
        this.setEditable(true);
    }

    private doSave(): Promise<boolean> {
        if(!this.editable){
            return new Promise(resolve => resolve(true));
        }
        if (!this.userId) {
            Alert.showMessage("没有需要保存的变动");
            return new Promise<boolean>(resolve => {
                resolve(true);
            });
        }
        let result = {};

        this.mapTree.forEach((key, tree, map) => {
            let selectIds = tree.getTree().getSelectedId(true);
            if (selectIds && selectIds.length > 0) {
                result[key] = selectIds;
            }
        });
        $.extend(result, this.menuBtn.getValue());
        UserService.saveUserRight(this.userId, result, (result2) => {
            if (result2.success) {
                Alert.showMessage("保存成功!");
                return new Promise<boolean>(resolve => {
                    resolve(true);
                });
            } else {
                Alert.showMessage(result2.err);
                return new Promise<boolean>(resolve => {
                    resolve(false);
                });
            }
        });
    }

    setManageCenter(manageCenter: IManageCenter) {
        this.manageCenter = manageCenter;
    }

    stateChange(source: any, tableId, state: number, extendData?: any) {
    }

    protected createUI(): HTMLElement {
        return $("<div class='user-resource' style='width: 100%;height: 100%'></div>").get(0);
    }

    setEditable(editable: boolean) {
        if (this.lstTree) {
            for (let tree of this.lstTree) {
                tree.setEnable(editable);
            }
        }
        this.menuBtn.setEditable(editable);
    }

    protected initSubControls() {
        this.toolBar = new Toolbar<any>({float: false});
        this.$element.append(this.toolBar.getViewUI());
        //TODO 查询表数据,并显示
        UiService.findTableRows(SchemaFactory.getTableByTableName(UserToResource.RESOURCE_TABLE,
            DmConstants.DefaultSchemaIDs.DEFAULT_SYS_SCHEMA).getTableDto().tableId, {}, (result: HandleResult) => {
            this.initTree(<Array<any>>result.data);
        });
    }

    private initTree(lstData: Array<any>) {
        this.menuBtn = new MenuAndButton<any>({});
        this.menuBtn.addReadyListener(() => {
            this.fireReadyEvent();
            this.menuBtn.setEditable(this.properties.initState != Constants.UIState.view);
        });
        this.$element.append(this.menuBtn.getViewUI());
        this.lstResource = lstData;
        if (!lstData) {
            this.ready = true;
            this.fireReadyEvent();
            return;
        }
        this.treeCount = lstData.length;
        for (let row of lstData) {
            //过滤菜单和按钮资源
            let resourceId = row.rs_id;
            if (resourceId == DmConstants.DefaultRsIds.menu || resourceId == DmConstants.DefaultRsIds.menuButton) {
                continue;
            }
            let refTree = ReferenceTree.getTreeInstance(row.resource_id, GlobalParams.loginVersion, true);
            this.$element.append(refTree.getViewUI());
            refTree.reload();
            refTree.setWidth(300);
            refTree.setHeight(500);
            refTree.addReadyListener(() => {
                refTree.setEnable(this.properties.initState != Constants.UIState.view);
                this.readyCount++;
                if (this.readyCount === this.treeCount) {
                    this.ready = true;
                    this.fireReadyEvent();
                }
            });
            this.lstTree.push(refTree);
            this.mapTree.set(row['rs_id'], refTree);
        }
    }

    private signTrees(userId) {
        UserService.getUserRights(userId, (result: HandleResult) => {
            if (result.success) {
                let mapData = result.data;
                let btnIds: StringMap<any>, menuIds: StringMap<any>;
                if (mapData) {
                    for (let rsId in mapData) {
                        if (rsId == DmConstants.DefaultRsIds.menuButton.toString()) {
                            btnIds = this.getIdMap(mapData[rsId]);
                        } else if (rsId == DmConstants.DefaultRsIds.menu.toString()) {
                            menuIds = this.getIdMap(mapData[rsId]);
                        } else {
                            this.mapTree.get(rsId).getTree().selectNodeById(this.getIdArray(mapData[rsId]));
                        }
                    }
                    this.menuBtn.signTreeById(btnIds, menuIds);
                }
            }
        });
    }

    private getIdArray(lstData: Array<object>) {
        let result = new Array<any>();
        for (let row of lstData) {
            result.push(row["rs_detail_id"])
        }
        return result;
    }

    private getIdMap(lstData: Array<object>) {
        let result = new StringMap<any>();
        for (let row of lstData) {
            result.set(row["rs_detail_id"], null);
        }
        return result;
    }


    private signOneTree(tree: ReferenceTree<any>, ids: Array<any>) {
        tree.getTree().selectNodeById(ids);
    }

    getValue(): any {
    }

    setValue(value: any, extendData?) {
    }

    reload(): void {
        this.lstTree.forEach((tree, index) => {
            tree.reload();
        })
    }

    destroy(): boolean {
        this.lstTree = null;
        this.mapTree.clear();
        this.lstResource = null;
        this.toolBar.destroy();
        this.manageCenter = null;
        return super.destroy();
    }

}

