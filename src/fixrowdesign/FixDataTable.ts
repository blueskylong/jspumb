import {AutoManagedUI, IManageCenter} from "../blockui/managedView/AutoManagedUI";
import {PageDetailDto} from "../funcdesign/dto/PageDetailDto";
import {MenuButtonDto} from "../sysfunc/menu/dto/MenuButtonDto";
import {BaseAutoManagedUI} from "../blockui/managedView/BaseAutoManagedUI";
import {Table} from "../blockui/table/Table";
import {SchemaFactory} from "../datamodel/SchemaFactory";
import {LocalRenderProvider} from "../blockui/table/TableRenderProvider";
import {FixRowService} from "./service/FixRowService";
import {BeanFactory, CustomUi} from "../decorator/decorator";
import {BlockViewer} from "../blockui/uiruntime/BlockViewer";
import {ManagedUITools} from "../blockui/managedView/ManagedUITools";
import {Constants} from "../common/Constants";
import {ManagedTable} from "../blockui/managedView/ManagedTable";
import {UiUtils} from "../common/UiUtils";
import {CodeLevelProvider} from "../common/CodeLevelProvider";
import {TreeUI} from "../blockui/JsTree/TreeUI";
import {BlockViewDto} from "../uidesign/dto/BlockViewDto";
import {BorderLayout, BorderLayoutProperty} from "../blockui/layout/BorderLayout";
import BaseUI from "../uidesign/view/BaseUI";
import {DataDialogInfo, DataDlg} from "./dlg/DataDlg";
import {CommonUtils} from "../common/CommonUtils";
import {Alert} from "../uidesign/view/JQueryComponent/Alert";
import ClickEvent = JQuery.ClickEvent;
import {DmConstants} from "../datamodel/DmConstants";
import {DesignUiService} from "../uidesign/service/DesignUiService";
import {StringMap} from "../common/StringMap";
import {GlobalParams} from "../common/GlobalParams";

@CustomUi("FixDataTable")
export class FixDataTable<T extends PageDetailDto> extends BaseAutoManagedUI<T> {
    private table: Table;
    private tableBody: TableBodyPanel;
    private lstUseBtn = new Array<MenuButtonDto>();
    private lstToolBtn = new Array<MenuButtonDto>();
    private manageCenter: IManageCenter;

    private viewer: BlockViewer;
    private tree: TreeUI<BlockViewDto>;
    private fixId: number;
    private lvlProvider: CodeLevelProvider = CodeLevelProvider.getDefaultCodePro();
    private layout: BorderLayout<BorderLayoutProperty>;

    private masterDsId = null;


    protected componentButtonClicked(event: ClickEvent, menuBtnDto: MenuButtonDto, data) {

        let operType = menuBtnDto.tableOpertype;
        //如果存在扩展处理程序的,优先执行
        if (!this.enabled) {
            return;
        }
        if (operType === Constants.DsOperatorType.add) {
            this.doAdd();
        } else if (operType === Constants.DsOperatorType.delete) {
            this.table.removeRow(data);
            this.tree.setValue(this.table.getData());
        } else if (
            operType === Constants.DsOperatorType.view) {
            this.doView(data);
        } else if (operType === Constants.DsOperatorType.edit) {
            this.doEdit(data);
            this.tree.setValue(this.table.getData());
        }
    }


    btnClicked(source: any, buttonInfo: MenuButtonDto, data): boolean {
        if (buttonInfo.relationTableid === this.properties.relationDs
            && buttonInfo.tableOpertype === Constants.DsOperatorType.saveMulti) {
            FixRowService.saveFixData(this.fixId,
                this.table.getData(true), (result) => {
                    if (result.success) {
                        Alert.showMessage("保存成功");
                        this.updateTableData();
                    } else {
                        Alert.showMessage({message: result.message, type: Alert.type.danger})
                    }
                })
        } else if (buttonInfo.relationTableid === this.properties.relationDs
            && buttonInfo.tableOpertype === Constants.DsOperatorType.custom1) {
            //转换成更新编码
            this.updateLvlByTree();
        }
        return false;
    }

    private getMasterDsId() {
        if (this.masterDsId != null) {
            return this.masterDsId;
        }
        let parentDs = SchemaFactory.getSchema(DmConstants.DefaultSchemaIDs.DEFAULT_DM_SCHEMA, GlobalParams.getLoginVersion())
            .findMasterDsId(this.properties.relationDs);
        if (!parentDs || parentDs.length === 0) {
            throw new Error("没有指定父级数据源");
        }
        this.masterDsId = parentDs[0];
        return this.masterDsId;

    }

    protected initSubControls() {
        let borderLayoutProperty = BorderLayoutProperty.genDefaultFullProperty();
        borderLayoutProperty.westWidth = 0.3;
        borderLayoutProperty.centerWidth = 0.7;
        borderLayoutProperty.eastWidth = 0;
        this.layout = new BorderLayout<BorderLayoutProperty>(borderLayoutProperty);

        let param = JSON.parse(this.properties.customParam);
        this.tree = TreeUI.getTreeInstance(param["treeUIId"]);

        //
        this.layout.addComponent(BorderLayout.west, this.tree);

        this.tableBody = new TableBodyPanel({});
        this.layout.addComponent(BorderLayout.center, this.tableBody);
        this.$element.append(this.layout.getViewUI());
        this.layout.show();

    }

    protected initEvent() {
        this.tree.addSelectionListener({
            handleEvent: (eventType: string, data: any, source: any, extObject?: any) => {
                if (data && data["data_id"]) {
                    this.table.locateRow("data_id", data["data_id"]);
                } else {
                    this.table.clearSelection();
                }
            }
        });
    }

    private findNextSub(parentCode: string): string {
        let lstData = this.table.getData();
        this.lvlProvider.setCurCode("000");
        let maxCode = "";
        let lvlCode;
        let len = parentCode.length + 3;
        for (let row of lstData) {
            lvlCode = row[DmConstants.ConstField.lvlCode];
            if (lvlCode && lvlCode.length === len && lvlCode.indexOf(parentCode) === 0 && lvlCode > maxCode) {
                maxCode = lvlCode;
            }
        }
        if (maxCode) {
            this.lvlProvider.setCurCode(maxCode);
            return this.lvlProvider.getNext();
        } else {
            this.lvlProvider.setCurCode(parentCode);
            return this.lvlProvider.getSubNext();
        }


    }

    private findMaxFirstLevel(): string {
        let lstData = this.table.getData();
        this.lvlProvider.setCurCode("000");
        let maxCode = "";
        let lvlCode;
        if (lstData) {
            for (let row of lstData) {
                lvlCode = row[DmConstants.ConstField.lvlCode];
                if (lvlCode && lvlCode.length === 3 && lvlCode > maxCode) {
                    maxCode = lvlCode;
                }
            }
            if (maxCode) {
                this.lvlProvider.setCurCode(maxCode);
                return this.lvlProvider.getNext();
            }
        }
        return this.lvlProvider.getNext();
    }

    protected doAdd() {
        let row = this.table.getCurrentRow();
        let newRow = {"data_id": CommonUtils.genId()};
        if (row) {
            newRow[DmConstants.ConstField.lvlCode] = this.findNextSub(row[DmConstants.ConstField.lvlCode]);
        } else {
            newRow[DmConstants.ConstField.lvlCode] = this.findMaxFirstLevel();
        }
        let dlgInfo: DataDialogInfo =
            {
                initValue: newRow,
                title: "增加",
                viewer: this.viewer,

                operType: Constants.DsOperatorType.add,
                callback: (result, rowData) => {
                    let row = this.table.getCurrentRow();
                    if (row) {
                        this.table.addRow(rowData, CommonUtils.genUUID(), "afterSelected");
                    } else {
                        this.table.addRow(rowData);
                    }
                    this.resetTree();
                    return true;
                }
            };

        new DataDlg(dlgInfo).show();
    }

    private resetTree() {
        this.tree.setValue(this.table.getData());
    }

    protected doEdit(row) {
        console.log("rowid更新前:" + row[Table.ID_FIELD]);
        let dlgInfo: DataDialogInfo =
            {
                initValue: row,
                title: "修改",
                viewer: this.viewer,
                operType: Constants.DsOperatorType.edit,
                callback: (result, data) => {
                    this.table.setRowData(row[Table.ID_FIELD], data);
                    return true;
                }
            };

        new DataDlg(dlgInfo).show();
    }

    protected doView(data) {
        let dlgInfo: DataDialogInfo =
            {
                initValue: data,
                title: "查看",
                viewer: this.viewer,
                operType: Constants.DsOperatorType.view,
                callback: (result, rowId) => {
                    return true;
                }
            };

        new DataDlg(dlgInfo).show();
    }

    checkAndSave(): Promise<boolean> {
        return undefined;
    }

    protected createUI(): HTMLElement {
        return $(require("./template/FixMainUI.html")).get(0);
    }

    dataChanged(source: any, tableId, mapKeyAndValue: object, changeType, rowData?: object) {
    }

    afterComponentAssemble(): void {
        super.afterComponentAssemble();
        this.fireReadyEvent();
        this.tree.addReadyListener(() => {
            this.tree.getTree().setDraggable(true);
            this.tree.getTree().addDropListener({
                handleEvent: (eventType: string, data: any, source: any, extObject?: any) => {
                    this.updateLvlByTree();
                }
            });
        });

    }

    private updateLvlByTree() {
        let oraData = this.tree.getTree().getJsTree().get_json(null, {flat: false});
        let mapLvl = new StringMap<string>();
        if (oraData && oraData.length > 0) {
            let idToCode = {};
            let provider = new CodeLevelProvider();
            let data = oraData[0].children;
            for (let row of data) {
                this.makeLevel(provider, row, idToCode);
            }
            let lstRowData = this.table.getData();
            for (let row of lstRowData) {
                row[DmConstants.ConstField.lvlCode] = idToCode[row["data_id"]];
            }
            lstRowData.sort((row1, row2) => {
                if (row1[DmConstants.ConstField.lvlCode] > row2[DmConstants.ConstField.lvlCode]) {
                    return 1;
                } else if (row1[DmConstants.ConstField.lvlCode] === row2[DmConstants.ConstField.lvlCode]) {
                    return 0;
                } else {
                    return -1
                }
            });
            this.table.setData(lstRowData);
        }
        return true;
    }

    private makeLevel(codePro: CodeLevelProvider, node, obj) {

        let curCode = codePro.getNext();
        obj[node.data.data_id] = curCode;

        if (node.children && node.children.length > 0) {
            codePro.goSub();
            for (let subNode of node.children) {
                this.makeLevel(codePro, subNode, obj);
            }
            codePro.setCurCode(curCode);
        }
    }

    dsSelectChanged(source: any, tableId, mapKeyAndValue, row?) {
        if (source === this) {
            return;
        }
        if (tableId === this.properties.relationDs) {
            if (this.table && row) {
                this.table.locateRow("lvl_code", row["lvl_code"]);
            }
            return;
        }
        if (row && SchemaFactory.isChildAndAncestor(this.properties.relationDs, tableId)) {
            //如果选择的是父级
            this.updateTable(row["fix_id"]);
            this.fixId = row["fix_id"];
        }
    }

    private clearSearchOption(viewer: BlockViewer) {
        let allComponentDto = viewer.getAllComponentDto();
        allComponentDto.forEach(compDto => {
            compDto.showSearch = 0;
        })
    }

    private updateTable(fixId) {
        if (this.table) {
            this.table.destroy();
        }
        FixRowService.findFixRowComponents(fixId, (result) => {
            this.viewer = BeanFactory.populateBean(BlockViewer, result.data);
            // this.clearSearchOption(this.viewer);
            this.table = new Table(new LocalRenderProvider(this.viewer));
            this.tableBody.setTable(this.table.getViewUI());
            UiUtils.addAutoHeightFit(this.table.getViewUI());
            this.table.addReadyListener(() => {
                if (this.lstUseBtn.length > 0) {
                    this.table.setColOperatorButtons(this.toButtonInfo(this.lstUseBtn));
                }
                if (this.lstToolBtn.length > 0) {
                    this.table.setToolbarButton(this.toButtonInfo(this.lstToolBtn));
                }
                this.updateTableData();

                this.table.addListener(Constants.GeneralEventType.EVENT_DBL_CLICK, {
                    handleEvent: (eventType: string, data: any, source: any, extObject?: any) => {
                        if (this.hasBtn(Constants.DsOperatorType.edit)) {
                            this.doEdit(data);
                            return;
                        }
                        if (this.hasBtn(Constants.DsOperatorType.view)) {

                            this.doView(data);
                            return;
                        }

                    }
                });
            })
        })

    }

    /**
     * 是否存在指定按钮
     * @param btnType
     */
    private hasBtn(btnType) {
        if (this.lstToolBtn) {
            for (let btn of this.lstToolBtn) {
                if (btn.tableOpertype === btnType) {
                    return true;
                }
            }
        }
        if (this.lstUseBtn) {
            for (let btn of this.lstUseBtn) {
                if (btn.tableOpertype === btnType) {
                    return true;
                }
            }
        }
        return false;
    }

    private updateTableData() {
        FixRowService.findFixData(this.fixId, (result) => {
            this.table.setData(result.data);
            this.tree.setValue(result.data);
        })
    }

    getPageDetail(): PageDetailDto {
        return this.properties;
    }

    getTableIds(): Array<number> {
        return [this.properties.relationDs];
    }

    getUiDataNum(): number {
        return 2;
    }

    referenceSelectChanged(source: any, refId, id, isLeaf) {
    }

    reload(): void {
    }

    setButtons(buttons: Array<MenuButtonDto>) {
        let btns = ManagedUITools.findRelationButtons(buttons, this.properties.relationDs, false);
        if (!btns || btns.length == 0) {
            return;
        }
        this.lstUseBtn = new Array<MenuButtonDto>();
        this.lstToolBtn = new Array<MenuButtonDto>();
        //这里可以做得更好点,在表格的按钮区显示"增加"这一类的统一按钮
        for (let btn of btns) {
            //这里是控件要求
            if (btn.tableOpertype === Constants.DsOperatorType.delete
                || btn.tableOpertype === Constants.DsOperatorType.edit
                || ManagedTable.mapEventHandler.has(btn.tableOpertype)) {
                btn.isUsed = true;
                this.lstUseBtn.push(btn);
            } else if (btn.tableOpertype === Constants.DsOperatorType.add ||
                btn.forOne) {
                btn.isUsed = true;
                this.lstToolBtn.push(btn);
            }
        }
    }

    setEditable(editable): void {
    }

    setManageCenter(manageCenter: IManageCenter) {
        this.manageCenter = manageCenter;
    }

    stateChange(source: any, tableId, state: number, extendData?: any) {
    }

}

export class TableBodyPanel extends BaseUI<any> {
    protected createUI(): HTMLElement {
        return TableBodyPanel.createFullPanel("table-body-panel").get(0);
    }

    setTable(element) {
        this.$element.children().remove();
        this.$element.append(element);
    }

}
