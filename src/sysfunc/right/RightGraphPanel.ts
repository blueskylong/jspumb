/**
 * 显示权限结构
 */
import BaseUI from "../../uidesign/view/BaseUI";
import * as echarts from 'echarts';
import {DirectedGraph} from "./graph/DirectedGraph";
import {ECBasicOption} from "echarts/types/dist/shared";
import {RightResourceDto} from "./service/RightResourceDto";
import {UserRightService} from "./service/UserRightService";
import {GlobalParams} from "../../common/GlobalParams";
import {StringMap} from "../../common/StringMap";
import {RightRelationDto} from "./service/RightRelationDto";
import {CycleDetector} from "./graph/CycleDetector";

// import EChartOption = echarts.EChartsOption as any;//echart 5.0+ 已经改为此参数，否则编译报错

export class RightGraphPanel extends BaseUI<any> {
    private mapRelation: StringMap<RightRelationDto> = new StringMap<RightRelationDto>();
    private mapInCycleNode: StringMap<any> = new StringMap<any>();

    protected createUI(): HTMLElement {
        return RightGraphPanel.createFullPanel("right-graph").get(0);
    }


    afterComponentAssemble(): void {
        UserRightService.findAllRelationDto(GlobalParams.getLoginVersion(), (lstRightRelation) => {
            UserRightService.findAllRightSourceDto(GlobalParams.getLoginVersion(), (lstRightResource) => {
                let graph = new DirectedGraph<RightResourceDto>();
                let mapResourceDto = new StringMap<RightResourceDto>();
                lstRightResource.forEach(el => {
                    graph.addNode(el);
                    mapResourceDto.set(el.getRsId() + "", el);
                });
                if (lstRightRelation != null) {
                    lstRightRelation.forEach(el => {
                        graph.addEdge(mapResourceDto.get(el.getRsIdFrom() + ""), mapResourceDto.get(el.getRsIdTo() + ""));
                        this.mapRelation.set(el.getRsIdFrom() + "_" + el.getRsIdTo(), el);
                    });
                }
                this.showGraph(graph);
            })
        })
    }

    private showGraph(graph: DirectedGraph<RightResourceDto>) {
        this.mapInCycleNode = new StringMap<any>();
        let detector = new CycleDetector(graph);
        if (detector.containsCycle()) {
            let lstRightSource = detector.getVerticesInCycles();
            lstRightSource.forEach(el => {
                this.mapInCycleNode.set(el.getRsId() + "", null);
            })
        }
        let chart = echarts.init(this.$element.get(0) as any, null, {width: 1200, height: 800});
        //生成数据
        let option = this.getDefaultOptions();
        let node = [];
        let edges = [];
        graph.forEach((key, value, map) => {
            node.push({"name": value.getRsId(), "value": value.getRsName() + ""});
            let rightResourceDtos = graph.edgesFrom(value);
            //target和source都是以节点的name为值的
            if (rightResourceDtos != null) {
                rightResourceDtos.forEach((el) => {
                    edges.push({
                        'source': value.getRsId() + "", 'target': el.getRsId() + "",
                        'value': this.mapRelation.get(value.getRsId() + "_" + el.getRsId()).getRelationName()
                    })
                });
            }
        });
        option.series[0]['data'] = node;
        option.series[0]['links'] = edges;
        option.series[0]['itemStyle']['color'] = (item, e, w) => {
            if (this.mapInCycleNode.has(item["data"].name)) {
                return "#db2f0f";
            }
            return "#4b9cdb";
        };
        chart.setOption(option);
    }

    private getDefaultOptions() {
        let option = {
            tooltip: {},
            series: [
                {
                    type: 'graph',
                    layout: 'force',
                    symbolSize: 50,
                    edgeSymbol: ['circle', 'arrow'],
                    edgeSymbolSize: 15,
                    roam: true,
                    draggable: true,
                    itemStyle:
                        {
                            shadowColor: 'rgba(0, 0, 0, 0.5)',
                            shadowBlur: 10,
                            //可以使用回调
                            // color: function () {
                            //    return "#FFF"
                            // }
                        },
                    lineStyle: {
                        color: "target",
                        opacity: 1
                    },
                    label: {
                        show: true,
                        formatter: function (e) {
                            return e['data']['value'];
                        }
                        // normal: {
                        //     show: true,
                        //     formatter
                        // }
                    },
                    edgeLabel: {
                        show: true,
                        formatter: function (e) {
                            return e['data']['value']
                        }
                        // normal: {
                        //     show: true,
                        //     position: 'middle',
                        //     formatter: function (e) {
                        //         return e['data']['value']
                        //     }
                        // }
                    },
                    force: {
                        repulsion: 1000,
                        edgeLength: 200
                    }
                }
            ]
        };
        return option;
    }


}
