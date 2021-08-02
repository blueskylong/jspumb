import {BaseComponent} from "../../uidesign/view/BaseComponent";
import {BlockViewDto} from "../../uidesign/dto/BlockViewDto";
import {BlockViewer} from "../uiruntime/BlockViewer";
import {UiService} from "../service/UiService";
import {Form} from "../Form";
import {CommonUtils} from "../../common/CommonUtils";
import {GlobalParams} from "../../common/GlobalParams";
import {NetRequest} from "../../common/NetRequest";
import {GeneralEventListener} from "../event/GeneralEventListener";
import {Constants} from "../../common/Constants";
import {HandleResult} from "../../common/HandleResult";
import {Alert} from "../../uidesign/view/JQueryComponent/Alert";
import * as jsPlumb from "jsplumb";
import {StringMap} from "../../common/StringMap";

/**
 * 此控件,会在原始的指针值上维护数据,可以直接使用传入的值 ,也可以使用getValue取得新组织的数据.
 */
export class CardList<T extends BlockViewDto> extends BaseComponent<T> {
    static serverDataUrl = "/dmdata/findBlockData";
    static CARD_CLASS = "form-card";
    static EMPTY_CLASS = "empty";
    protected viewer: BlockViewer = null;

    protected lstForm = new Array<Form>();

    private getDefaultValue: () => any;

    private beforeAdd: (card: CardList<any>, value) => boolean;


    protected values = [];
    protected removeAble = false;
    protected isShowHead = false;
    protected curForm: Form = null;
    private lstSelectChangeListener: Array<GeneralEventListener>;

    protected showSave = false;
    protected sortable = false;

    protected showAdd = false;


    protected createUI(): HTMLElement {
        let $ele = $(require("../template/CardList.html"));
        return $ele.get(0);
    }

    protected async init() {
        await this.initViewer();
    }

    setBeforeAdd(func: (card: CardList<any>) => boolean) {
        this.beforeAdd = func;
    }

    protected fireSelectChangeEvent() {
        if (!this.lstSelectChangeListener || this.lstSelectChangeListener.length == 0) {
            return;
        }
        let value = this.curForm ? this.curForm.getValue() : null;
        for (let listener of this.lstSelectChangeListener) {
            listener.handleEvent(Constants.GeneralEventType.SELECT_CHANGE_EVENT, value, null);
        }
    }


    static getInstance(blockId, version?) {
        let blockDto = new BlockViewDto();
        blockDto.blockViewId = blockId;
        blockDto.versionCode = version || GlobalParams.getLoginVersion();
        return new CardList(blockDto);
    }

    protected initSubControls() {
        this.setShowSave(this.showSave, true);
        this.setRemoveable(this.removeAble, true);
        this.setShowHead(this.isShowHead, true);
        this.setSortable(this.sortable, true);
        this.setShowAdd(this.showAdd, true);
    }

    setExtendData(data: StringMap<any>) {
        super.setExtendData(data);
        if (this.lstForm.length > 0) {
            for (let form of this.lstForm) {
                form.setExtendData(data);
            }
        }

    }

    protected initEvent() {
        this.$element.find(".btn-add").on("click", (event) => {
            this.addNewCard(this.getFixValue());
            this.updateBtnPosition();
            this.updateHint();
        });
        this.$element.find(".btn-save").on("click", (event) => {
            this.save();
        });
    }

    /**
     * 取得固定的值
     */
    protected getFixValue() {
        return {};
    }

    /**
     * 可以编辑,有表头,有增加,有删除
     */
    setFullEditable(editable = true) {
        this.setEditable(editable);
        this.setShowAdd(editable);
        this.setRemoveable(editable);
        this.setSortable(editable, true);
    }

    async initViewer() {
        this.viewer = await UiService.getSchemaViewer(this.properties.blockViewId);
        this.properties = this.viewer.getBlockViewDto() as any;
    }

    getValue(): any {
        let result = new Array();
        if (this.lstForm) {
            for (let form of this.lstForm) {
                result.push(form.getValue());
            }
        }
        return result;
    }

    loadData(filter?) {
        CommonUtils.readyDo(() => {
                return !!this.viewer;
            },
            () => {
                let blockId = this.viewer.getBlockViewDto().blockViewId;
                CommonUtils.handleResponse(NetRequest.axios.post(CardList.serverDataUrl + "/" + blockId
                    , filter ? $.extend({"extFilter": JSON.stringify(filter)}, {blockId: blockId})
                        : {blockId: blockId}),
                    (result: HandleResult) => {
                        if (result.success) {
                            this.setValue(<Array<any>>result.data);
                        } else {
                            Alert.showMessage(result.err);
                        }
                    });
            });
    }

    afterComponentAssemble(): void {
        this.fireReadyEvent();
    }

    setShowHead(isShowHead, force = false) {
        if (this.isShowHead == isShowHead && !force) {
            return;
        }
        this.isShowHead = isShowHead;
        this.updateShow();
    }

    setRemoveable(removeAble, force = false) {
        if (this.removeAble == removeAble && !force) {
            return;
        }
        this.removeAble = removeAble;
        this.updateShow();
    }

    setShowAdd(isShow: boolean, force = false) {
        if (this.showAdd == isShow && !force) {
            return;
        }
        this.showAdd = isShow;
        if (this.showAdd) {
            this.setEditable(true);
            this.$element.find(".btn-add").removeClass(CardList.UN_VISIBLE_CLASS);
        } else {
            this.$element.find(".btn-add").addClass(CardList.UN_VISIBLE_CLASS);
        }
    }

    private updateShow() {

        if (this.removeAble && this.isShowHead) {
            if (this.lstForm) {
                for (let form of this.lstForm) {
                    form.showHead(true);
                    form.showClose(true);
                }
            }
        } else if (this.isShowHead) {
            for (let form of this.lstForm) {
                form.showHead(true);
            }
        } else {
            for (let form of this.lstForm) {
                form.showHead(false);
            }
        }


    }

    setSortable(sortable: boolean, force = false) {
        if (this.sortable == sortable && !force) {
            return;
        }
        this.sortable = sortable;
        if (this.sortable) {
            this.$element['dragsort']({
                dragEnd: () => {
                    let lstForm = this.lstForm;
                    this.lstForm = new Array<Form>();
                    if (!this.values) {
                        this.values = [];
                    }
                    let oldValue = new Array<any>();
                    oldValue.push(...this.values);
                    this.values.splice(0, this.values.length);

                    this.$element.find(".dm-form").each((index, element) => {
                        for (let i = 0; i < lstForm.length; i++) {
                            if (lstForm[i].getViewUI() == element) {
                                this.lstForm.push(lstForm[i]);
                                if (oldValue.length > i) {
                                    this.values.push(oldValue[i]);
                                } else {
                                    this.values.push(lstForm[i].getValue());
                                }
                            }
                        }
                    });
                    this.updateBtnPosition();
                }
            });
        } else {
            this.$element['dragsort']("destroy");
        }

    }

    setEditable(editable: boolean, force = false) {
        if (this.editable == editable && !force) {
            return;
        }
        if (this.lstForm) {
            for (let form of this.lstForm) {
                form.setEditable(this.editable);
            }
        }

    }

    setShowSave(isShow: boolean, force = false) {
        if (this.showSave == isShow && !force) {
            return;
        }
        this.showSave = isShow;
        if (this.showSave) {
            this.$element.find(".btn-save").removeClass(CardList.UN_VISIBLE_CLASS);
        } else {
            this.$element.find(".btn-save").addClass(CardList.UN_VISIBLE_CLASS);
        }
    }

    private updateBtnPosition() {
        this.$element.append(this.$element.find(".btn-add"));
    }

    setEnable(enable: boolean) {
        this.enabled = enable;
        if (this.lstForm) {
            for (let form of this.lstForm) {
                form.setEditable(enable);
            }
        }
    }

    save(): Promise<boolean> {
        return new Promise(resolve => {
            resolve(true);
        });
    }

    /**
     * 取得原始指针的值
     */
    getOriginData() {
        return this.values;
    }

    deleteRow(index: number) {
        if (index < 0 || index > this.lstForm.length) {
            throw new Error("删除的序号不正确:" + index);
        }
        let forms = this.lstForm.splice(index, 1);
        this.removeCard(forms[0]);
        if (this.values) {
            this.values.splice(index, 1);
        }
    }

    addSelectChangeListener(listener: GeneralEventListener) {
        if (!this.lstSelectChangeListener) {
            this.lstSelectChangeListener = [];
        }
        this.lstSelectChangeListener.push(listener);
    }

    setValue(values: Array<any>) {
        this.values = values || [];

        CommonUtils.readyDo(() => {
            return !!this.viewer;
        }, () => {
            //创建数据
            if (!values || values.length < 1) {
                this.clearCard();
                this.updateHint();
                return;
            }

            for (let i = 0; i < values.length; i++) {
                if (this.lstForm && this.lstForm.length > i) {
                    this.lstForm[i].setValue(values[i]);
                } else {
                    this.addNewCard(values[i]);
                }
                this.updateBtnPosition();
            }
            if (this.lstForm.length > values.length) {
                for (let i = values.length; i < this.lstForm.length; i++) {
                    this.removeCard(this.lstForm[i]);
                }
                this.lstForm.splice(values.length, this.lstForm.length - values.length);
            }
            this.updateHint();
        })
    }


    updateHint() {
        if (this.values && this.values.length > 0) {
            this.$element.removeClass(CardList.EMPTY_CLASS);

        } else {
            this.$element.addClass(CardList.EMPTY_CLASS);
        }
    }

    setDefaultValueProvider(getDefaultValue) {
        this.getDefaultValue = getDefaultValue;
    }

    clearCard() {
        if (this.lstForm && this.lstForm.length > 0) {
            for (let form of this.lstForm) {
                this.removeCard(form);
            }
            this.lstForm = [];
        }
    }

    private removeCard(form: Form) {
        form.destroy();
    }

    addNewCard(value?: any) {
        if (this.beforeAdd && !this.beforeAdd(this, value)) {
            return;
        }
        //判断是新增加,还是恢复显示
        if (this.values.indexOf(value) == -1) {
            if (this.getDefaultValue) {
                value = $.extend(this.getDefaultValue(), value || {},);
            }
            this.values.push(value);
        }
        let form = new Form(this.properties);

        let that = this;
        form.addValueChangeListener({
            handleEvent(eventType: string, data: object, source: object, extObject?: any) {
                that.cardValueChanged(extObject, data + "", source);
            }
        });

        form.showHead(this.isShowHead);
        if (this.removeAble) {
            form.showClose(true);
        }
        form.setBlockViewer(this.viewer);
        this.$element.append(form.getViewUI());
        form.setExtendData(this.extendData);
        $(form.getViewUI()).on("click", (event) => {
            if (this.curForm === form) {
                return;
            }
            this.curForm = form;
            this.fireSelectChangeEvent();
            this.$element.find(".dm-form").removeClass("active");
            $(this.curForm.getViewUI()).addClass("active");
        });
        if (!this.lstForm) {
            this.lstForm = new Array();
        }
        if (!value && this.getDefaultValue) {
            form.setValue(this.getDefaultValue());
        } else {
            form.setValue(value || {});
        }
        form.addClass(CardList.CARD_CLASS);
        form.setEditable(this.editable);
        form.addCloseListener((form) => {
            if (this.beforeDelete(form.getValue())) {
                this.doDelete(form.getValue(), () => {
                    this.deleteRow(this.lstForm.indexOf(form));
                    if (this.curForm == form) {
                        this.fireSelectChangeEvent();
                        this.curForm = null;
                    }
                })

            }

        });
        form.setEditable(this.editable);
        this.lstForm.push(form);
    }

    protected beforeDelete(row): boolean {
        return true;
    }

    protected doDelete(row, callBack) {
        callBack();
    }

    private cardValueChanged(form: Form, fieldName: string, value: object) {
        if (!this.values || this.values.length == 0) {
            return;
        }
        let index = this.lstForm.indexOf(form);
        if (index == -1) {
            return;
        }
        this.values[index][fieldName] = value;
    }

    public check() {
        if (this.lstForm) {
            for (let form of this.lstForm) {
                if (!form.check()) {
                    return false;
                }
            }
        }
        return true;
    }


}
