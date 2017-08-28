///<reference path="../typings/tsd.d.ts" />
import {QueryCtrl} from 'app/plugins/sdk';
import _ from 'lodash';

class NewRelicQueryCtrl extends QueryCtrl {
  static templateUrl = 'partials/query.editor.html';
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
  constructor($scope, $injector) {
    super($scope, $injector);

    this.operators = [
      { value: '', label: 'none' },
      { value: '+', label: '+' },
      { value: '-', label: '-' },
      { value: '*', label: '*' },
      { value: '/', label: '/' },
    ];
    
    let target_defaults = {
      type: 'applications',
      app_id: null,
      target: null,
      value: null,
    }
    _.defaultsDeep(this.target, target_defaults);

    this.getApplications();
    this.toggleOperand2();
  };

  // Gets list of applications from datasource to populate the Application dropdown listbox
  getApplications() {
    if (this.apps) {
      return Promise.resolve(this.apps);
    } else {
      return this.datasource.getApplications()
      .then(apps => {
        apps = _.map(apps, app => {
          return { name: app.name, id: app.id };
        });
        apps.push({ name: 'Default', id: null });
        this.apps = apps;

        return apps;
      });
    }
  }

  // Gets list of metrics from datasource 
  getMetrics() {
    if (this.metricsOperand1) {
      return Promise.resolve(this.metricsOperand1);
    } else {
      return this.datasource.getMetricNames(this.target.app_id)
      .then(metrics => {
        this.metricsOperand1 = metrics;
        return metrics;
      });
    }
  }

  // Gets list of metric namespaces from datasource to populate the Metric Namespace dropdown
  getMetricNamespaces() {
    return this.getMetrics().then(metrics => {
      return _.map(metrics, metric => {
        return { text: metric.name, value: metric.name };
      });
    });
  }

  // Gets list of metric namespaces from datasource to populate the Metric Value dropdown
  getMetricValues() {
    let name = this.target.target;
    return this.getMetrics().then(metrics => {
      let ns = _.find(metrics, {name: name});
      if (ns) {
        return _.map(ns.values, val => {
          return { text: val, value: val };
        });
      } else {
        return [];
      }
    });
  }

  // Gets list of metrics from datasource for the second operand
  getMetricsOperand2() {
    if (this.metricsOperand2) {
      return Promise.resolve(this.metricsOperand2);
    } else {
      return this.datasource.getMetricNames(this.target.app_id)
      .then(metricsOperand2 => {
        this.metricsOperand2 = metricsOperand2;
        return metricsOperand2;
      });
    }
  }

  // Gets list of metric namespaces from datasource to populate the Metric Namespace dropdown for the second operand
  getMetricNamespacesOperand2() {
    return this.getMetricsOperand2().then(metricsOperand2 => {
      return _.map(metricsOperand2, metric => {
        return { text: metric.name, value: metric.name };
      });
    });
  }

  // Gets list of metric namespaces from datasource to populate the Metric Value dropdown for the second operand
  getMetricValuesOperand2() {
    let name = this.target.targetOperand2;
    return this.getMetricsOperand2().then(metricsOperand2 => {
      let ns = _.find(metricsOperand2, {name: name});
      if (ns) {
        return _.map(ns.values, val => {
          return { text: val, value: val };
        });
      } else {
        return [];
      }
    });
  }

  // Shows the second operand selection if the operator is defined
  toggleOperand2() {
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
  }

  // Resets query editor
  toggleApplication() {
    this.isOperand2Visible = false;
    this.target.target = "";
    this.target.value = "";
    this.target.operator = "";
    this.target.targetOperand2 = "";
    this.target.valueOperand2 = "";

    this.getMetrics();
  }

  // Refreshes the page
  onChangeInternal() {
    this.refresh();
  }
}

export {NewRelicQueryCtrl};
