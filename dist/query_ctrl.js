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

                // Gets list of applications from datasource to populate the Application dropdown listbox
                NewRelicQueryCtrl.prototype.getApplications = function () {
                    var _this = this;
                    if (this.apps) {
                        return Promise.resolve(this.apps);
                    }
                    else {
                        // keep the final page number low enough to prevent any runaway processes, just in case...
                        var finalPageNumber = 10;
                        (function loopOnPagedResults(requestedPageNumber) {
                            shouldContinueLoop = (finalPageNumber > requestedPageNumber);
                            if (shouldContinueLoop) new Promise((resolve, reject) => {
                                _this.datasource.getApplications(requestedPageNumber).then(function (appsPageData) {
                                    appsPageData = lodash_1.default.map(
                                        appsPageData,
                                        function (appsPageData) {
                                            return { name: appsPageData.name, id: appsPageData.id };
                                        }
                                    );
                                    // Max data results count is 200: https://docs.newrelic.com/docs/apis/rest-api-v2/requirements/pagination-api-output
                                    if (appsPageData.length < 200) {
                                        finalPageNumber = requestedPageNumber;
                                    }
                                    if (_this.apps == null) {
                                        appsPageData.unshift({ name: 'Default', id: null });
                                        _this.apps = appsPageData;
                                    } else {
                                        for(var i=0;i<appsPageData.length;i++) {_this.apps.push(appsPageData[i]);}
                                    }
                                    resolve();
                                });
                            }).then(loopOnPagedResults.bind(null, requestedPageNumber + 1));
                        })(1);
                    }
                };
                // Gets list of metrics from datasource 
                NewRelicQueryCtrl.prototype.getMetrics = function () {
                    var _this = this;
                    if (this.metricsOperand1) {
                        return Promise.resolve(this.metricsOperand1);
                    }
                    else {
                        return this.datasource.getMetricNames(this.target.app_id)
                            .then(function (metrics) {
                            _this.metricsOperand1 = metrics;
                            return metrics;
                        });
                    }
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
                    if (this.metricsOperand2) {
                        return Promise.resolve(this.metricsOperand2);
                    }
                    else {
                        return this.datasource.getMetricNames(this.target.app_id)
                            .then(function (metricsOperand2) {
                            _this.metricsOperand2 = metricsOperand2;
                            return metricsOperand2;
                        });
                    }
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
