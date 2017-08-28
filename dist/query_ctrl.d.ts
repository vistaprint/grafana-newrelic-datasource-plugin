/// <reference path="../typings/tsd.d.ts" />
import { QueryCtrl } from 'app/plugins/sdk';
declare class NewRelicQueryCtrl extends QueryCtrl {
    static templateUrl: string;
    refresh: any;
    datasource: any;
    type: any;
    apps: any[];
    metricsOperand1: any[];
    metricsOperand2: any[];
    operators: any;
    operator: any;
    isOperand2Visible: boolean;
    /** @ngInject **/
    constructor($scope: any, $injector: any);
    getApplications(): any;
    getMetrics(): any;
    getMetricNamespaces(): any;
    getMetricValues(): any;
    getMetricsOperand2(): any;
    getMetricNamespacesOperand2(): any;
    getMetricValuesOperand2(): any;
    toggleOperand2(): void;
    toggleApplication(): void;
    onChangeInternal(): void;
}
export { NewRelicQueryCtrl };
