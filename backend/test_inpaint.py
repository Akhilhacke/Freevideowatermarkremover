import cv2, numpy as np, os

img = np.ones((400, 600, 3), dtype=np.uint8) * 220
cv2.rectangle(img, (200, 150), (400, 250), (50, 50, 80), -1)
cv2.putText(img, 'LOGO', (250, 210), cv2.FONT_HERSHEY_SIMPLEX, 1.2, (180, 180, 200), 3)
cv2.imwrite('uploads/test_logo.png', img)

full_mask = np.zeros((400, 600), dtype=np.uint8)
full_mask[150:250, 200:400] = 255
kernel = np.ones((7, 7), np.uint8)
full_mask = cv2.dilate(full_mask, kernel, iterations=3)

result_ns = cv2.inpaint(img, full_mask, inpaintRadius=7, flags=cv2.INPAINT_NS)
result_telea = cv2.inpaint(img, full_mask, inpaintRadius=7, flags=cv2.INPAINT_TELEA)

cv2.imwrite('outputs/test_ns.png', result_ns)
cv2.imwrite('outputs/test_telea.png', result_telea)
print(f'NS: {os.path.getsize("outputs/test_ns.png")} bytes')
print(f'Telea: {os.path.getsize("outputs/test_telea.png")} bytes')
print('Done')
