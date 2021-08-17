import BaseUI from "../uidesign/view/BaseUI";
import {MenuButtonDto} from "../sysfunc/menu/dto/MenuButtonDto";
import {MenuInfo} from "../sysfunc/menu/dto/MenuInfo";

export abstract class MenuFunction<T extends MenuInfo> extends BaseUI<T> {
    private stateChangeListener: () => void;

    /**
     * 关闭前询问
     */
    beforeClose(): boolean {
        return true;
    }

    getButton(): Array<MenuButtonDto> {
        return null;
    }

    handleButtonClick(btn: MenuButtonDto, source) {
        if (this[btn.funcName] && typeof this[btn.funcName] === "function") {
            this[btn.funcName]();
        }
        //TODO
    }

    getState() {
        return null;
    }

    setStateChangeListener(stateChangeListener: () => void) {
        this.stateChangeListener = stateChangeListener;
    }

    setParamters(param: any) {

    }

    /**
     * 这个是给子类一个处理额外操作的接口，在界面完成后调用
     */
    protected uiReady() {

    }

}


