import {BaseDto} from "./BaseDto";

export default class TableDto extends BaseDto {
    /**
     * 设计ID
     */
    public schemaId: number;
    /**
     * 表ID
     */
    public tableId: number;
    /**
     * 表英文名
     */
    public tableName: string;
    /**
     * 表中文名
     */
    public title: string;

    /**
     * 是否只读
     */
    public readOnly: number;

    /**
     * 数据源名
     */
    public dataOperId: number;
    /**
     * 设计的界面元素的顶部位置
     */
    public posTop: number;
    /**
     * 设计的界面元素的左边位置
     */
    public posLeft: number;

    /**
     * 宽度
     */
    public width: number;
    /**
     * 高度
     */
    public height: number;
    /**
     * 默认编辑视图
     */
    public blockViewId: number;

    public isFixrow:number;

}
