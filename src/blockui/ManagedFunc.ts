import {Logger} from "../common/Logger";
import {GlobalParams} from "../common/GlobalParams";
import {ManagedUiCenter} from "./managedView/ManagedUiCenter";
import {ManagedPage} from "./managedView/ManagedPage";
import {MenuFunc} from "../decorator/decorator";
import {MenuButtonDto} from "../sysfunc/menu/dto/MenuButtonDto";
import {MenuInfo} from "../sysfunc/menu/dto/MenuInfo";
import {MenuFunction} from "./MenuFunction";
import {Alert} from "../uidesign/view/JQueryComponent/Alert";
import {ManagedUITools} from "./managedView/ManagedUITools";
import {AutoManagedUI} from "./managedView/AutoManagedUI";

/**
 * 设计出来的自动管理的功能
 */
@MenuFunc("ManagedFunc")
export class ManagedFunc<T extends MenuInfo> extends MenuFunction<T> {
    static CENTER_PARAM_NAME = "managerCenter";
    protected managedUiCenter: ManagedUiCenter;

    protected page: ManagedPage<any>;
    private isValid = false;
    private lstUnDockBtn: Array<MenuButtonDto> = null;

    protected createUI(): HTMLElement {
        return $(require("./template/FunctionUI.html")).get(0);
    }

    protected async initSubControls() {
        this.isValid = false;
        if (!this.properties.getMenuDto() || !this.properties.getMenuDto().pageId) {
            Logger.error("菜单没有指定页面信息");
            Alert.showMessage("菜单没有指定页面信息");
            this.$element.find(".dm-function")
                .append($("<div class='empty-menu-hint' style='height: 100%;width: 100%'>初始化失败(菜单没有指定页面信息)</div>"));
            return;
        }
        let schemaId = await ManagedUITools.getPageSchema(this.properties.getMenuDto().pageId, GlobalParams.getLoginUser());
        if (!this.properties[ManagedFunc.CENTER_PARAM_NAME]) {
            this.managedUiCenter = new ManagedUiCenter(schemaId);
            this.managedUiCenter.setButtonClickHandler((btn: MenuButtonDto, source) => {
                this.handleButtonClick(btn, source);
            });
        } else {
            this.managedUiCenter = this.properties[ManagedFunc.CENTER_PARAM_NAME];
        }

        //显示配置界面
        this.page = ManagedPage.getManagedInstance(this.properties.getMenuDto().pageId, null);
        this.$element.append(this.page.getViewUI());
        this.page.addReadyListener((source) => {
            this.managedUiCenter.registerMenuFunc(this);
            this.fireReadyEvent();
            this.uiReady();
        });
        this.isValid = true;
    }

    getPage() {
        return this.page;
    }

    /**
     * 根据编码查询页面元素
     * @param controlCode
     */
    findSubUI(controlCode: string): AutoManagedUI {
        if (this.page) {
            return this.page.findSubUI(controlCode);
        }
        return null;
    }

    /**
     * 根据类型查询页面元素
     * @param _Constructor
     */
    findSubUIByType(_Constructor: Function): AutoManagedUI {
        if (this.page) {
            return this.page.findSubUIByType(_Constructor);
        }
        return null;
    }


    getButton(): Array<MenuButtonDto> {
        if (!this.properties.getLstBtns()) {
            return null;
        }
        if (this.lstUnDockBtn != null) {
            return this.lstUnDockBtn;
        }
        //先由各界面领用
        this.managedUiCenter.distributeButtons(this.properties.getLstBtns());
        this.lstUnDockBtn = new Array<MenuButtonDto>();
        for (let buttonInfo of this.properties.getLstBtns()) {
            if (!buttonInfo.isUsed) {
                this.lstUnDockBtn.push(buttonInfo);
            }
        }
        return this.lstUnDockBtn;
    }

    destroy(): boolean {
        if (this.managedUiCenter && !this.properties[ManagedFunc.CENTER_PARAM_NAME]) {
            this.managedUiCenter.destroy();
        } else {
            this.managedUiCenter.unRegisterMenuFunc(this);
        }
        this.managedUiCenter = null;
        if (this.page) {
            this.page.destroy();
        }
        return super.destroy();
    }

    /**
     * 处理
     * @param actionCode
     */
    handleButtonClick(btn: MenuButtonDto, source) {
        if (source === this) {
            return false;
        }
        if (this.managedUiCenter.btnClicked(this, btn, {})) {
            return;
        }
        if (!btn.funcName) {
            Alert.showMessage("按钮没有指定处理程序");
            return;
        }
        if (this[btn.funcName] && typeof this[btn.funcName] === "function") {
            this[btn.funcName]();
        }
        //TODO
    }
}
