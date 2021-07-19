/**
 * 此表单只响应列表或树选中情况下的显示
 * 表单只响应本级数据源的变化
 */
import {Table} from "../table/Table";
import {AutoManagedUI, EventInterceptor, IEventHandler, IManageCenter} from "./AutoManagedUI";
import {StringMap} from "../../common/StringMap";
import {Column} from "../../datamodel/DmRuntime/Column";
import {Constants} from "../../common/Constants";
import {ManagedUITools} from "./ManagedUITools";
import {TableRenderProvider} from "../table/TableRenderProvider";
import {PageDetailDto} from "../../funcdesign/dto/PageDetailDto";
import {MenuButtonDto} from "../../sysfunc/menu/dto/MenuButtonDto";
import {CommonUtils} from "../../common/CommonUtils";
import {ManagedDialogInfo, ManagedDlg} from "./ManagedDlg";
import {Dialog} from "../Dialog";
import {UiService} from "../service/UiService";
import {SchemaFactory} from "../../datamodel/SchemaFactory";
import {HandleResult} from "../../common/HandleResult";
import {GeneralEventListener} from "../event/GeneralEventListener";
import {Alert} from "../../uidesign/view/JQueryComponent/Alert";
import ClickEvent = JQuery.ClickEvent;
import ColumnModel = FreeJqGrid.ColumnModel;
import {BlockViewer} from "../uiruntime/BlockViewer";
import htmlString = JQuery.htmlString;
import {DmConstants} from "../../datamodel/DmConstants";


export class ManagedTable extends Table implements AutoManagedUI {
    protected dsIds = new Array<any>();
    protected refCols = new StringMap<Array<Column>>();
    protected manageCenter: IManageCenter;
    protected pageDetail: PageDetailDto;
    protected extFilter = {};
    protected extFilterTemp = {};
    private lstUseBtn = new Array<MenuButtonDto>();
    private lstToolBtn = new Array<MenuButtonDto>();
    //记录不可为空的
    private lstCantNullMasterFields: Array<string>;
    /**
     * 额外按钮事件处理插件
     */
    private static mapEventHandler = new StringMap<IEventHandler>();
    /**
     * 额外表格完成时执行机会
     */
    private static lstGlobalReadyListener: Array<(table: ManagedTable) => void> = [];
    /**
     *额外列处理
     */
    private static lstExtColProvider: Array<(blockInfo: BlockViewer) => Array<ColumnModel>> = [];
    protected mapInterceptor: StringMap<Array<EventInterceptor>> = new StringMap<Array<EventInterceptor>>();

    private firstReady = false;

    static getManagedInstance(renderPro: TableRenderProvider, pageDetail: PageDetailDto) {
        let table = new ManagedTable(renderPro);
        table.pageDetail = pageDetail;
        table.addReadyListener(() => {
            if (!table.firstReady) {
                table.firstReady = true;
                for (let callback of ManagedTable.lstGlobalReadyListener) {
                    callback(table);
                }
            }
            if (table.getPageDetail() && table.getPageDetail().loadOnshow) {
                table.reload();
            }
            //分析数据源信息
            ManagedUITools.initReferAndDsId(table.properties.getBlockInfo().getLstComponent(), table.dsIds, table.refCols);
            table.addSelectChangeListener({
                handleEvent: (eventType: string, row: object, table: ManagedTable, extObject?: any) => {
                    if (!table.manageCenter || table.dsIds.length != 1) {//只有单一数据源时,才做处理
                        return;
                    }
                    table.manageCenter.dsSelectChanged(table, table.dsIds[0], ManagedUITools.getDsKeyValue(table.dsIds[0], row), row);
                }
            });
            table.addDblClickLister({
                handleEvent: (eventType: string, data: any, source: any, extObject?: any) => {
                    if (!table.enabled) {
                        return;
                    }
                    if (table.hasBtn(Constants.DsOperatorType.edit)) {
                        if (!table.doPreButtonClick(Constants.DsOperatorType.edit, data)) {
                            return;
                        }
                        table.doView(true, data);
                        return;
                    }
                    if (table.hasBtn(Constants.DsOperatorType.view)) {
                        if (!table.doPreButtonClick(Constants.DsOperatorType.view, data)) {
                            return;
                        }
                        table.doView(false, data);
                        return;
                    }

                }
            });

        });
        return table;
    }

    getPageDetail(): PageDetailDto {
        return this.pageDetail;
    }

    /**
     * 同源数据变化时的响应，
     * 考虑到在编辑阶段，没有保存的情况下一起变化，无法取消，所以改到数据整体变化里再更新
     * @param source
     * @param tableId
     * @param mapKeyAndValue
     * @param field
     * @param value
     */
    attrChanged(source: any, tableId, mapKeyAndValue, field, value) {
        // if (source == this) {
        //     return;
        // }
        // //如果和源数据源有1对1的关系 ,则也需要刷新
        // //这里简化,只处理本数据源且是同一行时更新自己
        // let rowId = ManagedUITools.findRow(tableId, mapKeyAndValue, this.getData() as any, Table.ID_FIELD) as any;
        // if (rowId) {
        //     let row = this.getRowData(rowId);
        //     row[field] = value;
        //     this.setRowData(rowId, row);
        // }
    }


    dataChanged(source: any, tableId, mapKeyAndValue, changeType, row?) {
        if (source == this) {
            return;
        }
        if (this.dsIds.length !== 1) {
            return;
        }
        //只处理单数据源的情况
        if (this.dsIds[0] == tableId) {
            //如果是同表删除,则直接删除好,不再查询数据库
            if (changeType === Constants.TableDataChangedType.deleted) {
                let rowId = ManagedUITools.findRow(tableId, mapKeyAndValue, this.getData() as any, Table.ID_FIELD);
                if (rowId) {
                    this.removeRow(rowId);
                }
            } else {
                if (row) {
                    let rowId = ManagedUITools.findRow(tableId, mapKeyAndValue, this.getData() as any, Table.ID_FIELD) as any;
                    if (rowId) {
                        this.setRowData(rowId, row);
                    }
                }
            }

        } else {
            //如果不是本表变化,如果存在关联，则刷新当前行
            if (SchemaFactory.hasRelation(tableId, this.dsIds[0])) {
                let curRow = this.getCurrentRow();
                console.log("selectIDs=>" + this.getSelectRowIds());
                if (!curRow) {
                    return;
                }
                let id = curRow[SchemaFactory.getTableByTableId(this.dsIds[0]).getKeyField()];
                if (!id) {
                    return;
                }
                let rowId = curRow[Table.ID_FIELD];
                UiService.findTableRow(this.dsIds[0], id, (result) => {
                    if (result.data && result.data.length > 0) {
                        this.setRowData(rowId, this.filterOptionData([result.data[0]])[0]);


                    }
                });
            }
        }
    }

    afterComponentAssemble(): void {
        super.afterComponentAssemble();
        if (this.pageDetail.loadOnshow) {
            CommonUtils.readyDo(() => {
                return this.isReady();
            }, () => {
                this.reload();
            })
        }
    }

    protected getExtColModel(): Array<FreeJqGrid.ColumnModel> {
        let extCols = new Array<ColumnModel>();
        if (ManagedTable.lstExtColProvider.length > 0) {
            let cols = ManagedTable.findExtCol(this.properties.getBlockInfo());
            if (cols) {
                extCols.push(...cols);
            }
        }
        return extCols;
    }

    dsSelectChanged(source: any, tableId, mapKeyAndValue, row?) {
        if (source == this) {
            return;
        }
        //查询数据源之间的关系,如果是同一源,不处理
        if (this.dsIds.length == 1 && this.dsIds[0] == tableId) {
            return;
        }
        let tableRelationField = ManagedUITools.getTableRelationField(tableId, this.dsIds);
        if (!tableRelationField) {
            return null
        }
        if (!mapKeyAndValue) {//如果没有指定行数据,则表示取消选择,则删除相应的条件
            delete this.extFilter[tableRelationField[1]];
            this.reloadData();
            return;
        }
        //增加条件到本次查询,如果没有取消,则会一直接有效
        this.extFilter[tableRelationField[1]] = row[tableRelationField[0]] || mapKeyAndValue[tableRelationField[0]];
        this.reloadData();

    }

    reloadData() {
        //查看条件，如果没有任何条件，且此页面不允许完全查询，则不查询
        if (this.pageDetail.noFullData != null && this.pageDetail.noFullData == 1 && CommonUtils.isEmpty(this.extFilter)) {
            this.setData(null);
        } else {
            super.reloadData();
        }

        if (this.manageCenter) {
            this.manageCenter.dsSelectChanged(this, this.dsIds[0], null, null);
        }

    }

    reload(filters?) {
        this.extFilterTemp = filters;
        this.reloadData();
    }

    getTableIds(): Array<number> {
        return this.dsIds;
    }

    referenceSelectChanged(source: AutoManagedUI, refId, id) {
        //查询是不是相关的引用,如果是,则要增加过滤
        if (ManagedUITools.makeFilter(refId, this.dsIds, this.extFilter, id)) {
            this.reload();
        }

    }

    stateChange(source: any, tableId, state: number) {
        if (this.dsIds.indexOf(tableId) != -1) {
            //这是需要进一步判断,哪些控件可以编辑
            this.setEnable(Constants.TableState.view == state);
        } else if (SchemaFactory.isChildAndAncestor(tableId, this.dsIds[0])) {
            this.setEnable(Constants.TableState.view === state);
        }
    }


    setManageCenter(listener: IManageCenter) {
        this.manageCenter = listener;
    }

    protected async initSubControls() {
        super.initSubControls();
        this.properties.setExtFilterProvider({
            getExtFilter: (source: object, oldFilter: object) => {
                return this.extFilter;
            }
        });
    }

    addDblClickLister(listener: GeneralEventListener) {
        this.addListener(Constants.GeneralEventType.EVENT_DBL_CLICK, listener);
    }

    destroy(): boolean {
        this.dsIds = null;
        this.refCols = null;
        this.manageCenter = null;
        this.extFilter = null;
        this.extFilterTemp = null;
        return super.destroy();
    }

    setButtons(buttons: Array<MenuButtonDto>) {
        if (!buttons || buttons.length == 0) {
            this.hideOperatorCol();
            return;
        }
        this.showOperatorCol();
        let btns = ManagedUITools.findRelationButtons(buttons, this.dsIds[0], false);
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
                || btn.tableOpertype === Constants.DsOperatorType.custom1
                || btn.tableOpertype === Constants.DsOperatorType.custom2
                || btn.tableOpertype === Constants.DsOperatorType.custom3
                || btn.tableOpertype === Constants.DsOperatorType.custom4
                || ManagedTable.mapEventHandler.has(btn.tableOpertype)) {
                btn.isUsed = true;
                this.lstUseBtn.push(btn);
            } else if (btn.tableOpertype === Constants.DsOperatorType.add ||
                btn.forOne) {
                btn.isUsed = true;
                this.lstToolBtn.push(btn);
            } else if (ManagedTable.mapEventHandler.has(btn.tableOpertype)) {

            }
        }
        if (this.lstUseBtn.length > 0) {
            this.setColOperatorButtons(this.toButtonInfo(this.lstUseBtn));
        }
        if (this.lstToolBtn.length > 0) {
            this.setToolbarButton(this.toButtonInfo(this.lstToolBtn));
        }
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

    protected doAdd() {
        //如果有主表，且没有选择,本表关联字段不可以为空时，则不可以增加
        if (this.getMasterNotNullRelationFields().length > 0) {
            if (!this.extFilter) {
                Alert.showMessage("请选择主表信息");
                return;
            }
            for (let field of this.getMasterNotNullRelationFields()) {
                if (CommonUtils.isEmpty(this.extFilter[field])) {
                    Alert.showMessage("请选择主表信息");
                    return;
                }
            }
        }
        let dlgInfo: ManagedDialogInfo =
            {
                dsId: this.dsIds[0],
                initValue: this.extFilter,
                title: "增加",
                operType: Constants.DsOperatorType.add,
                callback: () => {
                    this.manageCenter.dataChanged(this, this.dsIds[0],
                        null, Constants.TableDataChangedType.added);
                    this.reload();
                }
            };

        new ManagedDlg(dlgInfo).show();
    }

    /**
     * 取得与主表数据表对应的列，且不可以为空的字段
     */
    private getMasterNotNullRelationFields(): Array<string> {
        if (!this.lstCantNullMasterFields) {
            this.lstCantNullMasterFields = [];
            //初始化
            let thisId = this.dsIds[0];
            let lstRelation = SchemaFactory.getTableRelations(thisId);
            if (!lstRelation || lstRelation.length == 0) {
                return this.lstCantNullMasterFields;
            }
            //检查
            for (let relation of lstRelation) {
                if (relation.getTableFrom().getTableDto().tableId == thisId) {
                    if (relation.getDto().relationType == DmConstants.RelationType.oneToOne
                        || relation.getDto().relationType == DmConstants.RelationType.multiToOne) {
                        //还需要此字段是必填的
                        if (!SchemaFactory.getColumnById(relation.getDto().fieldFrom).getColumnDto().nullable) {
                            this.lstCantNullMasterFields
                                .push(SchemaFactory.getColumnById(relation.getDto().fieldFrom).getColumnDto().fieldName);
                        }
                    }
                } else {
                    if (relation.getDto().relationType == DmConstants.RelationType.oneToOne
                        || relation.getDto().relationType == DmConstants.RelationType.oneToMulti) {
                        //还需要此字段是必填的
                        if (!SchemaFactory.getColumnById(relation.getDto().fieldTo).getColumnDto().nullable) {
                            this.lstCantNullMasterFields
                                .push(SchemaFactory.getColumnById(relation.getDto().fieldTo).getColumnDto().fieldName);
                        }
                    }
                }
            }
        }
        return this.lstCantNullMasterFields;
    }

    private doDelete(data) {
        Dialog.showConfirm("确定要删除此行吗?", () => {
            let tableInfo = SchemaFactory.getTableByTableId(this.dsIds[0]);
            UiService.deleteRowByIds([data[tableInfo.getKeyField()]], this.dsIds[0], (result: HandleResult) => {
                if (this.manageCenter) {
                    this.manageCenter.dataChanged(this, this.dsIds[0],
                        null, Constants.TableDataChangedType.deleted);
                    this.reload();
                }
            });
        });
    }

    private doView(canEdit: boolean, data) {
        let key = this.getKeyValue(data);
        if (key === null || typeof key === "undefined") {
            Alert.showMessage("没有找到主键值");
            return;
        }
        let dlgInfo: ManagedDialogInfo =
            {
                dsId: this.dsIds[0],
                initValue: key,
                title: canEdit ? "修改" : "查看",
                operType: canEdit ? Constants.DsOperatorType.edit : Constants.DsOperatorType.view,
                callback: () => {
                    let obj = {};
                    obj[this.getKeyField()] = this.getKeyValue(data);
                    this.manageCenter.dataChanged(this, this.dsIds[0],
                        obj, Constants.TableDataChangedType.edited);
                    this.reload();
                }
            };

        new ManagedDlg(dlgInfo).show();
    }

    protected componentButtonClicked(event: ClickEvent, menuBtnDto: MenuButtonDto, data) {
        if (!this.doPreButtonClick(menuBtnDto.tableOpertype, data)) {
            return;
        }
        let operType = menuBtnDto.tableOpertype;
        //如果存在扩展处理程序的,优先执行
        if (ManagedTable.mapEventHandler.has(operType)) {
            ManagedTable.mapEventHandler.get(operType)
                .doHandle(operType, this.dsIds[0], data, this, menuBtnDto);
            return;
        }
        if (!this.enabled) {
            return;
        }
        if (operType === Constants.DsOperatorType.add) {
            this.doAdd();
        } else if (operType === Constants.DsOperatorType.delete) {
            this.doDelete(data);
        } else if (operType === Constants.DsOperatorType.edit ||
            operType === Constants.DsOperatorType.view) {
            this.doView(operType === Constants.DsOperatorType.edit, data);
        }

        //后监听
        this.doAfterButtonClick(operType, data);


    }

    private doPreButtonClick(operType, data): boolean {
        let lstInter = this.mapInterceptor.get(operType + "");
        if (lstInter) {
            for (let inter of lstInter) {
                if (inter.beforeHandle && !inter.beforeHandle(operType + "", this.dsIds[0], data, this)) {
                    return false;
                }
            }
        }
        return true;
    }

    private doAfterButtonClick(operType, data): void {
        let lstInter = this.mapInterceptor.get(operType + "");
        if (lstInter) {
            for (let inter of lstInter) {
                inter.afterHandle && inter.afterHandle(operType + "", this.dsIds[0], data, this);
            }
        }
    }

    private getKeyValue(data) {
        let tableInfo = SchemaFactory.getTableByTableId(this.dsIds[0]);
        return data[tableInfo.getKeyField()];
    }

    private getKeyField() {
        let tableInfo = SchemaFactory.getTableByTableId(this.dsIds[0]);
        return tableInfo.getKeyField();
    }


    getUiDataNum(): number {
        return Constants.UIDataNum.multi;
    }

    /**
     * 增加事件拦截器
     * @param operType
     * @param interceptor
     */
    addEventInterceptor(operType: number | string, interceptor: EventInterceptor) {
        let lstInter = this.mapInterceptor.get(operType + "");
        if (!lstInter) {
            lstInter = new Array<EventInterceptor>();
            this.mapInterceptor.set(operType + "", lstInter);
        }
        lstInter.push(interceptor);
    }

    /**
     * 增加类级别的扩展处理程序
     * @param operType
     * @param eventHandler
     */
    static addClassEventHandler(operType: number | string, eventHandler: IEventHandler) {
        ManagedTable.mapEventHandler.set(operType + "", eventHandler);
    }

    static addGlobalReadyListener(callback: (table: ManagedTable) => void) {
        ManagedTable.lstGlobalReadyListener.push(callback);
    }

    static addExtColProvider(callback: (blockInfo: BlockViewer) => Array<ColumnModel>) {
        ManagedTable.lstExtColProvider.push(callback);
    }

    private static findExtCol(blockInfo: BlockViewer): Array<ColumnModel> {
        if (ManagedTable.lstExtColProvider.length == 0) {
            return null;
        }
        let result = new Array<ColumnModel>();
        for (let func of ManagedTable.lstExtColProvider) {
            let cols = func(blockInfo);
            if (cols) {
                result.push(...cols);
            }
        }
        return result;
    }

}
