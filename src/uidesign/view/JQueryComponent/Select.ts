import {TextInput} from "./TextInput";
import {Component} from "../../../blockui/uiruntime/Component";
import {UiService} from "../../../blockui/service/UiService";
import {ReferenceData} from "../../../datamodel/dto/ReferenceData";
import {StringMap} from "../../../common/StringMap";
import "bootstrap-select/js/i18n/defaults-zh_CN"
import {CommonUtils} from "../../../common/CommonUtils";
import {GlobalParams} from "../../../common/GlobalParams";
import {Column} from "../../../datamodel/DmRuntime/Column";
import {FilterExpression} from "../../../datamodel/DmRuntime/formula/FilterExpression";
import {RegComponent} from "../../../decorator/decorator";
import {Constants} from "../../../common/Constants";

@RegComponent(Constants.ComponentType.select)
export class Select<T extends Component> extends TextInput<T> {
    private valueTitle: StringMap<string> = new StringMap<string>();
    private dataReady = false;
    private hasExtendFilter = false;
    private filterValues: StringMap<object> = new StringMap<object>();

    private paramNames: Array<Column>;


    protected getEditorType() {
        return "select";
    }

    protected async afterCreateEditor($dom?) {
        //生成option
        if (this.properties.column.getColumnDto().refId) {
            let data = [];
            if (this.properties.column.getColumnDto().refFilter) {
                //如果是有额外条件的,则必须由外界提供值之后,才去取值
                this.hasExtendFilter = true;
                //分析参数
                let filterExpression = new FilterExpression();
                filterExpression.parseExpression(this.properties.column.getColumnDto().refFilter);
                let params = filterExpression.getServiceNameAndParams();
                if (filterExpression.isServiceFilter()) {
                    if (params.length > 1) {
                        this.paramNames = params.slice(1) as any;
                    }
                } else {//如果是普通的表达式,则把本方的条件都做成参数
                    this.paramNames = filterExpression.getColParams(this.properties.getColumn().getColumnDto().tableId);
                    //这里只需要把本表的参数传到后台即可
                }

            } else {
                data = await UiService.getReferenceData(
                    this.properties.column.getColumnDto().refId);
            }
            this.initOptions(data)

        } else {
            //这里应用在本地动态插入选择项
            this.editor.selectpicker("refresh");
            this.dataReady = true;
        }

        let $ele = $dom ? $dom : this.$element;
        this.dataReady = true;
    }

    private initOptions(data: Array<any>) {

        this.editor.children().remove();
        this.valueTitle = new StringMap<string>();
        if (!data || data.length < 0) {
            return;
        }
        let editor = this.editor;
        let ref: ReferenceData;
        //如果可以为空
        if (this.properties.getColumn().getColumnDto().nullable) {
            editor.append("<option value=''></option>");
        }
        for (let referenceData of data as any) {
            ref = (<ReferenceData>referenceData);
            this.valueTitle.set(ref.id, ref.name);
            editor.append("<option value='" + ref.id + "'>" + ref.name + "</option>");
        }
        editor.selectpicker("refresh");
    }

    public updateSelection() {
        this.editor.selectpicker("refresh");
    }

    setValue(value: any, extendValue?) {
        //这里增加判断,如果还没有选择项,可能是还没有初始化完成,这里增加一点时间,再试一次
        CommonUtils.readyDo(() => {
            return this.dataReady;
        }, () => {
            super.afterComponentAssemble();
            this.editor.selectpicker('val', value);
            this.handleOptions(extendValue, value);
        });
    }

    parentValueChanged(fullValue: object, comValue?): void {
        this.handleOptions(fullValue, comValue);
    }

    /**
     * 处理选项项
     */
    private async handleOptions(values, comValue) {
        if (!this.hasExtendFilter) {
            return;
        }
        let extendFilterValues = this.getExtendFilterValues(values);
        //如果返回null,则按约定清除数据
        if (extendFilterValues == null) {
            this.initOptions([]);
            this.filterValues = new StringMap<object>();
            return;
        }
        if (this.filterValues.equals(extendFilterValues)) {
            //如果和上次一样,则不处理
            return;
        }
        this.dataReady = false;
        this.filterValues = extendFilterValues;
        if (!comValue) {
            comValue = this.getValue();
        }
        //如果没有提供值,那选项要清空
        let data = [];
        if (extendFilterValues && extendFilterValues.getSize() > 0) {
            data = await UiService.findColumnReferenceData(this.properties.column.getColumnDto().refId,
                this.properties.column.getColumnDto().columnId, extendFilterValues.getValueAsObject());
        }
        this.initOptions(data);
        this.editor.selectpicker('val', comValue);
        this.dataReady = true;
    }

    private getExtendFilterValues(values): StringMap<any> {
        let result = new StringMap<String>();
        if (!values || $.isEmptyObject(values)) {
            return result;
        }
        if (!this.paramNames || this.paramNames.length == 0) {
            return result;
        }

        values = $.extend(false, {}, values, GlobalParams.getGlobalParams());
        for (let column of this.paramNames) {
            let fieldName = column.getColumnDto().fieldName;
            //如果是转换后的字段,则需要跟着转一次
            if (this.properties.isConvertToCamel) {
                fieldName = CommonUtils.toCamel(fieldName);
            }
            if (values.hasOwnProperty(fieldName)) {
                result.set(column.getColumnDto().columnId + "", values[fieldName]);
            } else {
                //如果有一个没有给定值 ,则返回空,不再查询
                return null;
            }
        }
        return result;

    }

    afterComponentAssemble(): void {
        CommonUtils.readyDo(() => {
            return this.dataReady;
        }, () => {
            super.afterComponentAssemble();
            this.setEditable(this.editable);
        });
    }

    getValue(): any {
        return this.editor.selectpicker('val');
    }

    getTitle(): any {
        return this.valueTitle.get(this.getValue());
    }

    addOption(id, title) {
        this.valueTitle.set(id, title);
        this.editor.append("<option value='" + id + "'>" + title + "</option>");
        this.updateSelection();
    }

    protected createEditor(id: string) {
        // @ts-ignore
        return $("<select class='com-editor form-control selectpicker col-'" +
            " name='" + this.properties.column.getColumnDto().fieldName + "' data-size='5' id='" + id +
            "'><option></option></select>");
    }

    setEditable(editable: boolean) {
        super.setEditable(editable);
        if (editable) {
            this.$element.find("button").removeAttr("disabled");
        } else {
            this.$element.find("button").attr("disabled", "readonly");
        }
    }

    setEnable(enable: boolean) {
        super.setEnable(enable);
        if (enable) {
            this.$element.find("button").removeAttr("disabled");
        } else {
            this.$element.find("button").attr("disabled", "disabled");
        }
    }

    destroy(): boolean {
        this.$element.selectpicker('destroy');
        this.valueTitle = null;
        this.filterValues = null;
        this.paramNames = null;
        return super.destroy();
    }
}
