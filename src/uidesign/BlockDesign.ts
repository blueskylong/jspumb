import {MenuFunc} from "../decorator/decorator";
import {JsTree, JsTreeInfo} from "../blockui/JsTree/JsTree";
import "./templates/BlockDesign.css";
import {SelectDsDlg} from "./dialog/SelectDsDlg";
import {DesignUiService} from "./service/DesignUiService";
import {DesignPanel} from "./blockdv/DesignPanel";
import {Form} from "../blockui/Form";
import EventBus from "../dmdesign/view/EventBus";
import {CommonUtils} from "../common/CommonUtils";
import {Alert} from "./view/JQueryComponent/Alert";
import {Dialog, DialogInfo} from "../blockui/Dialog";
import {GlobalParams} from "../common/GlobalParams";
import {BlockViewDto} from "./dto/BlockViewDto";
import {Constants} from "../common/Constants";
import {InputDlg} from "../blockui/dialogs/InputDlg";
import {Select} from "./view/JQueryComponent/Select";
import {IComponentGenerator} from "./view/generator/IComponentGenerator";
import {JQueryGeneralComponentGenerator} from "./view/JQueryComponent/JQueryGeneralComponentGenerator";
import {CodeLevelProvider} from "../common/CodeLevelProvider";
import {MenuInfo} from "../sysfunc/menu/dto/MenuInfo";
import {MenuFunction} from "../blockui/MenuFunction";
import {MenuButtonDto} from "../sysfunc/menu/dto/MenuButtonDto";
import {DmConstants} from "../datamodel/DmConstants";
import {UiUtils} from "../common/UiUtils";
import {StringMap} from "../common/StringMap";
import {SchemaFactory} from "../datamodel/SchemaFactory";

@MenuFunc("BlockDesign")
export default class BlockDesign<T extends MenuInfo> extends MenuFunction<T> {
    private schemaId = 2;
    private generator: IComponentGenerator = new JQueryGeneralComponentGenerator();
    private selectDsDlg: SelectDsDlg;

    private dsTree: JsTree<JsTreeInfo>;
    //设计面板
    private designPanel: DesignPanel<any>;
    //控件属性面板
    private fColAttr: Form;
    //块属性面板
    private fBlock: Form;
    //最后选择的视图ID
    private lastBlockId = -1;

    //视图树
    private blockTree: JsTree<JsTreeInfo>;
    private selectedTable: Array<number>;
    private blockDlg: InputDlg;
    private schemaSelect: Select<any>;

    private confirmDlg: Dialog<DialogInfo>;

    protected createUI(): HTMLElement {

        this.blockDlg = new InputDlg({
            title: "增加视图",
            inputTitle: "视图名称",
            isCanEmpty: false,
            destroyOnClose: false,
            onOk: (items) => {
                this.addView(this.blockDlg.getValue());
                return true;
            }
        });
        let $ele = $(require("./templates/BlockDesign.html"));

        this.dsTree = new JsTree<any>({
            rootName: "数据源",
            multiSelect: false,
            textField: "name",
            idField: "id",
            parentField: "parent",
            showSearch: true,
            dnd: {
                isDraggable: true,
                onlyDroppable: true
            }
        });
        $ele.find(".ds-tree").append(this.dsTree.getViewUI());
        UiUtils.addAutoHeightFit(this.dsTree.getViewUI());

        this.blockTree = new JsTree<JsTreeInfo>({
            rootName: "视图",
            textField: "blockViewName",
            idField: "blockViewId",
            codeField: "lvlCode",
            url: () => {
                return "/ui/getBlockViews/" + this.schemaId
            },
            dnd: {isDraggable: true, onlyDroppable: false},
            buttons: [{
                id: "delete",
                iconClass: "fa fa-trash",
                hint: "删除",
                clickHandler: (event, data) => {
                    this.doDelete(data);
                }
            }, {
                id: "add",
                iconClass: "fa fa-plus",
                hint: "增加",
                clickHandler: (event, data) => {
                    this.blockTree.selectNode(data.id);
                    this.doAdd();
                }
            }],
            onReady: () => {
                // this.clearAttrShow();
            }

        });
        let compInfo = Form.genSimpDto(Constants.ComponentType.select, "方案选择", 12, "c1", 85);
        this.schemaSelect = <Select<any>>this.generator.generateComponent(compInfo.getComponentDto().dispType,
            compInfo, $ele.find(".block-tree").get(0), {
                handleEvent: (eventType: string, field: any, value: any, extObject?: any) => {
                    this.schemaSelectChanged(value);
                }
            });
        $ele.find(".block-tree").append(this.schemaSelect.getViewUI());
        $ele.find(".block-tree").append(this.blockTree.getViewUI());

        UiUtils.addAutoHeightFit(this.blockTree.getViewUI());

        this.designPanel = new DesignPanel<any>({});
        $ele.find(".design-form").append(this.designPanel.getViewUI());

        this.fBlock = Form.getInstance(50);
        $ele.find(".form-attr").append(this.fBlock.getViewUI());

        this.fColAttr = Form.getInstance(55);
        $ele.find(".col-attr").append(this.fColAttr.getViewUI());
        return $ele.get(0);
    }

    private updateTree(data) {
        this.dsTree.setValue(data);
    }

    private getSelectDsDlg() {
        this.selectDsDlg = new SelectDsDlg({
            title: "请选择数据表",
            onOk: (items) => {
                this.selectedTable = items;
                if (items && items.length > 0) {
                    DesignUiService.findTablesAndFields(items, (data) => {
                        this.updateTree(data)
                    });
                }
                return true;
            }
        });
        return this.selectDsDlg;
    }

    private addView(viewName) {
        if (CommonUtils.isEmpty(viewName)) {
            return;
        }
        let parentId = "null";
        let node = this.blockTree.getCurrentNode();
        if (node && node.data) {
            parentId = node.data.blockViewId;
        }
        DesignUiService.genNewBlockViewer(viewName, this.schemaId, parentId, (newId) => {
            this.blockTree.getJsTree().refresh(false, true);
            this.blockTree.selectNodeById(newId);
        });
    }

    afterComponentAssemble(): void {
        this.bindEvent();
        this.fireReadyEvent();
        setTimeout(() => {
            this.schemaSelect.setValue(DmConstants.DefaultSchemaIDs.DEFAULT_BS_SCHEMA);
            this.schemaSelectChanged(DmConstants.DefaultSchemaIDs.DEFAULT_BS_SCHEMA);

        }, 300);

    }

    private bindEvent() {
        this.$element.find(".split-pane")['splitPane']();
        this.$element.find(".btnSelectDs").on("click", (e) => {
            this.getSelectDsDlg().setSchemaId(this.schemaId).show(this.selectedTable);
        });
        this.blockTree.addDropListener({
            handleEvent: (eventType: string, data: any, source: any, extObject?: any) => {
                this.saveBlockLvl();
            }
        });

        this.blockTree.addSelectListener({
            handleEvent: (type, data) => {
                if (data) {
                    if (this.lastBlockId == data['blockViewId']) {
                        return;
                    }
                    this.lastBlockId = data['blockViewId'];
                    this.fBlock.setValue(data);
                    this.designPanel.showBlock(this.lastBlockId, data['versionCode']);
                    CommonUtils.readyDo(() => {
                        return this.designPanel.isReady();
                    }, () => {
                        this.selectedTable = this.designPanel.getRelationDs();

                        if (this.selectedTable && this.selectedTable.length > 0) {

                            DesignUiService.findTablesAndFields(this.selectedTable, (data) => {
                                this.updateTree(data)
                            })
                        }
                    });
                }
            }
        });
        this.designPanel.setSelectListener(this);
        this.designPanel.addListener(EventBus.VALUE_CHANGE_EVENT, {
            //这里的数据是高度和宽度
            handleEvent: (eventType: string, data: any, source: any, extObject?: any) => {
                if (this.lastBlockId > 0) {
                    this.fBlock.setFieldValue("rowSpan", data["height"]);
                    this.fBlock.setFieldValue("colSpan", data["width"]);
                }
            }
        });
        this.fBlock.addValueChangeListener({
            handleEvent: (eventType: string, field: any, value: any, extObject?: any) => {
                if (field == "defaultShowType") {
                    if (value == Constants.DispType.table) {
                        this.designPanel.showAsTable();
                    } else {
                        this.designPanel.showAsForm();
                    }
                } else if (field == "layoutType") {
                    this.designPanel.setLayoutType(value);
                } else if (field == "colSpan" || field == "rowSpan") {
                    this.designPanel.valueChanged(field, value);
                }
            }
        });
        this.fColAttr.addValueChangeListener(this);
    }

    handleEvent(eventType: string, data: object, value: object) {
        if (eventType === EventBus.SELECT_CHANGE_EVENT) {
            this.fColAttr.setValue(data);
        } else if (eventType === EventBus.VALUE_CHANGE_EVENT) {
            //如果变化不成功,则要恢复
            if (!this.designPanel.valueChanged(data, value)) {
                this.fColAttr.setValue(this.designPanel.getCurrentData());
            }
        }
    }

    private saveBlockLvl() {
        let oraData = this.blockTree.getJsTree().get_json(null, {flat: false});
        if (oraData && oraData.length > 0) {
            let obj = {};
            let provider = new CodeLevelProvider();
            let data = oraData[0].children;
            for (let row of data) {
                this.makeLevel(provider, row, obj);
            }
            let curId = null;
            if (this.blockTree.getCurrentData()) {
                curId = this.blockTree.getCurrentData().blockViewId;
            }
            DesignUiService.updateBlockLevel(obj, DmConstants.DefaultSchemaIDs.DEFAULT_SYS_SCHEMA, (data) => {
                this.blockTree.reload();
                if (curId) {
                    this.blockTree.selectNodeById(curId);
                    UiUtils.hideMask();
                }
            });
        }
        return true;
    }

    private schemaSelectChanged(schemaId: number) {
        this.schemaId = schemaId;
        this.blockTree.reload();
        this.clearAttrShow();
        let mapParam = new StringMap();
        mapParam.set("schema", SchemaFactory.getSchema(this.schemaId, GlobalParams.getLoginVersion()));
        this.fColAttr.setExtendData(mapParam)
    }

    private makeLevel(codePro: CodeLevelProvider, node, obj) {

        let curCode = codePro.getNext();
        obj[node.data.blockViewId] = curCode;

        if (node.children && node.children.length > 0) {
            codePro.goSub();
            for (let subNode of node.children) {
                this.makeLevel(codePro, subNode, obj);
            }
            codePro.setCurCode(curCode);
        }
    }

    doSave() {
        this.designPanel.doSave(this.fBlock.getValueForObject(BlockViewDto), () => {
            this.refresh();
        });
    }

    doAdd() {
        this.blockDlg.show(null);
    }

    refresh() {
        let viewId = this.blockTree.getCurrentData().blockViewId;
        this.blockTree.getJsTree().refresh();
        this.blockTree.selectNodeById(viewId);
    }

    beforeClose(): boolean {
        return true;
    }

    getButton(): Array<MenuButtonDto> {
        let addButton = new MenuButtonDto();
        addButton.funcName = "doAdd";
        addButton.title = "增加";
        addButton.iconClass = "fa fa-plus-circle";
        let saveButton = new MenuButtonDto();
        saveButton.funcName = "doSave";
        saveButton.title = "保存";
        saveButton.iconClass = "fa fa-floppy-o";
        let deleteButton = new MenuButtonDto();
        deleteButton.funcName = "doDelete";
        deleteButton.title = "删除";
        deleteButton.iconClass = "fa fa-trash";

        return [addButton, saveButton, deleteButton];
    }


    destroy(): boolean {
        this.designPanel.destroy();
        this.dsTree.destroy();
        this.blockTree.destroy();
        $.contextMenu("destroy");
        return super.destroy();
    }

    doDelete(data?) {
        let node;
        node = data ? data : this.blockTree.getCurrentNode();
        if (data) {
            node = data;
        }
        if (!node.data) {
            Alert.showMessage({message: "请选择要删除的视图"});
            return;
        }
        if (node.children && node.children.length > 0) {
            Alert.showMessage({message: "此视图下已存在子节点,请先删除!"});
            return;
        }
        this.confirmDlg = new Dialog<DialogInfo>({
            title: "确认",
            content: "确定删除此视图吗?",
            onOk: (items) => {
                DesignUiService.deleteBlockView(node.data.blockViewId, (data) => {
                    Alert.showMessage({message: "删除成功!"});
                    this.blockTree.getJsTree().refresh(false, true);
                    this.clearAttrShow();
                });
                return true;
            }
        });
        this.confirmDlg.show();
    }

    public clearAttrShow() {
        this.lastBlockId = null;
        this.designPanel.showBlock(null, GlobalParams.loginVersion);
        this.fBlock.setValue({});
        this.fColAttr.setValue({});
        this.dsTree.setValue({});
    }
}

