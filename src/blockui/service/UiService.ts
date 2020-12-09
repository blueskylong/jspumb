import {BeanFactory} from "../../decorator/decorator";
import {BlockViewer} from "../uiruntime/BlockViewer";
import {ReferenceData} from "../../datamodel/dto/ReferenceData";
import {NetRequest} from "../../common/NetRequest";
import {StringMap} from "../../common/StringMap";
import {CommonUtils} from "../../common/CommonUtils";
import {ReferenceDto} from "../../datamodel/dto/ReferenceDto";
import {PageInfo} from "../../funcdesign/dto/PageInfo";

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
    static async getSchemaViewerDirect(blockViewerId: number) {
        let key = UiService.PREFIX_KEY_BLOCK + blockViewerId;
        let viewData = await NetRequest.axios.get(this.URL_ROOT + "/getSchemaViewer/" + blockViewerId);
        let result = BeanFactory.populateBean(BlockViewer, viewData.data) as any;
        return result;
    }

    /**
     * 取得引用信息
     * @param refId
     * @param version
     */
    static async getReferenceData(refId: number) {
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

}
