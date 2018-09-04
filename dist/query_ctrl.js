System.register(['app/plugins/sdk', 'lodash'], function(exports_1) {
    var __extends = (this && this.__extends) || function (d, b) {
        for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
    var sdk_1, lodash_1;
    var NewRelicQueryCtrl;
    return {
        setters:[
            function (sdk_1_1) {
                sdk_1 = sdk_1_1;
            },
            function (lodash_1_1) {
                lodash_1 = lodash_1_1;
            }],
        execute: function() {
            NewRelicQueryCtrl = (function (_super) {
                __extends(NewRelicQueryCtrl, _super);
                /** @ngInject **/
                function NewRelicQueryCtrl($scope, $injector) {
                    _super.call(this, $scope, $injector);
                    this.operators = [
                        { value: '', label: 'none' },
                        { value: '+', label: '+' },
                        { value: '-', label: '-' },
                        { value: '*', label: '*' },
                        { value: '/', label: '/' },
                    ];
                    var target_defaults = {
                        type: 'applications',
                        app_id: null,
                        target: null,
                        value: null,
                    };
                    lodash_1.default.defaultsDeep(this.target, target_defaults);
                    this.getApplications();
                    this.toggleOperand2();
                };

                /// "private" function that is called to handle paging of data coming from _this.datasource (via datasourceGetterFunc)
                /// @param datasourceGetterFunc function call to get data from the datasource
                /// @param transformFunc optional function call to transform data before injecting it into a NewRelicQueryCtrl field member
                /// @param finalPageBreakerNumber max number of pages to query from New Relic (failsafe that could probably be refactored out if someone really doesn't like such patterns)
                /// @param maxItemsPerPage maximum number of items returned per page by New Relic (usually 200 or 1000, depending on type of data -- see https://docs.newrelic.com/docs/apis/rest-api-v2/requirements/pagination-api-output)
                /// @param getFieldDataFunc getter function for the field member that will be caching the results from New Relic
                /// @param setFieldDataFunc setter (i.e., initializer) function for the field member that will be caching the results from New Relic
                /// @param appendFieldDataFunc called when new page data is available to apply to the value acquired from a call to getFieldDataFunc
                NewRelicQueryCtrl.prototype.doPagingLoop = function (datasourceGetterFunc, transformFunc, finalPageBreakerNumber, maxItemsPerPage,
                                                                     getFieldDataFunc, setFieldDataFunc, appendFieldDataFunc) {
                    (function loop(requestedPageNumber) {
                        shouldContinueLoop = (finalPageBreakerNumber > requestedPageNumber);
                        if (shouldContinueLoop) new Promise((resolve, reject) => {
                            datasourceGetterFunc(requestedPageNumber).then(function (pageData) {
                                if (transformFunc) {
                                    pageData = transformFunc(pageData);
                                }
                                // Max "data" results count is 200, "name" is 1000: https://docs.newrelic.com/docs/apis/rest-api-v2/requirements/pagination-api-output
                                if (pageData.length < maxItemsPerPage) {
                                    finalPageBreakerNumber = requestedPageNumber;
                                }
                                let fieldMemberData = getFieldDataFunc();
                                if (fieldMemberData == null) {
                                    setFieldDataFunc(pageData);
                                } else {
                                    for(var i=0;i<pageData.length;i++){ appendFieldDataFunc(pageData[i]); }
                                }
                                resolve();
                            });
                        }).then(loop.bind(null, requestedPageNumber+1, false));
                    })(1);
                    let results = getFieldDataFunc();
                    return Promise.resolve(results);
                };
                // Gets list of applications from datasource to populate the Application dropdown listbox
                NewRelicQueryCtrl.prototype.getApplications = function () {
                    var _this = this;
                    if (_this.apps === undefined) {
                        _this.doPagingLoop(
                            function(requestedPageNumber) { return _this.datasource.getApplications(requestedPageNumber); },
                            function(appsPageData) { return lodash_1.default.map(appsPageData, function(appsPageDataItem) { return {name: appsPageDataItem.name, id: appsPageDataItem.id};}); },
                            10,
                            200,
                            function() { return _this.apps; },
                            function(cachedData) { if (_this.apps === undefined) { _this.apps = cachedData; } },
                            function(dataItem) { _this.apps.push(dataItem); }
                        );
                    }
                    return Promise.resolve(_this.apps);
                };

                // Gets list of metrics from datasource
                NewRelicQueryCtrl.prototype.getMetrics = function () {
                    var _this = this;
                    if (_this.metricsOperand1 === undefined) {
                        _this.doPagingLoop(
                            function(requestedPageNumber) { return _this.datasource.getMetricNames(_this.target.app_id, requestedPageNumber); },
                            null,
                            10,
                            1000,
                            function() { return _this.metricsOperand1; },
                            function(cachedData) { _this.metricsOperand1 = cachedData; },
                            function(dataItem) { _this.metricsOperand1.push(dataItem); }
                        );
                    }
                    return Promise.resolve(_this.metricsOperand1);
                };

                // Gets list of metric namespaces from datasource to populate the Metric Namespace dropdown
                NewRelicQueryCtrl.prototype.getMetricNamespaces = function () {
                    return this.getMetrics().then(function (metrics) {
                        return lodash_1.default.map(metrics, function (metric) {
                            return { text: metric.name, value: metric.name };
                        });
                    });
                };
                // Gets list of metric namespaces from datasource to populate the Metric Value dropdown
                NewRelicQueryCtrl.prototype.getMetricValues = function () {
                    var name = this.target.target;
                    return this.getMetrics().then(function (metrics) {
                        var ns = lodash_1.default.find(metrics, { name: name });
                        if (ns) {
                            return lodash_1.default.map(ns.values, function (val) {
                                return { text: val, value: val };
                            });
                        }
                        else {
                            return [];
                        }
                    });
                };
                // Gets list of metrics from datasource for the second operand
                NewRelicQueryCtrl.prototype.getMetricsOperand2 = function () {
                    var _this = this;
                    if (_this.metricsOperand2 === undefined) {
                        _this.doPagingLoop(
                            function(requestedPageNumber) { return _this.datasource.getMetricNames(_this.target.app_id, requestedPageNumber); },
                            null,
                            10,
                            1000,
                            function() { return _this.metricsOperand2; },
                            function(cachedData) { _this.metricsOperand2 = cachedData; },
                            function(dataItem) { _this.metricsOperand2.push(dataItem); }
                        );
                    }
                    return Promise.resolve(_this.metricsOperand2);
                };
                // Gets list of metric namespaces from datasource to populate the Metric Namespace dropdown for the second operand
                NewRelicQueryCtrl.prototype.getMetricNamespacesOperand2 = function () {
                    return this.getMetricsOperand2().then(function (metricsOperand2) {
                        return lodash_1.default.map(metricsOperand2, function (metric) {
                            return { text: metric.name, value: metric.name };
                        });
                    });
                };
                // Gets list of metric namespaces from datasource to populate the Metric Value dropdown for the second operand
                NewRelicQueryCtrl.prototype.getMetricValuesOperand2 = function () {
                    var name = this.target.targetOperand2;
                    return this.getMetricsOperand2().then(function (metricsOperand2) {
                        var ns = lodash_1.default.find(metricsOperand2, { name: name });
                        if (ns) {
                            return lodash_1.default.map(ns.values, function (val) {
                                return { text: val, value: val };
                            });
                        }
                        else {
                            return [];
                        }
                    });
                };
                // Shows the second operand selection if the operator is defined
                NewRelicQueryCtrl.prototype.toggleOperand2 = function () {
                    if (this.target.operator != "") {
                        this.isOperand2Visible = true;
                    }
                    else {
                        this.isOperand2Visible = false;
                        this.target.constantOperand2 = "";
                        this.target.metricOperand2 = "";
                        this.target.aggregationsOperand2 = "";
                        this.refresh();
                    }
                };
                // Resets query editor
                NewRelicQueryCtrl.prototype.toggleApplication = function () {
                    this.isOperand2Visible = false;
                    this.target.target = "";
                    this.target.value = "";
                    this.target.operator = "";
                    this.target.targetOperand2 = "";
                    this.target.valueOperand2 = "";
                    this.getMetrics();
                };
                // Refreshes the page
                NewRelicQueryCtrl.prototype.onChangeInternal = function () {
                    this.refresh();
                };
                NewRelicQueryCtrl.templateUrl = 'partials/query.editor.html';
                return NewRelicQueryCtrl;
            })(sdk_1.QueryCtrl);
            exports_1("NewRelicQueryCtrl", NewRelicQueryCtrl);
        }
    }
});
//# sourceMappingURL=query_ctrl.js.map
