Add-Type -AssemblyName System.Drawing;

function Crop-Image($srcPath, $dstPath, $x, $y, $w, $h) {
    $src = [System.Drawing.Bitmap]::FromFile($srcPath)
    $rect = New-Object System.Drawing.Rectangle($x, $y, $w, $h)
    $cropped = $src.Clone($rect, $src.PixelFormat)
    $cropped.Save($dstPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $cropped.Dispose()
    $src.Dispose()
}

$sheet = "C:/Users/Pasha/.gemini/antigravity/brain/72da3648-8ca2-4139-9d52-fa527994aebe/scene1_family_pixel_spritesheet_1792586873798.jpg"
$dadSheet = "C:/Users/Pasha/.gemini/antigravity/brain/72da3648-8ca2-4139-9d52-fa527994aebe/dad_35yo_character_design_sheet_1792588974914.jpg"

# Crop 4 columns to inspect
Crop-Image $sheet "public/assets/characters/col1.png" 50 160 300 550
Crop-Image $sheet "public/assets/characters/col2.png" 360 160 300 550
Crop-Image $sheet "public/assets/characters/col3.png" 670 160 300 550
Crop-Image $sheet "public/assets/characters/col4.png" 980 160 350 550

Write-Output "Columns cropped successfully"
