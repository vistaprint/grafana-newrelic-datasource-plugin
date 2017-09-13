///<reference path="../typings/tsd.d.ts" />
import moment from 'moment';

class NewRelicDatasource {
  name: string;
  appId: any;
  apiKey: any;
  apiUrl: string;

  /** @ngInject */
  constructor(instanceSettings, private $q, private backendSrv, private templateSrv) {
    this.name = instanceSettings.name;
    this.appId = instanceSettings.jsonData.app_id;
    this.apiKey = instanceSettings.jsonData.api_key;
    this.apiUrl = "https://api.newrelic.com";
    this.backendSrv = backendSrv;
  }

  // Takes input from grafana, sends requests to new relic , and transforms new relic response to grafana format
  query(options) {
    var self = this;
    var requests = [];

    options.targets.forEach(function(target){
      var type = target.type || 'applications';
      var app_id = target.app_id;
      var namespaces = [target.target];
      var metricvalues = [target.value];

      if (target.operator != "" && target.targetOperand2 != "" && target.valueOperand2 != "") {
        namespaces = [target.target, target.targetOperand2];
        metricvalues = [target.value, target.valueOperand2];
      }

      var request_metadata = {
        operand1 : {
          namespace: target.target,
          metricvalue: target.value, 
        },
        operand2 : {
          namespace: target.targetOperand2,
          metricvalue: target.valueOperand2, 
        },
        operator : target.operator,
      }
      
      var request = {
        refId: target.refId,
        alias: target.alias,
        url: self.apiUrl + '/v2/' + type + '/' + app_id + '/metrics/data.json',
        params: {
          "names[]": namespaces,
          "values[]": metricvalues,
          to: options.range.to,
          from: options.range.from,
          period: self._convertToSeconds(options.interval || "60s"),
        },
        metadata: request_metadata,
      }

      if (app_id) {
        requests.push(request);
      }
    });
    return this.makeMultipleRequests(requests);
  }

  // Makes request for each target
  makeMultipleRequests(requests) {
    var self = this;
    return this.$q(function(resolve, reject) {
      var mergedResults = {
        data: [],
      }
      var promises = [];
      requests.forEach(function(request){
        promises.push(self.makeRequest(request));
      });
      self.$q.all(promises).then((data) => {
        data.forEach(function(result){
          mergedResults.data = mergedResults.data.concat(self._parseMetricResults(result));
        });
        resolve(mergedResults);
      });
    });
  }

  // All intervals under 1 minute are automatically set to 1 minute
  // At this time it seems like the NewRelic API does not return any results with an interval lower than 1m
  // Note that for case "s"
  _convertToSeconds(interval) {
    var seconds: number = parseInt(interval);
    var unit: string = interval.slice(-1).toLowerCase();
    switch (unit) {
      case "s":
        seconds = 60;
        break;
      case "m":
        seconds = seconds * 60;
        break;
      case "h":
        seconds = seconds * 3600;
        break;
      case "d":
        seconds = seconds * 86400;
        break;
      default:
        seconds = 60;
        break;
    }
    return seconds;
  }

  _parseMetricResults(result) {
    var self = this;
    var metrics = result.response.metric_data.metrics;
    var metricsList = [];

    // Create lists of metrics series
    metrics.forEach(function(metric){
      metric.alias = result.alias;
      metricsList = metricsList.concat(self._parseMetric(metric));
    });

    // If there was an expression with the second operand, evaluate the expression
    if (result.metadata.operator != "" && result.metadata.operand2.namespace != "" && result.metadata.operand2.metricvalue != "" ) {
      return self._evaluateExpression(metricsList, result.metadata);
    }

    return metricsList;
  }

  _parseMetric(metric) {
    var self = this;
    var metricValues = Object.keys(metric.timeslices[0].values);
    var metricData = [];
    metricValues.forEach(function(metricValue){
      metricData.push({
        target: self._parseTargetAlias(metric, metricValue),
        datapoints: self._getTargetSeries(metric, metricValue),
        namespace: metric.name,
        metricvalue: metricValue,
      });
    });
    return metricData;
  }

  _getTargetSeries(metric, metricValue) {
    var series = [];
    metric.timeslices.forEach(function(slice){
      series.push([slice.values[metricValue], moment(slice.to).valueOf()]);
    });
    return series;
  }

  _parseTargetAlias(metric, metricValue) {
    if (metric.alias) {
      return metric.alias.replace(/\$value/g, metricValue);
    } else {
      return metric.name + ":" + metricValue;
    }
  }

  // Evaluates expression in case operator is defined
  _evaluateExpression(metricsList, metadata) {
    var result = [];
    var resultseries = [];
    var op1series = [];
    var op2series = [];

    var target = metricsList[0].target;
    
    // Find first operand series
    metricsList.forEach(function(metricData){
      if (metricData.namespace == metadata.operand1.namespace && metricData.metricvalue == metadata.operand1.metricvalue)
        op1series = metricData.datapoints;
    });

    // Find second operand series
    metricsList.forEach(function(metricData){
      if (metricData.namespace == metadata.operand2.namespace && metricData.metricvalue == metadata.operand2.metricvalue)
        op2series = metricData.datapoints;
    });

    // Apply operation to the series
    var i=0;
    op1series.forEach(function(op1value){
      // Evaluate the operator
      switch (metadata.operator) {
        case '+':
          resultseries.push([op1value[0]+op2series[i][0],op1value[1]]);
          break;
        case '-':
          resultseries.push([op1value[0]-op2series[i][0],op1value[1]]);
          break;
        case '*':
          resultseries.push([op1value[0]*op2series[i][0],op1value[1]]);
          break;
        case '/':
          if (op2series[i][0] != 0) 
            resultseries.push([op1value[0]/op2series[i][0],op1value[1]]);
          else
            resultseries.push([0,op1value[1]]);
          break;
        default:
          resultseries.push([op1value[0],op1value[1]]);
      }      
      i++;
    });

    result.push({
      target: target, 
      datapoints: resultseries,
    });
    return result;
  }

  // Makes API request to new relic to get metrics data
  makeRequest(request) {
    var options: any = {
      method: "get",
      url: request.url,
      params: request.params,
      data:   request.data,
    };

    options.headers = options.headers || {};
    options.headers["X-Api-Key"] = this.apiKey;

    return this.backendSrv.datasourceRequest(options).then(result => {
      return {response: result.data, refId: request.refId, alias: request.alias, metadata: request.metadata };
    }, function(err) {
      if (err.status !== 0 || err.status >= 300) {
        if (err.data && err.data.error) {
          throw { message: 'New Relic Error Response: ' + err.data.error.title, data: err.data, config: err.config };
        } else {
          throw { message: 'New Relic Error: ' + err.message, data: err.data, config: err.config };
        }
      }
    });
  }

  // Tests datasource during setup
  testDatasource() {
    var url = this.apiUrl + '/v2/applications.json';

    return this.makeRequest({url: url}).then(() => {
      return { status: "success", message: "Data source is working", title: "Success" };
    });
  }

  // Gets metrics for query editor
  getMetricNames(application_id) {
    var self = this;
    if (!application_id) {
      application_id = this.appId;
    }

    let request = {
      url: self.apiUrl + '/v2/applications/' + application_id + '/metrics.json'
    };

    return this.makeRequest(request)
    .then(result => {
      if (result && result.response && result.response.metrics) {
        return result.response.metrics;
      } else {
        return [];
      }
    });
  }

  // Gets applications for query editor
  getApplications() {
    var self = this;
    let request = {
      url: self.apiUrl + '/v2/applications.json'
    };

    return this.makeRequest(request)
    .then(result => {
      if (result && result.response && result.response.applications) {
        return result.response.applications;
      } else {
        return [];
      }
    });
  }

}

export {NewRelicDatasource};
