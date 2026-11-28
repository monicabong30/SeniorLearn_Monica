[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [ValidatePattern('^(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)$')]
  [string]$LanIp,
  [switch]$ReplaceServerCertificate
)

$ErrorActionPreference = 'Stop'
$backendRoot = Split-Path -Parent $PSScriptRoot
$certDirectory = Join-Path $backendRoot 'certs'
$mobileCaPath = Join-Path (Split-Path -Parent $backendRoot) 'mobile\assets\certs\seniorlearn-local-ca.crt'
$opensslCommand = Get-Command openssl -ErrorAction SilentlyContinue
$openssl = if ($opensslCommand -and (Test-Path $opensslCommand.Source)) { $opensslCommand.Source } elseif (Test-Path 'C:\Program Files\Git\usr\bin\openssl.exe') { 'C:\Program Files\Git\usr\bin\openssl.exe' } else { $null }
if (-not $openssl) {
  throw 'OpenSSL was not found. Install Git for Windows (including OpenSSL) or OpenSSL, then run this script again.'
}

New-Item -ItemType Directory -Force -Path $certDirectory | Out-Null
$caKey = Join-Path $certDirectory 'seniorlearn-local-ca.key'
$caCert = Join-Path $certDirectory 'seniorlearn-local-ca.crt'
$serverKey = Join-Path $certDirectory 'server.key'
$serverCsr = Join-Path $certDirectory 'server.csr'
$serverCert = Join-Path $certDirectory 'server.crt'
$serial = Join-Path $certDirectory 'seniorlearn-local-ca.srl'

if ((Test-Path $caKey) -xor (Test-Path $caCert)) {
  throw "The existing CA is incomplete in $certDirectory. Restore both CA files or remove them deliberately before retrying."
}
if (-not (Test-Path $caKey)) {
  & $openssl genrsa -out $caKey 4096
  & $openssl req -x509 -new -sha256 -key $caKey -out $caCert -days 3650 -subj '/CN=SeniorLearn Local Root CA/O=SeniorLearn Australia' -addext 'basicConstraints=critical,CA:TRUE,pathlen:0' -addext 'keyUsage=critical,keyCertSign,cRLSign' -addext 'subjectKeyIdentifier=hash'
  if ($LASTEXITCODE -ne 0) { throw 'OpenSSL could not create the SeniorLearn local CA.' }
  Write-Host "Created reusable local CA: $caCert"
} else {
  Write-Host "Reusing existing local CA: $caCert"
}

if ((Test-Path $serverKey) -or (Test-Path $serverCert)) {
  if (-not $ReplaceServerCertificate) {
    throw 'A server certificate or private key already exists. Re-run with -ReplaceServerCertificate to replace it; the CA will be preserved.'
  }
  Remove-Item -LiteralPath $serverKey, $serverCsr, $serverCert -Force -ErrorAction SilentlyContinue
}

$configPath = Join-Path $certDirectory 'server-openssl.cnf'
@"
[req]
distinguished_name = dn
prompt = no
req_extensions = req_ext
[dn]
CN = $LanIp
O = SeniorLearn Australia
[req_ext]
subjectAltName = @alt_names
[alt_names]
IP.1 = $LanIp
IP.2 = 127.0.0.1
IP.3 = 10.0.2.2
DNS.1 = localhost
[v3_server]
basicConstraints = critical,CA:FALSE
keyUsage = critical,digitalSignature,keyEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names
authorityKeyIdentifier = keyid,issuer
subjectKeyIdentifier = hash
"@ | Set-Content -LiteralPath $configPath -NoNewline

try {
  & $openssl genrsa -out $serverKey 2048
  & $openssl req -new -key $serverKey -out $serverCsr -config $configPath
  & $openssl x509 -req -in $serverCsr -CA $caCert -CAkey $caKey -CAcreateserial -out $serverCert -days 825 -sha256 -extfile $configPath -extensions v3_server
  if ($LASTEXITCODE -ne 0) { throw 'OpenSSL could not create the server certificate.' }
} finally {
  Remove-Item -LiteralPath $configPath, $serverCsr -Force -ErrorAction SilentlyContinue
}

New-Item -ItemType Directory -Force -Path (Split-Path -Parent $mobileCaPath) | Out-Null
Copy-Item -LiteralPath $caCert -Destination $mobileCaPath -Force
Write-Host "Created server certificate for IP SAN ${LanIp}: $serverCert"
Write-Host "Copied public CA for the Android build: $mobileCaPath"
