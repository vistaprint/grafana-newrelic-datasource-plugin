/// <reference path="../typings/tsd.d.ts" />
declare class NewRelicDatasource {
    private $q;
    private backendSrv;
    private templateSrv;
    name: string;
    appId: any;
    apiKey: any;
    apiUrl: string;
    /** @ngInject */
    constructor(instanceSettings: any, $q: any, backendSrv: any, templateSrv: any);
    query(options: any): any;
    makeMultipleRequests(requests: any): any;
    _convertToSeconds(interval: any): number;
    _parseMetricResults(result: any): any[];
    _parseMetric(metric: any): any[];
    _getTargetSeries(metric: any, metricValue: any): any[];
    _parseTargetAlias(metric: any, metricValue: any): any;
    _evaluateExpression(metricsList: any, metadata: any): any[];
    makeRequest(request: any): any;
    testDatasource(): any;
    getMetricNames(application_id: any): any;
    getApplications(): any;
}
export { NewRelicDatasource };
