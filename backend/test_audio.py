import cv2, numpy as np, os, subprocess
from services.video_processor import remove_watermark_video

out = cv2.VideoWriter('uploads/test_audio.mp4', cv2.VideoWriter_fourcc(*'mp4v'), 10, (320, 240))
for i in range(30):
    f = np.ones((240, 320, 3), dtype=np.uint8) * 200
    cv2.putText(f, 'WATERMARK', (50, 120), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
    out.write(f)
out.release()

subprocess.run([
    'ffmpeg', '-y', '-i', 'uploads/test_audio.mp4',
    '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=mono',
    '-c:v', 'copy', '-c:a', 'aac', '-shortest',
    'uploads/test_audio_wav.mp4'
], capture_output=True, check=True)

probe = subprocess.run([
    'ffprobe', '-v', 'error', '-select_streams', 'a:0',
    '-show_entries', 'stream=codec_type', '-of', 'csv=p=0',
    'uploads/test_audio_wav.mp4'
], capture_output=True, text=True)
print(f'Original has audio: {probe.stdout.strip() == "audio"}')

remove_watermark_video('uploads/test_audio_wav.mp4', 'outputs/test_clean_audio.mp4', 'inpaint')

probe2 = subprocess.run([
    'ffprobe', '-v', 'error', '-select_streams', 'a:0',
    '-show_entries', 'stream=codec_type', '-of', 'csv=p=0',
    'outputs/test_clean_audio.mp4'
], capture_output=True, text=True)
has_audio = probe2.stdout.strip() == 'audio'
print(f'Output has audio: {has_audio}')
sz = os.path.getsize('outputs/test_clean_audio.mp4')
print(f'Output size: {sz} bytes')
print('SUCCESS' if has_audio else 'AUDIO MISSING')
