import {Component} from "../../../blockui/uiruntime/Component";
import {JQBaseComponent} from "./JQBaseComponent";
import {FilterExpression} from "../../../datamodel/DmRuntime/formula/FilterExpression";
import {TextArea} from "./TextArea";
import {CommonUtils} from "../../../common/CommonUtils";
import {SchemaFactory} from "../../../datamodel/SchemaFactory";
import {Schema} from "../../../datamodel/DmRuntime/Schema";
import {StringMap} from "../../../common/StringMap";
import {FilterDlg, FilterDlgProperty} from "./formula/FilterDlg";
import {RegComponent} from "../../../decorator/decorator";
import {Constants} from "../../../common/Constants";
import {FormulaParse} from "../../../datamodel/DmRuntime/formula/FormulaParse";
import {TextInput} from "./TextInput";
import {Alert} from "./Alert";
import {GlobalParams} from "../../../common/GlobalParams";

@RegComponent(Constants.ComponentType.filter)
export class FilterInput<T extends Component> extends TextInput<T> {
    static schemaParamName = "schema";
    protected filter: string;
    // protected textArea: TextArea<T>;
    protected schema: Schema;
    protected filterDlg: FilterDlg<any>;

    private buttonElement: JQuery;


    /**
     * 是否需要翻译
     */
    private needTrans = true;

    protected createEditor(id: string) {
        return $("<textarea class='com-editor form-control' id='" + id
            + "' name='" + this.properties.getColumn().getColumnDto().fieldName + "'/>");
    }

    private showDlg() {
        if (this.schema) {

            this.filterDlg = new FilterDlg<FilterDlgProperty>({
                title: this.isFilter() ? "条件设计" : "公式设计",
                isFilter: this.isFilter(),
                editable: this.editable,
                schema: this.schema,
                onOk: (filterCN) => {
                    this.filter = this.filterDlg.getFilterInner();
                    super.setValue(filterCN);
                    this.fireValueChanged(this.properties.column.getColumnDto().fieldName, this.filter);
                    return true;
                },
                //强制保存,则二个表达式一样
                forceSave: (filterCN) => {
                    this.filter = filterCN;
                    super.setValue(filterCN);
                    this.fireValueChanged(this.properties.column.getColumnDto().fieldName, this.filter);
                }
            });
            this.filterDlg.show(this.getValue());
        }
    }

    protected initEvent() {
        this.$element.on("dblclick", (e) => {
            this.showDlg();

        });

        this.$element.on("mouseenter", (event) => {
            if (!this.buttonElement) {
                this.buttonElement = $("<div class='filter-btn fa fa-share-alt-square'></div>");
                this.$element.append(this.buttonElement);
                this.buttonElement.on("click", (event) => {
                    this.showDlg();
                });
            }
            this.buttonElement.show(500);

        });
        this.$element.on("mouseleave", (event) => {
            this.buttonElement.hide(500);
        });
        // this.addValueChangeListener({
        //     handleEvent: (eventType: string, data: any, source: any, extObject?: any) => {
        //         this.doTrans();
        //     }
        // });
        // this.setEditable(false);
        this.editor.attr("readonly", "readonly")
    }

    getRequireExtendDataName(): Array<string> {
        return [FilterInput.schemaParamName];
    }

    setExtendData(data: StringMap<any>) {
        if (!data) {
            console.log("没有提供需要的信息:方案信息");
            return;
        }
        this.schema = data.get(FilterInput.schemaParamName);
        if (this.schema == null) {
            console.log("没有提供需要的信息:方案信息");
            return;
        }
        if (typeof this.schema !== "object") {
            this.schema = SchemaFactory.getSchema(this.schema as any, GlobalParams.getLoginVersion());
        }
    }

    setEditable(editable: boolean) {
        this.editable = editable;

    }

    setEnable(enable: boolean) {
        this.enabled = enable;
    }

    isNeedTrans(): boolean {
        return this.needTrans;
    }

    setNeedTrans(value: boolean) {
        this.needTrans = value;
    }

    private doTrans() {
        let text = this.getValue();
        try {
            this.filter = text;
            if (CommonUtils.isEmpty(text)) {
                return;
            }
            this.filter = FormulaParse.getInstance(this.isFilter(), this.schema).transToInner(text);
            return this.filter;
        } catch (e) {
            console.log("翻译失败:");
            console.log(e);
            this.filter = text;
        }
    }

    getValue(): any {
        return this.filter;
    }

    /**
     * 设置值时,需要将方案iD传入,否则在转换中文时,不好查询.
     * @param value
     * @param extendData
     */
    setValue(value: any, extendData?) {

        this.filter = value;
        try {
            if (this.filter != null) {
                super.setValue(FormulaParse.getInstance(this.isFilter(),
                    this.schema).transToCn(this.filter));
            } else {
                super.setValue(null);
            }
        } catch (e) {
            console.log(e.message);
            super.setValue(this.filter);
        }
    }

    protected isFilter() {
        return true;
    }


}
