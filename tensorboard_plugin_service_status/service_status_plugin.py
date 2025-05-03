import json
import os
import sys
from collections import deque

import werkzeug
from tensorboard.plugins.base_plugin import FrontendMetadata, TBPlugin
from werkzeug import wrappers

# Environment variables to configure paths for health and log files
_HEALTH_FILE = os.environ.get(
    "TENSORBOARD_SVC_STATUS_FILE", "/tmp/tensorboard_svc_status.txt"
)
_LOGS_FILE = os.environ.get("TENSORBOARD_SVC_LOG_FILE", "/tmp/tensorboard_svc.log")


class ServiceStatusPlugin(TBPlugin):
    """A custom TensorBoard plugin for displaying service status and logs."""

    # Unique name for this plugin (used in frontend and routing)
    plugin_name = "service_status"

    def __init__(self, context):
        """Initialize the plugin with the TensorBoard context."""
        self._logdir = context.logdir

    def frontend_metadata(self):
        """Declare static assets and tab name for TensorBoard UI."""
        return FrontendMetadata(
            es_module_path="/static/index.js", tab_name="Service Status"
        )

    def get_plugin_apps(self):
        """Define endpoints exposed by this plugin."""
        return {
            "/status": self._serve_status,       # Returns health status
            "/config": self._serve_config,       # Returns current config info
            "/logs": self._serve_logs,           # Returns recent logs
            "/static/index.js": self._serve_static,  # Serves frontend JS
        }

    @wrappers.Request.application
    def _serve_static(self, request):
        """Serve the static frontend JavaScript file."""
        del request
        path = os.path.join(os.path.dirname(__file__), "static", "index.js")
        with open(path, "rb") as f:
            content = f.read()
        return werkzeug.Response(content, content_type="application/javascript")

    def is_active(self):
        """Activate the plugin regardless of conditions."""
        return True

    @wrappers.Request.application
    def _serve_status(self, request):
        """Serve the service health status from a designated file."""
        del request
        message = ""
        if os.path.exists(_HEALTH_FILE):
            with open(_HEALTH_FILE, "r") as f:
                message = f.read().strip()

        response = json.dumps({"message": message})
        return werkzeug.Response(response, content_type="application/json")

    @wrappers.Request.application
    def _serve_logs(self, request):
        """Serve the last N lines of logs from the designated log file."""
        DEFAULT_LINES = 500
        try:
            max_lines = int(request.args.get("max_lines", DEFAULT_LINES))
        except:
            max_lines = DEFAULT_LINES

        # Cap maximum lines to avoid overloading the response
        max_lines = min(max_lines, 1000)

        logs = ""
        if os.path.exists(_LOGS_FILE):
            logs = "".join(tail(_LOGS_FILE, max_lines))

        return werkzeug.Response(logs, content_type="text/plain")

    @wrappers.Request.application
    def _serve_config(self, request):
        """Serve current environment variables and the running command line."""
        del request

        config = {"config": {"env": dict(**os.environ), "cmd": " ".join(sys.argv)}}
        response = json.dumps(config)
        return werkzeug.Response(response, content_type="application/json")


def tail(filename, n):
    """Return the last n lines from a file."""
    with open(filename, "r") as f:
        return list(deque(f, maxlen=n))
