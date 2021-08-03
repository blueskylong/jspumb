import {BaseDto} from "../../../../datamodel/dto/BaseDto";

export class StepDetail extends BaseDto {
    stepId: number;
    detailId: number;
    detailName: string;
    lvlCode: string;
    dispFilter: string;
    pageId: number;
    customStep: string;
    params: string;
}
