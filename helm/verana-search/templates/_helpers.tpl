{{- define "verana-search.name" -}}
{{- .Chart.Name | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "verana-search.fullname" -}}
{{- printf "%s-%s" .Release.Name .Chart.Name | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "verana-search.labels" -}}
app.kubernetes.io/name: {{ include "verana-search.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end -}}

{{- define "verana-search.selectorLabels" -}}
app.kubernetes.io/name: {{ include "verana-search.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}
