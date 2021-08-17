import {AutoManagedUI, IManageCenter, ManagedEventListener} from "./AutoManagedUI";
import {GlobalParams} from "../../common/GlobalParams";
import {SchemaFactory} from "../../datamodel/SchemaFactory";
import {MenuButtonDto} from "../../sysfunc/menu/dto/MenuButtonDto";
import {Constants} from "../../common/Constants";
import {ButtonInfo} from "../../uidesign/view/JQueryComponent/Toolbar";
import {UiService} from "../service/UiService";
import {Schema} from "../../datamodel/DmRuntime/Schema";
import {MenuFunction} from "../MenuFunction";
import {ManagedFunc} from "../ManagedFunc";
import {MenuInfo} from "../../sysfunc/menu/dto/MenuInfo";


/**
 * 受控件的管理中心
 */
export class ManagedUiCenter implements IManageCenter {
    protected lstMenuFuc: Array<ManagedFunc<MenuInfo>> = new Array<ManagedFunc<MenuInfo>>();

    protected lstManagedUI: Array<AutoManagedUI> = new Array<AutoManagedUI>();

    protected buttonClickHandler: (btn: MenuButtonDto, source) => void;

    protected globalParam = {};

    constructor(protected schemaId?) {
    }

    getGlobalParams(): object {
        return this.globalParam;
    }

    setGlobalParams(obj: object) {
        this.globalParam = obj;
    }

    /**
     * 注册功能,跨功能时需要注册
     * @param func
     */
    registerMenuFunc(func: ManagedFunc<MenuInfo>) {
        this.lstMenuFuc.push(func);
        this.registerManagedUI(func.getPage().getSubManagedUI(), func.getDtoInfo().getMenuDto().menuId);
    }

    /**
     * 注册功能,跨功能时需要注册
     * @param func
     */
    unRegisterMenuFunc(func: ManagedFunc<MenuInfo>) {
        this.lstMenuFuc.splice(this.lstMenuFuc.indexOf(func), 1);
        this.unRegisterManagedUI(func.getPage().getSubManagedUI());
    }

    /**
     * 注册受控件,
     * @param uis
     */
    registerManagedUI(uis: Array<AutoManagedUI>, menuId?) {
        if (!uis) {
            return;
        }
        for (let ui of uis) {
            if (this.lstManagedUI.indexOf(ui) === -1) {
                ui.setManageCenter(this);
                if (menuId) {
                    //这里设置所属的菜单,是用于后面按钮响应注册时,查询相关处理主体
                    ui.getPageDetail().belongMenuId = menuId;
                }
                //再次确认
                if (this.lstManagedUI.indexOf(ui) === -1) {
                    this.lstManagedUI.push(ui);
                }
            }
        }
    }

    /**
     *     取消注册受控件
     */
    unRegisterManagedUI(uis: AutoManagedUI | Array<AutoManagedUI>) {
        if (uis instanceof Array) {
            for (let ui of uis) {
                ui.setManageCenter(null);
                this.removeUI(ui);
            }
        } else {
            uis.setManageCenter(null);
            this.removeUI(uis);
        }

    }

    distributeButtons(btns: Array<MenuButtonDto>) {
        if (!btns && !this.lstManagedUI) {
            return;
        }
        for (let btn of btns) {
            btn.isUsed = false;
        }
        //需要做二次分发,第一次给单数据类型分发,第二次给集合类型分发,一般情况下,像保存,修改这些按钮优先分配到单数据类型的界面中
        //如果是多菜单集成的情况,则还要判断菜单是否一致
        let menuId = btns[0].menuId;
        for (let ui of this.lstManagedUI) {
            if (ui.getUiDataNum() <= Constants.UIDataNum.one && ui.getPageDetail().belongMenuId === menuId) {
                ui.setButtons(btns);
            }
        }
        for (let ui of this.lstManagedUI) {
            if (ui.getUiDataNum() >= Constants.UIDataNum.multi && ui.getPageDetail().belongMenuId === menuId) {
                ui.setButtons(btns);
            }
        }
    }

    private removeUI(ui: AutoManagedUI) {
        let index = this.lstManagedUI.indexOf(ui);
        if (index == -1) {
            return;
        }
        this.lstManagedUI.splice(index, 1);
    }

    /**
     * 一个数据发生了变化
     * @param source
     * @param tableId
     * @param mapKeyAndValue
     * @param field
     * @param value
     */
    attrChanged(source: any, tableId, mapKeyAndValue, field, value) {
        //暂时不做分发处理,影响取消操作
        //首先取得此数据相关的视图,然后通知
        let relationUIs = this.getRelationUIs(tableId);
        for (let ui of relationUIs) {
            if (ui == source) {
                continue;
            }
            ui.attrChanged(source, tableId, mapKeyAndValue, field, value);
        }
    }

    dataChanged(source: any, tableId, mapKeyAndValue, changeType, row?) {
        //首先取得此数据相关的视图,然后通知
        let relationUIs = this.getRelationUIs(tableId);
        for (let ui of relationUIs) {
            if (ui == source) {
                continue;
            }
            ui.dataChanged(source, tableId, mapKeyAndValue, changeType, row);
        }
    }

    dsSelectChanged(source: any, tableId, mapKeyAndValue, row?) {
        //首先取得此数据相关的视图,然后通知
        let relationUIs = this.getRelationUIs(tableId);
        for (let ui of relationUIs) {
            if (ui == source) {
                continue;
            }
            ui.dsSelectChanged(source, tableId, mapKeyAndValue, row);
        }
    }

    referenceSelectChanged(source: any, refId, id, isLeaf) {

        //首先取得此数据相关的视图,然后通知
        let relationTableIds = this.getRelationTablesByRef(this.schemaId, GlobalParams.getLoginVersion(), refId);
        if (!relationTableIds) {
            return;
        }
        for (let ui of this.lstManagedUI) {
            if (ui == source) {
                continue;
            }
            if (this.anyInArray(ui.getTableIds(), relationTableIds)) {
                ui.referenceSelectChanged(source, refId, id, isLeaf);
            }

        }
    }

    private inArray(id: number, ids: Array<number>) {
        return ids.indexOf(id) != -1;
    }

    private anyInArray(ids: Array<number>, idRange: Array<number>) {
        if (!ids) {
            return false;
        }
        for (let id of ids) {
            if (this.inArray(id, idRange)) {
                return true;
            }
        }
        return false;
    }

    /**
     * 数据源的状态发生变化,需要通知所有的块
     * @param source
     * @param tableId
     * @param state
     */
    stateChange(source: any, tableId, state: number) {
        if (this.lstManagedUI) {
            for (let managedUi of this.lstManagedUI) {
                if (managedUi === source) {
                    continue;
                }
                managedUi.stateChange(source, tableId, state);
            }

        }
    }

    /**
     * 取得与此表有直接相关的界面
     * @param tableId
     */
    private getRelationUIs(tableId) {
        let result = new Array<AutoManagedUI>();
        for (let ui of this.lstManagedUI) {
            let tableIds = ui.getTableIds();
            if (!tableIds) {
                continue;
            }
            if (tableIds.indexOf(tableId) != -1) {
                result.push(ui);
                continue;
            }
            for (let id of tableIds) {
                if (SchemaFactory.getTablesRelation(tableId, id)) {
                    result.push(ui);
                    break;
                }
            }

        }
        return result;
    }

    private getRelationTablesByRef(schemaId, version, refId): Array<number> {
        if (!schemaId || schemaId <= 0) {
            //查找所有
            let schemas = SchemaFactory.getSchemas(version);
            let result = [];
            for (let schema of schemas) {
                let refs = this.findRefInSchema(schema, version, refId);
                if (refs && refs.length > 0) {
                    result.push(...refs);
                }
            }
            return result;

        } else {
            let schema = SchemaFactory.getSchema(schemaId, version);
            //查找指定
            return this.findRefInSchema(schema, version, refId);
        }

    }

    private findRefInSchema(schema: Schema, version, refId) {

        let lstTable = schema.getLstTable();
        if (!lstTable) {
            return null;
        }
        let result = [];
        for (let table of lstTable) {
            if (table.hasColRelationToRef(refId)) {
                result.push(table.getTableDto().tableId);
            }
        }
        return result;
    }

    destroy() {
        this.unRegisterManagedUI(this.lstManagedUI);
        this.lstManagedUI = null;
        this.buttonClickHandler = null;
        this.globalParam = {};
        this.lstMenuFuc = null;
    }

    /**
     * 按钮被点击,如果是处理不了的,则交级上级处理,这是界面处理不了的按钮事件,这里处理,
     * 这里做分发操作,如果某个子界面处理了些消息,则完成,
     * 如果返回值都是假,则提交成界面处理
     * @param buttonInfo
     */
    btnClicked(source: any, buttonInfo: MenuButtonDto, data): boolean {
        let relationUIs = this.getRelationUIs(buttonInfo.relationTableid);
        if (relationUIs) {
            for (let managedUi of relationUIs) {
                if (managedUi.btnClicked) {
                    if (source === managedUi) {
                        continue;
                    }
                    if (managedUi.btnClicked(source, buttonInfo, data)) {
                        return true;
                    }
                }
            }

        }
        if (this.buttonClickHandler) {
            this.buttonClickHandler(buttonInfo, source);
        }
        //这个返回结果没有地方应用
        return true;
    }

    setButtonClickHandler(handler: (btn: MenuButtonDto, source) => void) {
        this.buttonClickHandler = handler;
    }

    /**
     * 检查并保存,TODO_2 目前删除还没有办法判断,所以删除要单独操作
     * 如果主键字段是负值,说明是新增,否则是修改  中心使用
     * @param rowData
     * @param dsId
     * @param callback
     */
    checkAndSave(rowData: object | Array<object>, dsId, callback: (result) => void) {
        if (!this.checkData(rowData, dsId)) {
            return;
        }
        //调用服务器,进行保存
        if (!(Array.isArray(rowData))) {
            rowData = [rowData];
        }
        UiService.saveRows(rowData as any, dsId, (result) => {
            callback(result);
        });
    }

    /**
     * 这里主要是进行数据间的约束检查
     * @param rowData
     * @param dsId
     */
    private checkData(rowData: object | Array<object>, dsId) {
        return true;
    }


    //TODO 计算当前表的全局公式，如果有受影响的界面，界面接收后自行更新

};
