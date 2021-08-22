import {JsTree, JsTreeInfo} from "../../blockui/JsTree/JsTree";
import {Form} from "../../blockui/Form";
import {BorderLayout, BorderLayoutProperty} from "../../blockui/layout/BorderLayout";
import {GeneralEventListener} from "../../blockui/event/GeneralEventListener";
import EventBus from "./EventBus";
import {BeanFactory} from "../../decorator/decorator";
import SchemaDto from "../../datamodel/dto/SchemaDto";
import {InputDlg} from "../../blockui/dialogs/InputDlg";
import {Dialog, DialogInfo} from "../../blockui/Dialog";
import {DmDesignService} from "../service/DmDesignService";
import {Alert} from "../../uidesign/view/JQueryComponent/Alert";

/**
 * 包含方案树和方案明细信息的面板
 */
export class SchemaMainInfo extends BorderLayout<BorderLayoutProperty> {
    private schemaTree: JsTree<JsTreeInfo>;
    private fSchema: Form;
    private selectChangeListener: GeneralEventListener;
    private valueChangeListener: GeneralEventListener;
    private addDlg: InputDlg;


    getViewUI(): HTMLElement {

        return super.getViewUI();
    }

    protected initSubControls() {
        this.schemaTree = new JsTree<JsTreeInfo>({
            textField: "schemaName",
            rootName: "方案信息",
            idField: "schemaId",
            url: "/dm/findAllSchemaDto",
            buttons: [{
                id: "add",
                iconClass: "fa fa-plus",
                hint: "增加",
                clickHandler: (event, data, id) => {
                    this.doAdd(data);
                }
            }, {
                id: "delete",
                iconClass: "fa fa-trash",
                hint: "删除",
                isShow: (data) => {
                    if (!data.data) {
                        return false;
                    }
                    if (data.data.schemaId == 1 || data.data.schemaId == 2) {
                        return false;
                    }
                    return true;
                },
                clickHandler: (event, data) => {
                    this.doDelete(data);
                }
            }]
        });
        this.fSchema = Form.getInstance(25);
        this.addComponent(BorderLayout.west, this.schemaTree);
        this.addComponent(BorderLayout.center, this.fSchema);
        this.fSchema.addValueChangeListener({
            handleEvent: (eventType: string, data: object, source: object, extObject?: any) => {
                this.fireValueChangeListener(data, source);
            }
        });
        this.show();
    }

    private doDelete(data) {
        if (data.data == null) {
            Alert.showMessage("请选择删除的方案");
            return;
        }
        if (data.data.schemaId == 1 || data.data.schemaId == 2) {
            Alert.showMessage("系统方案,不可以删除");
            return;
        }
        new Dialog({
            title: "确认", content: "确定要删除方案[" + data.data.schemaName + "]吗?删除将不可恢复!",
            onOk: () => {
                DmDesignService.deleteSchema(data.data.schemaId, (data) => {
                    this.schemaTree.reload();
                    this.schemaTree.selectNodeById(2);
                });
                return true;
            }
        }).show();

    }

    private doAdd(data) {
        new InputDlg({
            title: "增加方案", inputTitle: "方案名称", isCanEmpty: false, onOk: (data) => {

                DmDesignService.addSchema(data, (schemaId) => {
                    this.schemaTree.reload();
                    this.schemaTree.selectNodeById(schemaId);
                });
                return true;
            }
        }).show();
    }


    private fireSchemaSelectChanged(schemaInfo) {
        if (this.selectChangeListener) {
            this.selectChangeListener.handleEvent(EventBus.SELECT_CHANGE_EVENT,
                BeanFactory.populateBean(SchemaDto, schemaInfo), null, null);
        }
    }

    private fireValueChangeListener(field, value) {
        if (this.valueChangeListener) {
            this.valueChangeListener.handleEvent(EventBus.VALUE_CHANGE_EVENT, field, value, null);
        }
    }

    setSelectChangeListener(listener: GeneralEventListener) {
        this.selectChangeListener = listener;
    }

    protected initEvent() {
        this.schemaTree.addSelectListener({
            handleEvent: (eventType: string, data: object, source: object, extObject?: any) => {
                if (this.schemaTree.isSelectRoot()) {
                    return;
                }
                this.fSchema.setValue(data);
                this.fireSchemaSelectChanged(data);
            }
        });

    }

    afterComponentAssemble(): void {
        // this.schemaTree.selectNodeById(3);//默认选择用户方案
        super.afterComponentAssemble();
    }

    setValueChangeListener(valueChangeListener: GeneralEventListener) {
        this.valueChangeListener = valueChangeListener;
    }

    setEditable(canEdit) {
        this.fSchema.setEditable(canEdit);
    }

    refresh(schemaId?) {
        this.schemaTree.reload();
        if (schemaId) {
            this.schemaTree.selectNodeById(schemaId);
        }
    }

    destroy(): boolean {
        this.fSchema.destroy();
        this.schemaTree.destroy();
        this.selectChangeListener = null;
        this.valueChangeListener = null;
        return super.destroy();
    }

}
