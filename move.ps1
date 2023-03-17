$destination = ".\..\..\main\Samuel-Risner.github.io"
$origin = Get-Location
Set-Location $destination
$destination = Get-Location

$toDelete = Get-ChildItem ".\" -Exclude ".git", ".gitattributes", "LICENSE", "README.md"
Write-Output "The following files will be deleted: " $toDelete
$answer = read-host -prompt "Press 'Y' to delete them"
if ($answer -eq "Y") {
    Write-Output "Deleting files..."
    $toDelete | Remove-Item -recurse -Force
} else {
    Write-Output "NOT deleting files."
}

Write-Output "Copying static folder..."
Copy-Item -Path "$($origin)\static" -Destination $destination -Recurse -Exclude "*.gitkeep" -Force

Write-Output "Copying rendered templates..."
Copy-Item -Path "$($origin)\rendered_templates\*" -Destination $destination -Recurse -Exclude "*.gitkeep" -Force