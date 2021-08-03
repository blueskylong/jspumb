import BaseUI from "../../uidesign/view/BaseUI";
import {ListItem, ListItemInfo} from "./ListItem";
import {Constants} from "../../common/Constants";
import "./template/style.css";

export class ListUI<T extends ListUIInfo> extends BaseUI<T> {
    /**
     * 数据
     */
    private lstItem: Array<ListItem<ListItemInfo>> = new Array<ListItem<ListItemInfo>>();

    private $itemBody: JQuery;

    protected createUI(): HTMLElement {
        return $(require("./template/ListUI.html")).get(0);
    }

    protected initSubControls() {
        this.$itemBody = this.$element.find(".list-body");
        if (this.properties.title) {
            this.$element.find(".list-title").text(this.properties.title);
        } else {
            this.$element.find(".list-title").addClass(ListUI.HIDDEN_CLASS);
        }

    }

    setData(lstData: Array<object>) {
        this.clearItems();
        if (lstData) {
            for (let obj of lstData) {
                this.addItem(obj);
            }
        }
    }

    getCurrentItemId() {
        let $ele = this.$itemBody.find("." + ListUI.ACTIVE_CLASS);
        if ($ele.length < 1) {
            return null;
        }
        return $ele.attr(ListItem.ITEM_ID_ATTRNAME);

    }

    clearItems() {
        while (this.lstItem.length > 0) {
            this.removeItem(this.lstItem[0].getId());
        }

    }

    getItem(id): ListItem<ListItemInfo> {
        for (let item of this.lstItem) {
            if (item.getId() === id) {
                return item;
            }
        }
        return null;
    }

    addItem(obj: Object) {
        if (!this.$element) {
            this.getViewUI();
        }
        let item = new ListItem({
            id: obj[this.properties.idField],
            title: obj[this.properties.titleField], data: obj
        });
        item.addSelectionListener({
            handleEvent: (eventType: string, id: any, source: any, extObject?: any) => {
                this.setActive(id);
                this.fireEvent(Constants.GeneralEventType.SELECT_CHANGE_EVENT, id, this);
            }

        });
        item.addDoubleClickListener({
            handleEvent: (eventType: string, id: any, source: any, extObject?: any) => {
                this.setActive(id);
                this.fireEvent(Constants.GeneralEventType.EVENT_DBL_CLICK, id, this);
            }
        });
        this.lstItem.push(item);
        this.$itemBody.append(item.getViewUI());
        if (this.properties.draggable) {
            this.$itemBody['dragsort']("destroy");
            this.$itemBody['dragsort']({
                dragEnd: (item) => {
                    return true;
                }
            });
        }
    }

    setActive(id: string) {
        for (let item of this.lstItem) {
            item.setActive(item.getId() === id)
        }
    }

    removeItem(id: string): boolean {
        let index = 0;
        for (let item of this.lstItem) {
            if (item.getId() === id) {
                item.destroy();
                this.lstItem.splice(index, 1);
                return true;
            }
            index++;
        }
        return false;
    }

    /**
     * 经过排序的数据
     */
    getData() {
        let lstResult = new Array<object>();
        this.$itemBody.find(".list-item").each((index, html) => {
            lstResult.push(this.findItemValue($(html).attr(ListItem.ITEM_ID_ATTRNAME)));
        });
        return lstResult;
    }

    /**
     * 查找条件的值
     * @param id
     */
    private findItemValue(id) {
        for (let item of this.lstItem) {
            if (item.getId() === id) {
                return item.getData();
            }
        }
        return null;
    }

    destroy(): boolean {
        this.clearItems();
        this.$itemBody = null;
        return super.destroy();
    }
}

export interface ListUIInfo {
    draggable: boolean;
    title: string;
    idField: string;
    titleField: string;
}
