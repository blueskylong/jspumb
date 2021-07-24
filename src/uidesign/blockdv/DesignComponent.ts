import {Component} from "../../blockui/uiruntime/Component";
import {IComponentGenerator} from "../view/generator/IComponentGenerator";
import {JQueryGeneralComponentGenerator} from "../view/JQueryComponent/JQueryGeneralComponentGenerator";
import {BaseComponent} from "../view/BaseComponent";
import EventBus from "../../dmdesign/view/EventBus";
import {Panel} from "../view/JQueryComponent/Panel";
import {Alert} from "../view/JQueryComponent/Alert";
import {Constants} from "../../common/Constants";
import {JQBaseComponent} from "../view/JQueryComponent";
import {UiUtils} from "../../common/UiUtils";

export class DesignComponent<T extends Component> extends BaseComponent<T> {
    public static COMID = "comId";
    private generator: IComponentGenerator = new JQueryGeneralComponentGenerator();
    private component: BaseComponent<Component>;
    private horSpan: number;
    private verSpan: number;
    private layoutType: number;
    private lstSubComp = new Array<DesignComponent<Component>>();
    private $masker: JQuery;


    protected createUI(): HTMLElement {
        //因为实际的控件是放在设计控件的内部 ,所以,位置大小信息,需要修改一下,在外面进行保存
        this.horSpan = this.properties.getComponentDto().horSpan;
        this.verSpan = this.properties.getComponentDto().verSpan;
        this.layoutType = this.properties.getLayoutType();
        //实际控件的虚拟设置
        this.properties.getComponentDto().horSpan = 12;
        this.properties.getComponentDto().verSpan = -1;
        this.properties.setLayoutType(Constants.PositionLayoutType.bootstrapLayout);

        let $ele = $(require("../templates/DesignComponent.html"));
        $ele.attr(DesignComponent.COMID, this.properties.getComponentDto().componentId);
        if (this.layoutType == Constants.PositionLayoutType.absoluteLayout) {
            $ele.css("top", this.properties.getComponentDto().posTop);
            $ele.css("left", this.properties.getComponentDto().posLeft
                ? this.properties.getComponentDto().posLeft : 0);
            $ele.css("width", this.horSpan ? this.horSpan : 30);
            $ele.css("height", this.verSpan
                ? this.verSpan : 100);
        }
        this.$masker = $ele.find(".masker");
        if (this.isContainer()) {
            $ele.find(".masker").css("z-index", 0);
        }
        $ele.attr("title","原始字段："+this.properties.getColumn().getColumnDto().fieldName);
        return $ele.get(0);
    }

    getHorSpan() {
        return this.horSpan;
    }

    getVerSpan() {
        return this.verSpan;
    }

    getRealComp() {
        return this.component;
    }

    public propertyChanged(propertyName, value) {
        if (this.isContainer() && this.getSubDesignComp().length > 0) {

            //如果是容器,且有子控件,则不可以修改
            if (propertyName === "dispType" && value !== "panel") {
                Alert.showMessage({message: "容器里还有子控件,请先处理子控件!"})
                return false;
            }

        }
        if (propertyName === "horSpan") {
            this.horSpan = value;
            this.handleSize();
            return true;
        } else if (propertyName === "verSpan") {
            this.verSpan = value;
            this.handleSize();
            return true;
        }
        //始终是占满
        this.getDtoInfo().getComponentDto().horSpan = 12;
        this.getDtoInfo().getComponentDto().verSpan = -1;
        this.getDtoInfo().getComponentDto()[propertyName] = value;
        this.properties.setLayoutType(Constants.PositionLayoutType.bootstrapLayout);
        if (this.isNeedRecreate(propertyName)) {
            this.createComponent();
        }
        return true;
    }

    private handleSize() {
        this.$element.removeClass((index, className) => {
            if (className) {
                let classes = className.split(" ");
                for (let aclass of classes) {
                    if (aclass.indexOf("col-md-") == 0) {
                        return aclass;
                    }
                }
            }
        });
        if (this.layoutType == Constants.PositionLayoutType.absoluteLayout) {


            this.$element.css("position", "absolute")
            this.$element.css("top",
                this.properties.getComponentDto().posTop ? this.properties.getComponentDto().posTop : 100);
            this.$element.css("left",
                this.properties.getComponentDto().posLeft ? this.properties.getComponentDto().posLeft : 100);
            this.$element.css("height", this.verSpan
            );
            this.$element.css("width", this.horSpan
            );
            return;
        }
        //设置高度和宽度 bootstrap布局如下
        if (this.horSpan <= 12) {//小于12.表示用bootstrap的列布局
            this.$element.addClass("col-md-" + this.horSpan);
        } else if (this.horSpan > 12) {//大于12 ,则直接使用像素
            this.$element.css("width", this.horSpan + "px");
        } else if (this.horSpan < 0) {//小于0表示填充所有空间
            UiUtils.addAutoHeightFit(this.$element.get(0));
        }
        if (this.verSpan <= 12 && this.verSpan > 1) {//小于12.表示占用几行
            this.$element.attr("rows", this.properties.componentDto.verSpan);
        } else if (this.verSpan > 12) {//大于12 ,则直接使用像素
            this.$element.height(this.verSpan);
        } else {//小于0表示填充所有空间
            this.verSpan = 1;
            this.$element.css("height", JQBaseComponent.rowHeight);
            // AutoFit.addAutoFitComponent(this.$element.get(0), false, true);
        }

    }

    isContainer() {
        return this.properties.getComponentDto().dispType === "panel";
    }

    getSubDesignComp() {
        return this.lstSubComp;
    }

    addSubControl(control: DesignComponent<Component>) {
        this.lstSubComp.push(control);
        (<Panel<any>>this.getRealComp()).addSubControl(control);
        return control;
    }


    afterComponentAssemble(): void {
        super.afterComponentAssemble();
        this.createComponent();
        this.bindEvent();
    }

    private bindEvent() {
        let $closeBtn = this.$element.find(".close-button");
        this.$element.on("mouseenter", (e) => {
            e.stopPropagation();
            e.preventDefault();
            $closeBtn.removeClass(DesignComponent.HIDDEN_CLASS);
        });
        this.$element.on("mouseleave", (e) => {
            if (this.editable) {
                $closeBtn.addClass(DesignComponent.HIDDEN_CLASS);
            }
        });
        this.$element.on("mousedown", (e) => {
            if (e.target != this.$masker.get(0) && e.target != this.getViewUI()) {
                return;
            }
            if (document.activeElement) {
                document.activeElement['blur']();
            }
            EventBus.fireEvent(EventBus.SELECT_CHANGE_EVENT, e, this);
        });
        $closeBtn.on("click", (e) => {
            if (!this.$element) {
                return;
            }
            this.$element.trigger("focus");
            e.preventDefault();
            e.stopPropagation();
            //这里只是用于触发删除事件
            EventBus.fireEvent(EventBus.DELETE_COLUMN, null, this)

        });
        $closeBtn.on("mousedown", (e) => {
            e.preventDefault();
            e.stopPropagation();
        });
        let that = this;
        EventBus.addListener(EventBus.SELECT_CHANGE_EVENT, this);
        if (this.layoutType == Constants.PositionLayoutType.absoluteLayout) {
            this.$element.draggable({
                stop: (event) => {
                    this.properties.getComponentDto().posTop = this.$element.position().top;
                    this.properties.getComponentDto().posLeft = this.$element.position().left;
                }
            });
            this.$element.resizable({
                stop: (event) => {
                    this.horSpan = this.$element.width();
                    this.verSpan = this.$element.height();
                }
            });
        }


    }

    handleEvent(eventType: string, data: object, source: object, extObject?: any) {
        if (this == source) {
            this.$element.find(".masker").addClass("active");
        } else {
            this.$element.find(".masker").removeClass("active");
        }
    }

    private createComponent() {
        if (this.component) {
            this.component.destroy();
        }
        this.component = this.generator.generateComponent(this.properties.componentDto.dispType, this.properties,
            null);
        $(this.component.getViewUI()).insertBefore(this.$element.children()[0]);

        if (this.lstSubComp && this.isContainer()) {
            for (let designCom of this.lstSubComp) {
                (<Panel<any>>this.getRealComp()).addSubControl(designCom);
            }
        }
        this.handleSize();

    }

    private isNeedRecreate(propertyName) {
        return (propertyName === "title" || propertyName === "verSpan" || propertyName === "horSpan" ||
            propertyName === "dispType" || propertyName === "titleColor" || propertyName === "backgroundColor"
            || propertyName === "titlePosition" || propertyName === "titleSpan");

    }

    getValue() {
        this.properties.getComponentDto().horSpan = this.horSpan;
        this.properties.getComponentDto().verSpan = this.verSpan;
        this.properties.setLayoutType(this.layoutType);
        return this.properties;
    }

    destroy(): boolean {
        EventBus.removeListener(EventBus.SELECT_CHANGE_EVENT, this);
        this.generator = null;
        if (this.lstSubComp) {
            for (let com of this.lstSubComp) {
                com.destroy();
            }
        }
        return super.destroy();
    }

    setEditable(editable: boolean) {
        this.editable = editable;
        if (!this.editable) {
            this.$element.find(".close-button").addClass(DesignComponent.HIDDEN_CLASS);
        }
    }

    setEnable(enable: boolean) {
        this.setEditable(enable);
    }

    setValue(value: any) {
    }


}
