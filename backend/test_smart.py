import cv2, numpy as np, os
from services.image_processor import remove_watermark_image

img = np.ones((400, 600, 3), dtype=np.uint8) * 220
cv2.rectangle(img, (200, 150), (400, 250), (50, 50, 80), -1)
cv2.putText(img, 'LOGO', (250, 210), cv2.FONT_HERSHEY_SIMPLEX, 1.2, (180, 180, 200), 3)
cv2.imwrite('uploads/test_smart_logo.png', img)

coords = {"x": 200, "y": 150, "w": 200, "h": 100}
remove_watermark_image('uploads/test_smart_logo.png', 'outputs/test_smart_result.png', 'inpaint', coords)

orig = cv2.imread('uploads/test_smart_logo.png')
result = cv2.imread('outputs/test_smart_result.png')
diff = cv2.absdiff(orig, result)
diff_mean = np.mean(diff)
print(f'Difference from original: {diff_mean:.2f}')
print(f'Output size: {os.path.getsize("outputs/test_smart_result.png")} bytes')
print('SUCCESS')
