#!/bin/bash

# アプリケーションアイコン作成スクリプト
# PNG画像からmacOS用のicnsファイルを生成

echo "🎨 アプリケーションアイコンを作成中..."

# アイコン用ディレクトリの作成
mkdir -p build/icon.iconset

# ベースアイコン（1024x1024）を作成
# 実際の画像がない場合はシンプルなグラデーションアイコンを生成
cat > build/create_base_icon.py << 'EOF'
from PIL import Image, ImageDraw, ImageFont
import os

# 1024x1024のベースアイコンを作成
size = 1024
image = Image.new('RGBA', (size, size), (0, 0, 0, 0))
draw = ImageDraw.Draw(image)

# グラデーション背景
for i in range(size):
    for j in range(size):
        # 中心からの距離を計算
        center_x, center_y = size // 2, size // 2
        distance = ((i - center_x) ** 2 + (j - center_y) ** 2) ** 0.5
        max_distance = (size // 2) * 1.2
        
        if distance <= size // 2:
            # グラデーション計算
            ratio = distance / max_distance
            blue = int(59 + (96 - 59) * ratio)
            green = int(130 + (165 - 130) * ratio)
            red = int(246 + (220 - 246) * ratio)
            image.putpixel((i, j), (red, green, blue, 255))

# チャットアイコンを描画
icon_size = size // 3
icon_x = (size - icon_size) // 2
icon_y = (size - icon_size) // 2

# メッセージバブル
bubble_width = icon_size * 0.8
bubble_height = icon_size * 0.6
bubble_x = icon_x + icon_size * 0.1
bubble_y = icon_y + icon_size * 0.2

draw.rounded_rectangle(
    [bubble_x, bubble_y, bubble_x + bubble_width, bubble_y + bubble_height],
    radius=20,
    fill=(255, 255, 255, 230)
)

# テキスト行
line_height = bubble_height // 5
for i in range(3):
    line_y = bubble_y + bubble_height * 0.2 + i * line_height
    line_width = bubble_width * (0.8 if i < 2 else 0.5)
    draw.rounded_rectangle(
        [bubble_x + bubble_width * 0.1, line_y, 
         bubble_x + bubble_width * 0.1 + line_width, line_y + line_height * 0.4],
        radius=3,
        fill=(100, 100, 100, 200)
    )

# 保存
image.save('build/icon_1024x1024.png')
print("✅ ベースアイコンを作成しました: build/icon_1024x1024.png")
EOF

# Pythonでアイコンを生成
if command -v python3 &> /dev/null; then
    python3 -c "
from PIL import Image, ImageDraw
import os

# 1024x1024のベースアイコンを作成
size = 1024
image = Image.new('RGBA', (size, size), (0, 0, 0, 0))
draw = ImageDraw.Draw(image)

# グラデーション背景
for i in range(size):
    for j in range(size):
        center_x, center_y = size // 2, size // 2
        distance = ((i - center_x) ** 2 + (j - center_y) ** 2) ** 0.5
        
        if distance <= size // 2:
            ratio = min(distance / (size // 2), 1.0)
            blue = int(96 + (59 - 96) * ratio)
            green = int(165 + (130 - 165) * ratio) 
            red = int(220 + (246 - 220) * ratio)
            image.putpixel((i, j), (red, green, blue, 255))

# チャットバブル
bubble_size = size // 2
bubble_x = (size - bubble_size) // 2
bubble_y = (size - bubble_size) // 2

draw.rounded_rectangle(
    [bubble_x, bubble_y, bubble_x + bubble_size, bubble_y + bubble_size * 0.7],
    radius=bubble_size // 8,
    fill=(255, 255, 255, 240)
)

# テキスト行
for i in range(3):
    line_y = bubble_y + bubble_size * (0.15 + i * 0.15)
    line_width = bubble_size * (0.7 if i < 2 else 0.4)
    draw.rounded_rectangle(
        [bubble_x + bubble_size * 0.1, line_y, 
         bubble_x + bubble_size * 0.1 + line_width, line_y + bubble_size * 0.08],
        radius=4,
        fill=(70, 70, 70, 200)
    )

image.save('build/icon_1024x1024.png')
print('✅ ベースアイコンを作成しました')
" 2>/dev/null || echo "⚠️  Pillowがインストールされていません。手動でアイコンを配置してください。"
else
    echo "⚠️  Python3がインストールされていません。手動でアイコンを配置してください。"
fi

# 各サイズのアイコンを生成（sipsコマンドを使用）
if [ -f "build/icon_1024x1024.png" ]; then
    echo "📐 各サイズのアイコンを生成中..."
    
    # iconsetに必要なサイズ
    declare -a sizes=("16" "32" "64" "128" "256" "512" "1024")
    
    for size in "${sizes[@]}"; do
        sips -z $size $size "build/icon_1024x1024.png" --out "build/icon.iconset/icon_${size}x${size}.png" > /dev/null 2>&1
        # Retina用
        if [ $size -ne 1024 ]; then
            double_size=$((size * 2))
            sips -z $double_size $double_size "build/icon_1024x1024.png" --out "build/icon.iconset/icon_${size}x${size}@2x.png" > /dev/null 2>&1
        fi
    done
    
    # icnsファイルを生成
    iconutil -c icns "build/icon.iconset" -o "build/app-icon.icns"
    echo "✅ アイコンファイルを生成しました: build/app-icon.icns"
else
    echo "❌ ベースアイコンの生成に失敗しました"
fi
