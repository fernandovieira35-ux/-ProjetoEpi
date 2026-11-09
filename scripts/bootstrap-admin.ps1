param([switch]$Diagnostico,[switch]$Recuperar,[switch]$DefinirSenha)
$ErrorActionPreference = 'Stop'
if ($Diagnostico -and $Recuperar) { throw 'Use somente um modo por vez.' }
if ($DefinirSenha -and -not $Recuperar) { throw 'Use -DefinirSenha junto com -Recuperar.' }
$projectRoot = Split-Path $PSScriptRoot -Parent
$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
$nodeExecutable = if ($nodeCommand) { $nodeCommand.Source } else { Join-Path $projectRoot '.tools/node.exe' }
if (-not (Test-Path -LiteralPath $nodeExecutable)) { throw 'Instale Node.js 22 ou superior.' }
$projectUrl = & $nodeExecutable (Join-Path $PSScriptRoot 'project-url.mjs')
if ($LASTEXITCODE -ne 0 -or $projectUrl -notmatch '^https://[a-z0-9-]+\.supabase\.co$') { throw 'URL inválida em estoque/assets/js/config.js. Corrija a configuração antes de continuar.' }
Write-Host "Projeto configurado: $projectUrl"
if ($Diagnostico) { Write-Host 'Modo diagnóstico: somente consulta; não cria nem altera usuários.' }
$secretValue = Read-Host 'Chave administrativa Supabase (entrada oculta; não é gravada)' -AsSecureString
$secretPointer = [IntPtr]::Zero
$passwordPointer = [IntPtr]::Zero
$confirmationPointer = [IntPtr]::Zero
$passwordValue = $null
$confirmationValue = $null
try {
    $secretPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secretValue)
    $env:SUPABASE_URL = $projectUrl
    $env:SUPABASE_SECRET_KEY = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($secretPointer)
    $scriptArguments = @((Join-Path $PSScriptRoot 'bootstrap-admin.mjs'))
    if ($Diagnostico) { $scriptArguments += '--diagnostic' }
    if ($Recuperar) { $scriptArguments += '--recover' }
    if ($DefinirSenha) {
        Write-Host 'Escolha uma senha com 12 ou mais caracteres, maiúscula, minúscula, número e símbolo.'
        $passwordValue = Read-Host 'Nova senha de adcmim (oculta)' -AsSecureString
        $confirmationValue = Read-Host 'Repita a nova senha (oculta)' -AsSecureString
        $passwordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($passwordValue)
        $confirmationPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($confirmationValue)
        $env:BOOTSTRAP_NEW_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordPointer)
        $env:BOOTSTRAP_CONFIRM_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($confirmationPointer)
        $scriptArguments += '--choose-password'
    }
    & $nodeExecutable @scriptArguments
    if ($LASTEXITCODE -ne 0) { throw 'Operação não concluída. Consulte a mensagem acima.' }
} finally {
    if ($passwordPointer -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPointer) }
    if ($confirmationPointer -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($confirmationPointer) }
    if ($passwordValue) { $passwordValue.Dispose() }
    if ($confirmationValue) { $confirmationValue.Dispose() }
    Remove-Item Env:BOOTSTRAP_NEW_PASSWORD -ErrorAction SilentlyContinue
    Remove-Item Env:BOOTSTRAP_CONFIRM_PASSWORD -ErrorAction SilentlyContinue
    if ($secretPointer -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($secretPointer) }
    $secretValue.Dispose()
    Remove-Item Env:SUPABASE_SECRET_KEY -ErrorAction SilentlyContinue
    Remove-Item Env:SUPABASE_URL -ErrorAction SilentlyContinue
}
