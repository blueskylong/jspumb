import {PageDetailDto} from "../../funcdesign/dto/PageDetailDto";
import {MenuButtonDto} from "../menu/dto/MenuButtonDto";
import {MenuAndButton} from "./MenuAndButton";
import {Toolbar} from "../../uidesign/view/JQueryComponent/Toolbar";
import {ManagedUITools} from "../../blockui/managedView/ManagedUITools";
import {SchemaFactory} from "../../datamodel/SchemaFactory";
import {DmConstants} from "../../datamodel/DmConstants";
import TableDto from "../../datamodel/dto/TableDto";
import {UiService} from "../../blockui/service/UiService";
import {HandleResult} from "../../common/HandleResult";
import {ReferenceTree} from "../../blockui/JsTree/ReferenceTree";
import {GlobalParams} from "../../common/GlobalParams";
import {StringMap} from "../../common/StringMap";
import {CustomUi} from "../../decorator/decorator";
import {Alert} from "../../uidesign/view/JQueryComponent/Alert";
import {Constants} from "../../common/Constants";
import {UserService} from "../user/service/UserService";
import {UserRightService} from "./service/UserRightService";
import {CommonUtils} from "../../common/CommonUtils";
import {AbstractManagedCustomPanel} from "../../blockui/managedView/AbstractManagedCustomPanel";
import {UiUtils} from "../../common/UiUtils";

/**
 * 角色授权下方的相关的权限资源,必须是对对应关系的
 */
@CustomUi("RoleToResource")
export class RoleToResource<T extends PageDetailDto> extends AbstractManagedCustomPanel<T> {
    public static RIGHT_RELATION_TABLE = "aolie_s_right_relation_detail";

    static RESOURCE_DS_ID_TABLE = "aolie_s_right_resource";

    private menuBtn: MenuAndButton<any>;
    private toolBar: Toolbar<any>;
    private rightRelationTable: TableDto;
    private lstTree = new Array<ReferenceTree<any>>();
    private mapTree = new StringMap<ReferenceTree<any>>();
    private lastRoleId;

    protected initSubControls() {
        this.toolBar = new Toolbar<any>({float: false});
        this.$element.append(this.toolBar.getViewUI());
        this.menuBtn = new MenuAndButton<any>({});
        this.menuBtn.addReadyListener(() => {
            this.fireReadyEvent();
            this.menuBtn.setEditable(this.properties.initState != Constants.UIState.view);
        });
        this.$element.append(this.menuBtn.getViewUI());
        this.rightRelationTable = SchemaFactory.getTableByTableName(RoleToResource.RIGHT_RELATION_TABLE,
            DmConstants.DefaultSchemaIDs.DEFAULT_SYS_SCHEMA)
            .getTableDto();
        let resourceTable = SchemaFactory.getTableByTableName(RoleToResource.RESOURCE_DS_ID_TABLE,
            DmConstants.DefaultSchemaIDs.DEFAULT_SYS_SCHEMA)
            .getTableDto();

        UiService.findRoleRightOtherRelation((result: HandleResult) => {
            this.initTree(<Array<any>>result.data);
        });
    }

    setEditable(editable: boolean) {
        if (this.manageCenter) {
            this.manageCenter.stateChange(this, this.getTableIds()[0],
                editable ? Constants.TableState.edit : Constants.TableState.view);
        }
        this.menuBtn.setEditable(editable);
        if (this.lstTree) {
            for (let tree of this.lstTree) {
                tree.setEditable(editable);
            }
        }
        super.setEditable(editable);
    }


    private initTree(lstData: Array<any>) {
        if (!lstData) {
            return;
        }
        for (let row of lstData) {
            let rsId = row["rs_id"];
            let refTree = ReferenceTree.getTreeInstance(row.resource_id, GlobalParams.loginVersion, true);
            this.$element.append(refTree.getViewUI());
            refTree.reload();
            refTree.setWidth(300);
            refTree.setHeight(500);
            refTree.addReadyListener(() => {
                refTree.setEditable(this.properties.initState != Constants.UIState.view);
            });
            this.lstTree.push(refTree);
            this.mapTree.set(row['rs_id'], refTree);
        }
    }

    protected createUI(): HTMLElement {

        let $ele = RoleToResource.createFullPanel("role-to-resource");

        //初始化其它的资源

        return $ele.get(0);
    }


    dsSelectChanged(source: any, tableId, mapKeyAndValue, row?) {
        this.lastRoleId = row["role_id"];
        this.initSelection(this.lastRoleId);
    }

    private initSelection(roleId) {
        try {
            UiUtils.showMask();
            this.menuBtn.setRole(roleId);
            if (this.lstTree && this.lstTree.length > 0) {
                this.mapTree.forEach((key, tree, map) => {
                    UserRightService.findRsDetail(DmConstants.DefaultRsIds.role,
                        key, this.lastRoleId, (result) => {
                            this.signTree(tree, result.data);
                        });
                });
            }
        } finally {
            UiUtils.hideMask();
        }
    }

    private signTree(tree: ReferenceTree<any>, data) {
        let keys = [];
        if (data && data.length > 0) {
            for (let row of data) {
                keys.push(row["idTarget"]);
            }
        }
        tree.getTree().selectNodeById(keys);
    }


    getTableIds(): Array<number> {
        return [this.rightRelationTable.tableId];
    }

    referenceSelectChanged(source: any, refId, id, isLeaf) {
        Alert.showMessage("cc");
    }

    setButtons(buttons: Array<MenuButtonDto>) {
        if (!buttons) {
            return;
        }
        let btns = ManagedUITools.findRelationButtons(buttons,
            this.rightRelationTable.tableId);
        if (btns) {
            this.toolBar.addButtons(this.toButtonInfo(btns));
        }

    }

    protected componentButtonClicked(event: JQuery.ClickEvent<any, any, any, any>, menuBtnDto: MenuButtonDto, data) {
        //编辑
        if (menuBtnDto.tableOpertype === Constants.DsOperatorType.edit) {
            if (this.editable) {
                return;
            }
            this.setEditable(true);

        } else if (menuBtnDto.tableOpertype === Constants.DsOperatorType.cancel) {
            if (!this.editable) {
                return;
            }
            //取消
            this.initSelection(this.lastRoleId);
            this.setEditable(false);

        } else if (menuBtnDto.tableOpertype === Constants.DsOperatorType.saveMulti ||
            menuBtnDto.tableOpertype === Constants.DsOperatorType.saveSingle) {
            if (!this.editable) {
                return;
            }
            if (!this.lastRoleId) {
                return;
            }
            this.doSave();
        }
    }

    private setTreeEnable(enable) {
        if (this.lstTree) {
            for (let tree of this.lstTree) {
                tree.setEnable(enable);
            }
        }
    }

    checkAndSave(): Promise<boolean> {
        return this.doSave();
    }

    doSave(): Promise<boolean> {
        if (!this.editable) {
            return new Promise<boolean>(resolve => resolve(true));
        }
        let data = this.menuBtn.getValue();
        this.mapTree.forEach((key, tree, map) => {
            data[key] = tree.getTree().getSelectedId(true);
        });
        UserService.saveRightRelationDetails(DmConstants.DefaultRsIds.role, this.lastRoleId, data, (result => {
            if (result.success) {
                Alert.showMessage("保存成功");
                this.setEditable(false);
            } else {
                Alert.showMessage("保存失败:" + result.err);
            }
        }));
    }


}
