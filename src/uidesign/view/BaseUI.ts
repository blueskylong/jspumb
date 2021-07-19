import {GeneralEventListener} from "../../blockui/event/GeneralEventListener";
import {StringMap} from "../../common/StringMap";
import {hasMagic} from "glob";
import {UiUtils} from "../../common/UiUtils";

export default abstract class BaseUI<T> implements GeneralEventListener {

    public static rowHeight = 45;
    protected static UN_VISIBLE_CLASS = "un-visible";
    protected static HIDDEN_CLASS = "hidden";
    protected properties: T;
    protected template: string;
    protected lstReadyListener: Array<(source: any) => void>;
    protected mapListener: StringMap<Array<GeneralEventListener>> = new StringMap<Array<GeneralEventListener>>();

    /**
     * dom
     */
    protected element: HTMLElement;

    protected $element: JQuery;

    protected ready = false;
    protected destroyed = false;

    protected hashCode: number = -1;
    private initTime = null;

    protected resizeListener: () => void;


    public addListener(type, listener: GeneralEventListener) {
        if (!type) {
            return;
        }
        let generalEventListeners = this.mapListener.get(type);
        if (!generalEventListeners) {
            generalEventListeners = new Array<GeneralEventListener>();
            this.mapListener.set(type, generalEventListeners);
        }
        if (generalEventListeners.indexOf(listener) == -1) {
            generalEventListeners.push(listener);
        }
    }

    constructor(properties: T) {
        this.properties = properties;
        this.hashCode = $.hashCode();
        this.initTime = new Date().getTime();
    }

    public fireEvent(type: string, data?, source?, extObj?) {
        let generalEventListeners = this.mapListener.get(type);
        if (generalEventListeners) {
            for (let listener of generalEventListeners) {
                listener.handleEvent(type, data, source, extObj);
            }
        }
    }

    addReadyListener(handler: (source: any) => void) {
        if (!this.lstReadyListener) {
            this.lstReadyListener = new Array<() => void>();
        }
        this.lstReadyListener.push(handler);
        if (this.isReady()) {//如果已经结束 了,则直接调用
            handler(this);
            return;
        }
    }

    removeListener(type, listener: GeneralEventListener) {
        if (!type || !listener) {
            return;
        }
        let generalEventListeners = this.mapListener.get(type);
        if (generalEventListeners) {
            let index = generalEventListeners.indexOf(listener);
            if (index != -1) {
                generalEventListeners.splice(index, 1);
            }
        }
    }

    fireReadyEvent() {
        this.ready = true;
        if (this.lstReadyListener) {
            for (let listener of this.lstReadyListener) {
                listener(this);
            }
            //这里清空,因为只会调用 一次
            this.lstReadyListener = [];
        }
    }

    public getDtoInfo() {
        return this.properties;
    }

    handleEvent(eventType: string, data: object, source: object) {
    }

    /**
     * 取得视图的组件
     */
    public getViewUI(): HTMLElement {
        if (!this.element) {
            this.element = this.createUI();
            this.$element = $(this.element);
            this.initSubControls();
            this.initEvent();
            DomAssembleNotifier.getInstance().addWaitingUI(this);
        }

        this.$element.attr("component-class", this.constructor.name);
        this.$element.attr("hashcode", this.hashCode);

        return this.element;
    }

    protected initSubControls() {

    }

    protected initEvent() {

    }

    /**
     * 创建本级视图
     */
    protected abstract createUI(): HTMLElement;

    /**
     * 当视图被装配后的处理
     */
    public afterComponentAssemble(): void {
    };

    /**
     * 创建一个空面板.
     * @param className
     */
    public static createFullPanel(className?: string) {
        let $ele = $("<div class = 'full-display'></div>");
        if (className) {
            $ele.addClass(className);
        }
        return $ele;
    }


    /**
     * 设置某一属性
     * @param attrName
     * @param value
     */
    public setAttribute(attrName: string, value: Object) {

        this.getAttributes()[attrName] = value;
    }

    /**
     * 取得某一属性
     */
    public getAttributes(): T {
        if (!this.properties) {
            this.properties = {} as any;
        }
        return this.properties;
    }

    /**
     * 自己被删除前
     */
    public destroy(): boolean {
        if (this.$element) {
            this.$element.remove();
            this.$element = null;
            this.element = null;
        }
        this.lstReadyListener = null;
        this.mapListener.clear();
        this.destroyed = true;
        this.properties = null;
        if (this.resizeListener) {
            UiUtils.unRegOnWindowResized(this.resizeListener);
            this.resizeListener = null;
        }
        return true;
    }

    isDestroied() {
        return this.destroyed;
    }

    public hide() {
        this.$element.attr("display", "none");
    }

    public shown() {
        this.$element.attr("display", "display");
    }

    /**
     * 父容器的值发生了变化,可能会影响此控件的显示属性,需要变化,如选择框,可能需要根据父亲值的变化,重新生成选择项
     * @param fullValue
     */
    public parentValueChanged(fullValue: object): void {

    }

    public isReady() {
        return this.ready;
    }

    public setWidth(width: number) {
        this.$element.width(width);
        this.$element.css("display", "inline-block")
    }

    public setHeight(height: number) {
        this.$element.height(height);
    }

    public getHashCode() {
        return this.hashCode;
    }

    public getInitTime() {
        return this.initTime;
    }

    /**
     * 生成错误面板
     * @param err
     */
    getErrPanel(err): HTMLElement {
        let html = "<div class='error-panel'>";
        if (err) {
            html += err;
        }
        err + '</div>';
        return $(html).get(0);
    }

    resize(event?) {

    }
}

/**
 * UI被装配置时的通知,主要调用afterComponentAssemble
 */
class DomAssembleNotifier {

    /**
     * 最长失效时间 单位秒
     */
    private static MAX_WAIT_SECONDS = 5;
    private static notifier: DomAssembleNotifier;
    public static mapElement = new StringMap<BaseUI<any>>();
    private static task = null;

    public static getInstance() {
        if (!DomAssembleNotifier.notifier) {
            DomAssembleNotifier.notifier = new DomAssembleNotifier();
        }
        return DomAssembleNotifier.notifier;
    }

    constructor() {
        document.addEventListener('DOMNodeInserted', function (e) {
            DomAssembleNotifier.notifyUI(e.target as any);
        }, false);
    }

    public addWaitingUI(ui: BaseUI<any>) {
        if (DomAssembleNotifier.mapElement.has(ui.getHashCode() + "")) {
            return;
        } else {
            // console.log("----->addUI:" + ui.getHashCode());
            if (DomAssembleNotifier.task == null) {
                DomAssembleNotifier.task = setInterval(() => {
                    DomAssembleNotifier.clearOutOfDateWaiter();
                }, DomAssembleNotifier.MAX_WAIT_SECONDS * 1000)
            }
            DomAssembleNotifier.mapElement.set(ui.getHashCode() + "", ui);

        }
    }

    private static notifyUI(ele: HTMLElement, isHandleSub = false) {
        if (this.mapElement.getSize() < 1) {
            return;
        }
        let $ele = $(ele);
        if ($ele.attr("hashcode")) {
            let hashCode = ele.getAttribute("hashcode");
            if (this.mapElement.has(hashCode)) {
                let ui = this.mapElement.get(hashCode);
                ui.afterComponentAssemble();
                // console.log("----->notify:" + hashCode);
                //只通知一次
                this.mapElement.delete(hashCode);
                //如果不是处理下级的,则要检查下级并通知
                if (!isHandleSub) {
                    let lstSub = $(ui.getViewUI()).find("[hashcode]");
                    // console.log("----->notify-sub:" + hashCode);
                    if (lstSub.length > 0) {//也要通知子控件
                        lstSub.each((index, element) => {
                            //因为下级已被平铺出来,这里就不需要递归了
                            this.notifyUI(element, true);
                        })
                    }
                }


            }
        }
    }


    private static clearOutOfDateWaiter() {
        if (this.mapElement.getSize() < 1) {
            clearInterval(this.task);
            this.task = null;
            return;
        }
        let toDeleteKey = [];

        let now = new Date().getTime();
        this.mapElement.forEach((key, ui, map) => {
            if ((now - ui.getInitTime()) / 1000 > DomAssembleNotifier.MAX_WAIT_SECONDS) {
                toDeleteKey.push(key);
            }
        });
        if (toDeleteKey.length > 0) {
            for (let key of toDeleteKey) {
                this.mapElement.delete(key);
            }
        }

    }


}


// var greeter = Object.create(window["Greeter"].prototype);
// greeter.constructor.apply(greeter, new Array("World"));
// var button = document.createElement('button');
// button.innerText = "Say Hello";
// button.onclick = function() {
//     alert(greeter.greet());
// }
// document.body.appendChild(button);
