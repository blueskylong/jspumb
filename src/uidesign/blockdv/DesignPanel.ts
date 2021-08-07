import BaseUI from "../view/BaseUI";
import {ColumnDto} from "../../datamodel/dto/ColumnDto";
import {Constants} from "../../common/Constants";
import {Component} from "../../blockui/uiruntime/Component";
import {Column} from "../../datamodel/DmRuntime/Column";
import {ComponentDto} from "../dto/ComponentDto";
import {CommonUtils} from "../../common/CommonUtils";
import {DesignComponent} from "./DesignComponent";
import EventBus from "../../dmdesign/view/EventBus";
import {GeneralEventListener} from "../../blockui/event/GeneralEventListener";
import {UiService} from "../../blockui/service/UiService";
import {BlockViewer} from "../../blockui/uiruntime/BlockViewer";
import {Alert} from "../view/JQueryComponent/Alert";
import {DesignUiService} from "../service/DesignUiService";
import {CodeLevelProvider} from "../../common/CodeLevelProvider";
import {JsTree, JsTreeInfo} from "../../blockui/JsTree/JsTree";
import {SchemaFactory} from "../../datamodel/SchemaFactory";
import {TreeNode, TreeNodeFactory} from "../../common/TreeNode";
import {BlockViewDto} from "../dto/BlockViewDto";
import {DesignTable} from "./DesignTable";
import {JQueryGeneralComponentGenerator} from "../view/JQueryComponent/JQueryGeneralComponentGenerator";
import {Form} from "../../blockui/Form";
import {UiUtils} from "../../common/UiUtils";

/**
 * 设计面板，包含了控件树和控件设计面板。
 */
export class DesignPanel<T> extends BaseUI<T> {

    private lstDesignComponent: Array<DesignComponent<Component>> = [];
    private lstComponentDto: Array<ComponentDto> = [];
    private $compBody: JQuery;
    private currentComp: DesignComponent<Component>;
    private currentDto: ComponentDto;

    private selectListener: GeneralEventListener;
    private blockViewer: BlockViewer;
    //已添加的控件树
    private compTree: JsTree<JsTreeInfo>;
    private isMaskTreeChange = false;
    private isMaskPanelSelectChange = false;
    private isInitDrag = false;
    //默认显示面板
    private isShowForm = true;
    private dTable: DesignTable;
    private dropHandler: (event, data) => void;
    private layoutType = Constants.PositionLayoutType.bootstrapLayout;
    //记录面板的宽度和高度,如果是负数,则不记录
    private width = -1;
    private height = -1;


    private lvlProvider: CodeLevelProvider = CodeLevelProvider.getDefaultCodePro();

    protected createUI(): HTMLElement {
        let $ele = $(require("../templates/DesignPanel.html"));
        this.createCompTree();
        $ele.find(".component-tree").append(this.compTree.getViewUI());
        return $ele.get(0);

    }

    private createCompTree() {
        this.compTree = new JsTree<JsTreeInfo>({
            textField: "title",
            idField: "componentId",
            codeField: "lvlCode",
            rootName: "视图结构",
            dnd: {
                isDraggable: true,
                onlyDroppable: false,
                isCanDrop: (sourceData, parentNodeId) => {
                    if (!this.blockViewer) {
                        return false;
                    }
                    if (!parentNodeId || parentNodeId === "#") {
                        return false;
                    }
                    if (parentNodeId === this.compTree.getDtoInfo().rootId) {
                        return true;
                    }
                    return this.compTree.getNodeData(parentNodeId).data.dispType === Constants.ComponentType.panel;
                }
            },
            buttons: [{
                id: "delete",
                iconClass: "fa fa-trash",
                hint: "删除",
                clickHandler: (event, data) => {
                    this.deleteComp(data);
                }
            }]
        });
        this.compTree.addSelectListener(this);

    }


    afterComponentAssemble(): void {
        this.$compBody = this.$element.find(".form-body");
        this.$element.find(".split-pane")['splitPane']();
        //       this.compTree.afterComponentAssemble();
        this.dropHandler = (event, data) => {
            if (!this.blockViewer) {
                return;
            }
            //这个是放到面板上
            if (this.$element.find(".design-body").find(data.event.target).length > 0
                || data.event.target === this.$element.find(".design-body").get(0)) {
                let component = this.createByColumn(data.data.origin.get_node(data.data.nodes[0]).data);
                this.compTree.setValue(this.lstComponentDto);

                CommonUtils.readyDo(() => {
                    return this.compTree.isReady()
                }, () => {
                    if (!this.isShowForm) {
                        this.resortComponentByTree();
                    }
                    this.selectDesignItem(component.getComponentDto().componentId);
                });

            } else {//这里是控件树自己拖动
                this.resortComponentByTree();
            }
        };

        $(document).on("dnd_stop.vakata.jstree", this.dropHandler);

        super.afterComponentAssemble();
    }

    protected initEvent() {
        EventBus.addListener(EventBus.SELECT_CHANGE_EVENT, this);
        EventBus.addListener(EventBus.DELETE_COLUMN, this);
    }

    setSelectListener(handler: GeneralEventListener) {
        this.selectListener = handler;
    }

    handleEvent(eventType: string, data: object, source: object) {

        if (eventType === EventBus.SELECT_CHANGE_EVENT) {

            this.currentComp = source as any;
            if (this.selectListener) {
                this.selectListener.handleEvent(EventBus.SELECT_CHANGE_EVENT,
                    this.currentComp.getValue().getComponentDto(), source);
            }
            if (!this.isMaskTreeChange) {
                this.isMaskPanelSelectChange = true;
                this.selectTreeNode(this.currentComp.getValue().getComponentDto().componentId);
                this.isMaskPanelSelectChange = false;
            }

        } else if (eventType === EventBus.DELETE_COLUMN) {
            if (this.currentComp === source) {
                this.currentComp = null;
            }
            this.deleteComp(source as any);
        } else if (eventType === JsTree.EVENT_SELECT_CHANGED) {
            if (!data) {
                return;
            }
            if (!this.isMaskPanelSelectChange) {
                this.isMaskTreeChange = true;
                this.selectDesignItem(data['componentId']);
                this.isMaskTreeChange = false;
            }
            //如果是table.需要调用一下上级的事件处理
            if (!this.isShowForm) {
                this.selectListener.handleEvent(EventBus.SELECT_CHANGE_EVENT,
                    this.findComponentDto(data['componentId']), source);
            }
        }
    }

    private selectDesignItem(comId) {
        if (this.isShowForm) {
            this.$element.find("[comid=" + comId + "]").trigger("mousedown");
        } else {
            this.currentDto = this.findComponentDto(comId);
            CommonUtils.readyDo(() => {
                return this.dTable.isReady()
            }, () => {
                this.dTable.selectCol(comId);
            })


        }
    }

    showAsForm(layoutType = Constants.PositionLayoutType.bootstrapLayout) {
        if (this.isShowForm && this.layoutType == layoutType) {
            return;
        }
        this.blockViewer.setLstComponent(this.getData());
        this.clear(false);
        this.layoutType = layoutType;
        this.showForm();
    }

    showAsTable() {
        if (!this.isShowForm) {
            return;
        }
        this.blockViewer.setLstComponent(this.getData());
        this.clear(false);
        this.showTable();
    }

    valueChanged(propertyName, value) {
        if (propertyName == "rowSpan") {
            this.height = value;
            this.handleContainerSize();
            return;
        }
        if (propertyName == "colSpan") {
            this.width = value;
            this.handleContainerSize();
            return;
        }
        if (propertyName === "title") {
            this.compTree.changeCurrentNodeText(value);
        }
        let isOk = false;
        if (this.isShowForm) {//面板自己处理修改属性
            if (this.currentComp) {
                isOk = this.currentComp.propertyChanged(propertyName, value);
            }

        } else {
            //表格则需要在此处理属性变化
            if (this.currentDto) {
                this.currentDto[propertyName] = value;
            }
            this.dTable.propertyChanged(propertyName, value);
            isOk = true;
        }
        if (isOk) {
            return true;
        }
        return false;
    }

    private createByColumn(colDto: ColumnDto) {
        let component = this.createComponentInfo(colDto);
        let code;
        if (!this.lstComponentDto || this.lstComponentDto.length < 1) {
            this.lvlProvider.setCurCode('');
        } else {
            this.lvlProvider.setCurCode(this.lstComponentDto[this.lstComponentDto.length - 1].lvlCode);
        }
        component.getComponentDto().lvlCode = this.lvlProvider.getNext();
        this.addComponent(component);
        return component;
    }

    private selectTreeNode(comId) {
        if (!this.isMaskTreeChange) {
            this.isMaskTreeChange = true;
            this.compTree.selectNodeById(comId, true);
        }
        this.isMaskTreeChange = false;
    }

    private addComponent(component: Component): DesignComponent<any> {
        this.lstComponentDto.push(component.getComponentDto());
        let newCom = new DesignComponent(component);
        if (this.isShowForm) {
            this.lstDesignComponent.push(newCom);

            this.$compBody.append(newCom.getViewUI());
//            newCom.afterComponentAssemble();
        } else {
            this.blockViewer.getLstComponent().push(component);
        }
        if (!this.isInitDrag && !this.isFixLayout()) {
            this.$compBody['dragsort']({
                dragEnd: (item) => {
                    this.resortComponentByPanel();
                    return true;
                }
            });
            this.isInitDrag = true;
        }
        if (this.isFixLayout()) {
            this.$compBody['dragsort']("destroy");
            this.isInitDrag = false;
        }


        return newCom;
    }

    private isFixLayout() {
        return this.layoutType == Constants.PositionLayoutType.absoluteLayout;
    }

    private resortComponentByPanel() {
        let newLstComp = [];
        this.lstComponentDto = [];
        let codeProvider = new CodeLevelProvider();
        codeProvider.setCurCode("000");
        if (this.lstDesignComponent.length > 0) {
            this.$compBody.children(".design-component").each((index, item) => {
                let designComp = this.getComponentInfoById($(item).attr(DesignComponent.COMID));
                this.addCompInfo(designComp, codeProvider, newLstComp);
            });
            this.compTree.setValue(this.lstComponentDto);
            if (this.currentComp && !this.isMaskTreeChange) {
                this.isMaskTreeChange = true;
                this.compTree.selectNodeById(this.currentComp.getValue().getComponentDto().componentId);
            }
            this.isMaskTreeChange = false;
        }
    }

    private addCompInfo(designComp: DesignComponent<Component>, codeProvider: CodeLevelProvider, newLstComp: Array<DesignComponent<any>>) {
        let curLevel = codeProvider.getNext();
        designComp.getDtoInfo().getComponentDto().lvlCode = curLevel;
        newLstComp.push(designComp);
        this.lstComponentDto.push(designComp.getDtoInfo().getComponentDto());
        if (designComp.getSubDesignComp().length > 0) {
            codeProvider.getSubNext();
            for (let com of designComp.getSubDesignComp()) {
                this.addCompInfo(com, codeProvider, newLstComp);
            }
        }
        codeProvider.setCurCode(curLevel);
    }

    private resortComponentByTree() {
        let comps = this.getData();
        this.lstComponentDto = [];
        this.reshowDesignPanel(comps);
    }

    private deleteComp(comp: DesignComponent<any> | object) {
        if (comp instanceof DesignComponent) {
            let index = this.lstDesignComponent.indexOf(comp);
            this.lstDesignComponent.splice(index, 1);
            this.lstComponentDto.splice(index, 1);
            comp.destroy();
        } else {
            if (this.lstDesignComponent) {
                this.removeCompById(comp['data'].componentId);
            }
            this.compTree.getJsTree().delete_node(comp);

            this.resortComponentByTree();
        }
        this.compTree.setValue(this.lstComponentDto);
    }

    private removeCompById(comId) {
        if (this.lstDesignComponent) {
            for (let i = 0; i < this.lstDesignComponent.length; i++) {
                if (this.lstDesignComponent[i].getDtoInfo().getComponentDto().componentId == comId) {
                    let comp = this.lstDesignComponent.splice(i, 1);
                    comp[0].destroy();
                    return;
                }
            }
        }
    }

    private createComponentInfo(colDto: ColumnDto) {
        let comp = new Component();
        let col = new Column();
        col.setColumnDto(colDto);
        comp.setColumn(col);
        let compDto = new ComponentDto();
        compDto.dispType = this.getDisplayTypeByFieldType(colDto);
        compDto.title = colDto.title;
        compDto.columnId = colDto.columnId;
        compDto.componentId = CommonUtils.genId();
        compDto.titleSpan = 3;
        compDto.horSpan = this.isFixLayout() ? 240 : 4;
        compDto.verSpan = this.isFixLayout() ? 30 : 1;
        if (this.isFixLayout()) {
            compDto.posTop = 100;
            compDto.posLeft = 300;
        }
        compDto.versionCode = this.blockViewer.getBlockViewDto().versionCode;
        compDto.blockViewId = this.blockViewer.getBlockViewDto().blockViewId;
        compDto.componentId = CommonUtils.genId();
        comp.setLayoutType(this.layoutType);
        comp.setComponentDto(compDto);
        return comp;
    }


    private getDisplayTypeByFieldType(colDto: ColumnDto) {
        if (colDto.refId) {
            return Constants.ComponentType.select;
        }
        let colType = colDto.fieldType;
        if (colType == Constants.FieldType.int || colType == Constants.FieldType.decimal) {
            return Constants.ComponentType.number;
        } else if (colType == Constants.FieldType.datetime) {
            return Constants.ComponentType.time;
        } else {
            return Constants.ComponentType.text;
        }
    }

    public getData(lvlCode?: string): Array<Component> {
        let oraData = this.compTree.getJsTree().get_json(null, {flat: false});
        if (oraData && oraData.length > 0) {
            let lstComp = [];
            let provider = new CodeLevelProvider();
            let data = oraData[0].children;
            for (let row of data) {
                this.getTreeValue(provider, lstComp, row);
            }
            return lstComp;
        }
        return null;
    }

    private getTreeValue(codeLevelProvider: CodeLevelProvider, result, rowData) {
        let curCode = codeLevelProvider.getNext();
        let component = this.getComponentInfoById(rowData.data.componentId);
        component.getDtoInfo().getComponentDto().lvlCode = curCode;
        //这里需要恢复扩展信息,也就是到得一次信息后,需要刷新,设置面板才可以正常显示
        component.getDtoInfo().getComponentDto().horSpan = component.getHorSpan();
        component.getDtoInfo().getComponentDto().verSpan = component.getVerSpan();
        result.push(component.getDtoInfo());
        if (rowData.children) {
            codeLevelProvider.goSub();
            for (let subRow of rowData.children) {
                this.getTreeValue(codeLevelProvider, result, subRow);
            }
        }
        codeLevelProvider.setCurCode(curCode);
    }

    private getComponentDtoById(comId) {
        if (this.lstComponentDto) {
            for (let dto of this.lstComponentDto) {
                if (dto.componentId == comId) {
                    return dto;
                }
            }
        }
        return null;
    }

    doSave(viewInfo: BlockViewDto, onSuccess: () => void) {
        this.blockViewer.setLstComponent(this.getData());
        this.blockViewer.setBlockViewDto(viewInfo);

        DesignUiService.saveBlockViewer(this.blockViewer, (err) => {
            if (CommonUtils.isEmpty(err)) {
                UiService.clearCache(this.blockViewer.getBlockViewDto().blockViewId);
                Alert.showMessage("保存成功");
                onSuccess();
            } else {
                Alert.showMessage({message: "保存失败,原因:" + err, type: Alert.type.warning});
            }
        });
    }

    private getComponentInfoById(id): DesignComponent<Component> {
        if (this.isShowForm && this.lstDesignComponent.length > 0) {
            for (let com of this.lstDesignComponent) {
                if (com.getAttributes().getComponentDto().componentId == id) {
                    return com;
                }
            }
        } else {
            for (let com of this.blockViewer.getLstComponent()) {
                if (com.getComponentDto().componentId == id) {
                    return new DesignComponent(com);
                }
            }
        }

        return null;
    }

    destroy(): boolean {
        EventBus.removeListener(EventBus.SELECT_CHANGE_EVENT, this);
        EventBus.removeListener(EventBus.DELETE_COLUMN, this);
        this.clear();
        this.currentComp = null;
        this.selectListener = null;
        this.$compBody = null;
        EventBus.clearEvent();
        $(document).off("dnd_stop.vakata.jstree", this.dropHandler);
        return super.destroy();
    }

    async showBlock(blockId, version) {
        this.ready = false;
        if (this.blockViewer) {
            this.clear();
        }
        if (blockId) {
            this.blockViewer = await UiService.getSchemaViewerDirect(blockId) as BlockViewer;
            this.layoutType = this.blockViewer.getBlockViewDto().layoutType;
            this.showComponent();
        } else {
            this.blockViewer = null;
        }

    }

    private reshowDesignPanel(lstComp: Array<Component>) {
        this.clear();
        this.blockViewer.setLstComponent(lstComp);
        this.isMaskTreeChange = true;
        this.showComponent();
        this.isMaskTreeChange = false;

    }

    private showComponent() {
        this.clear();
        this.lstComponentDto = [];
        if (this.blockViewer) {
            this.width = this.blockViewer.getBlockViewDto().colSpan;
            this.height = this.blockViewer.getBlockViewDto().rowSpan;
            if (this.blockViewer.getBlockViewDto().defaultShowType == Constants.DispType.table) {
                this.showTable();
            } else {
                this.showForm();
            }

            this.compTree.setValue(this.lstComponentDto);
        }
        this.ready = true;
    }

    private showTable() {
        this.$element.find(".form-body").resizable({
            stop: (e) => {
                this.height = this.$element.find(".form-body").height();
                this.width = this.$element.find(".form-body").width();
                this.$element.setGridWidth(this.width);
            }
        });
        this.isShowForm = false;
        this.blockViewer.getBlockViewDto().defaultShowType = Constants.DispType.table;
        this.blockViewer.getBlockViewDto()
        this.dTable = new DesignTable(this.blockViewer);
        this.dTable.addSelectChangeListener({
            handleEvent: (eventType: string, comID: any, value: any, extObject?: any) => {
                if (eventType === EventBus.SELECT_CHANGE_EVENT) {
                    this.currentComp = null;
                    if (this.selectListener) {
                        this.selectListener.handleEvent(EventBus.SELECT_CHANGE_EVENT,
                            this.findComponentDto(comID), value);
                    }
                    if (!this.isMaskTreeChange) {
                        this.isMaskPanelSelectChange = true;
                        this.selectTreeNode(comID);
                        this.isMaskPanelSelectChange = false;
                    }
                } else if (eventType === EventBus.VALUE_CHANGE_EVENT) {
                    this.findComponentDto(comID as any).width = value;
                }
            }
        })
        this.$compBody.append(this.dTable.getViewUI());
        this.lstComponentDto = [];
        if (this.blockViewer.getLstComponent()) {
            for (let comp of this.blockViewer.getLstComponent()) {
                this.lstComponentDto.push(comp.getComponentDto());
            }
        }
        this.handleContainerSize();

    }

    private findComponentDto(compId) {
        if (this.lstComponentDto) {
            for (let dto of this.lstComponentDto) {
                if (dto.componentId == compId) {
                    return dto;
                }
            }
        }
        return null;
    }

    private showForm() {

        this.$element.find(".form-body").resizable({
            stop: (e) => {
                this.height = this.$element.find(".form-body").height();
                this.width = this.$element.find(".form-body").width();
                this.fireEvent(EventBus.VALUE_CHANGE_EVENT, {height: this.height, width: this.width});
                UiUtils.fireResizeEvent();
            }
        });
        //这里设置只会影响设计界面的显示方式,不会写入到后台
        this.blockViewer.getBlockViewDto().defaultShowType = Constants.DispType.form;
        this.isShowForm = true;
        if (this.layoutType == Constants.PositionLayoutType.absoluteLayout) {
            this.$compBody.addClass(Form.FIX_POSITION_CLASS);
        } else {
            this.$compBody.removeClass(Form.FIX_POSITION_CLASS);
        }
        if (this.blockViewer.getLstComponent()) {
            this.blockViewer.getLstComponent().forEach(el => {
                el.setLayoutType(this.layoutType);
            });
            let comNodes = TreeNodeFactory.genTreeNode(this.blockViewer.getLstComponent(), "componentDto", "lvlCode");

            if (comNodes) {
                for (let node of comNodes) {
                    this.createSubComponents(null, node);
                }
            }
        }
        this.handleContainerSize();

    }

    private handleContainerSize() {
        let $formBody = this.$element.find(".form-body");
        let num = this.width;
        if (num > 12) {
            $formBody.css("width", num);
        } else if (num > 0) {
            $formBody.addClass("col-md-" + num);
            $formBody.css("width", "auto");
        } else {
            $formBody.css("width", "auto");
        }
        num = this.height;
        if (num > 12) {
            $formBody.css("height", num);
        } else if (num > 0) {
            $formBody.css("height", DesignPanel.rowHeight * num)

        } else {
            $formBody.css("height", "auto");
        }
        if (!this.isShowForm) {
            this.$element.setGridWidth($formBody.width());
        }
        UiUtils.fireResizeEvent();
    }

    /**
     * 创建子组件
     */
    private createSubComponents(panel: DesignComponent<any>, node: TreeNode<Component>) {
        let control = null;
        if (!panel) {
            control = this.addComponent(node.data);
        } else {
            control = this.addSubComponent(node.data, panel);
        }
        if (node.children && node.children.length > 0) {
            for (let subNode of node.children) {
                this.createSubComponents(control, subNode);
            }
        }
    }

    private addSubComponent(component: Component, parent: DesignComponent<any>) {
        this.lstComponentDto.push(component.getComponentDto());
        let newCom = new DesignComponent(component);
        this.lstDesignComponent.push(newCom);
        parent.addSubControl(newCom);
        // newCom.afterComponentAssemble();
        return newCom;
    }

    setLayoutType(layoutType) {
        if (this.layoutType == layoutType) {
            return;
        }
        this.layoutType = layoutType;
        this.updateLayout();
    }

    private updateLayout() {
        if (!this.isShowForm) {
            return;
        }
        this.blockViewer.setLstComponent(this.getData());
        this.clear(false);
        this.showForm();

    }

    /**
     * 取得当前已存在的DS
     */
    getRelationDs() {
        if (this.lstComponentDto) {
            let result = [];
            for (let dto of this.lstComponentDto) {
                let table = SchemaFactory.getTableByColId(dto.columnId);
                if (table) {
                    if (result.indexOf(table.getTableDto().tableId) == -1) {
                        result.push(table.getTableDto().tableId);
                    }
                }

            }
            return result;
        }
        return null;
    }

    private clear(clearTree = true) {
        if (this.lstDesignComponent && this.lstDesignComponent.length > 0) {
            for (let comp of this.lstDesignComponent) {
                comp.destroy();
            }
            this.lstDesignComponent = [];
        }
        this.lstComponentDto = [];
        if (this.dTable) {
            this.dTable.destroy();
            this.dTable = null;
        }
        if (clearTree) {
            this.compTree.setValue(null);
        }

    }

    getCurrentData() {
        if (this.currentComp) {
            return this.currentComp.getValue().getComponentDto();
        }
    }


}
