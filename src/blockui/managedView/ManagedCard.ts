/**
 * 此表单只响应列表或树选中情况下的显示
 * 表单只响应本级数据源的变化
 */
import {BlockViewDto} from "../../uidesign/dto/BlockViewDto";
import {CardList} from "../cardlist/CardList";
import {AutoManagedUI, ManagedEventListener} from "./AutoManagedUI";
import {StringMap} from "../../common/StringMap";
import {Column} from "../../datamodel/DmRuntime/Column";
import {Form} from "../Form";
import {Constants} from "../../common/Constants";
import {ManagedUITools} from "./ManagedUITools";
import {GlobalParams} from "../../common/GlobalParams";
import {PageDetailDto} from "../../funcdesign/dto/PageDetailDto";
import {MenuButtonDto} from "../../sysfunc/menu/dto/MenuButtonDto";
import {Alert} from "../../uidesign/view/JQueryComponent/Alert";
import {UiService} from "../service/UiService";
import {HandleResult} from "../../common/HandleResult";
import {SchemaFactory} from "../../datamodel/SchemaFactory";
import {CodeLevelProvider} from "../../common/CodeLevelProvider";
import {DmConstants} from "../../datamodel/DmConstants";
import {Dialog} from "../Dialog";
import {CommonUtils} from "../../common/CommonUtils";


export class ManagedCard<T extends BlockViewDto> extends CardList<T> implements AutoManagedUI {

    protected dsIds = new Array<any>();
    protected refCols = new StringMap<Array<Column>>();
    protected managedEventListener: ManagedEventListener;
    protected pageDetail: PageDetailDto;
    protected extFilter = {};
    private keyField = null;
    /**
     * 待删除的数据
     */
    protected deleteIds = new Array<any>();

    attrChanged(source: any, tableId, mapKeyAndValue, field, value) {
        if (source == this) {
            return;
        }
        //如果和源数据源有1对1的关系 ,则也需要刷新
        //这里简化,只处理本数据源且是同一行时更新自己
        let form = this.locateForm(tableId, mapKeyAndValue);
        if (form) {
            form.setFieldValue(field, value);
        }
    }

    destroy(): boolean {
        this.dsIds = null;
        this.refCols = null;
        this.managedEventListener = null;
        this.pageDetail = null;
        this.extFilter = null;
        this.deleteIds = null;
        return super.destroy();
    }


    private locateForm(tableId, mapKeyAndValue): Form {
        if (!mapKeyAndValue) {
            return null;
        }
        if (!this.lstForm || this.lstForm.length == 0) {
            return null;
        }
        for (let form of this.lstForm) {
            let values = form.getValue();
            if (this.isInRow(values, mapKeyAndValue)) {
                return form;
            }
        }

        return null;
    }

    deleteRow(index: number) {
        if (index < 0 || index > this.lstForm.length) {
            throw new Error("删除的序号不正确:" + index);
        }
        let row = this.values[index];
        let id = row[this.getKeyField()];
        if (parseInt(id) > -1) {
            let obj = {};
            obj[this.getKeyField()] = id;
            this.deleteIds.push(obj);
        }
        super.deleteRow(index);
    }

    private isInRow(row, map: StringMap<any>) {
        let result = true;
        map.forEach((key, value, map) => {
            if (!row.hasOwnProperty(key) || row[key] != value) {
                result = false;
                return false;
            }
        });
        return result;
    }

    dataChanged(source: any, tableId, mapKeyAndValue) {
        if (source == this) {
            return;
        }
        //只处理单数据源的情况
        if (this.dsIds.length == 1 && this.dsIds[0] == tableId) {
            let form = this.locateForm(tableId, mapKeyAndValue);
            if (form) {
                this.deleteRow(this.lstForm.indexOf(form));
            }
        }
    }


    /**
     * 这里只处理从属性的变化,也就是只响应主表的选择变化
     * @param source
     * @param tableId
     * @param mapKeyAndValue
     * @param row
     */
    dsSelectChanged(source: any, tableId, mapKeyAndValue, row?) {
        if (source == this) {
            return;
        }

        let tableRelationField = ManagedUITools.getTableRelationField(tableId, this.dsIds);
        if (!tableRelationField) {
            return null
        }
        if (!mapKeyAndValue) {//如果没有指定行数据,则表示取消选择,则删除相应的条件
            delete this.extFilter[tableRelationField[1]];
            this.loadData(this.extFilter);
            return;
        }
        //增加条件到本次查询,如果没有取消,则会一直接有效
        this.extFilter[tableRelationField[1]] = (row[tableRelationField[0]] || mapKeyAndValue[tableRelationField[0]]) + "";
        this.loadData(this.extFilter);

    }

    reload(): void {
        this.loadData(this.extFilter);
    }

    getTableIds(): Array<number> {
        return this.dsIds;
    }

    getPageDetail() {
        return this.pageDetail;
    }


    static getManagedInstance(pageDetail: PageDetailDto, version?) {
        let blockDto = new BlockViewDto();
        blockDto.blockViewId = pageDetail.viewId;
        blockDto.versionCode = version || GlobalParams.getLoginVersion();

        let card = new ManagedCard(blockDto);
        card.pageDetail = pageDetail;
        card.addReadyListener(() => {
                card.setFullEditable(card.getPageDetail().initState == Constants.UIState.view);
            }
        )
        return card;
    }

    referenceSelectChanged(source: AutoManagedUI, refId, id) {
        //查询是不是相关的引用,如果是,则要增加过滤
        if (ManagedUITools.makeFilter(refId, this.dsIds, this.extFilter, id)) {
            this.loadData(this.extFilter);
        }


    }

    stateChange(source: any, tableId, state: number) {
        if (this.dsIds.indexOf(tableId) != -1) {
            //这是需要进一步判断,哪些控件可以编辑
            this.setFullEditable(Constants.TableState.view != state);
        }
        return false;
    }

    afterComponentAssemble(): void {
        //分析数据源信息
        ManagedUITools.initReferAndDsId(this.viewer.getLstComponent(), this.dsIds, this.refCols);
        this.addSelectChangeListener({
            handleEvent: (eventType: string, row: object, card: object, extObject?: any) => {
                if (!this.managedEventListener || this.dsIds.length != 1) {//只有单一数据源时,才做处理
                    return;
                }
                this.managedEventListener.dsSelectChanged && this.managedEventListener.dsSelectChanged(this, this.dsIds[0], ManagedUITools.getDsKeyValue(this.dsIds[0], row), row);
            }
        });
        super.afterComponentAssemble();
        if (this.pageDetail && this.pageDetail.loadOnshow == 1) {
            this.loadData();
        }
        this.setDefaultValueProvider(() => {
            let tableInfo = SchemaFactory.getTableByTableId(this.dsIds[0]);
            return tableInfo.getDefaultValue();

        });
    }


    setManageCenter(listener: ManagedEventListener) {
        this.managedEventListener = listener;
    }

    /**
     * 接收菜单按钮,当前只接收增加,保存和修改操作的按钮
     * @param buttons
     */
    setButtons(buttons: Array<MenuButtonDto>) {
        //只处理当数据源的情况
        if (!this.dsIds && this.dsIds.length != 1) {
            return;
        }
        let btns = ManagedUITools.findRelationButtons(buttons, this.dsIds[0]);
        if (!btns || btns.length < 1) {
            return;
        }
        this.setFullEditable(false);
        for (let btn of btns) {
            let isUse = btn.isUsed;
            btn.isUsed = true;
            this.setSortable(true);
            if (btn.tableOpertype === Constants.DsOperatorType.edit) {
                this.setFullEditable(true);

            } else if (btn.tableOpertype === Constants.DsOperatorType.add) {
                this.setShowAdd(true);
            } else if (btn.tableOpertype === Constants.DsOperatorType.saveMulti) {
                this.setShowSave(true);
            } else if (btn.tableOpertype === Constants.DsOperatorType.delete) {
                this.setShowHead(true);
            } else {
                btn.isUsed = isUse;
                this.setSortable(false);
            }

        }


    }

    /**
     * 取得固定的值
     */
    protected getFixValue() {
        return this.extFilter;
    }

    /**
     * 取得可以处理的类型
     */
    protected getCanHandleButtonType() {
        return [Constants.DsOperatorType.edit,
            Constants.DsOperatorType.saveMulti,
            Constants.DsOperatorType.add,
            Constants.DsOperatorType.cancel];
    }

    setValue(values: Array<any>) {
        this.deleteIds = [];
        super.setValue(values);
    }

    loadData(filter?) {
        this.deleteIds = [];
        if (this.pageDetail.noFullData && CommonUtils.isEmpty(filter)) {
            return;
        }
        super.loadData(filter);
    }

    getUiDataNum(): number {
        return Constants.UIDataNum.multi;
    }

    async save(): Promise<boolean> {
        if (!this.editable) {
            return new Promise(resolve => resolve(true));
        }
        if (!this.check()) {
            return new Promise(resolve => {
                resolve(false);
            });
        }
        let data = this.getValue();
        if (!data) {
            data = [];
        } else {
            this.setOrder(data);
        }
        if (this.deleteIds) {
            data.push(...this.deleteIds);
        }

        UiService.saveRows(data, this.dsIds[0], (result: HandleResult) => {
            if (result.success) {
                this.deleteIds = [];
                Alert.showMessage("保存成功!");
                this.loadData();
                return new Promise(resolve => {
                    resolve(true);
                });
            } else {
                Alert.showMessage("保存失败!" + result.err);
                return new Promise(resolve => {
                    resolve(false);
                });
            }
        })
    }

    protected setOrder(data: Array<any>) {
        let tableInfo = SchemaFactory.getTableByTableId(this.dsIds[0]);
        if (tableInfo.hasColName(DmConstants.ConstField.xh)) {
            let index = 1;
            for (let row of data) {
                row[DmConstants.ConstField.xh] = index++
            }
        } else if (tableInfo.hasColName(DmConstants.ConstField.lvlCode)) {
            let codePro = new CodeLevelProvider();
            for (let row of data) {
                row[DmConstants.ConstField.lvlCode] = codePro.getNext();
            }
        }
    }

    private getKeyField() {
        if (this.keyField) {
            return this.keyField;
        }
        let tableInfo = SchemaFactory.getTableByTableId(this.dsIds[0]);
        this.keyField = tableInfo.getKeyField();
        return this.keyField;
    }

    checkAndSave() {
        //本身不修改数据
        return this.save();
    }

}
