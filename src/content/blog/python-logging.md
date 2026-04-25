---
title: 'Custom Logging in Python'
description: 'How to utilize regex using python'
pubDate: 'April 27 2026'
heroImage: '/Build_the_web_you_want.png'
---

## Why Custom Logging?

`print()` statements are fine for quick debugging, but production code needs structured, configurable, and persistent logging. Python's built-in `logging` module gives you severity levels, multiple output destinations, formatting control, and filtering — all without any third-party packages.

```python
import logging
```

---

## The Basics — Logging Levels

Each level represents a severity. Messages below the configured threshold are silently ignored.

| Level | Value | When to Use |
|-------|-------|-------------|
| `DEBUG` | 10 | Detailed diagnostic info during development |
| `INFO` | 20 | Confirmation that things are working as expected |
| `WARNING` | 30 | Something unexpected, but the app still works |
| `ERROR` | 40 | A feature failed, but the app keeps running |
| `CRITICAL` | 50 | The app itself may be crashing |

```python
logging.debug("Variable x = %s", x)
logging.info("Server started on port 8080")
logging.warning("Disk usage at 89%")
logging.error("Failed to connect to database")
logging.critical("Out of memory — shutting down")
```

---

## Quick Start — `basicConfig`

The simplest way to configure logging in one line.

```python
import logging

logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

logging.info("Application started")
# 2025-04-24 10:03:22 [INFO] root: Application started
```

> **Limitation:** `basicConfig` only works once. If you need flexibility, use handlers and formatters directly (covered below).

---

## Core Architecture

Python logging has four building blocks that snap together:

```
Logger  →  Handler  →  Formatter
  ↓
Filter (optional)
```

- **Logger** — The entry point. You call `.info()`, `.error()`, etc. on it.
- **Handler** — Decides *where* the log goes (console, file, network, email).
- **Formatter** — Decides *how* the log looks (timestamp format, included fields).
- **Filter** — Decides *which* logs pass through (by name, level, or custom logic).

---

## Setting Up a Custom Logger Step by Step

### Step 1 — Create a Named Logger

Always use `__name__` so each module gets its own logger automatically.

```python
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)
```

### Step 2 — Add a Console Handler

```python
console_handler = logging.StreamHandler()
console_handler.setLevel(logging.INFO)

console_format = logging.Formatter(
    "%(asctime)s │ %(levelname)-8s │ %(name)s │ %(message)s",
    datefmt="%H:%M:%S",
)
console_handler.setFormatter(console_format)

logger.addHandler(console_handler)
```

### Step 3 — Add a File Handler

```python
file_handler = logging.FileHandler("app.log")
file_handler.setLevel(logging.DEBUG)

file_format = logging.Formatter(
    "%(asctime)s [%(levelname)s] %(name)s (%(filename)s:%(lineno)d): %(message)s"
)
file_handler.setFormatter(file_format)

logger.addHandler(file_handler)
```

### Step 4 — Use It

```python
logger.debug("This goes to the file only")
logger.info("This goes to both console and file")
logger.error("This goes to both console and file")
```

The console only shows INFO and above, while the file captures everything from DEBUG up. This is the power of per-handler levels.

---

## Useful Format Fields

| Field | Output |
|-------|--------|
| `%(asctime)s` | Timestamp (`2025-04-24 10:03:22,451`) |
| `%(name)s` | Logger name (`myapp.auth`) |
| `%(levelname)s` | Level as text (`ERROR`) |
| `%(filename)s` | Source file (`views.py`) |
| `%(lineno)d` | Line number (`42`) |
| `%(funcName)s` | Function name (`process_order`) |
| `%(module)s` | Module name without `.py` |
| `%(message)s` | The actual log message |
| `%(process)d` | Process ID |
| `%(thread)d` | Thread ID |
| `%(threadName)s` | Thread name |

---

## Real-World Examples

### 1. Web Application Logger with Rotating Files

Prevent log files from eating all your disk space.

```python
import logging
from logging.handlers import RotatingFileHandler

logger = logging.getLogger("webapp")
logger.setLevel(logging.DEBUG)

# Rotate at 5 MB, keep 3 backups (app.log, app.log.1, app.log.2, app.log.3)
handler = RotatingFileHandler(
    "app.log", maxBytes=5_000_000, backupCount=3
)
handler.setFormatter(logging.Formatter(
    "%(asctime)s [%(levelname)s] %(name)s: %(message)s"
))
logger.addHandler(handler)

logger.info("Request received: GET /api/users")
```

### 2. Daily Log Files with Timed Rotation

Create a new log file every midnight — perfect for servers.

```python
from logging.handlers import TimedRotatingFileHandler

handler = TimedRotatingFileHandler(
    "server.log",
    when="midnight",      # rotate at midnight
    interval=1,           # every 1 day
    backupCount=30,       # keep 30 days of history
)
handler.suffix = "%Y-%m-%d"  # filenames: server.log.2025-04-24
handler.setFormatter(logging.Formatter(
    "%(asctime)s [%(levelname)s] %(message)s"
))

logger = logging.getLogger("server")
logger.addHandler(handler)
```

### 3. Separate Error Log for Monitoring

Route errors to their own file so your alerting system can watch one file.

```python
logger = logging.getLogger("myapp")
logger.setLevel(logging.DEBUG)

# All logs → general file
general = logging.FileHandler("general.log")
general.setLevel(logging.DEBUG)

# Errors only → error file
errors = logging.FileHandler("errors.log")
errors.setLevel(logging.ERROR)

fmt = logging.Formatter("%(asctime)s [%(levelname)s] %(name)s: %(message)s")
general.setFormatter(fmt)
errors.setFormatter(fmt)

logger.addHandler(general)
logger.addHandler(errors)

logger.info("User logged in")          # general.log only
logger.error("Payment gateway timeout") # both files
```

### 4. JSON Logging for Log Aggregation (ELK, Datadog, CloudWatch)

Structured logs are essential for modern observability platforms.

```python
import json
import logging

class JsonFormatter(logging.Formatter):
    def format(self, record):
        log_entry = {
            "timestamp": self.formatTime(record),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }
        # Include exception info if present
        if record.exc_info and record.exc_info[0]:
            log_entry["exception"] = self.formatException(record.exc_info)
        # Include any extra fields passed via the `extra` parameter
        for key in record.__dict__:
            if key not in logging.LogRecord("", 0, "", 0, "", (), None).__dict__:
                log_entry[key] = record.__dict__[key]
        return json.dumps(log_entry)

logger = logging.getLogger("api")
handler = logging.StreamHandler()
handler.setFormatter(JsonFormatter())
logger.addHandler(handler)
logger.setLevel(logging.DEBUG)

logger.info("Order placed", extra={"order_id": "ORD-4521", "amount": 99.95})
# {"timestamp": "2025-04-24 10:03:22,451", "level": "INFO", "message": "Order placed", "order_id": "ORD-4521", "amount": 99.95, ...}
```

### 5. Request-Scoped Logging with Contextual Data

Track a request ID across every log line in a web request.

```python
import logging
import uuid

class RequestFilter(logging.Filter):
    def __init__(self):
        super().__init__()
        self.request_id = "no-request"

    def set_request_id(self, rid):
        self.request_id = rid

    def filter(self, record):
        record.request_id = self.request_id
        return True

logger = logging.getLogger("api")
logger.setLevel(logging.DEBUG)
req_filter = RequestFilter()
logger.addFilter(req_filter)

handler = logging.StreamHandler()
handler.setFormatter(logging.Formatter(
    "%(asctime)s [%(request_id)s] %(levelname)s: %(message)s"
))
logger.addHandler(handler)

# Simulate a request
req_filter.set_request_id(str(uuid.uuid4())[:8])
logger.info("Received POST /api/orders")
logger.info("Validated payload")
logger.info("Order saved to database")
# All three lines share the same request_id for tracing
```

### 6. Email Alerts on Critical Errors

Send an email when something truly breaks.

```python
from logging.handlers import SMTPHandler

mail_handler = SMTPHandler(
    mailhost=("smtp.example.com", 587),
    fromaddr="alerts@example.com",
    toaddrs=["oncall@example.com"],
    subject="CRITICAL: Application Error",
    credentials=("alerts@example.com", "app-password"),
    secure=(),
)
mail_handler.setLevel(logging.CRITICAL)
mail_handler.setFormatter(logging.Formatter(
    "%(asctime)s [%(levelname)s]\n\n%(message)s\n\nModule: %(module)s\nLine: %(lineno)d"
))

logger = logging.getLogger("myapp")
logger.addHandler(mail_handler)

logger.critical("Database connection pool exhausted — all requests failing")
# → email sent to oncall@example.com
```

### 7. Multi-Module Logging with Hierarchy

Loggers follow a dot-separated hierarchy. Configure the parent and children inherit it.

```python
# config.py — set up once at application start
import logging

def setup_logging():
    root = logging.getLogger("myapp")
    root.setLevel(logging.DEBUG)

    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter(
        "%(asctime)s [%(levelname)s] %(name)s: %(message)s"
    ))
    root.addHandler(handler)

# auth.py
logger = logging.getLogger("myapp.auth")
logger.info("User jdoe authenticated")
# Output: 2025-04-24 10:03:22 [INFO] myapp.auth: User jdoe authenticated

# payments.py
logger = logging.getLogger("myapp.payments")
logger.error("Stripe API returned 500")
# Output: 2025-04-24 10:03:22 [ERROR] myapp.payments: Stripe API returned 500
```

Both child loggers automatically use the handler and format configured on `myapp`.

### 8. Configuration via Dictionary (Production Pattern)

The cleanest way to configure logging in larger applications.

```python
import logging.config

LOGGING_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "standard": {
            "format": "%(asctime)s [%(levelname)s] %(name)s: %(message)s"
        },
        "detailed": {
            "format": "%(asctime)s [%(levelname)s] %(name)s (%(filename)s:%(lineno)d): %(message)s"
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "level": "INFO",
            "formatter": "standard",
            "stream": "ext://sys.stdout",
        },
        "file": {
            "class": "logging.handlers.RotatingFileHandler",
            "level": "DEBUG",
            "formatter": "detailed",
            "filename": "app.log",
            "maxBytes": 10_000_000,
            "backupCount": 5,
        },
    },
    "loggers": {
        "myapp": {
            "level": "DEBUG",
            "handlers": ["console", "file"],
            "propagate": False,
        },
    },
}

logging.config.dictConfig(LOGGING_CONFIG)
logger = logging.getLogger("myapp")
logger.info("Logging configured via dictionary")
```

### 9. Logging with Exception Tracebacks

Capture full stack traces alongside your error messages.

```python
logger = logging.getLogger("myapp")

def process_order(order_id):
    try:
        result = 100 / 0  # simulate a bug
    except Exception:
        logger.exception("Failed to process order %s", order_id)
        # .exception() automatically includes the full traceback
        # 2025-04-24 [ERROR] myapp: Failed to process order ORD-42
        # Traceback (most recent call last):
        #   File "orders.py", line 5, in process_order
        #     result = 100 / 0
        # ZeroDivisionError: division by zero
```

### 10. Performance Timing Logger

Measure and log how long operations take.

```python
import logging
import time
from contextlib import contextmanager

logger = logging.getLogger("perf")
logger.setLevel(logging.DEBUG)

handler = logging.StreamHandler()
handler.setFormatter(logging.Formatter("%(asctime)s [PERF] %(message)s"))
logger.addHandler(handler)

@contextmanager
def log_duration(operation):
    start = time.perf_counter()
    yield
    elapsed = time.perf_counter() - start
    logger.info("%s completed in %.3fs", operation, elapsed)

# Usage
with log_duration("Database query"):
    time.sleep(0.35)  # simulate work
# 2025-04-24 10:03:22 [PERF] Database query completed in 0.350s

with log_duration("API call to Stripe"):
    time.sleep(1.2)
# 2025-04-24 10:03:23 [PERF] API call to Stripe completed in 1.200s
```

---

## Advanced Techniques

### Custom Log Levels

Define your own severity levels for domain-specific needs.

```python
AUDIT = 25  # between INFO (20) and WARNING (30)
logging.addLevelName(AUDIT, "AUDIT")

def audit(self, message, *args, **kwargs):
    if self.isEnabledFor(AUDIT):
        self._log(AUDIT, message, args, **kwargs)

logging.Logger.audit = audit

logger = logging.getLogger("myapp")
logger.audit("User jdoe changed role from 'viewer' to 'admin'")
```

### Buffered Logging with `MemoryHandler`

Queue up logs and flush them in batches (useful for reducing I/O).

```python
from logging.handlers import MemoryHandler

file_handler = logging.FileHandler("buffered.log")
memory_handler = MemoryHandler(
    capacity=100,               # buffer up to 100 records
    flushLevel=logging.ERROR,   # flush immediately on ERROR
    target=file_handler,        # final destination
)

logger = logging.getLogger("batch")
logger.addHandler(memory_handler)
```

### Silencing Noisy Third-Party Libraries

Stop `urllib3`, `boto3`, or other libraries from flooding your logs.

```python
logging.getLogger("urllib3").setLevel(logging.WARNING)
logging.getLogger("botocore").setLevel(logging.WARNING)
logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
```

### Thread-Safe Context with `contextvars` (Python 3.7+)

The modern, thread- and async-safe way to attach context.

```python
import logging
import contextvars

request_id_var = contextvars.ContextVar("request_id", default="-")

class ContextFilter(logging.Filter):
    def filter(self, record):
        record.request_id = request_id_var.get()
        return True

# In your request handler:
request_id_var.set("abc-123")
logger.info("Processing request")  # log line includes request_id=abc-123
```

---

## Built-In Handlers Reference

| Handler | Destination |
|---------|-------------|
| `StreamHandler` | Console (`stdout` / `stderr`) |
| `FileHandler` | Single file |
| `RotatingFileHandler` | File with size-based rotation |
| `TimedRotatingFileHandler` | File with time-based rotation |
| `SocketHandler` | TCP socket |
| `DatagramHandler` | UDP socket |
| `SysLogHandler` | Unix syslog |
| `SMTPHandler` | Email via SMTP |
| `MemoryHandler` | In-memory buffer, flushed to a target |
| `HTTPHandler` | HTTP POST/GET to a URL |
| `QueueHandler` | Thread-safe queue (for async processing) |
| `NullHandler` | Discards everything (for libraries) |

---

## What's Possible — A Summary

| Use Case | Approach |
|----------|----------|
| Debugging during development | `DEBUG` level to console |
| Production server monitoring | Rotating files + JSON format |
| Error alerting and on-call notifications | `SMTPHandler` on `CRITICAL` |
| Distributed request tracing | Context filters with request IDs |
| Compliance and audit trails | Custom `AUDIT` level to dedicated file |
| Performance profiling | Timing context managers |
| Log aggregation (ELK, Datadog, Splunk) | JSON formatter to `stdout` or file |
| Microservice correlation | `contextvars` with trace/span IDs |
| Reducing noise from dependencies | Set third-party loggers to `WARNING` |
| Centralized config for large apps | `dictConfig` or `fileConfig` |

---

## Tips and Pitfalls

1. **Always use `__name__` for logger names** — It automatically mirrors your package structure and enables hierarchical control.
2. **Never use the root logger in libraries** — Always create a named logger and add `NullHandler()` so the consuming app controls output.
3. **Use lazy formatting** — Write `logger.info("User %s logged in", user)` not `logger.info(f"User {user} logged in")`. The f-string is evaluated even if the message is filtered out.
4. **Use `.exception()` inside `except` blocks** — It captures the full traceback automatically. Outside an `except` block, use `.error()` instead.
5. **Set `propagate = False` when needed** — Without this, messages bubble up to parent loggers and can appear duplicated.
6. **Don't add handlers in library code** — Libraries should only call `logger.addHandler(logging.NullHandler())`. Let the application configure handlers.
7. **Use `dictConfig` for anything beyond trivial setups** — It's declarative, easy to read, and easy to swap between environments (dev vs staging vs production).
