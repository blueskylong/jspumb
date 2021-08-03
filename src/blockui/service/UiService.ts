import {BeanFactory} from "../../decorator/decorator";
import {BlockViewer} from "../uiruntime/BlockViewer";
import {ReferenceData} from "../../datamodel/dto/ReferenceData";
import {NetRequest} from "../../common/NetRequest";
import {StringMap} from "../../common/StringMap";
import {CommonUtils} from "../../common/CommonUtils";
import {ReferenceDto} from "../../datamodel/dto/ReferenceDto";
import {PageInfo} from "../../funcdesign/dto/PageInfo";
import {Logger} from "../../common/Logger";

export class UiService {
    private static URL_ROOT = "/ui";
    private static CACHE = new StringMap<object>();
    private static PREFIX_KEY_BLOCK = "BLOCK_";
    private static PREFIX_KEY_REFERENCE_DATE = "REFERENCE_";


    /**
     * 取得一个UI信息
     * @param blockViewerId
     * @param version
     */
    static async getSchemaViewer(blockViewerId: number) {
        let key = UiService.PREFIX_KEY_BLOCK + blockViewerId;
        if (UiService.CACHE.has(key)) {
            return UiService.CACHE.get(key);
        }
        let result = await UiService.getSchemaViewerDirect(blockViewerId);
        UiService.CACHE.set(key, result);
        return result;
    }

    /**
     * 取得一个UI信息
     * @param blockViewerId
     * @param version
     */
    static async getSchemaViewerByCode(blockViewerCode: string) {
        let key = UiService.PREFIX_KEY_BLOCK + blockViewerCode;
        if (UiService.CACHE.has(key)) {
            return UiService.CACHE.get(key);
        }
        let result = await UiService.getSchemaViewerByCodeDirect(blockViewerCode);
        UiService.CACHE.set(key, result);
        return result;
    }

    /**
     * 取得一个UI信息
     * @param blockViewerId
     * @param version
     */
    static async findPageInfo(pageId: number) {
        let viewData = await NetRequest.axios.get("/page/findPageInfo/" + pageId);
        let result = BeanFactory.populateBean(PageInfo, viewData.data) as any;
        return result;
    }

    /**
     * 取得一个UI信息
     * @param blockViewerId
     * @param version
     */
    static async findPageSchemaId(pageId: number) {
        let result = await NetRequest.axios.get("/page/findPageSchemaId/" + pageId);
        return result.data;
    }

    /**
     * 取得一个UI信息
     * @param blockViewerId
     * @param version
     */
    static async getSchemaViewerDirect(blockViewerId: number) {
        let viewData = await NetRequest.axios.get(this.URL_ROOT + "/getSchemaViewer/" + blockViewerId);
        let result = BeanFactory.populateBean(BlockViewer, viewData.data) as any;
        return result;
    }

    /**
     * 取得一个UI信息
     * @param blockViewerId
     * @param version
     */
    static async getSchemaViewerByCodeDirect(blockViewerCode: string) {
        let viewData = await NetRequest.axios.get(this.URL_ROOT + "/getSchemaViewerByCode/" + blockViewerCode);
        let result = BeanFactory.populateBean(BlockViewer, viewData.data) as any;
        return result;
    }

    /**
     * 取得引用信息
     * @param refId
     * @param version
     */
    static async getReferenceData(refId: number) {
        if (refId != null) {
            let key = UiService.PREFIX_KEY_REFERENCE_DATE + refId;
            if (UiService.CACHE.has(key)) {
                return UiService.CACHE.get(key) as any;
            }
            let result = await NetRequest.axios.get(this.URL_ROOT + "/findReferenceData/" + refId);
            if (result && result.data) {
                let lstResult = new Array<ReferenceData>();
                for (let row of result.data) {
                    lstResult.push(BeanFactory.populateBean(ReferenceData, row));
                }
                UiService.CACHE.set(key, lstResult);
                return lstResult;
            }
        } else {
            Logger.error("没有指定引用的ID");
        }
        return null;
    }

    /**
     * 取得引用信息
     * @param refId
     * @param version
     */
    static async findColumnReferenceData(refId: number, colId: number, extFilter: any) {

        let result = await NetRequest.axios.post(this.URL_ROOT + "/findColumnReferenceData/" + refId + "/" + colId,
            extFilter);
        if (result && result.data) {
            return BeanFactory.populateBeans(ReferenceData, result.data);
        }
        return null;
    }

    static clearCache(blockViewerId: number) {
        UiService.CACHE.delete(UiService.PREFIX_KEY_BLOCK + blockViewerId);
    }


    /**
     * 取得一个引用信息
     * @param blockViewerId
     * @param version
     */
    static async getReferenceDto(refId: number) {
        let data = await NetRequest.axios.get("/dm/getReferenceDto/" + refId);
        let result = BeanFactory.populateBean(ReferenceDto, data.data) as any;
        return result;
    }

    /**
     * 保存增加或修改的数据.
     * @param rows
     * @param dsId
     * @param callback
     */
    static saveRows(rows: Array<any>, dsId: number, callback: (result) => void) {
        CommonUtils.handleResponse(NetRequest.axios.post("/dmdata/saveRows/" + dsId, rows), callback);
    }

    /**
     * 根据ID删除
     * @param ids
     * @param dsId
     * @param callback
     */
    static deleteRowByIds(ids: Array<number>, dsId: number, callback: (result) => void) {
        CommonUtils.handleResponse(NetRequest.axios.post("/dmdata/deleteRowByIds/" + dsId, ids), callback);
    }

    /**
     * 更新层次编码
     */
    static updateLevel(mapIdToCode, viewId: number, callback: (result) => void) {
        CommonUtils.handleResponse(NetRequest.axios.post("/dmdata/updateLevel/" + viewId, mapIdToCode), callback);
    }

    /**
     * 查询角色对应的其它资源信息
     */
    static findRoleRightOtherRelation(callback: (result) => void) {
        CommonUtils.handleResponse(NetRequest.axios.get("/user/findRoleRightOtherRelation"), callback);
    }

    /**
     * 查找表单行
     * @param dsId
     * @param rowId
     * @param callback
     */

    static findTableRow(dsId, rowId, callback: (result) => void) {
        CommonUtils.handleResponse(NetRequest.axios.get("/dmdata/findTableRow/" + dsId + "/" + rowId
        ), callback);
    }

    /**
     * 查找表多行
     * @param dsId
     * @param rowId
     * @param callback
     */

    static findTableRows(dsId, filter, callback: (result) => void) {
        CommonUtils.handleResponse(NetRequest.axios.post("/dmdata/findTableRows/" + dsId, filter
        ), callback);
    }

    /**
     * 查询步骤信息
     * @param stepId
     * @param callback
     */
    static findStepInfo(stepId, callback: (result) => void) {
        CommonUtils.handleResponse(NetRequest.axios.get("/step/findStepInfo/" + stepId
        ), callback);
    }
}
