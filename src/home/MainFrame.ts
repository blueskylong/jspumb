import BaseUI from "../uidesign/view/BaseUI";

import "./plugs/custom.css";
import {IMainFrame} from "../App/IMainFrame";
import {ApplicationContext, BeanFactory} from "../decorator/decorator";
import {MenuFunction} from "../blockui/MenuFunction";
import {CommonUtils} from "../common/CommonUtils";

import {Alert} from "../uidesign/view/JQueryComponent/Alert";
import {MenuService} from "../sysfunc/menu/service/MenuService";
import {MenuInfo} from "../sysfunc/menu/dto/MenuInfo";
import {CacheUtils} from "../common/CacheUtils";
import {GlobalParams} from "../common/GlobalParams";
import {MenuDto} from "../sysfunc/menu/dto/MenuDto";
import {SidebarMenu} from "./SidebarMenu";
import {Logger} from "../common/Logger";
import {DropMenu, DropMenuInfo, DropMenuItemInfo, MessageDropMenu, MessageDropMenuItemInfo} from "./DropMenu";
import {UiUtils} from "../common/UiUtils";
import {App} from "../App/App";

export class MainFrame<T extends HomeInfo> extends BaseUI<T> implements IMainFrame {
    static cacheType = "menu";
    private $root: JQuery = null;
    private $menuToggle: JQuery = null;
    // private $sidebarMenu: JQuery = null;
    private $sidebarFooter: JQuery = null;
    private $leftCol: JQuery = null;
    private $body: JQuery = null;
    private $navMenu: JQuery = null;
    private $footer: JQuery = null;
    private $toolbar: JQuery = null;
    private $menuTitle: JQuery = null;

    private menuBar: SidebarMenu<any> = null;
    private dropDownMenu: DropMenu<DropMenuInfo>;


    private lastFunc: MenuFunction<MenuInfo>;

    protected createUI(): HTMLElement {
        let $ele = $(require("./templates/MainFrame.html"));
        this.$root = $ele;
        this.$menuToggle = $ele.find('#menu_toggle');
        // this.$sidebarMenu = $ele.find('#sidebar-menu');
        this.$sidebarFooter = $ele.find('.sidebar-footer');
        this.$leftCol = $ele.find('.left_col');
        this.$body = $ele.find('.right_col');
        this.$navMenu = $ele.find('.nav_menu');
        this.$footer = $ele.find('footer');
        this.$toolbar = $ele.find(".toolbar");
        this.$menuTitle = $ele.find(".current-menu-title");

        return $ele.get(0);
    }

    protected initSubControls() {
        this.initUserOperator();
        this.initMessages();
        // this.initMenu();
    }

    public refresh(menuId?): void {
        this.initMenu(menuId);
    }

    private initMessages() {
        let lstItem = new Array<MessageDropMenuItemInfo>();
        lstItem.push({
            messageId: 1,
            imageURL: "",
            fromUser: "张明",
            receiveTime: new Date(Date.now() - 1000 * 69),
            message: "这是我发的一个消息",
            handler: (messageId) => {
                Alert.showMessage("显示信息" + messageId);
            }
        });

        lstItem.push({
            messageId: 2,
            imageURL: "",
            fromUser: "李浩然",
            receiveTime: new Date(Date.now() - 1000 * 100),
            message: "新年快乐",
            handler: (messageId) => {
                Alert.showMessage("显示信息" + messageId);
            }
        });

        let messageDropMenu = new MessageDropMenu({
            lstItem: lstItem, count: 10, showMore: () => {
                Alert.showMessage("没有更多的消息");
            }
        });
        $(messageDropMenu.getViewUI()).insertAfter($(this.dropDownMenu.getViewUI()));

    }

    private initUserOperator() {
        let lstItem = new Array<DropMenuItemInfo>();

        lstItem.push({
            title: "修改资料", icons: "fa fa fa-pencil-square-o", clickHandler: (event) => {
                Alert.showMessage("修改资料了");
            }
        });
        lstItem.push({
            title: "切换角色", icons: "fa fa-users", clickHandler: (event) => {
                GlobalParams.getApp().showSelectRole(this.lastFunc ?
                    this.lastFunc.getDtoInfo().getMenuDto().menuId : null);
            }
        });
        lstItem.push({
            title: "退出登录", icons: "fa fa-sign-out", clickHandler: (event) => {
                GlobalParams.logout();
                GlobalParams.getApp().showLogin(this.lastFunc && this.lastFunc.getDtoInfo()
                    ? this.lastFunc.getDtoInfo().getMenuDto().menuId : null);
            }
        });
        this.dropDownMenu = new DropMenu<DropMenuInfo>({
            userName: GlobalParams.getLoginUser().getUserName(),
            lstItem: lstItem,
            userImg: null
        });
        $(this.dropDownMenu.getViewUI()).insertAfter(this.$toolbar);
    }


    afterComponentAssemble(): void {
        this.setContentHeight();
        CommonUtils.readyDo(() => {
            return !!this.menuBar;
        }, () => {
            //           this.menuBar.afterComponentAssemble();
        });

    }

    protected setContentHeight() {

        let bodyHeight = window.innerHeight;
        let footerHeight = this.$footer.outerHeight();
        let topNavHeight = this.$navMenu.outerHeight();

        let contentHeight = bodyHeight - footerHeight - topNavHeight;

        this.$body.css('height', contentHeight);
        this.$body.css('min-height', contentHeight);
        this.$body.css('max-height', contentHeight);
    };


    public initMenu(menuId?) {
        if (this.menuBar) {
            this.menuBar.destroy();
            this.$element.find("#sidebar-menu").children().remove();
        }
        MenuService.findUserMenu((data) => {

            let lstMenuDto: Array<MenuDto> = [];
            if (data) {
                lstMenuDto = BeanFactory.populateBeans(MenuDto, data);
            }
            this.menuBar = new SidebarMenu(lstMenuDto);
            this.$element.find("#sidebar-menu").append(this.menuBar.getViewUI());

            this.showFunc(menuId);

        });

    }

    protected initEvent() {


        // toggle small or large menu
        this.$menuToggle.on('click', () => {
                this.$root.toggleClass('nav-md nav-sm');
                this.menuBar.setShowSmall(this.$root.hasClass('nav-sm'));
            }
        );
        window
            .onresize = () => {
            this.setContentHeight();
        };

        $('.close-link').on("click", () => {
            var $boxPanel = this.$element.closest('.x_panel');
            $boxPanel.remove();
        });
        $('[data-toggle="tooltip"]').tooltip({
            container: 'body'
        });

        $(".expand").on("click", () => {
            $(this).next().slideToggle(200);
            let $expand = this.$element.find(">:first-child");

            if ($expand.text() == "+") {
                $expand.text("-");
            } else {
                $expand.text("+");
            }
        });
    }

    showFunc(menuId: number) {
        if (this.menuBar) {
            this.menuBar.locateMenu();
        }
        UiUtils.showMask();
        if (this.lastFunc) {
            try {
                if (this.lastFunc.beforeClose && !this.lastFunc.beforeClose()) {
                    return false;
                }
                this.lastFunc.destroy();
            } catch (e) {
                Logger.error(e.message);
            }
            this.$body.children().remove();
        }
        this
            .lastFunc = null;

        //如果没有指定菜单,则到主页
        if (!menuId) {
            this.showHomePage();
            UiUtils.hideMask();
            return;
        }
        MenuService.findMenuInfo(menuId, (data) => {
            let funcName = "";
            let menuInfo: MenuInfo = CacheUtils.get(MainFrame.cacheType, CommonUtils.genKey(menuId, GlobalParams.loginVersion));
            if (menuInfo) {
                this.createAndShowFunc(menuInfo);
            } else {
                //查询后创建
                MenuService.findMenuInfo(menuId, (data) => {
                    if (!data.success) {
                        Alert.showMessage("查询菜单信息失败");
                        return;
                    }
                    let menuInfo1 = BeanFactory.populateBean(MenuInfo, data.data);
                    CacheUtils.put(MainFrame.cacheType, menuId, menuInfo1);
                    this.createAndShowFunc(menuInfo1);

                });

            }

        });
        return true;

    }


    protected showHomePage() {
        this.updateMenuText("首页");
        this.$toolbar.children().remove();
        let baseUi = <MenuFunction<any>>BeanFactory.createBean(this.properties.homePageClass, []);
        this.lastFunc = baseUi;
        this.$body.append(this.lastFunc.getViewUI());
    }

    protected createAndShowFunc(menuInfo: MenuInfo) {
        try {
            let funcName = menuInfo.getMenuDto().funcName;
            if (!funcName) {
                Alert.showMessage("指定的功能不存在");
                UiUtils.hideMask();
                return;
            }
            let funcClazz = ApplicationContext.getMenuFunc(funcName);
            let baseUi = <MenuFunction<any>>BeanFactory.createBean(funcClazz, [menuInfo]);
            this.lastFunc = baseUi;
            this.updateMenuText(menuInfo.getMenuDto().menuName);
            this.lastFunc.addReadyListener(() => {
                this.initButtons();
                UiUtils.hideMask();
            });
            this.$body.append(this.lastFunc.getViewUI());

            return <MenuFunction<any>>this.lastFunc;
        } catch (e) {
            console.log(e.message);
            Alert.showMessage({type: Alert.type.danger, message: "显示功能失败！" + e.message});
            UiUtils.hideMask();
        }
    }

    private updateMenuText(title) {
        this.$menuTitle.text(title);
    }

    private initButtons() {
        this.$toolbar.children().remove();
        if (this.lastFunc) {
            let buttons = this.lastFunc.getButton();
            if (buttons && buttons.length > 0) {
                for (let btn of buttons) {
                    //先处理分隔条件
                    if (btn.title === "|") {
                        let span = $("<span class='button-split btn'></span>");
                        this.$toolbar.append(span);
                        continue;
                    }
                    let $btn = $("<button class=\"btn btn-warning\" action-code='" + btn.funcName + "'>" +
                        (btn.iconClass ? "<span class='" + btn.iconClass + "'></span>" : "")
                        + (btn.title ? btn.title : "") + "</button>");
                    $btn.on("click", (event) => {
                        this.lastFunc.handleButtonClick(btn);
                    });
                    this.$toolbar.append($btn);
                }
            }
        }
    }


    /**
     * 根据功能状态更新按钮的状态
     */
    private updateButtonState() {
        //TODO
    }

    destroy(): boolean {

        this.$root = null;
        this.$menuToggle = null;
        // private $sidebarMenu: JQuery = null;
        this.$sidebarFooter = null;
        this.$leftCol = null;
        this.$body = null;
        this.$navMenu = null;
        this.$footer = null;
        this.$toolbar = null;

        this.menuBar.destroy();
        if (this.lastFunc != null && !this.lastFunc.isDestroyed()) {
            this.lastFunc.destroy();
        }
        this.lastFunc = null;
        return super.destroy();
    }
}

export interface HomeInfo {
    homePageClass: { new(...args: Array<any>): any };
}
