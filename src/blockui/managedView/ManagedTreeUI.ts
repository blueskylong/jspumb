/**
 * 此表单只响应列表或树选中情况下的显示
 * 表单只响应本级数据源的变化
 */
import {AutoManagedUI, IManageCenter, ManagedEventListener} from "./AutoManagedUI";
import {StringMap} from "../../common/StringMap";
import {Column} from "../../datamodel/DmRuntime/Column";
import {Constants} from "../../common/Constants";
import {TreeUI} from "../JsTree/TreeUI";
import {BlockViewDto} from "../../uidesign/dto/BlockViewDto";
import {ManagedUITools} from "./ManagedUITools";
import {GlobalParams} from "../../common/GlobalParams";
import {CommonUtils} from "../../common/CommonUtils";
import {PageDetailDto} from "../../funcdesign/dto/PageDetailDto";
import {MenuButtonDto} from "../../sysfunc/menu/dto/MenuButtonDto";
import {Alert} from "../../uidesign/view/JQueryComponent/Alert";
import {ComfirmDlg} from "../dialogs/ComfirmDlg";
import {SchemaFactory} from "../../datamodel/SchemaFactory";
import {CodeLevelProvider} from "../../common/CodeLevelProvider";
import {UiService} from "../service/UiService";
import ClickEvent = JQuery.ClickEvent;
import {UiUtils} from "../../common/UiUtils";


export class ManagedTreeUI<T extends BlockViewDto> extends TreeUI<T> implements AutoManagedUI {

    protected dsIds = new Array<any>();
    protected refCols = new StringMap<Array<Column>>();
    protected manageCenter: IManageCenter;
    protected pageDetail: PageDetailDto;

    private oneKeyField = null;
    private hasSaveLevel = false;


    attrChanged(source: any, tableId, mapKeyAndValue, field, value) {
        if (source == this) {
            return;
        }
        //如果和源数据源有1对1的关系 ,则也需要刷新
        //这里简化,只处理本数据源且是同一行时更新自己
        let rowId = this.locateRow(tableId, mapKeyAndValue) as any;
        if (rowId) {
            let node = this.getTree().getJsTree().get_node(rowId);
            if (node) {
                //TODO 要观察有没有得到修改
                node.data[field] = value;
                if (field == this.treeInfo.textField) {
                    this.getTree().changeNodeText(rowId, value);
                }

            }
        }
    }

    checkAndSave(): Promise<boolean> {
        //本身不修改数据
        if (this.hasSaveLevel) {
            return this.doSaveLevel();
        } else {
            return new Promise(resolve => resolve(true));

        }
    }

    private locateRow(tableId, mapKeyAndValue) {
        if (!mapKeyAndValue) {
            return null;
        }
        let data = this.getValue() as Array<Object>;
        if (!data) {
            return null;
        }
        if (Array.isArray(data)) {
            for (let row of data) {
                if (this.isInRow(row, mapKeyAndValue)) {
                    return row[this.treeInfo.codeField];
                }
            }
        }
        return null;
    }

    private isInRow(row, rowToCompare) {
        let result = true;
        new StringMap(rowToCompare).forEach((key, value, map) => {
            if (!row.hasOwnProperty(key) || row[key] != value) {
                result = false;
                return false;
            }
        });
        return result;
    }

    dataChanged(source: any, tableId, mapKeyAndValue, changeType) {
        if (source == this) {
            return;
        }
        //只处理单数据源的情况
        if (this.dsIds.length == 1 && this.dsIds[0] == tableId) {
            //如果是删除数据
            if (changeType === Constants.TableDataChangedType.deleted) {
                let rowId = this.locateRow(tableId, mapKeyAndValue);
                if (rowId) {
                    this.getTree().getJsTree().delete_node(rowId);
                }
                return
            }
            if (changeType === Constants.TableDataChangedType.added
                || changeType === Constants.TableDataChangedType.edited) {
                this.reload();
                this.getTree().selectNodeById(mapKeyAndValue[ManagedUITools.getOneKeyColumnField(this.dsIds[0])]);
            }
        }
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
            if ($.isEmptyObject(this.extFilter) && this.pageDetail.loadOnshow != 1) {//如果是空条件,需要确认此控件有没有空条件查询的配置
                this.jsTree.setValue([]);
                return;
            }
            this.reload();
            this.manageCenter.dsSelectChanged(this, this.dsIds[0], null);
            return;
        }
        //增加条件到本次查询,如果没有取消,则会一直接有效
        this.extFilter[tableRelationField[1]] = row[tableRelationField[0]] || mapKeyAndValue[tableRelationField[0]];
        this.manageCenter.dsSelectChanged(this, this.dsIds[0], null);
        this.reload();

    }


    getTableIds(): Array<number> {
        return this.dsIds;
    }

    getPageDetail(): PageDetailDto {
        return this.pageDetail;
    }

    static getManagedInstance(pageDetail: PageDetailDto, version?) {
        let blockDto = new BlockViewDto();
        blockDto.blockViewId = pageDetail.viewId;
        blockDto.versionCode = version || GlobalParams.getLoginVersion();
        let tree = new ManagedTreeUI(blockDto);
        tree.pageDetail = pageDetail;
        tree.blockViewId = pageDetail.viewId;
        tree.versionCode = version;
        tree.addReadyListener(() => {
            if (tree.pageDetail && tree.pageDetail.loadOnshow == 1) {
                tree.reload();
            }
            tree.setEditable(tree.getPageDetail().initState != Constants.UIState.view);
        });
        return tree;
    }


    referenceSelectChanged(source: AutoManagedUI, refId, id) {
        //查询是不是相关的引用,如果是,则要增加过滤
        if (ManagedUITools.makeFilter(refId, this.dsIds, this.extFilter, id)) {
            this.reload();
        }

    }

    stateChange(source: any, tableId, state: number) {
        //如果变化的数据是本数据源或下级数据源
        if (this.dsIds.indexOf(tableId) != -1 || SchemaFactory.isChildAndAncestor(tableId, this.dsIds[0])) {
            //如果是在增加或编辑状态,则不允许树点击
            if (state === Constants.TableState.add || state === Constants.TableState.edit) {
                this.setEnable(false);
                return;
            }

        }
        this.setEnable(true);
    }

    onUiDataReady(): void {
        //分析数据源信息
        ManagedUITools.initReferAndDsId(this.viewer.getLstComponent(), this.dsIds, this.refCols);
        this.jsTree.addSelectListener({
            handleEvent: (eventType: string, row: object, table: object, extObject?: any) => {
                if (!this.manageCenter || this.dsIds.length != 1) {//只有单一数据源时,才做处理
                    return;
                }
                this.manageCenter.dsSelectChanged(this, this.dsIds[0], ManagedUITools.getDsKeyValue(this.dsIds[0], row), row);
            }
        });
    }

    afterComponentAssemble(): void {
        super.afterComponentAssemble();
        CommonUtils.readyDo(() => {
            return this.jsTree && this.jsTree.isReady();
        }, () => {
            ManagedUITools.initReferAndDsId(this.viewer.getLstComponent(), this.dsIds, this.refCols);
        });
    }

    setManageCenter(listener: ManagedEventListener) {
        this.manageCenter = listener;
    }

    setButtons(buttons: Array<MenuButtonDto>) {
        //只针对单表的情况
        if (this.dsIds && this.dsIds.length == 1) {
            //被使用过的,就不再显示在树上了
            let btns = ManagedUITools.findRelationButtons(buttons, this.dsIds[0], true);
            if (btns) {
                //再根据可操作的类型过滤
                let canAcceptButttons = this.getCanAcceptButtons();
                let validBtns = new Array<MenuButtonDto>();
                for (let btn of btns) {
                    if (canAcceptButttons.indexOf(btn.tableOpertype) != -1) {
                        validBtns.push(btn);
                    }
                }
                let buttonInfos = this.toButtonInfo(validBtns);
                for (let i = 0; i < validBtns.length; i++) {
                    let btn = validBtns[i];
                    btn.isUsed = true;
                    if (btn.tableOpertype === Constants.DsOperatorType.saveLevel) {
                        this.hasSaveLevel = true;
                        this.getTree().setDraggable(true);
                        buttonInfos[i].isShow = (node) => {
                            return !node.data;
                        }
                    }
                }
                this.jsTree.setButtons(buttonInfos);
            }
        }

    }

    protected getCanAcceptButtons() {
        return [Constants.DsOperatorType.saveLevel,
            Constants.DsOperatorType.delete,
            Constants.DsOperatorType.add,
            Constants.DsOperatorType.edit];
    }

    protected componentButtonClicked(event: ClickEvent, menuBtnDto: MenuButtonDto, data) {
        //这里只处理默认的几个操作
        if (menuBtnDto.tableOpertype === Constants.DsOperatorType.delete) {
            this.doDelete(data);
            return;
        } else if (menuBtnDto.tableOpertype === Constants.DsOperatorType.add) {
            //保存,只会保存级次
            this.doAdd(menuBtnDto, data);
            return;
        } else if (menuBtnDto.tableOpertype === Constants.DsOperatorType.saveLevel) {
            this.doSaveLevel();
            return;
        }
        //如果不是默认的,则交给菜单对应的功能去完成
        this.manageCenter.btnClicked(this, menuBtnDto, data);
    }

    //删除当前节点
    private doDelete(data) {
        //目前只允许单个的删除
        //
        if (this.jsTree.isRoot(data)) {
            Alert.showMessage("请选择要删除的数据");
            return;
        }
        if (!this.jsTree.isLeaf(data)) {
            Alert.showMessage("请选择叶子节点进行删除!");
            return;
        }
        ComfirmDlg.getInstance("确定要删除数据" + data.text + "吗?", (value) => {
            let keyValue = {};
            let keyField = ManagedUITools.getOneKeyColumnField(this.dsIds[0]);
            keyValue[keyField] = data.data[keyField];
            UiService.deleteRowByIds([data.data[keyField]], this.dsIds[0], (result) => {
                Alert.showMessage("删除成功!");
                this.reload();
                this.manageCenter.dataChanged(this, this.dsIds[0], keyValue, Constants.TableDataChangedType.deleted);
            });
            //执行删除
            return true;
        }).show();
    }

    /**
     * 这里只负责收集增加需要的数据.然后通知中心增加的事件及收集到的数据
     */
    private doAdd(btnInfo: MenuButtonDto, node) {
        //检查如果有主表界面存在,则要求必须主表有选中
        let value = this.makeAddData(node);
        if (value == null) {
            return;
        }
        this.manageCenter.btnClicked(this, btnInfo, value)
    }

    /**
     * 增加默认的数据
     * 查询存在主表的对应字段
     */
    private makeAddData(node) {
        this.jsTree.selectNode(node);
        let obj = {};
        let tableInfo = SchemaFactory.getTableByTableId(this.dsIds[0]);
        //查询主表字段.
        let columns = tableInfo.getOutMasterKeyColumns();
        //如果没有主表,则不处理
        if (columns && columns.length !== 0) {
            for (let column of columns) {
                if (!this.extFilter[column.getColumnDto().fieldName]) {
                    //TODO_2 可以查询表名提示
                    Alert.showMessage("主表字段没有值,请先选择主表字段");
                    return null;
                }
                obj[column.getColumnDto().fieldName] = this.extFilter[column.getColumnDto().fieldName]
            }
        }
        //生成级次字段
        let levelCode;

        let codeLevelProvider = CodeLevelProvider.getDefaultCodePro();
        if (node.children && node.children.length > 0) {
            levelCode = this.jsTree.getNodeCode(node.children[node.children.length - 1]);
            codeLevelProvider.setCurCode(levelCode);
            levelCode = codeLevelProvider.getNext();
        } else {
            if (this.getTree().isRoot(node)) {
                levelCode = codeLevelProvider.getNext();
            } else {
                levelCode = codeLevelProvider.setCurCode(this.jsTree.getNodeCode(node))
                    .getSubNext();
            }
        }
        if (this.hasCodeField) {
            obj[this.jsTree.getDtoInfo().codeField] = levelCode;
        }
        return obj;
    }


    getUiDataNum(): number {
        return Constants.UIDataNum.multi;
    }

    private getOneKeyField() {
        if (this.oneKeyField) {
            return this.oneKeyField;
        }
        this.oneKeyField = ManagedUITools.getOneKeyColumnField(this.dsIds[0]);
        return this.oneKeyField;
    }

    private doSaveLevel(): Promise<boolean> {
        if (!this.hasSaveLevel) {
            return new Promise(resolve => {
                resolve(false);
            });
        }
        let oraData = this.getTree().getJsTree().get_json(null, {flat: false});
        if (oraData && oraData.length > 0) {
            let obj = {};
            let provider = new CodeLevelProvider();
            let data = oraData[0].children;
            for (let row of data) {
                this.makeLevel(provider, row, obj);
            }
            let curId = null;
            if (this.getTree().getCurrentData()) {
                curId = this.getTree().getCurrentData()[this.getOneKeyField()];
            }
            UiService.updateLevel(obj, this.viewer.getBlockViewDto().blockViewId, (data) => {
                this.reload();
                if (curId) {
                    this.getTree().selectNodeById(curId);
                    UiUtils.hideMask();
                    Alert.showMessage("保存成功");
                    return new Promise(resolve => {
                        resolve(true);
                    })
                } else {
                    return new Promise(resolve => {
                        resolve(false);
                    })
                }

            });
        } else {
            return new Promise(resolve => {
                resolve(true);
            });
        }

    }

    private makeLevel(codePro: CodeLevelProvider, node, obj) {

        let curCode = codePro.getNext();
        obj[node.data[this.treeInfo.idField]] = curCode;

        if (node.children && node.children.length > 0) {
            codePro.goSub();
            for (let subNode of node.children) {
                this.makeLevel(codePro, subNode, obj);
            }
            codePro.setCurCode(curCode);
        }
    }

}

