import {BaseComponent} from "../../BaseComponent";
import {BorderLayout, BorderLayoutProperty} from "../../../../blockui/layout/BorderLayout";
import {Component} from "../../../../blockui/uiruntime/Component";
import {Constants} from "../../../../common/Constants";
import {JsTree} from "../../../../blockui/JsTree/JsTree";
import {JQueryGeneralComponentGenerator} from "../JQueryGeneralComponentGenerator";
import {Schema} from "../../../../datamodel/DmRuntime/Schema";
import {GlobalParams} from "../../../../common/GlobalParams";
import {ButtonPanel, ButtonPanelProperty} from "./ButtonPanel";
import {JQBaseComponent} from "../JQBaseComponent";
import "../template/FilterEditor.css"
import {CommonUtils} from "../../../../common/CommonUtils";
import {Alert} from "../Alert";
import {FormulaParse} from "../../../../datamodel/DmRuntime/formula/FormulaParse";

export class FilterEditor<T extends FilterEditorProperty> extends BaseComponent<T> {
    private static TYPE_TABLE = "0";
    private static TYPE_COL = "1";
    private static TYPE_SYSTEM = "2";
    private fieldTree: JsTree<any>;
    private textArea: JQBaseComponent<any>;
    private btnsPanel: ButtonPanel<ButtonPanelProperty>;
    private layout: BorderLayout<any>;
    private dropHandler: (event, data) => void;

    private filterCN: string;

    protected createUI(): HTMLElement {
        let borderLayoutProperty = BorderLayoutProperty.genDefaultFullProperty();
        borderLayoutProperty.southHeight = 0.4;
        borderLayoutProperty.centerHeight = 0.6;

        this.layout = new BorderLayout(borderLayoutProperty);
        let $ele = FilterEditor.createFullPanel("filter-editor");
        $ele.append(this.layout.getViewUI());
        return $ele.get(0);
    }

    protected initSubControls() {
        let componentInfo = Component.fromSimpleComponent({
            fieldName: "filter",
            title: "条件设计",
            titlePosition: Constants.TitlePosition.none,
            horSpan: 12,
            dispType: Constants.ComponentType.textarea
        });
        this.textArea = new JQueryGeneralComponentGenerator().generateComponent(Constants.ComponentType.textarea,
            componentInfo, null, this) as any;
        $(this.textArea.getViewUI()).addClass("full-display");
        this.textArea.getEditor().addClass("droppable");
        this.layout.addComponent(BorderLayout.center, this.textArea);

        this.editable = this.properties.editable;
        if (this.properties.editable) {
            this.fieldTree = new JsTree<any>({
                rootName: "可用参数",
                showSearch: true,
                loadOnReady: true,
                idField: "id",
                textField: "name",
                parentField: "parentId",
                dnd: {
                    onlyDroppable: true,
                    isDraggable: true
                }
            });


            this.layout.addComponent(BorderLayout.west, this.fieldTree);

            this.btnsPanel = new ButtonPanel({
                clickHandle: (value) => {
                    if (!this.editable) {
                        return;
                    }
                    this.insertText(value);
                },
                isFilter: this.properties.isFilter
            });
            this.layout.addComponent(BorderLayout.south, this.btnsPanel);

        }
        this.layout.show();
    }

    protected initEvent() {
        this.dropHandler = (event, data) => {

            if (!this.editable) {
                return;
            }
            if (event.currentTarget.activeElement === this.textArea.getEditor().get(0)) {
                let str = this.createStrBydTreeData(data.data.origin.get_node(data.data.nodes[0]).data);
                this.insertText(str);
            }
        };
        this.textArea.getEditor().on("mouseover", (e) => {

            this.textArea.getEditor().trigger("focus");
            this.textArea.getEditor().trigger("click");
        });
        if (this.fieldTree) {
            this.fieldTree.addReadyListener(() => {
                this.fieldTree.setValue(this.extractTreeInData());
            });
            this.fieldTree.addDblClick({
                handleEvent: (eventType: string, node: any, source: any, extObject?: any) => {
                    if (!node || node.type === FilterEditor.TYPE_TABLE) {
                        return;
                    }
                    let str = this.createStrBydTreeData(node.data);
                    this.insertText(str);
                }
            })
        }
    }

    private createStrBydTreeData(data) {
        if (data.type === FilterEditor.TYPE_TABLE) {
            return "";
        } else if (data.type === FilterEditor.TYPE_COL) {
            return "${" + data.fullName + "}";
        } else {
            return "#{" + data.fullName + "}";
        }

    }

    afterComponentAssemble(): void {
        $(document).on("dnd_stop.vakata.jstree", this.dropHandler);
    }

    private insertText(str) {
        let curPos = this.getCursorPos();
        let endPos = this.getEndPos();
        if (curPos < 0) {
            this.textArea.setValue(this.textArea.getValue() + str);
            this.textArea.getEditor()['selectionStart'] = this.textArea.getValue().length;
            this.textArea.getEditor()['selectionEnd'] = this.textArea.getValue().length;
            this.textArea.getEditor().trigger("focus");
        } else {
            let value = this.textArea.getValue() as string;
            let pre = value.substr(0, curPos) + str + value.substr(endPos);
            this.textArea.setValue(pre);
            this.textArea.getEditor().get(0)['selectionStart'] = curPos + str.length;
            this.textArea.getEditor().get(0)['selectionEnd'] = curPos + str.length;
            this.textArea.getEditor().trigger("focus");
        }
    }


    private getCursorPos() {
        let cursorPosition = -1;
        if (CommonUtils.isIE()) {
            let range = document['selection'].createRange();
            range.moveStart("character", -this.textArea.getEditor().get(0)['value'].length);
            cursorPosition = range.text.length;
        } else {//非IE浏览器
            cursorPosition = this.textArea.getEditor().get(0)['selectionStart'];
        }
        return cursorPosition;
    }

    private getEndPos() {
        let endPosition = -1;
        if (CommonUtils.isIE()) {
            let range = document['selection'].createRange();
            range.moveStart("character", -this.textArea.getEditor().get(0)['value'].length);
            endPosition = range.text.length;
        } else {//非IE浏览器
            endPosition = this.textArea.getEditor().get(0)['selectionEnd'];
        }
        return endPosition;
    }

    private extractTreeInData() {
        let result = this.extractTableAndColData();
        result.push(...this.extractSysParam());
        return result;
    }

    destroy(): boolean {
        this.textArea.destroy();
        this.fieldTree.destroy();
        this.layout.destroy();
        this.dropHandler = null;
        return super.destroy();
    }

    /**
     * 生成表和列信息
     */
    private extractTableAndColData() {

        if (!this.properties.schema) {
            return [];
        }
        let tables = this.properties.schema.getLstTable();
        if (!tables) {
            return [];
        }
        let result = [];
        let row;
        let tableId;
        let tableNameCN = "";
        for (let table of tables) {
            row = {};
            tableId = "T_" + table.getTableDto().tableId;
            row.id = tableId;
            row.name = table.getTableDto().title;
            tableNameCN = row.name;
            row.type = FilterEditor.TYPE_TABLE;
            row.data = table;
            result.push(row);
            let lstCol = table.getLstColumn();
            if (!lstCol) {
                continue;
            }
            for (let col of lstCol) {
                row = {};
                row.id = col.getColumnDto().columnId;
                row.name = col.getColumnDto().title + "[" + col.getColumnDto().fieldName + "]";
                row.parentId = tableId;
                row.data = col;
                row.fullName = tableNameCN + "." + col.getColumnDto().title;
                row.type = FilterEditor.TYPE_COL;
                result.push(row);
            }
        }
        return result;

    }

    /**
     * 检查公式是不是正确
     */
    check(silence?): boolean {
        try {
            this.getFilterInner();
            if (!silence) {
                Alert.showMessage("检查通过!")
            }
        } catch (e) {
            Alert.showMessage("检查未通过!    " + e.message);
            return false;
        }
        return true;
    }


    /**
     * 生成系统参数
     */
    private extractSysParam() {
        let rootVirtualId = -999999;
        let allGlobalParams = GlobalParams.getAllGlobalParams();
        let result = [];
        let row;
        row = {};
        row.id = rootVirtualId;
        row.name = "系统参数";
        row.type = FilterEditor.TYPE_TABLE;
        result.push(row);
        for (let param of allGlobalParams) {
            row = {};
            row.id = param.id;
            row.name = param.name;
            row.parentId = rootVirtualId;
            row.data = param;
            row.fullName = param.name;
            row.type = FilterEditor.TYPE_SYSTEM;
            result.push(row);
        }
        return result;
    }


    getValue(): any {
        return this.textArea.getValue();
    }

    getFilterInner() {
        return FormulaParse.getInstance(this.properties.isFilter,
            this.properties.schema).transToInner(this.getValue());
    }

    setFilterInner(value) {
        try {
            this.setValue(FormulaParse.getInstance(this.properties.isFilter,
                this.properties.schema).transToCn(value));
        } catch (e) {
            this.setValue(value);
        }
    }

    setValue(value: any, extendData?) {
        this.filterCN = value;
        this.textArea.setValue(value);
    }
}


export interface FilterEditorProperty {
    schema: Schema,
    editable: boolean,
    isFilter: boolean,
    onOk: (value) => void;
}
