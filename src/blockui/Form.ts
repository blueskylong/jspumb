import {BaseComponent} from "../uidesign/view/BaseComponent";
import {TreeNode, TreeNodeFactory} from "../common/TreeNode";
import {IComponentGenerator} from "../uidesign/view/generator/IComponentGenerator";
import {BlockViewDto} from "../uidesign/dto/BlockViewDto";
import {JQueryGeneralComponentGenerator} from "../uidesign/view/JQueryComponent/JQueryGeneralComponentGenerator";
import {UiService} from "./service/UiService";
import {Component} from "./uiruntime/Component";
import EventBus from "../dmdesign/view/EventBus";
import {CommonUtils} from "../common/CommonUtils";
import {StringMap} from "../common/StringMap";
import {BlockViewer} from "./uiruntime/BlockViewer";
import {GlobalParams} from "../common/GlobalParams";
import {ComponentDto} from "../uidesign/dto/ComponentDto";
import {Constants} from "../common/Constants";
import {ColumnDto} from "../datamodel/dto/ColumnDto";
import {Column} from "../datamodel/DmRuntime/Column";
import {BeanFactory} from "../decorator/decorator";
import {ButtonInfo, Toolbar, ToolbarInfo} from "../uidesign/view/JQueryComponent/Toolbar";
import "./uiruntime/validator";
import {BootstrapValidator} from "./uiruntime/validator/BootstrapValidator";
import "jquery-validation"
import {FormulaCalculator} from "../datamodel/DmRuntime/formula/FormulaCalculator";
import {ControlFilterResult} from "./uiruntime/ControlFilterInfo";


export class Form extends BaseComponent<BlockViewDto> {

    /**
     * 界面编码参数键
     */
    static PARAM_UI_CODE = "ui-code";
    /**
     * 界面ID参数键
     */
    static PARAM_UI_ID = "ui-id";

    /**
     * 字段名对应控件
     */
    protected subComponents: StringMap<BaseComponent<Component>> = new StringMap<BaseComponent<Component>>();
    protected lstComponent: Array<Component>;
    private lstComUI: Array<BaseComponent<Component>>;
    protected values: StringMap<object>;

    protected _blockViewId: number;
    protected _version: string;
    protected generator: IComponentGenerator = new JQueryGeneralComponentGenerator();

    protected editable = true;
    protected enabled = true;
    protected isShowTitle = false;
    protected isShowClose = false;
    protected lstCloseListener: Array<(form: Form) => void>;

    protected $formBody: JQuery;

    protected viewer: BlockViewer;
    //是否本地使用
    private isLocal = false;
    private toolDefaultPos = [20, 1];

    private toolbar: Toolbar<ToolbarInfo>;
    /**
     * 工具栏是不是有位置
     */
    private toolbarHasPosition = false;
    protected formulaCalculator: FormulaCalculator;


    constructor(dto: BlockViewDto) {
        super(dto);
        if (dto) {
            this.blockViewId = dto.blockViewId;
            this.version = dto.versionCode;
        } else {
            this.isLocal = true;
            let blockDto = new BlockViewDto();
            blockDto.colSpan = 12;
            this.properties = blockDto;
            this.viewer = new BlockViewer();
        }
    }

    /**
     * 取得本地视图
     * @param viewer
     */
    static getLocalInstance(viewer: BlockViewer) {
        let form = new Form(null);
        form.setBlockViewer(viewer);
        return form;
    }

    static getInstance(blockId, version?) {
        let blockDto = new BlockViewDto();
        blockDto.blockViewId = blockId;
        blockDto.versionCode = version || GlobalParams.getLoginVersion();
        return new Form(blockDto);
    }

    static getInstanceByCode(uiCode, version?) {
        let blockDto = new BlockViewDto();
        blockDto.blockCode = uiCode;
        blockDto.versionCode = version || GlobalParams.getLoginVersion();
        return new Form(blockDto);
    }

    setExtendData(data: StringMap<any>) {
        this.extendData = data;
        if (this.subComponents.getSize() > 0) {
            let isEmpty = !this.extendData || this.extendData.getSize() < 1;

            let lstComp = this.subComponents.getValues();
            for (let com of lstComp) {
                if (isEmpty) {
                    com.setExtendData(null);
                    continue;
                }
                let names = com.getRequireExtendDataName();
                if (!names) {
                    continue;
                }
                let values = new StringMap<any>();
                for (let name of names) {
                    values.set(name, this.extendData.get(name));
                }
                com.setExtendData(values);
            }
        }
    }

    showHead(isShow) {
        this.isShowTitle = isShow;
        this.updateTitle();

    }

    showClose(isShowClose) {
        this.isShowClose = isShowClose && this.editable;

    }

    getFormBody() {
        return this.$formBody;
    }

    updateTitle() {

        if (!this.$element) {
            return;
        }
        this.$element.find(".form-title").text(this.properties.title);
        if (this.isShowTitle) {
            this.$element.find(".form-head").removeClass(Form.HIDDEN_CLASS);
        } else {
            this.$element.find(".form-head").addClass(Form.HIDDEN_CLASS);
        }
        if (this.isShowClose) {
            this.$element.find(".btn-close").removeClass(Form.HIDDEN_CLASS);
        } else {
            this.$element.find(".btn-close").addClass(Form.HIDDEN_CLASS);
        }
        //如果显示表头，且设置了表单的高，则要加上表头的高度
        if (this.properties.rowSpan > 12 && this.isShowTitle) {
            this.$element.css("height", this.properties.rowSpan + 50);
        }
    }


    setBlockViewer(viewer) {
        this.viewer = viewer;
    }

    get blockViewId(): number {
        return this._blockViewId;
    }

    set blockViewId(value: number) {
        this._blockViewId = value;
    }

    get version(): string {
        return this._version;
    }

    set version(value: string) {
        this._version = value;
    }

    async initSubControls() {
        if (this.isLocal && !this.viewer) {
            return;
        }
        if (!this.viewer) {
            if (this.blockViewId) {
                this.viewer = await UiService.getSchemaViewer(this.blockViewId) as any;
            } else {
                this.viewer = await UiService.getSchemaViewerByCode(this.properties.blockCode) as any;
                this.blockViewId = this.viewer.getBlockViewDto().blockViewId;
            }

        }
        if (!this.isLocal) {
            this.formulaCalculator = FormulaCalculator.getInstance(this.viewer);
        }
        this.lstComponent = this.viewer.getLstComponent();
        this.lstComUI = new Array<BaseComponent<any>>();
        if (!this.lstComponent || this.lstComponent.length == 0) {
            this.lstComponent = [];
            return;
        }
        this.properties = this.viewer.getBlockViewDto();
        let comNodes = TreeNodeFactory.genTreeNode(this.lstComponent, "componentDto", "lvlCode");
        let layoutType = this.properties.layoutType;
        for (let node of comNodes) {
            if (this.properties.fieldToCamel == 1) {
                node.data.column.getColumnDto().fieldName
                    = CommonUtils.toCamel(node.data.column.getColumnDto().fieldName);
                node.data.isConvertToCamel = true;
            }
            node.data.setLayoutType(layoutType);
            this.createSubComponents(this.$formBody.get(0), node);
        }
        this.updateSize();
        this.updateTitle();
        this.onUiDataReady();
        this.initValidator();
    }

    private initValidator() {
        if (!this.isLocal) {
            let validator = new BootstrapValidator(this.viewer);
            validator.bindForm(this);
        }
    }


    public check() {
        return this.$formBody.valid();
    }

    /**
     * 取得指定的子控件
     * @param colId
     */
    public getComponentById(colId) {
        if (this.lstComUI) {
            for (let baseUi of this.lstComUI) {
                if (baseUi.getColumnId() == colId) {
                    return baseUi;
                }
            }
        }
        return null;
    }

    /**
     * 取得指定的子控件
     * @param colId
     */
    public getComponentByName(fieldName) {
        if (this.lstComUI) {
            for (let baseUi of this.lstComUI) {
                if (baseUi.getFieldName() == fieldName) {
                    return baseUi;
                }
            }
        }
        return null;
    }

    private updateSize() {
        if (this.properties.colSpan) {
            if (this.properties.colSpan <= 12) {
                //使用bootstrap布局
                this.$element.addClass("col-md-" + this.properties.colSpan);
            } else {
                this.$element.css("width", this.properties.colSpan);
            }

        }
        if (this.properties.rowSpan) {
            this.$element.css("height", this.properties.rowSpan);
        }
        //计算一下body的大小
        if (this.properties.layoutType == Constants.PositionLayoutType.absoluteLayout) {
            this.getFormBody().css("height", "100%")
                .css("overflow", "auto");
        }
    }

    protected onUiDataReady() {
        this.fireReadyEvent();
    }


    addButton(btnInfo: ButtonInfo | Array<ButtonInfo>) {
        if (!this.toolbar) {
            this.initToolBar();
        }
        if (btnInfo instanceof Array) {
            for (let btn of btnInfo) {
                this.toolbar.addButton(btn);
            }
        } else {
            this.toolbar.addButton(btnInfo);
        }

    }

    private initToolBar() {
        this.toolbar = new Toolbar<ToolbarInfo>({float: true});
        this.$element.append(this.toolbar.getViewUI());
        this.toolbar.setPosition(this.toolDefaultPos[0], this.toolDefaultPos[1]);

        this.toolbarHasPosition = true;
        this.toolbar.setToolbarDragedListener((args, uiparam) => {
            if (Math.abs(uiparam.position.left - this.toolDefaultPos[0]) < 200
                && Math.abs(uiparam.position.top - this.toolDefaultPos[1]) < 20) {
                this.toolbarHasPosition = true;
            } else {
                this.toolbarHasPosition = false;
            }
            this.updateToolbarPosition()
        });
        this.toolbar.setDoubleClickHandler(() => {
            this.toolbarHasPosition = true;
            this.updateToolbarPosition();
        });
        this.updateToolbarPosition();
    }

    private updateToolbarPosition() {
        if (this.toolbarHasPosition) {
            this.$element.addClass("form-has-toolbar");
            this.toolbar.setPosition(20, 1)
        } else {
            this.$element.removeClass("form-has-toolbar");
        }
    }

    setDisplayComponent(viewer: BlockViewer) {
        if (!this.isLocal) {
            throw new Error("在线配置Form,不可以使用此方法");
        }
        this.getViewUI();
        this.viewer = viewer;
        this.initSubControls();
    }

    protected createUI(): HTMLElement {
        let $ele = $(require("./template/Form.html"));
        $ele.attr("blockId", this.blockViewId);

        $ele.find(".close-button").on("click", (event) => {
            if (this.lstCloseListener) {
                for (let listener of this.lstCloseListener) {
                    listener(this);
                }
            }
        });
        this.$formBody = $ele.find(".form-body");
        return $ele.get(0);
    }

    /**
     * 创建子组件
     */
    private createSubComponents(parent: HTMLElement, node: TreeNode<Component>) {
        let component = this.generator.generateComponent(node.data.componentDto.dispType, node.data, parent, this);
        this.lstComUI.push(component);
        $(parent).append(component.getViewUI());
        this.subComponents.set(node.data.column.getColumnDto().fieldName, component);
        if (node.children && node.children.length > 0) {
            for (let subNode of node.children) {
                this.createSubComponents(component.getViewUI(), subNode);
            }
        }
    }


    getColumnId(): number {
        return 0;
    }

    /**
     * 这时注意
     */
    getValue(): object {
        this.stopEdit();
        if (!this.values) {
            this.values = new StringMap<object>();
        }
        return this.values.getValueAsObject();
    }

    /**
     * 这里会少触发一次值的刷新,如果计算
     */
    getCurrentValue(): object {
        if (!this.values) {
            this.values = new StringMap<object>();
        }
        return this.values.getValueAsObject();
    }

    setFieldValue(field, value) {
        let comp = this.subComponents.get(field);
        if (comp) {
            comp.setValue(value);
        }
        this.values.set(field, value);
    }

    getValueForObject<T>(clazz: { new(...args: Array<any>): T }): T {
        return BeanFactory.populateBean(clazz, this.getValue());
    }


    setEditable(editable: boolean) {
        this.editable = editable;
        if (this.subComponents) {
            this.subComponents.forEach((key, value, map) => {
                value.setEditable(editable);
            });
        }
    }

    public isEditable() {
        return this.editable;
    }

    setEnable(enable: boolean) {
        this.enabled = enable;
        if (this.subComponents) {
            this.subComponents.forEach((key, value, map) => {
                value.setEnable(enable);
            });
        }
    }

    public isEnabled() {
        return this.enabled;
    }

    setValue(value: any) {
        //先去掉焦点
        this.stopEdit();
        this.values = new StringMap<object>(value);
        this.updateSubComponentValues();
    }

    /**
     * 计算所有公式
     */
    async calcAllField() {
        let value = this.getValue();
        let mapValue = this.formulaCalculator.calcAllFormula(value);
        this.updateChangedValue(mapValue);
        let mapControlResult = await this.formulaCalculator.calcAllControlFilter(value);
        this.updateControlShowFilter(mapControlResult);
    }

    public stopEdit() {
        if (this.editable) {
            this.$element.find(".com-editor").blur();
        }
    }

    /**
     * 根据配置,生成默认数据
     */
    protected getDefaultValues() {
        let lstComponent = this.viewer.getLstComponent();
        let value = {};
        if (!lstComponent) {
            return value;
        }
        for (let component of lstComponent) {
            let value = component.getColumn().getColumnDto().defaultValue;
            if (typeof value != "undefined" && value != null) {
                value[component.getColumn().getColumnDto().fieldName] = value;
            }
        }
        return value;

    }

    protected updateSubComponentValues() {
        let objValue;
        let fullValues = this.values.getValueAsObject();
        this.subComponents.forEach((key, value, map) => {
            objValue = this.values.get(key);
            if (CommonUtils.isEmpty(objValue)) {
                this.subComponents.get(key).setValue(null, fullValues);
            } else {
                this.subComponents.get(key).setValue(objValue, fullValues);
            }
        });

    }

    addCloseListener(listener: (form: Form) => void) {
        if (!this.lstCloseListener) {
            this.lstCloseListener = new Array();
        }
        this.lstCloseListener.push(listener);
    }

    handleEvent(eventType: string, fieldName: object, value: object) {
        super.handleEvent(eventType, fieldName, value);
        if (eventType === EventBus.VALUE_CHANGE_EVENT) {
            if (!this.values) {
                this.values = new StringMap<object>();
            }
            this.values.set(fieldName + "", value);
            this.fireValueChanged(fieldName as any, value);

            let changedValue = this.calcFormula(fieldName as any);
            //计算界面控制条件
            this.calcControlFilter(fieldName as any);
            //通知子控件
            this.notifySubControlChanged();
        }

    }

    /**
     * 通知子控件,值发生了变化
     */
    private notifySubControlChanged() {
        if (!this.subComponents) {
            return;
        }
        let value = this.values.getValueAsObject();
        this.subComponents.forEach((key, com, map) => {
            com.parentValueChanged(value);
        });
    }

    private calcFormula(fieldWhoChanged: string): StringMap<any> {
        if (!this.formulaCalculator) {
            return;
        }
        let data = this.getValue();
        let fieldId = this.viewer.findFieldIdByName(fieldWhoChanged);
        let changedValue = this.formulaCalculator.calcFormulaOnFiledChange(fieldId,
            data);
        this.updateChangedValue(changedValue);
        return changedValue;

    }

    private updateChangedValue(changedValue: StringMap<any>) {
        if (!changedValue || changedValue.getSize() < 1) {
            return;
        }
        //下面设置值
        changedValue.forEach((key, value, map) => {
            this.setFieldValue(key, value);
        });
    }

    /**
     *计算可见条件
     * 由于此类计算少，所以就直接遍历计算
     */
    private async calcControlFilter(fieldWhoChanged: string) {
        let fieldId = this.viewer.findFieldIdByName(fieldWhoChanged);
        let newData = this.getValue();
        let controlInfo = await this.formulaCalculator.calcFilterOnFieldChange(fieldId, newData);
        if (!fieldId || !controlInfo) {
            return;
        }
        this.updateControlShowFilter(controlInfo);
    }

    private updateControlShowFilter(controlInfo: StringMap<ControlFilterResult>) {
        //根据计算结果控制控件
        controlInfo.forEach((fieldName, value, map) => {
            if (value.isEditableFilter) {
                this.getComponentByName(fieldName).setEditable(value.result);
            } else {
                this.getComponentByName(fieldName).setVisible(value.result);
            }

        });
    }

    /**
     * 计算使能条件
     * 由于此类计算少，所以就直接遍历计算
     */
    private calcEditable(newData) {
        //如果FORM不可编辑,则不再计算
        if (!this.isEditable()) {
            return;
        }
    }

    destroy(): boolean {
        //先移除子控件
        if (this.subComponents) {
            this.subComponents.forEach((key, value, map) => {
                value.destroy();
            });
        }
        this.subComponents = null;
        this.lstComponent = null;
        this.values = null;
        this.generator = null;
        this.lstCloseListener = null;
        if (this.toolbar) {
            this.toolbar.destroy();
        }

        return super.destroy();
    }

    addClass(className: string) {
        this.$element.addClass(className);
    }

    static genSimpleLocalViewer(lstComp: Array<Component>) {
        if (!lstComp || lstComp.length < 1) {
            return null;
        }
        let viewer = new BlockViewer();
        let viewerDto = new BlockViewDto();
        viewerDto.colSpan = 12;
        viewerDto.defaultShowType = Constants.DispType.form;
        viewer.setBlockViewDto(viewerDto);
        viewer.setLstComponent(lstComp);
        return viewer;
    }

    static genSimpDto(type, title, horSpan, field, refId?) {
        let dto = new ComponentDto();
        dto.dispType = type;
        dto.title = title;
        dto.horSpan = horSpan;
        dto.columnId = CommonUtils.nextInt();
        dto.componentId = CommonUtils.nextInt();
        let colDto = new ColumnDto();
        colDto.fieldName = field;
        colDto.refId = refId;
        colDto.columnId = dto.columnId;
        let column = new Column();
        column.setColumnDto(colDto);
        let comp = new Component();
        comp.setColumn(column);
        comp.setComponentDto(dto);
        return comp;
    }
}

CommonUtils.readyDo(() => {
    return !!$.validator;
}, () => {
    $.extend($.validator.messages, {
        required: "这是必填字段",
        remote: "请修正此字段",
        email: "请输入有效的电子邮件地址",
        url: "请输入有效的网址",
        date: "请输入有效的日期",
        dateISO: "请输入有效的日期 (YYYY-MM-DD)",
        number: "请输入有效的数字",
        digits: "只能输入数字",
        creditcard: "请输入有效的信用卡号码",
        equalTo: "你的输入不相同",
        extension: "请输入有效的后缀",
        maxlength: $.validator.format("最多可以输入 {0} 个字符"),
        minlength: $.validator.format("最少要输入 {0} 个字符"),
        rangelength: $.validator.format("请输入长度在 {0} 到 {1} 之间的字符串"),
        range: $.validator.format("请输入范围在 {0} 到 {1} 之间的数值"),
        max: $.validator.format("请输入不大于 {0} 的数值"),
        min: $.validator.format("请输入不小于 {0} 的数值")
    });
});
