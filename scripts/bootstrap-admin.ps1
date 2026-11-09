$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
$nodeExecutable = if ($nodeCommand) { $nodeCommand.Source } else { Join-Path $projectRoot '.tools/node.exe' }
if (-not (Test-Path -LiteralPath $nodeExecutable)) { throw 'Instale Node.js 22 ou superior.' }
$projectUrl = Read-Host 'URL do Supabase (https://referencia.supabase.co)'
$secretValue = Read-Host 'Chave administrativa Supabase (entrada oculta; não é gravada)' -AsSecureString
$secretPointer = [IntPtr]::Zero
try {
    $secretPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secretValue)
    $env:SUPABASE_URL = $projectUrl
    $env:SUPABASE_SECRET_KEY = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($secretPointer)
    & $nodeExecutable (Join-Path $PSScriptRoot 'bootstrap-admin.mjs')
    if ($LASTEXITCODE -ne 0) { throw 'Criação não confirmada. Consulte a mensagem acima.' }
} finally {
    if ($secretPointer -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($secretPointer) }
    $secretValue.Dispose()
    Remove-Item Env:SUPABASE_SECRET_KEY -ErrorAction SilentlyContinue
    Remove-Item Env:SUPABASE_URL -ErrorAction SilentlyContinue
}
