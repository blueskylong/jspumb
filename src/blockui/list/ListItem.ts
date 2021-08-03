import BaseUI from "../../uidesign/view/BaseUI";
import {GeneralEventListener} from "../event/GeneralEventListener";
import {Constants} from "../../common/Constants";

export class ListItem<T extends ListItemInfo> extends BaseUI<T> {

    static ITEM_ID_ATTRNAME = "id";

    protected createUI(): HTMLElement {
        return $(require("./template/ListItem.html")).get(0);
    }

    protected initSubControls() {
        this.$element.attr(ListItem.ITEM_ID_ATTRNAME, this.properties.id).text(this.properties.title);
    }

    protected initEvent() {
        this.$element.on("click", (event) => {
            this.fireEvent(Constants.GeneralEventType.SELECT_CHANGE_EVENT, this.getId(), this);
        });
        this.$element.on("dblclick", (event) => {
            this.fireEvent(Constants.GeneralEventType.EVENT_DBL_CLICK, this.getId(), this)
        })
    }

    setActive(isActive: boolean) {
        isActive ? this.$element.addClass(ListItem.ACTIVE_CLASS) : this.$element.removeClass(ListItem.ACTIVE_CLASS);
    }

    getId() {
        return this.properties.id;
    }


    getData() {
        return this.properties.data;
    }


}

export interface ListItemInfo {
    id: string;
    title: string;
    data: object;
}
