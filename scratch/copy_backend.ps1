$src = "D:\Project\REACT-WebFashion\back-end"
$dst = "d:\Project\404Studio\backend"
$excludeDirs = @("node_modules", ".git", "backups", "dist", "build", "coverage", ".cache", "tmp")
$excludeFiles = @(".env", ".env.staging", ".env.local", "*.log")

if (-not (Test-Path $dst)) {
    New-Item -ItemType Directory -Path $dst -Force | Out-Null
}

$copiedList = [System.Collections.Generic.List[PSObject]]::new()
$excludedList = [System.Collections.Generic.List[string]]::new()
$mismatchesList = [System.Collections.Generic.List[PSObject]]::new()

$allFiles = Get-ChildItem -Path $src -Recurse -File

foreach ($file in $allFiles) {
    $relPath = $file.FullName.Substring($src.Length + 1)
    $parts = $relPath.Split([System.IO.Path]::DirectorySeparatorChar)
    
    $skip = $false
    foreach ($part in $parts) {
        if ($excludeDirs -contains $part) {
            $skip = $true
            break
        }
    }
    
    if (-not $skip) {
        foreach ($exPattern in $excludeFiles) {
            if ($file.Name -like $exPattern) {
                $skip = $true
                break
            }
        }
    }
    
    if ($skip) {
        $excludedList.Add($relPath)
        continue
    }
    
    $targetFile = Join-Path $dst $relPath
    $targetDir = [System.IO.Path]::GetDirectoryName($targetFile)
    if (-not (Test-Path $targetDir)) {
        New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
    }
    
    Copy-Item -Path $file.FullName -Destination $targetFile -Force
    
    $srcHash = (Get-FileHash -Path $file.FullName -Algorithm SHA256).Hash
    $dstHash = (Get-FileHash -Path $targetFile -Algorithm SHA256).Hash
    
    if ($srcHash -ne $dstHash) {
        $mismatchesList.Add([PSCustomObject]@{
            File = $relPath
            SrcHash = $srcHash
            DstHash = $dstHash
        })
    } else {
        $copiedList.Add([PSCustomObject]@{
            File = $relPath
            Hash = $srcHash
            Size = $file.Length
        })
    }
}

# Copy sanitized .env.example
$exampleEnvSrc = "D:\Project\REACT-WebFashion\.env.example"
if (Test-Path $exampleEnvSrc) {
    Copy-Item -Path $exampleEnvSrc -Destination (Join-Path $dst ".env.example") -Force
}

$report = [PSCustomObject]@{
    TotalCopied = $copiedList.Count
    TotalExcluded = $excludedList.Count
    Mismatches = $mismatchesList.Count
    CopiedFiles = $copiedList
    ExcludedFiles = $excludedList
    MismatchesList = $mismatchesList
}

$report | ConvertTo-Json -Depth 5 | Out-File -FilePath "scratch/migration_result.json" -Encoding utf8

Write-Host "Migration Finished:"
Write-Host "Total Copied: $($copiedList.Count)"
Write-Host "Total Excluded: $($excludedList.Count)"
Write-Host "Mismatches: $($mismatchesList.Count)"
