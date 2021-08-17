import {BaseDto} from "../../datamodel/dto/BaseDto";

export class BlockViewDto extends BaseDto {
    blockViewId: number;

    blockViewName: string;
    /**
     * 默认视图类型 列表,树,面板?
     */
    defaultShowType: number;
    /**
     * 视图编码,主要是用来在客户端生成界面,便于查找和记忆.可以带上有意义的编码
     */
    blockCode: string;

    memo: string;

    schemaId: number;
    /**
     *
     */
    colSpan: number;
    rowSpan: number;
    fieldToCamel: number;
    title: string;
    showHead: number;
    lvlCode: string;
    layoutType: number;
    fixId: number;

}
