# 📊 ExchangeGO - Monitoring, Logging & Observability

**Часть:** 8.3  
**Время:** 8 часов  
**Приоритет:** 🟡 Средний

---

## 📋 Описание

Comprehensive monitoring setup с Prometheus, Grafana, ELK Stack для логирования, и application performance monitoring.

## 🎯 Цели

- Настроить полноценный monitoring stack
- Реализовать централизованное логирование
- Создать informative dashboards
- Настроить alerting system
- Обеспечить observability всех компонентов

---

## 📈 Prometheus Configuration

### Main Configuration

```yaml
# monitoring/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - 'rules/*.yml'

alerting:
  alertmanagers:
    - static_configs:
        - targets:
            - alertmanager:9093

scrape_configs:
  # Prometheus itself
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  # ExchangeGO Services
  - job_name: 'exchangego-web'
    static_configs:
      - targets: ['web:3000']
    metrics_path: '/api/metrics'
    scrape_interval: 30s

  - job_name: 'exchangego-admin'
    static_configs:
      - targets: ['admin:3000']
    metrics_path: '/api/metrics'
    scrape_interval: 30s

  - job_name: 'exchangego-gateway'
    static_configs:
      - targets: ['gateway:3001']
    metrics_path: '/metrics'
    scrape_interval: 15s

  # Infrastructure
  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']

  - job_name: 'postgres-exporter'
    static_configs:
      - targets: ['postgres-exporter:9187']

  - job_name: 'redis-exporter'
    static_configs:
      - targets: ['redis-exporter:9121']

  # Nginx
  - job_name: 'nginx'
    static_configs:
      - targets: ['nginx:9113']
```

### Alert Rules

```yaml
# monitoring/rules/alerts.yml
groups:
  - name: exchangego-alerts
    rules:
      # High error rate
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: 'High error rate detected'
          description: 'Error rate is {{ $value }} requests per second'

      # High response time
      - alert: HighResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: 'High response time detected'
          description: '95th percentile response time is {{ $value }} seconds'

      # Database connection issues
      - alert: DatabaseConnectionHigh
        expr: pg_stat_database_numbackends > 80
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: 'High database connections'
          description: 'Database has {{ $value }} active connections'

      # Memory usage
      - alert: HighMemoryUsage
        expr: process_resident_memory_bytes / 1024 / 1024 > 512
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: 'High memory usage'
          description: 'Process memory usage is {{ $value }} MB'

      # Disk space
      - alert: LowDiskSpace
        expr: (node_filesystem_avail_bytes / node_filesystem_size_bytes) * 100 < 10
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: 'Low disk space'
          description: 'Disk space is {{ $value }}% full'

      # Service down
      - alert: ServiceDown
        expr: up == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: 'Service is down'
          description: '{{ $labels.job }} service is down'

      # Exchange-specific alerts
      - alert: HighExchangeFailureRate
        expr: rate(exchange_orders_total{status="failed"}[5m]) / rate(exchange_orders_total[5m]) > 0.05
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: 'High exchange failure rate'
          description: 'Exchange failure rate is {{ $value }}%'

      - alert: LowExchangeVolume
        expr: rate(exchange_volume_total[1h]) < 1000
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: 'Low exchange volume'
          description: 'Exchange volume is below threshold'
```

---

## 📊 Grafana Dashboards

### Application Metrics Dashboard

```json
{
  "dashboard": {
    "id": null,
    "title": "ExchangeGO Application Metrics",
    "tags": ["exchangego", "application"],
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total{job=\"exchangego-gateway\"}[5m])",
            "legendFormat": "{{method}} {{route}}"
          }
        ],
        "yAxes": [
          {
            "label": "Requests/sec",
            "min": 0
          }
        ]
      },
      {
        "id": 2,
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{job=\"exchangego-gateway\"}[5m]))",
            "legendFormat": "95th percentile"
          },
          {
            "expr": "histogram_quantile(0.50, rate(http_request_duration_seconds_bucket{job=\"exchangego-gateway\"}[5m]))",
            "legendFormat": "50th percentile"
          }
        ],
        "yAxes": [
          {
            "label": "Seconds",
            "min": 0
          }
        ]
      },
      {
        "id": 3,
        "title": "Error Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total{job=\"exchangego-gateway\",status=~\"5..\"}[5m])",
            "legendFormat": "5xx errors"
          },
          {
            "expr": "rate(http_requests_total{job=\"exchangego-gateway\",status=~\"4..\"}[5m])",
            "legendFormat": "4xx errors"
          }
        ],
        "yAxes": [
          {
            "label": "Errors/sec",
            "min": 0
          }
        ]
      },
      {
        "id": 4,
        "title": "Database Connections",
        "type": "graph",
        "targets": [
          {
            "expr": "pg_stat_database_numbackends{datname=\"exchangego\"}",
            "legendFormat": "Active connections"
          }
        ]
      },
      {
        "id": 5,
        "title": "Memory Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "process_resident_memory_bytes{job=\"exchangego-gateway\"}",
            "legendFormat": "Gateway Memory"
          }
        ],
        "yAxes": [
          {
            "label": "Bytes",
            "min": 0
          }
        ]
      },
      {
        "id": 6,
        "title": "Exchange Metrics",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(exchange_orders_total[5m])",
            "legendFormat": "Orders/sec"
          },
          {
            "expr": "rate(exchange_volume_total[5m])",
            "legendFormat": "Volume/sec"
          }
        ]
      }
    ],
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "refresh": "10s"
  }
}
```

### Business Metrics Dashboard

```json
{
  "dashboard": {
    "id": null,
    "title": "ExchangeGO Business Metrics",
    "tags": ["exchangego", "business"],
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "Exchange Volume by Currency",
        "type": "piechart",
        "targets": [
          {
            "expr": "sum by (currency) (increase(exchange_volume_total[1h]))",
            "legendFormat": "{{currency}}"
          }
        ]
      },
      {
        "id": 2,
        "title": "Order Success Rate",
        "type": "stat",
        "targets": [
          {
            "expr": "sum(rate(exchange_orders_total{status=\"completed\"}[5m])) / sum(rate(exchange_orders_total[5m])) * 100",
            "legendFormat": "Success Rate %"
          }
        ]
      },
      {
        "id": 3,
        "title": "Active Users",
        "type": "graph",
        "targets": [
          {
            "expr": "active_connections",
            "legendFormat": "Active Users"
          }
        ]
      },
      {
        "id": 4,
        "title": "Revenue by Hour",
        "type": "graph",
        "targets": [
          {
            "expr": "increase(exchange_revenue_total[1h])",
            "legendFormat": "Revenue"
          }
        ]
      }
    ]
  }
}
```

---

## 🔧 Application Metrics Implementation

### NestJS Metrics Service

```typescript
// exchanger-gateway/src/metrics/metrics.service.ts
import { Injectable } from '@nestjs/common';
import { register, Counter, Histogram, Gauge } from 'prom-client';

@Injectable()
export class MetricsService {
  private readonly httpRequestsTotal = new Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status'],
  });

  private readonly httpRequestDuration = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status'],
    buckets: [0.1, 0.5, 1, 2, 5],
  });

  private readonly exchangeOrdersTotal = new Counter({
    name: 'exchange_orders_total',
    help: 'Total number of exchange orders',
    labelNames: ['from_currency', 'to_currency', 'status'],
  });

  private readonly exchangeVolumeTotal = new Counter({
    name: 'exchange_volume_total',
    help: 'Total exchange volume in base currency',
    labelNames: ['currency'],
  });

  private readonly exchangeRevenueTotal = new Counter({
    name: 'exchange_revenue_total',
    help: 'Total exchange revenue',
    labelNames: ['currency'],
  });

  private readonly activeConnections = new Gauge({
    name: 'active_connections',
    help: 'Number of active connections',
  });

  private readonly databaseQueries = new Counter({
    name: 'database_queries_total',
    help: 'Total number of database queries',
    labelNames: ['operation', 'table'],
  });

  private readonly cacheHits = new Counter({
    name: 'cache_hits_total',
    help: 'Total number of cache hits',
    labelNames: ['cache_key'],
  });

  constructor() {
    register.registerMetric(this.httpRequestsTotal);
    register.registerMetric(this.httpRequestDuration);
    register.registerMetric(this.exchangeOrdersTotal);
    register.registerMetric(this.exchangeVolumeTotal);
    register.registerMetric(this.exchangeRevenueTotal);
    register.registerMetric(this.activeConnections);
    register.registerMetric(this.databaseQueries);
    register.registerMetric(this.cacheHits);
  }

  recordHttpRequest(method: string, route: string, status: number, duration: number) {
    this.httpRequestsTotal.inc({ method, route, status: status.toString() });
    this.httpRequestDuration.observe({ method, route, status: status.toString() }, duration);
  }

  recordExchangeOrder(
    fromCurrency: string,
    toCurrency: string,
    status: string,
    amount: number,
    revenue?: number
  ) {
    this.exchangeOrdersTotal.inc({ from_currency: fromCurrency, to_currency: toCurrency, status });
    this.exchangeVolumeTotal.inc({ currency: fromCurrency }, amount);

    if (revenue && status === 'completed') {
      this.exchangeRevenueTotal.inc({ currency: fromCurrency }, revenue);
    }
  }

  recordDatabaseQuery(operation: string, table: string) {
    this.databaseQueries.inc({ operation, table });
  }

  recordCacheHit(cacheKey: string) {
    this.cacheHits.inc({ cache_key: cacheKey });
  }

  setActiveConnections(count: number) {
    this.activeConnections.set(count);
  }

  async getMetrics(): Promise<string> {
    return register.metrics();
  }
}

// Metrics middleware
@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  constructor(private readonly metricsService: MetricsService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();

    res.on('finish', () => {
      const duration = (Date.now() - start) / 1000;
      this.metricsService.recordHttpRequest(
        req.method,
        req.route?.path || req.path,
        res.statusCode,
        duration
      );
    });

    next();
  }
}
```

### Metrics Controller

```typescript
// exchanger-gateway/src/metrics/metrics.controller.ts
import { Controller, Get, Header } from '@nestjs/common';
import { MetricsService } from './metrics.service';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  @Header('Content-Type', 'text/plain')
  async getMetrics(): Promise<string> {
    return this.metricsService.getMetrics();
  }
}
```

---

## 📝 Logging System

### Custom Logger Service

```typescript
// exchanger-gateway/src/logging/logger.service.ts
import { LoggerService } from '@nestjs/common';
import * as winston from 'winston';
import { ElasticsearchTransport } from 'winston-elasticsearch';

export class CustomLoggerService implements LoggerService {
  private readonly logger: winston.Logger;

  constructor() {
    const transports: winston.transport[] = [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.timestamp(),
          winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
            return `${timestamp} [${context}] ${level}: ${message} ${
              Object.keys(meta).length ? JSON.stringify(meta) : ''
            }`;
          })
        ),
      }),
    ];

    // Add Elasticsearch transport in production
    if (process.env.NODE_ENV === 'production') {
      transports.push(
        new ElasticsearchTransport({
          level: 'info',
          clientOpts: {
            node: process.env.ELASTICSEARCH_URL,
          },
          index: 'exchangego-logs',
          transformer: logData => ({
            '@timestamp': new Date().toISOString(),
            message: logData.message,
            level: logData.level,
            context: logData.meta.context,
            environment: process.env.NODE_ENV,
            service: 'exchangego-gateway',
            ...logData.meta,
          }),
        })
      );
    }

    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      transports,
    });
  }

  log(message: string, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, { trace, context });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { context });
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, { context });
  }

  // Business event logging
  logExchangeOrder(orderData: any, context = 'ExchangeOrder') {
    this.logger.info('Exchange order processed', {
      context,
      ...orderData,
    });
  }

  logUserAction(userId: string, action: string, metadata?: any, context = 'UserAction') {
    this.logger.info(`User action: ${action}`, {
      context,
      userId,
      action,
      ...metadata,
    });
  }

  logSecurityEvent(event: string, metadata?: any, context = 'Security') {
    this.logger.warn(`Security event: ${event}`, {
      context,
      event,
      ...metadata,
    });
  }
}
```

### Structured Logging Interceptor

```typescript
// exchanger-gateway/src/logging/logging.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CustomLoggerService } from './logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: CustomLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, headers, user } = request;
    const start = Date.now();

    return next.handle().pipe(
      tap(response => {
        const duration = Date.now() - start;

        this.logger.log(`${method} ${url} - ${duration}ms`, 'HTTP', {
          method,
          url,
          duration,
          statusCode: context.switchToHttp().getResponse().statusCode,
          userId: user?.id,
          userAgent: headers['user-agent'],
          ip: request.ip,
          responseSize: JSON.stringify(response).length,
        });
      })
    );
  }
}
```

---

## 🐳 Monitoring Docker Compose

```yaml
# docker-compose.monitoring.yml
version: '3.8'

services:
  # Prometheus
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    ports:
      - '9090:9090'
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - ./monitoring/rules:/etc/prometheus/rules
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--storage.tsdb.retention.time=200h'
      - '--web.enable-lifecycle'
    networks:
      - monitoring

  # Grafana
  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    ports:
      - '3003:3000'
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana/provisioning:/etc/grafana/provisioning
      - ./monitoring/grafana/dashboards:/var/lib/grafana/dashboards
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_USERS_ALLOW_SIGN_UP=false
      - GF_INSTALL_PLUGINS=grafana-piechart-panel
    networks:
      - monitoring

  # Alertmanager
  alertmanager:
    image: prom/alertmanager:latest
    container_name: alertmanager
    ports:
      - '9093:9093'
    volumes:
      - ./monitoring/alertmanager.yml:/etc/alertmanager/alertmanager.yml
      - alertmanager_data:/alertmanager
    networks:
      - monitoring

  # Node Exporter
  node-exporter:
    image: prom/node-exporter:latest
    container_name: node-exporter
    ports:
      - '9100:9100'
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.rootfs=/rootfs'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'
    networks:
      - monitoring

  # Postgres Exporter
  postgres-exporter:
    image: prometheuscommunity/postgres-exporter:latest
    container_name: postgres-exporter
    ports:
      - '9187:9187'
    environment:
      - DATA_SOURCE_NAME=postgresql://postgres:password@postgres:5432/exchangego?sslmode=disable
    networks:
      - monitoring

  # Redis Exporter
  redis-exporter:
    image: oliver006/redis_exporter:latest
    container_name: redis-exporter
    ports:
      - '9121:9121'
    environment:
      - REDIS_ADDR=redis://redis:6379
    networks:
      - monitoring

  # Elasticsearch
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    container_name: elasticsearch
    environment:
      - discovery.type=single-node
      - 'ES_JAVA_OPTS=-Xms512m -Xmx512m'
      - xpack.security.enabled=false
    ports:
      - '9200:9200'
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data
    networks:
      - monitoring

  # Kibana
  kibana:
    image: docker.elastic.co/kibana/kibana:8.11.0
    container_name: kibana
    ports:
      - '5601:5601'
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    depends_on:
      - elasticsearch
    networks:
      - monitoring

  # Filebeat (Log shipper)
  filebeat:
    image: docker.elastic.co/beats/filebeat:8.11.0
    container_name: filebeat
    user: root
    volumes:
      - ./monitoring/filebeat.yml:/usr/share/filebeat/filebeat.yml:ro
      - /var/lib/docker/containers:/var/lib/docker/containers:ro
      - /var/run/docker.sock:/var/run/docker.sock:ro
    networks:
      - monitoring
    depends_on:
      - elasticsearch

volumes:
  prometheus_data:
  grafana_data:
  alertmanager_data:
  elasticsearch_data:

networks:
  monitoring:
    driver: bridge
```

---

## 🚨 Alertmanager Configuration

```yaml
# monitoring/alertmanager.yml
global:
  smtp_smarthost: 'smtp.gmail.com:587'
  smtp_from: 'alerts@exchangego.ru'
  smtp_auth_username: 'alerts@exchangego.ru'
  smtp_auth_password: 'app-password'

route:
  group_by: ['alertname', 'cluster', 'service']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'web.hook'
  routes:
    - match:
        severity: critical
      receiver: 'critical-alerts'
    - match:
        severity: warning
      receiver: 'warning-alerts'

receivers:
  - name: 'web.hook'
    webhook_configs:
      - url: 'http://host.docker.internal:5001/'

  - name: 'critical-alerts'
    email_configs:
      - to: 'admin@exchangego.ru,ops@exchangego.ru'
        subject: '🚨 CRITICAL: ExchangeGO Alert'
        body: |
          Alert: {{ .GroupLabels.alertname }}
          Summary: {{ range .Alerts }}{{ .Annotations.summary }}{{ end }}
          Description: {{ range .Alerts }}{{ .Annotations.description }}{{ end }}
    slack_configs:
      - api_url: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK'
        channel: '#alerts-critical'
        title: '🚨 Critical Alert'
        text: '{{ range .Alerts }}{{ .Annotations.summary }}{{ end }}'

  - name: 'warning-alerts'
    email_configs:
      - to: 'dev@exchangego.ru'
        subject: '⚠️  WARNING: ExchangeGO Alert'
        body: |
          Alert: {{ .GroupLabels.alertname }}
          Summary: {{ range .Alerts }}{{ .Annotations.summary }}{{ end }}
          Description: {{ range .Alerts }}{{ .Annotations.description }}{{ end }}
```

---

## ✅ Чек-лист готовности

- [ ] Prometheus monitoring настроен
- [ ] Grafana dashboards созданы
- [ ] Alert rules настроены
- [ ] Application metrics реализованы
- [ ] Logging с Elasticsearch настроен
- [ ] Kibana для log analysis готов
- [ ] Health checks endpoints созданы
- [ ] Performance monitoring готово
- [ ] Business metrics tracking
- [ ] Security event logging
- [ ] Alertmanager notifications
- [ ] Log rotation настроен

---

## 📊 Результаты

**Время выполнения:** 8 часов  
**Статус:** COMPLETED ✅

### Достижения:

1. **Comprehensive Monitoring** 📈
   - Prometheus metrics collection
   - Custom application metrics
   - Infrastructure monitoring
   - Business KPI tracking

2. **Observability Stack** 👀
   - Grafana visualization
   - Real-time dashboards
   - Alert management
   - Log aggregation

3. **Operational Intelligence** 🧠
   - Performance insights
   - Error tracking
   - User behavior analytics
   - Business intelligence

4. **Proactive Alerting** 🚨
   - Multi-channel notifications
   - Severity-based routing
   - Automated escalation
   - Incident management
