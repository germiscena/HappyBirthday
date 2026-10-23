Add-Type -AssemblyName System.Drawing;

function Extract-Transparent-Sprite($srcPath, $dstPath, $cropX, $cropY, $cropW, $cropH, $bgColorThreshold) {
    $src = [System.Drawing.Bitmap]::FromFile($srcPath)
    $dst = New-Object System.Drawing.Bitmap($cropW, $cropH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    
    # We sample the corner of the crop for background color if needed
    $bgCol = $src.GetPixel($cropX, $cropY)
    
    for ($y = 0; $y -lt $cropH; $y++) {
        for ($x = 0; $x -lt $cropW; $x++) {
            $px = $src.GetPixel($cropX + $x, $cropY + $y)
            
            # Check difference with background
            $dr = [Math]::Abs($px.R - $bgCol.R)
            $dg = [Math]::Abs($px.G - $bgCol.G)
            $db = [Math]::Abs($px.B - $bgCol.B)
            
            if ($dr + $dg + $db -lt $bgColorThreshold) {
                $dst.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
            } else {
                $dst.SetPixel($x, $y, $px)
            }
        }
    }
    
    $dst.Save($dstPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $dst.Dispose()
    $src.Dispose()
}

# 1. Mom from scene_characters_ref.jpg (X: 250, Y: 435, W: 60, H: 120)
Extract-Transparent-Sprite "assets/user_references/scene_characters_ref.jpg" "public/assets/characters/mom_sprite.png" 250 435 58 118 70

# 2. Sister from scene_characters_ref.jpg (X: 660, Y: 525, W: 70, H: 110)
Extract-Transparent-Sprite "assets/user_references/scene_characters_ref.jpg" "public/assets/characters/sister_sprite.png" 660 525 70 110 70

# 3. Toddler Heroine from scene_characters_ref.jpg (X: 485, Y: 580, W: 85, H: 100)
Extract-Transparent-Sprite "assets/user_references/scene_characters_ref.jpg" "public/assets/characters/heroine_toddler.png" 485 580 85 100 70

# 4. Butterfly from scene_characters_ref.jpg (X: 568, Y: 575, W: 38, H: 38)
Extract-Transparent-Sprite "assets/user_references/scene_characters_ref.jpg" "public/assets/characters/butterfly.png" 568 575 38 38 65

# 5. Dad 35yo from dad_pose1.png (sample corner color)
Extract-Transparent-Sprite "public/assets/characters/dad_pose1.png" "public/assets/characters/dad_35_sprite.png" 0 0 160 380 50

Write-Output "Sprites extracted"
