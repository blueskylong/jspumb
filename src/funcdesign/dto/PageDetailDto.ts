import {BaseDto} from "../../datamodel/dto/BaseDto";

export class PageDetailDto extends BaseDto {
    pageId: number;
    pageDetailId: number;
    viewId: number;
    pagePosition: string;
    initWidth: number;
    initHeight: number;
    showType: number;
    innerButton: number;
    viewType: number;
    loadOnshow: number;
    //当前界面的初始化状态
    initState: number;
    customUi: string;
    customParam: string;
    //默认使用的关联的数据源,可以在创建自定义控件时,使用此属性
    relationDs: number;
    uiCode: string;//编码,用于手动取得控件
    noFullData: number;//不允许空条件查询
}
