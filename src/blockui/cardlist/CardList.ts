import {BaseComponent} from "../../uidesign/view/BaseComponent";
import {BlockViewDto} from "../../uidesign/dto/BlockViewDto";
import {BlockViewer} from "../uiruntime/BlockViewer";
import {UiService} from "../service/UiService";
import {Form} from "../Form";
import {CommonUtils} from "../../common/CommonUtils";
import {Toolbar, ToolbarInfo} from "../../uidesign/view/JQueryComponent/Toolbar";
import {GlobalParams} from "../../common/GlobalParams";
import {ServerRenderProvider} from "../table/TableRenderProvider";
import {NetRequest} from "../../common/NetRequest";
import {GeneralEventListener} from "../event/GeneralEventListener";
import {Constants} from "../../common/Constants";

/**
 * 此控件,会在原始的指针值上维护数据,可以直接使用传入的值 ,也可以使用getValue取得新组织的数据.
 */
export class CardList<T extends BlockViewDto> extends BaseComponent<T> {
    static serverDataUrl = CommonUtils.getServerUrl("/data/findBlockData");
    static CARD_CLASS = "form-card";
    static EMPTY_CLASS = "empty";
    protected viewer: BlockViewer = null;

    protected lstForm = new Array<Form>();

    private getDefaultValue: () => any;

    protected editable = false;
    protected enable = true;
    protected values = [];
    protected removeAble = false;
    protected isShowHead = false;
    protected curForm: Form = null;
    private lstSelectChangeListener: Array<GeneralEventListener>;


    protected createUI(): HTMLElement {
        this.initViewer();
        let $ele = $(require("../templete/CardList.html"));
        $ele.find(".btn-add").on("click", (event) => {
            let value = {};
            if (this.getDefaultValue) {
                value = this.getDefaultValue();
            }
            this.values.push(value);
            this.addNewCard(value);
            this.updateBtnPosition();
            this.updateHint();
        });

        return $ele.get(0);
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

    async initViewer() {
        this.viewer = await UiService.getSchemaViewer(this.properties.blockViewId);
        this.properties = this.viewer.blockViewDto as any;
    }

    afterComponentAssemble(): void {
        super.afterComponentAssemble();
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
                NetRequest.axios.post(CardList.serverDataUrl + "/" + this.viewer.getBlockViewDto().blockViewId
                    , filter ? {"extFilter": filter} : {}).then((data => {
                    this.setValue(data.data);
                })).catch((e) => {

                });
            })

    }


    showHead(isShowHead) {
        if (this.isShowHead == isShowHead) {
            return;
        }
        this.isShowHead = isShowHead;
        this.updateShow();
    }

    setRemoveable(removeAble) {
        this.removeAble = removeAble;
        this.updateShow();
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

    setEditable(editable: boolean) {
        this.editable = editable;
        if (this.lstForm) {
            for (let form of this.lstForm) {
                form.setEditable(editable);
            }
        }
        if (editable) {
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
            this.$element["dragsort"]("destroy");
            this.$element.find(".btn-add").addClass(CardList.UN_VISIBLE_CLASS)
        }
        this.updateShow();
    }

    private updateBtnPosition() {
        this.$element.append(this.$element.find(".btn-add"));
    }

    setEnable(enable: boolean) {
        this.enable = enable;
        if (this.lstForm) {
            for (let form of this.lstForm) {
                form.setEditable(enable);
            }
        }
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
        this.values = values;
        if (!this.values) {
            this.values = [];
        }

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
        $(form.getViewUI()).remove();
    }

    addNewCard(value?: any) {
        let form = new Form(this.properties);
        let that = this;
        form.addValueChangeListener({
            handleEvent(eventType: string, data: object, source: object, extObject?: any) {
                that.cardValueChanged(extObject, data + "", source);
            }
        });

        form.showHead(this.isShowHead);
        form.setBlockViewer(this.viewer);
        this.$element.append(form.getViewUI());
        $(form.getViewUI()).on("click", (event) => {
            if (this.curForm === form) {
                return;
            }
            this.curForm = form;
            this.fireSelectChangeEvent();
            this.$element.find(".dm-form").removeClass("active");
            $(this.curForm.getViewUI()).addClass("active");
        });
        form.afterComponentAssemble();
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
            this.deleteRow(this.lstForm.indexOf(form));
            if (this.curForm == form) {
                this.fireSelectChangeEvent();
                this.curForm = null;
            }
        });
        this.lstForm.push(form);
    }

    private cardValueChanged(form: Form, fieldName: string, value: object) {
        if (!this.values) {
            return;
        }
        let index = this.lstForm.indexOf(form);
        if (index == -1) {
            return;
        }
        this.values[index][fieldName] = value;

    }


}
