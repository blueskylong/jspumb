/**
 * 复合控件,包含树,面板,列表,页面等.
 */
import {PageDetailDto} from "../../funcdesign/dto/PageDetailDto";
import {MenuButtonDto} from "../../sysfunc/menu/dto/MenuButtonDto";
import {ManagedFunc} from "../ManagedFunc";
import {MenuInfo} from "../../sysfunc/menu/dto/MenuInfo";

export interface AutoManagedUI extends ManagedEventListener {
    /**
     * 取得页面明细信息
     */
    getPageDetail(): PageDetailDto;

    /**
     * 取得控件相关的数据表id
     */
    getTableIds(): Array<number>;

    /**
     * 设置事件监测中心,主要是自身的事件反馈到管理中心
     * @param manageCenter
     */
    setManageCenter(manageCenter: IManageCenter)

    /**
     * 设置显示的按钮,只会给它相关的按钮,由自身处理.如果被使用,则要打上已使用的标记
     * 所有没被使用的按钮,都会统一显示在按钮区
     * @param buttons
     */
    setButtons(buttons: Array<MenuButtonDto>);

    /**
     * 界面展示数据行数量,1 个及多个
     */
    getUiDataNum(): number;

    /**
     * 取得界面
     */
    getViewUI(): HTMLElement;

    setEditable?(editable): void;

    addReadyListener?(handler: (source: any) => void);

    /**
     * 当视图被装配后的处理
     */
    afterComponentAssemble?(): void;

    /**
     * 增加事件拦截器
     * @param operType
     * @param interceptor
     */
    addEventInterceptor?(operType: number | string, interceptor: EventInterceptor);

    reload(): void;

    /**
     * 检查并保存，返回是否完成
     */
    checkAndSave(): Promise<boolean>;
}

/**
 * 事件拦截器
 */
export interface EventInterceptor {
    /**
     * 执行默认处理程序前调用的方法,如果返回false ,则不继续执行
     * @param operType  操作码 或者调用函数名
     * @param dsId  数据表ID
     * @param data  可能是行数据,也可能是多行数据
     * @param ui  默认执行的主体控件
     */
    beforeHandle?(operType: number | string, dsId: number, data: object | Array<object>, ui: AutoManagedUI): boolean;

    /**
     *默认处理程序完成后调用
     * @param operType
     * @param dsId
     * @param data
     * @param ui
     */
    afterHandle?(operType: number | string, dsId: number, data: object | Array<object>, ui: AutoManagedUI): void;
}

/**
 * 响应数据事件
 */
export interface ManagedEventListener {
    /**
     * 引用选择变化
     * @param source
     * @param refId 引用id
     * @param id  选择引用的ID值
     * @param isLeaf 是不是叶子节点
     */
    referenceSelectChanged(source: any, refId, id, isLeaf);

    /**
     * 数据表选变化
     * @param source
     * @param tableId
     * @param mapKeyAndValue
     * @param row
     */
    dsSelectChanged(source: any, tableId, mapKeyAndValue, row?);

    /**
     * 某一个数据值变化
     * @param source
     * @param tableId
     * @param mapKeyAndValue
     * @param field
     * @param value
     */
    attrChanged(source: any, tableId: number, mapKeyAndValue: object, field: string, value: any);

    /**
     * 数据删除,保存事件
     * @param source
     * @param tableId
     * @param mapKeyAndValue
     * @param changeType @See  Constants.TableDataChangedType
     */
    dataChanged(source: any, tableId, mapKeyAndValue: object, changeType, rowData?: object);

    /**
     *数据状态变化
     * @param tableId
     * @param state  这里是 TableState ,参见 Constants.TableState
     * @return  是否被处理了
     */
    stateChange(source: any, tableId, state: number, extendData?: any);

    /**
     * 按钮被点击,如果是处理不了的,则交级上级处理
     * @param buttonInfo
     */
    btnClicked?(source: any, buttonInfo: MenuButtonDto, data): boolean;


}

/**
 *扩展事件(按钮CLICK)处理器
 */
export interface IEventHandler {

    /**
     * 事件处理
     *
     * @param operType
     * @param dsId
     * @param data
     * @param ui
     */
    doHandle(operType: number | string, dsId: number,
             data: object | Array<object>, ui: AutoManagedUI, menuButtonDto: MenuButtonDto): void;

}

export interface IManageCenter extends ManagedEventListener {


    /**
     * 检查并保存,TODO_2 目前删除还没有办法判断,所以删除要单独操作
     * 如果主键字段是负值,说明是新增,否则是修改  中心使用
     * @param rowData
     * @param dsId
     * @param callback
     */
    checkAndSave?(rowData: object | Array<object>, dsId, callback: (result) => void);

    getGlobalParams(): object;

    setGlobalParams(obj: object);

    registerMenuFunc(func: ManagedFunc<MenuInfo>);

    /**
     * 注册受控件,
     * @param uis
     */
    registerManagedUI(uis: Array<AutoManagedUI>, menuId?);


}
