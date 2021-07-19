/**
 * 显示控件的额外属性
 */
import {BaseDto} from "../../datamodel/dto/BaseDto";

export class ComponentDto extends BaseDto {
    componentId: number;
    /**
     * 主表ID
     */
    blockViewId: number;
    /**
     * 引用的列ID
     */
    columnId: number;
    /**
     * 级次编码,本系统都采用的3位一级的编码格式
     */
    lvlCode: string;
    /**
     * 标题
     */
    title: string;
    /**
     * 显示方式,如text,datetime等
     */
    dispType: string;
    /**
     * 横向占比例,类似于bootstrap的12列,占多少列的意思
     */
    horSpan: number;
    /**
     * 纵向行数,如textArea这类的,会占用多行.
     */
    verSpan: number;
    /**
     * 如果为列表显示,则显示的宽度,0表示列表中不显示
     */
    width: number;
    /**
     * 可编辑条件,空表示可编辑
     */
    editableFilter: string;
    /**
     * 可见条件,空表示可见
     */
    visibleFilter: string;
    /**
     * 显示格式,如数字,日期等
     */
    format: string;
    /**
     * 自定义标题的颜色
     */
    titleColor: string;
    /**
     * 说明
     */
    memo: string;
    /**
     * 自定义css样式类
     */
    cssClass: string;
    /**
     * 扩展样式
     */
    extStyle: string;
    /**
     * 其它个性的属性扩展,使用JSON的格式,在生成时会合并到创建属性中
     */
    extAttr: string;
    /**
     * 分组类型
     */
    groupType: number;

    /**
     * 默认排序类型
     */
    orderType: number;

    /**
     * 背景色
     */
    backgroundColor: string;

    /**
     * 标题位置
     */
    titlePosition: string;

    titleSpan: number;

    /**
     * 如果是树状显示,在树上的作用,如标题,ID,编码等,查看 Constants.TreeRole常量定义
     */
    treeRole: number;

    posTop: number;
    posLeft: number;
    showSearch: number;
    hideInTable: number;//在列表中隐藏


}
