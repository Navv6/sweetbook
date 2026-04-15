# Set location to repository root
Set-Location "e:\sweetbook"

# Step 1: Create the public/audio directory if it doesn't exist
if (-not (Test-Path "public\audio")) {
    New-Item -ItemType Directory -Path "public\audio" -Force | Out-Null
    Write-Output "Created directory: public\audio"
} else {
    Write-Output "Directory already exists: public\audio"
}

# Step 2: Move the file from public/soundtrack to public/audio
Move-Item -Path "public\soundtrack\The_Shutter_s_Pause.mp3" -Destination "public\audio\The_Shutter_s_Pause.mp3" -Force
Write-Output "Moved file: public\soundtrack\The_Shutter_s_Pause.mp3 -> public\audio\The_Shutter_s_Pause.mp3"

# Step 3: Remove the now-empty public/soundtrack directory
Remove-Item -Path "public\soundtrack" -Force
Write-Output "Removed directory: public\soundtrack"

# Step 4: List the contents of public/audio to confirm
Write-Output "`nContents of public\audio\:"
Get-ChildItem -Path "public\audio\" | ForEach-Object {
    Write-Output "  $($_.Name)"
}
